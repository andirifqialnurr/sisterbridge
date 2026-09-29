// Bun (and @prisma/client on import) load .env into process.env, so a
// developer's live SISTER settings would leak into tests. Both loaders only
// fill variables that are still undefined, so pin fixture mode explicitly;
// live-mode tests set their own variables.
for (const key of Object.keys(process.env)) {
  if (key.startsWith("SISTER_")) {
    delete process.env[key];
  }
}
process.env.SISTER_FIXTURE_MODE = "true";
