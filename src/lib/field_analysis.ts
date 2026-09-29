// Infers the observed structure of SISTER JSON rows: which fields exist,
// which JSON types they actually carry, how often they are null, and a
// suggested PostgreSQL column type for the future typed replica tables.

export type ObservedType =
  | "string"
  | "numeric_string"
  | "date_string"
  | "datetime_string"
  | "uuid_string"
  | "empty_string"
  | "integer"
  | "decimal"
  | "boolean"
  | "null"
  | "array"
  | "object";

export type FieldAnalysis = {
  field: string;
  present: number;
  missing: number;
  nullish: number;
  types: Partial<Record<ObservedType, number>>;
  maxLength: number;
  // Numeric strings with a leading zero ("0012345678") are codes, not numbers.
  leadingZero: boolean;
  decimalString: boolean;
  examples: string[];
  postgres: PostgresType;
  suggested: string;
  nullable: boolean;
  children?: FieldAnalysis[];
};

export type StructureAnalysis = {
  rows: number;
  analyzedRows: number;
  fields: FieldAnalysis[];
};

export type PostgresType = "uuid" | "date" | "timestamp" | "bigint" | "numeric" | "boolean" | "jsonb" | "text";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const dateTimePattern = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/;
const numericPattern = /^-?\d+(\.\d+)?$/;
const maxExamples = 3;
const maxExampleLength = 60;

function observe(value: unknown): ObservedType {
  if (value === null || value === undefined) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return Number.isInteger(value) ? "integer" : "decimal";
  if (typeof value === "object") return "object";
  const text = String(value);
  if (text.trim() === "") return "empty_string";
  if (uuidPattern.test(text)) return "uuid_string";
  if (datePattern.test(text)) return "date_string";
  if (dateTimePattern.test(text)) return "datetime_string";
  if (numericPattern.test(text.trim())) return "numeric_string";
  return "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Identifier-like names stay text even when every value looks numeric:
// NIDN/NIP/NIK/kode/nomor/telepon can start with 0 or exceed numeric sense.
const codeNamePattern = /(^|_)(id|kode|nomor|no|nidn|nip|nik|nuptk|npwp|nidk|telepon|hp|rt|rw|kode_pos|nim|nipd)(_|$)/;

export function postgresTypeFor(
  field: string,
  types: Partial<Record<ObservedType, number>>,
  flags: { leadingZero: boolean; decimalString: boolean },
): PostgresType {
  const seen = (Object.keys(types) as ObservedType[]).filter(
    (type) => type !== "null" && type !== "empty_string",
  );
  if (seen.length === 0) return "text";
  const only = (...allowed: ObservedType[]) => seen.every((type) => allowed.includes(type));

  if (only("array", "object")) return "jsonb";
  if (only("boolean")) return "boolean";
  if (only("uuid_string")) return "uuid";
  if (only("date_string")) return "date";
  if (only("datetime_string", "date_string")) return "timestamp";
  if (only("integer")) return "bigint";
  if (only("integer", "decimal")) return "numeric";
  if (only("integer", "decimal", "numeric_string")) {
    const isCode = flags.leadingZero || (codeNamePattern.test(field) && !flags.decimalString);
    return isCode ? "text" : "numeric";
  }
  if (seen.includes("array") || seen.includes("object")) return "jsonb";
  return "text";
}

function describeType(
  postgres: PostgresType,
  types: Partial<Record<ObservedType, number>>,
  maxLength: number,
): string {
  const seen = (Object.keys(types) as ObservedType[]).filter(
    (type) => type !== "null" && type !== "empty_string",
  );
  if (seen.length === 0) return "text (selalu kosong)";
  if (postgres === "jsonb") {
    return seen.length > 1 ? "jsonb (tipe campuran)" : `jsonb (${seen[0]})`;
  }
  if (postgres === "numeric" && seen.includes("numeric_string")) {
    return seen.length > 1 ? "numeric (campuran number/string)" : "numeric (dikirim sebagai string)";
  }
  if (postgres === "text" && seen.includes("numeric_string") && seen.length === 1) {
    return "varchar (kode angka, jangan numeric)";
  }
  if (postgres === "text") {
    const length = Math.max(1, maxLength);
    return length <= 255 ? `varchar(${Math.min(255, Math.ceil(length * 1.5))})` : "text";
  }
  return postgres === "bigint" ? "integer" : postgres;
}

export function analyzeRows(rows: unknown[], maxRows = 2000, depth = 0): StructureAnalysis {
  const sample = rows.slice(0, maxRows).filter(isRecord);
  const order: string[] = [];
  const stats = new Map<
    string,
    {
      present: number;
      nullish: number;
      types: Partial<Record<ObservedType, number>>;
      maxLength: number;
      leadingZero: boolean;
      decimalString: boolean;
      examples: string[];
      nested: unknown[];
    }
  >();

  for (const row of sample) {
    for (const [field, value] of Object.entries(row)) {
      let entry = stats.get(field);
      if (!entry) {
        entry = {
          present: 0,
          nullish: 0,
          types: {},
          maxLength: 0,
          leadingZero: false,
          decimalString: false,
          examples: [],
          nested: [],
        };
        stats.set(field, entry);
        order.push(field);
      }
      entry.present += 1;
      const type = observe(value);
      entry.types[type] = (entry.types[type] ?? 0) + 1;
      if (type === "null" || type === "empty_string") {
        entry.nullish += 1;
        continue;
      }
      if (typeof value === "string") {
        entry.maxLength = Math.max(entry.maxLength, value.length);
      }
      if (type === "numeric_string") {
        const trimmed = String(value).trim();
        entry.leadingZero ||= /^-?0\d/.test(trimmed);
        entry.decimalString ||= trimmed.includes(".");
      }
      if (Array.isArray(value)) {
        entry.nested.push(...value);
      } else if (isRecord(value)) {
        entry.nested.push(value);
      }
      if (entry.examples.length < maxExamples && type !== "array" && type !== "object") {
        const example = String(value).slice(0, maxExampleLength);
        if (!entry.examples.includes(example)) {
          entry.examples.push(example);
        }
      }
    }
  }

  const fields = order.map((field): FieldAnalysis => {
    const entry = stats.get(field)!;
    const missing = sample.length - entry.present;
    const nestedObjects = entry.nested.filter(isRecord);
    const postgres = postgresTypeFor(field, entry.types, entry);
    return {
      field,
      present: entry.present,
      missing,
      nullish: entry.nullish,
      types: entry.types,
      maxLength: entry.maxLength,
      leadingZero: entry.leadingZero,
      decimalString: entry.decimalString,
      examples: entry.examples,
      postgres,
      suggested: describeType(postgres, entry.types, entry.maxLength),
      nullable: missing > 0 || entry.nullish > 0,
      children:
        depth < 2 && nestedObjects.length > 0
          ? analyzeRows(nestedObjects, maxRows, depth + 1).fields
          : undefined,
    };
  });

  return { rows: rows.length, analyzedRows: sample.length, fields };
}

export function toRows(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (isRecord(data) && Object.keys(data).length > 0) return [data];
  return [];
}

function typeSummary(types: Partial<Record<ObservedType, number>>) {
  return Object.entries(types)
    .map(([type, count]) => `${type}×${count}`)
    .join(", ");
}

// Markdown table for pasting into a design note or cookbook.
export function toMarkdown(title: string, analysis: StructureAnalysis): string {
  const lines = [
    `### ${title}`,
    "",
    `Dianalisis ${analysis.analyzedRows} dari ${analysis.rows} baris.`,
    "",
    "| Field | Usulan tipe | Nullable | Tipe teramati | Contoh |",
    "|---|---|---|---|---|",
  ];
  const walk = (fields: FieldAnalysis[], prefix: string) => {
    for (const field of fields) {
      const examples = field.examples.map((example) => example.replaceAll("|", "\\|")).join("; ");
      lines.push(
        `| \`${prefix}${field.field}\` | ${field.suggested} | ${field.nullable ? "ya" : "tidak"} | ${typeSummary(field.types)} | ${examples} |`,
      );
      if (field.children) {
        walk(field.children, `${prefix}${field.field}[].`);
      }
    }
  };
  walk(analysis.fields, "");
  return lines.join("\n");
}
