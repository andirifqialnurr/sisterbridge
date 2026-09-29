import { handleSisterFileRequest } from "@/server/sister/file_route";

export async function GET(request: Request, { params }: { params: Promise<{ id_sdm: string }> }) {
  const { id_sdm } = await params;
  return handleSisterFileRequest({ kind: "foto", id: id_sdm, request });
}
