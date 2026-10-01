import { BusinessModulePage } from "@/modules/business/page/business_module_pages";
export default async function Page({ params }: { params: Promise<{ id_pendidikan_formal: string }> }) {
  const { id_pendidikan_formal } = await params;
  return <BusinessModulePage itemId={id_pendidikan_formal} moduleKey="pendidikan_formal" />;
}