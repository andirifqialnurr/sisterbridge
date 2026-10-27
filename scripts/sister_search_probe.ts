// Bounded sandbox-only probes. No database writes, payloads, personal IDs,
// search terms or credentials are printed. An optional collaborator name can
// be supplied in SISTER_QA_COLLABORATOR_NAME; never pass NIK for smoke testing.
import { z } from "zod";
import { getSisterConfig } from "@/server/sister/config";
import { SisterApiError } from "@/server/sister/errors";
import { sisterGet } from "@/server/sister/http_client";
import { getJelajahDetail, getJelajahList, JelajahUnavailableError } from "@/modules/jelajah/api/jelajah_service";
import type { JelajahFetcher } from "@/modules/jelajah/api/jelajah_adapter";

const results: Record<string, unknown>[] = [];
let requests = 0;
let studentRequests = 0;
const fetcher: JelajahFetcher = async (path, query) => {
  requests += 1;
  if (path === "/referensi/mahasiswa_pddikti") studentRequests += 1;
  await new Promise(resolve => setTimeout(resolve, 1000));
  return sisterGet({ path, query, schema: z.unknown(), timeoutMs: 10000 });
};
async function probe<T>(module: string, load: () => Promise<T>): Promise<T | null> {
  try { return await load(); } catch (error) {
    results.push({ module, state: "failed", status: error instanceof SisterApiError ? error.status : 0 });
    return null;
  }
}
try {
  const config = getSisterConfig();
  if (config.fixture_mode || !config.base_url?.includes("sandbox")) throw new Error("Sandbox live configuration required");
  const units = await probe("ref_unit_kerja", () => getJelajahList({ module: "ref_unit_kerja" }, fetcher));
  const unitRows = Array.isArray(units?.data) ? units.data as Record<string, unknown>[] : [];
  const program = unitRows.find(row => String(row.id_jenis_unit) === "3" && z.string().uuid().safeParse(row.id).success);
  if (program) {
    const students = await probe("mahasiswa_pddikti", () => getJelajahList({
      module: "mahasiswa_pddikti", search: { id_program_studi: String(program.id), keyword: "SisterbridgeQaNoMatch" },
    }, fetcher));
    if (students) results.push({ module: "mahasiswa_pddikti", state: "response_received", status: 200, shape: students.shape, count: students.item_count });
    const before = studentRequests;
    let denied = false;
    try {
      await getJelajahList({ module: "mahasiswa_pddikti", search: {
        id_program_studi: "00000000-0000-4000-8000-000000000000", keyword: "SisterbridgeQaNoMatch",
      } }, fetcher);
    } catch (error) { denied = error instanceof JelajahUnavailableError; }
    results.push({ module: "mahasiswa_pddikti", unownedProgramRejected: denied, unownedStudentRequests: studentRequests - before });
    if (!denied || studentRequests !== before) process.exitCode = 1;
  } else results.push({ module: "mahasiswa_pddikti", state: "waiting_for_owned_program" });

  const name = z.string().trim().min(3).max(100).parse(process.env.SISTER_QA_COLLABORATOR_NAME ?? "SisterbridgeQaNoMatch");
  const collaborators = await probe("kolaborator_eksternal", () => getJelajahList({ module: "kolaborator_eksternal", search: { nama: name } }, fetcher));
  if (collaborators) results.push({ module: "kolaborator_eksternal", state: "response_received", status: 200, shape: collaborators.shape, count: collaborators.item_count });
  const rows = Array.isArray(collaborators?.data) ? collaborators.data as Record<string, unknown>[] : [];
  const match = rows.find(row => z.string().regex(/^[A-Za-z0-9_-]{1,64}$/).safeParse(row.id).success);
  if (match) {
    const detail = await probe("kolaborator_eksternal_detail", () => getJelajahDetail({ module: "kolaborator_eksternal", id: String(match.id) }, fetcher));
    if (detail) results.push({ module: "kolaborator_eksternal_detail", state: "response_received", status: 200, shape: detail.shape, count: detail.item_count });
  } else results.push({ module: "kolaborator_eksternal_detail", state: "waiting_for_search_match" });
  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), target: "sandbox", requests, databaseWrites: false, results }, null, 2));
} catch {
  console.error("Search probe stopped; check sandbox configuration. No credentials, search terms or payloads printed.");
  process.exitCode = 1;
}
