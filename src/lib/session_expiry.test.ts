import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { scheduleSessionExpiry, sessionExpiryTime } from "./session_expiry";

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-27T00:00:00Z")); });
afterEach(() => vi.useRealTimers());

it("parses serialized and Date expirations without accepting ambiguous values", () => {
  const date = new Date("2026-10-27T00:01:00Z");
  expect(sessionExpiryTime(date)).toBe(date.getTime());
  expect(sessionExpiryTime(date.toISOString())).toBe(date.getTime());
  expect(sessionExpiryTime(date.getTime())).toBe(date.getTime());
  for (const value of [null, undefined, {}, false, "invalid", Infinity, new Date(NaN)]) {
    expect(sessionExpiryTime(value)).toBeNull();
  }
});

it("fires exactly once at the deadline without polling", () => {
  const expire = vi.fn();
  scheduleSessionExpiry(Date.now() + 5000, expire);
  vi.advanceTimersByTime(4999);
  expect(expire).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(expire).toHaveBeenCalledOnce();
  vi.advanceTimersByTime(60000);
  expect(expire).toHaveBeenCalledOnce();
});

it("cancels an old deadline when the session changes or extends", () => {
  const expire = vi.fn();
  const cancel = scheduleSessionExpiry(Date.now() + 5000, expire);
  cancel();
  vi.advanceTimersByTime(6000);
  expect(expire).not.toHaveBeenCalled();
});

it("immediately expires past or invalid deadlines", () => {
  const expire = vi.fn();
  scheduleSessionExpiry(Date.now() - 1, expire);
  scheduleSessionExpiry(NaN, expire);
  expect(expire).toHaveBeenCalledTimes(2);
});

it("reschedules deadlines beyond the browser timer limit without overflowing", () => {
  const expire = vi.fn();
  const limit = 2_147_483_647;
  scheduleSessionExpiry(Date.now() + limit + 1000, expire);
  vi.advanceTimersByTime(limit);
  expect(expire).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1000);
  expect(expire).toHaveBeenCalledOnce();
});
