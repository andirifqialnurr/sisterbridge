// Regenerates the typed `replica` schema from the payloads currently in
// sister_replica_record and writes it as a new Prisma migration plus
// cookbook/replica_schema.md.
//
//   bun run replica:views            # write migration + doc
//   bun run replica:views --dry-run  # print a summary only
//   bunx prisma migrate deploy       # apply
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

import { prisma } from "@/server/db/prisma";
import { replicaEndpointTemplates } from "@/server/sister/replica/replica_catalog";
import {
  buildMigrationSql,
  buildSchemaDoc,
  buildViewSpecs,
} from "@/server/sister/replica/replica_views";

const { values } = parseArgs({ options: { "dry-run": { type: "boolean", default: false } } });

try {
  const endpoints = replicaEndpointTemplates();
  const samples = new Map<string, unknown[]>();
  for (const endpoint of endpoints) {
    const rows = await prisma.sisterReplicaRecord.findMany({
      where: { endpoint, deletedAt: null },
      select: { payloadJson: true },
    });
    samples.set(endpoint, rows.map((row) => row.payloadJson));
  }

  const specs = buildViewSpecs(samples, endpoints);
  const empty = specs.filter((spec) => spec.columns.length === 0).map((spec) => spec.name);
  console.log(`${specs.length} views (${specs.filter((spec) => spec.arrayField).length} child views)`);
  if (empty.length > 0) {
    console.log(`Without samples (meta + r_payload only): ${empty.join(", ")}`);
  }

  if (!values["dry-run"]) {
    const now = new Date();
    const generatedAt = now.toISOString();
    // The views depend on earlier migrations, so the new migration must sort
    // after every existing one even if a hand-written name is ahead of UTC.
    const migrationsRoot = join("prisma", "migrations");
    const latest = readdirSync(migrationsRoot)
      .map((name) => name.match(/^(\d{14})_/)?.[1])
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1);
    const nowStamp = generatedAt.replace(/\D/g, "").slice(0, 14);
    const stamp =
      latest && latest >= nowStamp ? String(BigInt(latest) + BigInt(1)) : nowStamp;
    const directory = join(migrationsRoot, `${stamp}_replica_views`);
    mkdirSync(directory, { recursive: true });
    writeFileSync(join(directory, "migration.sql"), buildMigrationSql(specs, generatedAt));
    writeFileSync(join("cookbook", "replica_schema.md"), buildSchemaDoc(specs, generatedAt));
    console.log(`Wrote ${directory}/migration.sql and cookbook/replica_schema.md`);
  }
} finally {
  await prisma.$disconnect();
}
