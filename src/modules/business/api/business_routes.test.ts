import { expect, it } from "vitest";
import { jelajahModules } from "@/modules/jelajah/api/jelajah_catalog";
import { resolveBusinessRoute } from "./business_routes";

it.each(jelajahModules.filter((module) => !module.path.includes("{")))(
  "resolves the exact list URL for $key before any record route",
  (module) => {
    const result = resolveBusinessRoute(module.path, module.query);
    expect(result?.module.key).toBe(module.key);
    expect(result?.itemId).toBeUndefined();
  },
);

it.each(jelajahModules.filter((module) => module.detailPath))(
  "keeps detail navigation for $key",
  (module) => {
    const result = resolveBusinessRoute(module.detailPath!.replace("{id}", "record-123"));
    expect(result?.module.key).toBe(module.key);
    expect(result?.itemId).toBe("record-123");
  },
);

it("requires exact query variants and rejects unknown routes", () => {
  expect(resolveBusinessRoute("/referensi/wilayah", { id_level_wilayah: ["1", "2"] })).toBeNull();
  expect(resolveBusinessRoute("/referensi/wilayah")).toBeNull();
  expect(resolveBusinessRoute("/unknown")).toBeNull();
});
