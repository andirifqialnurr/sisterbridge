const maxTimerDelay = 2_147_483_647;

export function sessionExpiryTime(value: unknown): number | null {
  const time = value instanceof Date ? value.getTime()
    : typeof value === "string" || typeof value === "number" ? new Date(value).getTime() : NaN;
  return Number.isFinite(time) ? time : null;
}

// Recheck long deadlines rather than overflowing setTimeout's signed 32-bit
// range. Cancellation and a one-shot callback make session refresh races safe.
export function scheduleSessionExpiry(expiresAt: number, onExpire: () => void): () => void {
  let active = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  function check() {
    if (!active) return;
    const remaining = expiresAt - Date.now();
    if (!Number.isFinite(remaining) || remaining <= 0) {
      active = false;
      onExpire();
    } else {
      timer = setTimeout(check, Math.min(remaining, maxTimerDelay));
    }
  }
  check();
  return () => { active = false; clearTimeout(timer); };
}
