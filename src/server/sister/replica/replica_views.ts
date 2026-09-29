// Generates the typed `replica` schema: one SQL view per SISTER endpoint over
// public.sister_replica_record, plus child views for arrays of objects inside
// payloads (penulis, anggota, dokumen, ...). Column types are inferred from
// the replicated payloads with analyzeRows(); casts go through replica.try_*
// helpers so an unexpected value becomes NULL instead of breaking the view.
//
// The schema is derived data: the migration drops and recreates it. Do not
// hand-edit objects inside `replica`; regenerate with `bun run replica:views`.

import { analyzeRows, type FieldAnalysis, type PostgresType } from "@/lib/field_analysis";

export type ReplicaColumn = {
  name: string;
  type: PostgresType;
  nullablePercent: number;
  // JSON path inside the payload, e.g. ["detail_perubahan", "ipk_baru"].
  path: string[];
};

export type ReplicaViewSpec = {
  name: string;
  endpoint: string;
  // Array field of the payload this child view unnests, if any.
  arrayField?: string;
  sampleRows: number;
  columns: ReplicaColumn[];
};

const metaColumns = [
  "r_integration_id",
  "r_id_sdm",
  "r_parent_id",
  "r_scope_key",
  "r_item_key",
  "r_fetched_at",
  "r_changed_at",
  "r_payload",
];

export function quoteIdent(name: string) {
  return `"${name.replaceAll('"', '""')}"`;
}

function quoteLiteral(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

export function sanitizeColumnName(field: string) {
  const cleaned = field
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const safe = /^[a-z_]/.test(cleaned) ? cleaned : `f_${cleaned}`;
  return (metaColumns.includes(safe) ? `f_${safe}` : safe).slice(0, 63) || "f_field";
}

// "/penelitian/{id}/bidang_ilmu" -> "penelitian_bidang_ilmu"; a list whose
// detail endpoint also exists gets "_list" so the detail keeps the plain name.
export function viewNameFor(endpoint: string, allEndpoints: ReadonlySet<string>) {
  const slug = endpoint
    .replace(/^\//, "")
    .split("/")
    .filter((segment) => !segment.startsWith("{"))
    .join("_");
  const hasDetail = !endpoint.endsWith("}") && allEndpoints.has(`${endpoint}/{id}`);
  return sanitizeColumnName(hasDetail ? `${slug}_list` : slug);
}

function nullablePercent(field: FieldAnalysis) {
  const total = field.present + field.missing;
  return total === 0 ? 100 : Math.round(((field.nullish + field.missing) / total) * 100);
}

// Scalar columns for one level; objects are flattened one level deep
// (`detail_perubahan_ipk_baru`), arrays stay jsonb.
function columnsFor(fields: FieldAnalysis[]): ReplicaColumn[] {
  const columns: ReplicaColumn[] = [];
  const used = new Set<string>();
  const add = (name: string, column: Omit<ReplicaColumn, "name">) => {
    let unique = name;
    for (let index = 2; used.has(unique); index += 1) {
      unique = `${name.slice(0, 60)}_${index}`;
    }
    used.add(unique);
    columns.push({ name: unique, ...column });
  };

  for (const field of fields) {
    const name = sanitizeColumnName(field.field);
    add(name, { type: field.postgres, nullablePercent: nullablePercent(field), path: [field.field] });

    const isObjectOnly = field.types.object && !field.types.array;
    if (isObjectOnly && field.children) {
      for (const child of field.children) {
        add(sanitizeColumnName(`${field.field}_${child.field}`), {
          type: child.postgres,
          nullablePercent: nullablePercent(child),
          path: [field.field, child.field],
        });
      }
    }
  }
  return columns;
}

export function buildViewSpecs(
  samples: ReadonlyMap<string, unknown[]>,
  endpoints: readonly string[],
): ReplicaViewSpec[] {
  const all = new Set(endpoints);
  const specs: ReplicaViewSpec[] = [];

  for (const endpoint of [...endpoints].sort()) {
    const rows = samples.get(endpoint) ?? [];
    const analysis = analyzeRows(rows, Number.MAX_SAFE_INTEGER);
    const name = viewNameFor(endpoint, all);
    specs.push({ name, endpoint, sampleRows: rows.length, columns: columnsFor(analysis.fields) });

    for (const field of analysis.fields) {
      if (field.types.array && field.children && field.children.length > 0) {
        specs.push({
          name: sanitizeColumnName(`${name.replace(/_list$/, "")}_${field.field}`),
          endpoint,
          arrayField: field.field,
          sampleRows: field.children[0].present + field.children[0].missing,
          columns: columnsFor(field.children),
        });
      }
    }
  }

  // A list and its detail can both carry the same array (e.g. bidang_keilmuan);
  // keep the detail's child view, which is the richer source.
  const seen = new Set<string>();
  return specs
    .sort((a, b) => Number(b.endpoint.endsWith("}")) - Number(a.endpoint.endsWith("}")))
    .filter((spec) => (seen.has(spec.name) ? false : (seen.add(spec.name), true)))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function castExpression(source: string, column: ReplicaColumn) {
  const parents = column.path.slice(0, -1).map((segment) => `->${quoteLiteral(segment)}`).join("");
  const leaf = quoteLiteral(column.path[column.path.length - 1]);
  const text = `${source}${parents}->>${leaf}`;
  switch (column.type) {
    case "jsonb":
      return `${source}${parents}->${leaf}`;
    case "text":
      return `nullif(${text}, '')`;
    default:
      return `replica.try_${column.type}(${text})`;
  }
}

const helperFunctions = (["uuid", "date", "timestamp", "bigint", "numeric", "boolean"] as const)
  .map(
    (type) => `CREATE FUNCTION replica.try_${type}(value text) RETURNS ${type}
LANGUAGE plpgsql IMMUTABLE AS $fn$
BEGIN
  RETURN nullif(btrim(value), '')::${type};
EXCEPTION WHEN others THEN
  RETURN NULL;
END
$fn$;`,
  )
  .join("\n\n");

function viewSql(spec: ReplicaViewSpec) {
  const source = spec.arrayField ? "e.value" : "r.payload_json";
  const parentKey = "CASE WHEN r.item_key = 'self' THEN coalesce(r.parent_id, r.id_sdm) ELSE r.item_key END";
  const meta = spec.arrayField
    ? [
        "r.integration_id AS r_integration_id",
        "r.id_sdm AS r_id_sdm",
        `${parentKey} AS r_parent_id`,
        "r.scope_key AS r_scope_key",
        "e.ordinality AS r_item_key",
        "r.fetched_at AS r_fetched_at",
        "r.changed_at AS r_changed_at",
      ]
    : [
        "r.integration_id AS r_integration_id",
        "r.id_sdm AS r_id_sdm",
        "r.parent_id AS r_parent_id",
        "r.scope_key AS r_scope_key",
        "r.item_key AS r_item_key",
        "r.fetched_at AS r_fetched_at",
        "r.changed_at AS r_changed_at",
      ];
  const columns = spec.columns.map((column) => `${castExpression(source, column)} AS ${quoteIdent(column.name)}`);
  const from = spec.arrayField
    ? `FROM public.sister_replica_record r
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(r.payload_json->${quoteLiteral(spec.arrayField)}) = 'array'
    THEN r.payload_json->${quoteLiteral(spec.arrayField)} ELSE '[]'::jsonb END
) WITH ORDINALITY AS e(value, ordinality)
WHERE r.endpoint = ${quoteLiteral(spec.endpoint)} AND r.deleted_at IS NULL AND jsonb_typeof(e.value) = 'object'`
    : `FROM public.sister_replica_record r
WHERE r.endpoint = ${quoteLiteral(spec.endpoint)} AND r.deleted_at IS NULL`;
  const description = spec.arrayField
    ? `SISTER ${spec.endpoint} -> ${spec.arrayField}[] (generated)`
    : `SISTER ${spec.endpoint} (generated)`;

  return `CREATE VIEW replica.${quoteIdent(spec.name)} AS
SELECT
  ${[...meta, ...columns, `${source} AS r_payload`].join(",\n  ")}
${from};
COMMENT ON VIEW replica.${quoteIdent(spec.name)} IS ${quoteLiteral(description)};`;
}

export function buildMigrationSql(specs: readonly ReplicaViewSpec[], generatedAt: string) {
  return `-- Generated by \`bun run replica:views\` on ${generatedAt}. Do not edit by hand.
-- Typed read-only views over public.sister_replica_record; see
-- cookbook/replica_schema.md. The schema is derived data and is recreated.
DROP SCHEMA IF EXISTS replica CASCADE;
CREATE SCHEMA replica;
COMMENT ON SCHEMA replica IS 'Typed views over SISTER replica payloads (generated)';

${helperFunctions}

${specs.map(viewSql).join("\n\n")}
`;
}

// Documentation without sample values: payloads contain personal data.
export function buildSchemaDoc(specs: readonly ReplicaViewSpec[], generatedAt: string) {
  const lines = [
    "# Skema replika typed (`replica`)",
    "",
    `Dihasilkan oleh \`bun run replica:views\` pada ${generatedAt} dari payload di`,
    "`sister_replica_record`. Jangan diedit manual; jalankan ulang generator setelah",
    "sync dengan data baru. Detail rancangan: [sister_replica.md](./sister_replica.md).",
    "",
    "Setiap view memiliki kolom meta `r_integration_id`, `r_id_sdm`, `r_parent_id`,",
    "`r_scope_key`, `r_item_key`, `r_fetched_at`, `r_changed_at`, dan `r_payload`",
    "(JSON asli). Baris yang sudah hilang dari SISTER (`deleted_at`) tidak ikut.",
    "",
    "| View | Sumber | Sampel | Kolom |",
    "|---|---|---:|---:|",
    ...specs.map(
      (spec) =>
        `| [\`replica.${spec.name}\`](#replica${spec.name.replaceAll("_", "")}) | \`${spec.endpoint}\`${spec.arrayField ? ` → \`${spec.arrayField}[]\`` : ""} | ${spec.sampleRows} | ${spec.columns.length} |`,
    ),
    "",
  ];

  for (const spec of specs) {
    lines.push(`## replica.${spec.name}`, "");
    lines.push(
      `Sumber: \`GET ${spec.endpoint}\`${spec.arrayField ? `, elemen \`${spec.arrayField}[]\`` : ""}; ${spec.sampleRows} baris sampel.`,
      "",
    );
    if (spec.columns.length === 0) {
      lines.push("Belum ada sampel; hanya kolom meta dan `r_payload`. Generate ulang setelah data tersedia.", "");
      continue;
    }
    lines.push("| Kolom | Tipe | Null/kosong |", "|---|---|---:|");
    for (const column of spec.columns) {
      lines.push(`| \`${column.name}\` | ${column.type} | ${column.nullablePercent}% |`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
