// Read-only SISTER -> PostgreSQL replica sync.
//
//   bun run sister:sync                      # full: referensi + every SDM
//   bun run sister:sync --scope referensi    # reference data + SDM index only
//   bun run sister:sync --scope sdm --sdm <id_sdm>[,<id_sdm>]
//   bun run sister:sync --sdm-limit 3        # smoke test on the first 3 SDMs
//   bun run sister:sync --concurrency 6 --no-children
//   bun run sister:sync --rps 2                     # slower pacing (default 4 req/s)
//   bun run sister:sync --refresh-children          # re-fetch every detail
//   bun run sister:sync --dry-run --dump out.json   # no database writes
//
// Only GET requests are sent. Outside production the sandbox base URL
// (SISTER_BASE_URL_DEV) is used when configured; see src/server/sister/config.ts.
import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

import { prisma } from "@/server/db/prisma";
import { getSisterConfig } from "@/server/sister/config";
import { fetchSisterJson } from "@/server/sister/replica/replica_fetch";
import { MemoryReplicaStore } from "@/server/sister/replica/replica_memory_store";
import { PrismaReplicaStore } from "@/server/sister/replica/replica_repository";
import { runReplicaSync, type ReplicaSyncScope } from "@/server/sister/replica/replica_sync";
import { getSisterToken } from "@/server/sister/token_provider";

const { values } = parseArgs({
  options: {
    scope: { type: "string", default: "full" },
    sdm: { type: "string" },
    "sdm-limit": { type: "string" },
    concurrency: { type: "string", default: "4" },
    rps: { type: "string", default: "4" },
    "no-children": { type: "boolean", default: false },
    "refresh-children": { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
    dump: { type: "string" },
  },
});

const scope = values.scope as ReplicaSyncScope;
if (!["full", "referensi", "sdm"].includes(scope)) {
  console.error(`Unknown --scope "${values.scope}". Use full, referensi, or sdm.`);
  process.exit(2);
}

const concurrency = Number(values.concurrency);
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 16) {
  console.error("--concurrency must be an integer between 1 and 16.");
  process.exit(2);
}

const requestsPerSecond = Number(values.rps);
if (!Number.isFinite(requestsPerSecond) || requestsPerSecond <= 0 || requestsPerSecond > 20) {
  console.error("--rps must be a number between 0 and 20.");
  process.exit(2);
}

const config = getSisterConfig();
if (config.fixture_mode || !config.base_url) {
  console.error("SISTER live mode is not enabled. Set SISTER_FIXTURE_MODE=false and the SISTER_* credentials.");
  process.exit(2);
}
if (!config.integration_id) {
  console.error("SISTER_INTEGRATION_ID is required so replica rows belong to one integration.");
  process.exit(2);
}

const dryRun = values["dry-run"];
if (values.dump && !dryRun) {
  console.error("--dump is only available together with --dry-run.");
  process.exit(2);
}
const memoryStore = dryRun ? new MemoryReplicaStore() : null;

const startedAt = Date.now();
console.log(
  `SISTER replica sync -> ${config.base_url} (scope=${scope}, concurrency=${concurrency}, rps=${requestsPerSecond}${dryRun ? ", dry-run" : ""})`,
);

try {
  const result = await runReplicaSync(
    {
      fetcher: fetchSisterJson,
      store: memoryStore ?? new PrismaReplicaStore(prisma),
      authorize: async () => ({ role: (await getSisterToken()).role }),
    },
    {
      integrationId: config.integration_id,
      baseUrl: config.base_url,
      credentialRef: config.credential_ref ?? "environment",
      scope,
      sdmIds: values.sdm?.split(",").map((id) => id.trim()).filter(Boolean),
      sdmLimit: values["sdm-limit"] ? Number(values["sdm-limit"]) : undefined,
      concurrency,
      requestsPerSecond,
      includeChildren: !values["no-children"],
      refreshChildren: values["refresh-children"],
      log: (line) => console.log(`[${((Date.now() - startedAt) / 1000).toFixed(0)}s] ${line}`),
    },
  );

  console.log(
    `\n${result.status} in ${((Date.now() - startedAt) / 1000).toFixed(0)}s: ` +
      `${result.requestCount} requests, ${result.recordCount} records, ` +
      `${result.changedCount} new/changed, ${result.deletedCount} retired, ${result.errorCount} errors (run ${result.runId})`,
  );

  const failing = Object.entries(result.endpoints).filter(([, stats]) => stats.failed > 0);
  if (failing.length > 0) {
    console.log("\nEndpoints with failures:");
    for (const [endpoint, stats] of failing) {
      console.log(`  ${endpoint}: ${stats.failed}/${stats.requests} failed, statuses=${JSON.stringify(stats.statuses)}`);
    }
  }

  if (memoryStore && values.dump) {
    writeFileSync(
      values.dump,
      JSON.stringify({ result, records: memoryStore.liveRecords() }, null, 1),
    );
    console.log(`
Dry-run records written to ${values.dump}`);
  }

  process.exitCode = result.status === "FAILED" ? 1 : 0;
} finally {
  await prisma.$disconnect();
}
