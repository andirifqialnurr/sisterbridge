// Shared pacing for every replica request. SISTER blocks a credential with
// 429 (no Retry-After header) after sustained bursts: on 2026-09-29 roughly
// 4,000 requests in 4 minutes locked even POST /authorize. The gate spaces
// request starts, and on 429 pauses all requests, halves the rate, and backs
// off exponentially; success slowly restores the configured rate.

export class RateLimitExhaustedError extends Error {
  constructor(message = "SISTER kept answering 429; sync stopped to avoid a longer block") {
    super(message);
    this.name = "RateLimitExhaustedError";
  }
}

export type RateGateOptions = {
  requestsPerSecond: number;
  minRequestsPerSecond?: number;
  initialCooldownMs?: number;
  maxCooldownMs?: number;
  // Consecutive 429 answers (across all requests) before giving up.
  maxConsecutiveRateLimits?: number;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
};

export class RateGate {
  private readonly maxRps: number;
  private readonly minRps: number;
  private readonly initialCooldownMs: number;
  private readonly maxCooldownMs: number;
  private readonly maxConsecutive: number;
  private readonly now: () => number;
  private readonly sleep: (ms: number) => Promise<void>;

  private rps: number;
  private nextSlotAt = 0;
  private pausedUntil = 0;
  private cooldownMs: number;
  private consecutiveRateLimits = 0;
  private successesSinceLimit = 0;
  rateLimitCount = 0;

  constructor(options: RateGateOptions) {
    this.maxRps = Math.max(0.1, options.requestsPerSecond);
    this.minRps = Math.min(this.maxRps, options.minRequestsPerSecond ?? 0.5);
    this.initialCooldownMs = options.initialCooldownMs ?? 30_000;
    this.maxCooldownMs = options.maxCooldownMs ?? 5 * 60_000;
    this.maxConsecutive = options.maxConsecutiveRateLimits ?? 6;
    this.now = options.now ?? Date.now;
    this.sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.rps = this.maxRps;
    this.cooldownMs = this.initialCooldownMs;
  }

  get currentRps() {
    return this.rps;
  }

  // Waits for the pause (if any) and for this request's start slot.
  async acquire() {
    for (;;) {
      const now = this.now();
      if (now < this.pausedUntil) {
        await this.sleep(this.pausedUntil - now);
        continue;
      }
      const slot = Math.max(now, this.nextSlotAt);
      this.nextSlotAt = slot + 1000 / this.rps;
      if (slot > now) {
        await this.sleep(slot - now);
      }
      if (this.now() >= this.pausedUntil) {
        return;
      }
    }
  }

  recordSuccess() {
    this.consecutiveRateLimits = 0;
    this.cooldownMs = this.initialCooldownMs;
    this.successesSinceLimit += 1;
    // Additive recovery: +10% of the configured rate per 50 successes.
    if (this.rps < this.maxRps && this.successesSinceLimit % 50 === 0) {
      this.rps = Math.min(this.maxRps, this.rps + this.maxRps * 0.1);
    }
  }

  // Returns the pause length; throws once SISTER keeps refusing.
  recordRateLimit(): number {
    this.rateLimitCount += 1;
    this.successesSinceLimit = 0;

    const now = this.now();
    // Requests already in flight when the block started report 429 too;
    // only the first one starts a pause, halves the rate, and counts
    // towards giving up.
    if (now < this.pausedUntil) {
      return this.pausedUntil - now;
    }
    this.consecutiveRateLimits += 1;
    if (this.consecutiveRateLimits > this.maxConsecutive) {
      throw new RateLimitExhaustedError();
    }
    const pause = this.cooldownMs;
    this.pausedUntil = now + pause;
    this.cooldownMs = Math.min(this.maxCooldownMs, this.cooldownMs * 2);
    this.rps = Math.max(this.minRps, this.rps / 2);
    return pause;
  }
}
