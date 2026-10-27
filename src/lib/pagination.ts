// Keep browser URL state within the same bounded integer range as API schemas.
export function parsePageParam(value: string | undefined): number {
  if (!value || !/^\d{1,7}$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page >= 1 && page <= 1_000_000 ? page : 1;
}
