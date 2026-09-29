import { handleSisterFileRequest } from "@/server/sister/file_route";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleSisterFileRequest({ kind: "dokumen", id, request });
}
