import { describe, expect, it } from "vitest";

import { appRouter } from "@/server/trpc/router";

function makeCaller(role: "ADMIN" | "OPERATOR" | "VIEWER" | null) {
  return appRouter.createCaller({
    requestId: "jelajah-request-123",
    request: new Request("https://app.test/api/trpc/jelajah.modules"),
    user: role
      ? { id: "00000000-0000-4000-8000-000000000001", email: "u@example.test", name: "U", role }
      : null,
  });
}

describe("Jelajah procedures", () => {
  it("lists the module catalog for operators", async () => {
    const modules = await makeCaller("OPERATOR").jelajah.modules();
    expect(modules.some((module) => module.key === "penelitian")).toBe(true);
  });

  it("rejects viewers and anonymous callers", async () => {
    await expect(makeCaller("VIEWER").jelajah.modules()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(makeCaller(null).jelajah.modules()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects unknown modules and malformed IDs before reaching SISTER", async () => {
    const caller = makeCaller("ADMIN");
    await expect(caller.jelajah.list({ module: "../referensi" as "ref_agama" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    await expect(caller.jelajah.detail({ module: "penelitian", id: "../../x" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("explains that the explorer needs live mode", async () => {
    process.env.SISTER_FIXTURE_MODE = "true";
    await expect(makeCaller("ADMIN").jelajah.list({ module: "ref_agama" })).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    });
  });
});
