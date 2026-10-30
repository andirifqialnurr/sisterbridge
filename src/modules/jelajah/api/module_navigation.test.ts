import { describe, expect, it } from "vitest";
import { jelajahModules } from "./jelajah_catalog";
import { moduleNavigationContext, moduleNavigationHref } from "./module_navigation";

const id = "00000000-0000-4000-8000-000000000001";
const profile = jelajahModules.find(module => module.key === "profil")!;
const activity = jelajahModules.find(module => module.key === "bkd_ajar")!;

describe("single-layer section navigation", () => {
  it("keeps directory entry links without fabricating an SDM", () => {
    expect(moduleNavigationHref(profile)).toBe("/pegawai?tab=profil");
    expect(moduleNavigationHref(activity)).toBe("/bkd?tab=bkd_ajar");
  });

  it("keeps the same SDM across all personal sections from profile and direct API routes", () => {
    for (const path of [`/pegawai/${id}`, `/data_pribadi/profil/${id}`]) {
      const context = moduleNavigationContext(path, "tab=profil&page=9&search=private");
      for (const entry of jelajahModules.filter(module => module.kind === "sdm_object")) {
        const link = moduleNavigationHref(entry, context);
        expect(link).toBe(`/pegawai/${id}?tab=${entry.key}`);
        expect(link).not.toContain("private");
      }
    }
  });

  it("retains BKD owner and semester but resets pagination on section changes", () => {
    const context = moduleNavigationContext("/bkd", `id_sdm=${id}&id_smt=20251&page_aktivitas=8`);
    for (const entry of jelajahModules.filter(module => module.key.startsWith("bkd_") || module.key === "laporan_akhir_bkd")) {
      const params = new URL(moduleNavigationHref(entry, context), "https://app.test").searchParams;
      expect(params.get("id_sdm")).toBe(id);
      expect(params.get("id_smt")).toBe("20251");
      expect(params.get("page_aktivitas")).toBeNull();
    }
    expect(moduleNavigationHref(profile, context)).toBe(`/pegawai/${id}?tab=profil`);
  });

  it("does not infer IDs from a foreign path, nested segments or malformed parameters", () => {
    for (const path of [`/penelitian/${id}`, `/pegawai/${id}/extra`, "/pegawai/ajuan"]) {
      expect(moduleNavigationContext(path, "id_sdm=not-a-uuid").idSdm).toBe("");
    }
    expect(moduleNavigationContext(`/pegawai/${id}`, "id_sdm=invalid").idSdm).toBe(id);
    expect(moduleNavigationContext("/penelitian", `id_sdm=${id}&id_smt=20251`).semester).toBe("");
  });

  it("leaves non-SDM and reference query variants unchanged", () => {
    for (const entry of jelajahModules.filter(module => module.kind !== "sdm_object" && !module.key.startsWith("bkd_") && module.key !== "laporan_akhir_bkd")) {
      const query = new URLSearchParams(entry.query ?? {}).toString();
      expect(moduleNavigationHref(entry, { idSdm: id, semester: "20251" })).toBe(`${entry.path}${query ? `?${query}` : ""}`);
    }
  });
});
