type NavigableTab = { disabled?: boolean };

// Roving focus must skip disabled tabs in the requested direction. In
// particular, ArrowLeft/End must not fall back to a forward scan.
export function getNextEnabledTabIndex(
  items: readonly NavigableTab[],
  current: number,
  key: string,
): number | null {
  const length = items.length;
  if (length === 0 || !Number.isInteger(current)) return null;
  const normalized = ((current % length) + length) % length;
  let start: number;
  let direction: number;
  switch (key) {
    case "ArrowRight": start = (normalized + 1) % length; direction = 1; break;
    case "ArrowLeft": start = (normalized - 1 + length) % length; direction = -1; break;
    case "Home": start = 0; direction = 1; break;
    case "End": start = length - 1; direction = -1; break;
    default: return null;
  }
  for (let offset = 0; offset < length; offset += 1) {
    const index = (start + offset * direction + length) % length;
    if (!items[index].disabled) return index;
  }
  return null;
}
