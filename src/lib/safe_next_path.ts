// Reject URL-normalization tricks as well as explicit protocol-relative URLs.
// In particular, browsers strip tabs/newlines before resolving an origin.
export function safeNextPath(value: string | null): string {
  if (!value?.startsWith("/") || Array.from(value).some(char => char === "\\" || char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127)) return "/";
  const origin = "https://same-site.invalid";
  try {
    const target = new URL(value, origin);
    return target.origin === origin ? `${target.pathname}${target.search}${target.hash}` : "/";
  } catch {
    return "/";
  }
}
