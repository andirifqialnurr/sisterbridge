import { BusinessModulePage } from "@/modules/business/page/business_module_pages";
export default async function Page({ params }: { params: Promise<{ id_penugasan: string }> }) {
  const { id_penugasan } = await params;
  return <BusinessModulePage itemId={id_penugasan} moduleKey="penugasan" />;
}