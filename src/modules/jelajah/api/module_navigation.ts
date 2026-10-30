import { jelajahModules, type JelajahModule } from "@/modules/jelajah/api/jelajah_catalog";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Sidebar owns navigation between SDM/BKD sections. Preserve only the context
// those sections need, not searches, stale pagination or arbitrary parameters.
export function moduleNavigationContext(pathname: string, search: string) {
  const params = new URLSearchParams(search);
  const profilePrefixes = ["/pegawai", ...jelajahModules.filter(module => module.kind === "sdm_object").map(module => module.path.split("/{")[0])];
  const profileId = profilePrefixes.map(prefix => pathname.startsWith(`${prefix}/`) ? pathname.slice(prefix.length + 1) : "")
    .find(id => uuid.test(id));
  const queryId = params.get("id_sdm") ?? "";
  const idSdm = profileId || (uuid.test(queryId) ? queryId : "");
  const semester = pathname === "/bkd" || pathname.startsWith("/bkd/") ? params.get("id_smt") ?? "" : "";
  return { idSdm, semester };
}

export function moduleNavigationHref(module: JelajahModule, context = { idSdm: "", semester: "" }) {
  if (module.kind === "sdm_object") {
    return `/pegawai${context.idSdm ? `/${encodeURIComponent(context.idSdm)}` : ""}?tab=${encodeURIComponent(module.key)}`;
  }
  if (module.key.startsWith("bkd_") || module.key === "laporan_akhir_bkd") {
    const params = new URLSearchParams({ tab: module.key });
    if (context.idSdm) params.set("id_sdm", context.idSdm);
    if (context.semester) params.set("id_smt", context.semester);
    return `/bkd?${params}`;
  }
  const query = new URLSearchParams(module.query ?? {}).toString();
  return `${module.path}${query ? `?${query}` : ""}`;
}
