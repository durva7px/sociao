import { describe, expect, it } from "vitest";
import { relativeTime } from "./relative-time";

// "2m ago"-style times shown on Post cards, as in the mockups.

const now = new Date("2026-11-25T12:00:00Z");
const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();
const MIN = 60_000;

describe("relativeTime", () => {
  it.each([
    [ago(20_000), "just now"],
    [ago(2 * MIN), "2m ago"],
    [ago(59 * MIN), "59m ago"],
    [ago(60 * MIN), "1h ago"],
    [ago(23 * 60 * MIN), "23h ago"],
    [ago(24 * 60 * MIN), "1d ago"],
    [ago(6 * 24 * 60 * MIN), "6d ago"],
  ])("%s -> %s", (iso, expected) => {
    expect(relativeTime(iso, now)).toBe(expected);
  });

  it("shows a date for anything a week or older", () => {
    expect(relativeTime("2026-11-10T09:00:00Z", now)).toBe("10 Nov");
  });

  it("treats a time slightly in the future (clock skew) as just now", () => {
    expect(relativeTime(ago(-5_000), now)).toBe("just now");
  });
});
