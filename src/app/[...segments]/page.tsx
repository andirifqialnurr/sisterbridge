import { notFound } from "next/navigation";
import { jelajahModules } from "@/modules/jelajah/api/jelajah_catalog";
import { BusinessModulePage } from "@/modules/business/page/business_module_pages";
import { BusinessBkdPage } from "@/modules/business/page/business_bkd_page";

type SearchParams = Record<string, string | string[] | undefined>;
function matches(template: string, path: string) {
  const expected = template.split("/").filter(Boolean);
  const actual = path.split("/").filter(Boolean);
  if (expected.length !== actual.length) return null;
  const values: string[] = [];
  for (let index = 0; index < expected.length; index += 1) {
    if (/^\{[^}]+\}$/.test(expected[index])) values.push(actual[index]);
    else if (expected[index] !== actual[index]) return null;
  }
  return values;
}
function queryMatches(module: (typeof jelajahModules)[number], params: SearchParams) {
  return Object.entries(module.query ?? {}).every(([key, value]) => String(params[key] ?? "") === value);
}
export default async function BusinessRoute({ params, searchParams }: { params: Promise<{ segments: string[] }>; searchParams: Promise<SearchParams> }) {
  const [{ segments }, query] = await Promise.all([params, searchParams]);
  const path = `/${segments.join("/")}`;
  for (const module of jelajahModules) {
    const exact = matches(module.path, path);
    if (exact?.length === 0 && queryMatches(module, query)) {
      if (module.key.startsWith("bkd_") || module.key === "laporan_akhir_bkd") return <BusinessBkdPage initialTab={module.key} />;
      return <BusinessModulePage moduleKey={module.key} />;
    }
    if (exact?.length === 1 && module.kind === "sdm_object") return <BusinessModulePage itemId={exact[0]} moduleKey={module.key} />;
    if (module.detailPath) {
      const detail = matches(module.detailPath, path);
      if (detail?.length === 1) return <BusinessModulePage itemId={detail[0]} moduleKey={module.key} />;
    } else if (module.children?.length) {
      const detail = matches(`${module.path}/{id}`, path);
      if (detail?.length === 1) return <BusinessModulePage itemId={detail[0]} moduleKey={module.key} />;
    }
  }
  notFound();
}