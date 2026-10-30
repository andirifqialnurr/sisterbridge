import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SdmProfilePage } from "./business_module_pages";
import { BusinessBkdPage } from "./business_bkd_page";
import { jelajahModules } from "@/modules/jelajah/api/jelajah_catalog";

const state = vi.hoisted(() => ({ values: {} as Record<string, string>, requests: [] as Record<string, unknown>[] }));
vi.mock("@tanstack/react-query", () => ({ useQuery: () => ({ data: undefined, isPending: false, error: null }) }));
vi.mock("@/lib/trpc", () => ({ useTRPC: () => ({ business: {
  rows: { queryOptions: (input: Record<string, unknown>) => { state.requests.push(input); return {}; } },
  semesters: { queryOptions: () => ({}) },
} }) }));
vi.mock("@/component/ui/page_shell", () => ({ PageShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock("./business_shared", async importOriginal => ({
  ...await importOriginal<typeof import("./business_shared")>(),
  useUrlState: () => ({ values: state.values, ready: true, set: vi.fn() }),
  SdmPicker: () => null,
}));

beforeEach(() => { state.values = {}; state.requests = []; });
const id = "00000000-0000-4000-8000-000000000001";

describe("submenu-owned business sections", () => {
  it.each(jelajahModules.filter(module => module.kind === "sdm_object"))("renders $label without repeating sidebar choices as tabs", module => {
    state.values = { tab: module.key };
    const html = renderToStaticMarkup(<SdmProfilePage idSdm={id} />);
    expect(html).not.toContain('role="tablist"');
    expect(html).toContain(`<h1 id="sdm-section-heading" class="text-base font-semibold">${module.label}</h1>`);
    expect(state.requests[0]).toMatchObject({ module: module.key, id_sdm: id });
  });

  it.each(["laporan_akhir_bkd", "bkd_pendidikan", "bkd_ajar", "bkd_tunjang", "bkd_pengmas", "bkd_penelitian"])("renders BKD section %s from URL without a second navigation layer", key => {
    state.values = { tab: key, id_sdm: id, id_smt: "20251" };
    const html = renderToStaticMarkup(<BusinessBkdPage />);
    expect(html).not.toContain('role="tablist"');
    expect(html).toContain('id="bkd-section-heading"');
    expect(state.requests.at(-1)).toMatchObject({ module: key, id_sdm: id, id_smt: "20251" });
  });

  it("keeps direct BKD route defaults and invalid URL values safe", () => {
    state.values = { tab: "not-a-module" };
    expect(renderToStaticMarkup(<BusinessBkdPage initialTab="bkd_ajar" />)).toContain("BKD pengajaran");
    expect(renderToStaticMarkup(<BusinessBkdPage initialTab="invalid" />)).toContain("Laporan akhir BKD");
  });

  it("explains missing semester instead of disabling hidden activity tabs", () => {
    state.values = { tab: "bkd_ajar", id_sdm: id };
    const html = renderToStaticMarkup(<BusinessBkdPage />);
    expect(html).toContain("Semester belum tersedia");
    expect(html).not.toContain('role="tab"');
  });
});
