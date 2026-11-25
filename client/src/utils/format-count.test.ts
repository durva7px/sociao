import { describe, expect, it } from "vitest";
import { formatCount } from "./format-count";

// D-032: full numbers with separators under 10,000; shortened from 10,000 up.

describe("formatCount", () => {
  it.each([
    [0, "0"],
    [24, "24"],
    [490, "490"],
    [1450, "1,450"],
    [9999, "9,999"],
    [10_000, "10k"],
    [12_800, "12.8k"],
    [12_849, "12.8k"],
    [999_499, "999.5k"],
    [1_000_000, "1m"],
    [1_250_000, "1.3m"],
  ])("%d -> %s", (n, expected) => {
    expect(formatCount(n)).toBe(expected);
  });
});
