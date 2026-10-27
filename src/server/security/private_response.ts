// Authenticated tRPC batches can contain multiple users' sensitive read DTOs.
// Never let browser/proxy HTTP caches replay them after an account switch.
export function withPrivateResponsePolicy(response: Response, requestId: string): Response {
  const headers = new Headers(response.headers);
  headers.set("cache-control", "private, no-store, max-age=0");
  headers.set("pragma", "no-cache");
  headers.set("expires", "0");
  headers.set("x-request-id", requestId);
  const vary = (headers.get("vary") ?? "").split(",").map(value => value.trim().toLowerCase());
  if (!vary.includes("cookie") && !vary.includes("*")) headers.append("vary", "Cookie");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
