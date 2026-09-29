export function buildSisterUrl(
  baseUrl: string,
  path: string,
  query?: Record<string, string | number | undefined>,
) {
  if (!path.startsWith("/")) {
    throw new Error("SISTER adapter paths must be absolute API paths");
  }

  if (path.startsWith("//")) {
    throw new Error("SISTER adapter rejected an unsafe URL");
  }

  const base = new URL(baseUrl);
  if (base.protocol !== "https:") {
    throw new Error("SISTER adapter rejected an unsafe URL");
  }

  // SISTER exposes versioned APIs below a path such as
  // `/ws-sandbox.php/1.0`. Resolving an absolute URL path directly against
  // the origin would discard that prefix, so resolve relative to the base
  // directory instead.
  const basePath = base.pathname.endsWith("/")
    ? base.pathname
    : `${base.pathname}/`;
  const baseDirectory = new URL(basePath, base.origin);
  const url = new URL(path.slice(1), baseDirectory);

  if (
    url.origin !== base.origin ||
    url.protocol !== "https:" ||
    !url.pathname.startsWith(basePath)
  ) {
    throw new Error("SISTER adapter rejected an unsafe URL");
  }

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}