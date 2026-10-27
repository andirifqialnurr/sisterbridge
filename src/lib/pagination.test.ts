import { expect, it } from "vitest";
import { parsePageParam } from "./pagination";

it.each([undefined, "", "0", "-1", "1.5", "NaN", "Infinity", "1e3", " 2", "1000001", "99999999"])("defaults invalid URL page %s to 1", value => {
  expect(parsePageParam(value)).toBe(1);
});

it.each([["1", 1], ["2", 2], ["2167", 2167], ["0000020", 20], ["1000000", 1000000]] as const)("keeps bounded URL page %s", (value, expected) => {
  expect(parsePageParam(value)).toBe(expected);
});
