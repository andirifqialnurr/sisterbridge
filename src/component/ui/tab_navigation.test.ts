import { describe, expect, it } from "vitest";
import { getNextEnabledTabIndex } from "./tab_navigation";

const items = [{}, { disabled: true }, {}, { disabled: true }];

describe("tabs roving keyboard focus", () => {
  it.each([
    [0, "ArrowRight", 2],
    [2, "ArrowRight", 0],
    [0, "ArrowLeft", 2],
    [2, "ArrowLeft", 0],
    [0, "Home", 0],
    [0, "End", 2],
  ] as const)("moves from %s with %s to enabled tab %s", (current, key, expected) => {
    expect(getNextEnabledTabIndex(items, current, key)).toBe(expected);
  });

  it("scans Home forward and End backward past disabled boundary tabs", () => {
    const boundaryDisabled = [{ disabled: true }, {}, {}, { disabled: true }];
    expect(getNextEnabledTabIndex(boundaryDisabled, 1, "Home")).toBe(1);
    expect(getNextEnabledTabIndex(boundaryDisabled, 1, "End")).toBe(2);
  });

  it("skips several disabled tabs without reversing direction", () => {
    const multiple = [{}, { disabled: true }, { disabled: true }, {}, {}];
    expect(getNextEnabledTabIndex(multiple, 3, "ArrowLeft")).toBe(0);
    expect(getNextEnabledTabIndex(multiple, 0, "ArrowRight")).toBe(3);
  });

  it.each(["ArrowLeft", "ArrowRight", "Home", "End"])("handles a single enabled tab for %s", key => {
    expect(getNextEnabledTabIndex([{}], 0, key)).toBe(0);
    expect(getNextEnabledTabIndex([{ disabled: true }], 0, key)).toBeNull();
    expect(getNextEnabledTabIndex([], 0, key)).toBeNull();
  });

  it("ignores unrelated keys and rejects non-integer indices", () => {
    expect(getNextEnabledTabIndex(items, 0, "Tab")).toBeNull();
    expect(getNextEnabledTabIndex(items, NaN, "ArrowRight")).toBeNull();
    expect(getNextEnabledTabIndex(items, 0.5, "ArrowRight")).toBeNull();
  });
});
