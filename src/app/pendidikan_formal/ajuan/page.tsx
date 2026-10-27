import { BusinessModulePage } from "@/modules/business/page/business_module_pages";

// A literal route is necessary: [id_pendidikan_formal] takes precedence
// over the root catch-all in Next.js.
export default function Page() {
  return <BusinessModulePage moduleKey="pendidikan_formal_ajuan" />;
}
