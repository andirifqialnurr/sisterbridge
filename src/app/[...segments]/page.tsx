import { notFound } from "next/navigation";
import { resolveBusinessRoute, type BusinessSearchParams } from "@/modules/business/api/business_routes";
import { BusinessModulePage } from "@/modules/business/page/business_module_pages";
import { BusinessBkdPage } from "@/modules/business/page/business_bkd_page";

export default async function BusinessRoute({ params, searchParams }: { params: Promise<{ segments: string[] }>; searchParams: Promise<BusinessSearchParams> }) {
  const [{ segments }, query] = await Promise.all([params, searchParams]);
  const path = `/${segments.join("/")}`;
  const resolved = resolveBusinessRoute(path, query);
  if (!resolved) notFound();
  const { module: catalogEntry, itemId } = resolved;
  if (!itemId && (catalogEntry.key.startsWith("bkd_") || catalogEntry.key === "laporan_akhir_bkd")) {
    return <BusinessBkdPage initialTab={catalogEntry.key} />;
  }
  return <BusinessModulePage itemId={itemId} moduleKey={catalogEntry.key} />;
}