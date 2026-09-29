import { describe, expect, it } from "vitest";

import { RateGate, RateLimitExhaustedError } from "./replica_rate_gate";

function fakeClock() {
  let now = 0;
  const sleeps: number[] = [];
  return {
    now: () => now,
    sleep: async (ms: number) => {
      sleeps.push(ms);
      now += ms;
    },
    advance: (ms: number) => {
      now += ms;
    },
    sleeps,
  };
}

describe("RateGate", () => {
  it("spaces request starts at the configured rate", async () => {
    const clock = fakeClock();
    const gate = new RateGate({ requestsPerSecond: 4, now: clock.now, sleep: clock.sleep });

    await gate.acquire();
    await gate.acquire();
    await gate.acquire();

    expect(clock.now()).toBe(500);
  });

  it("pauses everyone, halves the rate, and backs off exponentially on 429", async () => {
    const clock = fakeClock();
    const gate = new RateGate({
      requestsPerSecond: 4,
      initialCooldownMs: 30_000,
      now: clock.now,
      sleep: clock.sleep,
    });

    expect(gate.recordRateLimit()).toBe(30_000);
    expect(gate.currentRps).toBe(2);
    // In-flight requests hitting the same block only wait for the pause.
    clock.advance(10_000);
    expect(gate.recordRateLimit()).toBe(20_000);
    expect(gate.currentRps).toBe(2);

    await gate.acquire();
    expect(clock.now()).toBeGreaterThanOrEqual(30_000);

    expect(gate.recordRateLimit()).toBe(60_000);
    expect(gate.currentRps).toBe(1);
  });

  it("gives up after too many consecutive blocks and recovers after successes", async () => {
    const clock = fakeClock();
    const gate = new RateGate({
      requestsPerSecond: 4,
      initialCooldownMs: 1_000,
      maxConsecutiveRateLimits: 2,
      now: clock.now,
      sleep: clock.sleep,
    });

    gate.recordRateLimit();
    clock.advance(5_000);
    gate.recordRateLimit();
    clock.advance(5_000);
    expect(() => gate.recordRateLimit()).toThrow(RateLimitExhaustedError);

    const recovering = new RateGate({
      requestsPerSecond: 4,
      initialCooldownMs: 1_000,
      maxConsecutiveRateLimits: 2,
      now: clock.now,
      sleep: clock.sleep,
    });
    recovering.recordRateLimit();
    for (let index = 0; index < 50; index += 1) {
      recovering.recordSuccess();
    }
    expect(recovering.currentRps).toBeCloseTo(2.4);
  });
});
