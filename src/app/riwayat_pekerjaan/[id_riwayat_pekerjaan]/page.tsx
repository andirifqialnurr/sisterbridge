import { BusinessModulePage } from "@/modules/business/page/business_module_pages";
export default async function Page({ params }: { params: Promise<{ id_riwayat_pekerjaan: string }> }) {
  const { id_riwayat_pekerjaan } = await params;
  return <BusinessModulePage itemId={id_riwayat_pekerjaan} moduleKey="riwayat_pekerjaan" />;
}