import { SdmProfilePage } from "@/modules/business/page/business_module_pages";
export default async function Page({ params }: { params: Promise<{ id_sdm: string }> }) {
  const { id_sdm } = await params;
  return <SdmProfilePage idSdm={id_sdm} />;
}