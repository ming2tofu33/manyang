import { describe, expect, test } from "vitest";

import { getMillisecondsUntilNextMinute } from "./use-current-app-date";

describe("current app date subscription timing", () => {
  test("schedules the next refresh just after the next minute starts", () => {
    expect(getMillisecondsUntilNextMinute(new Date("2026-06-01T08:59:59.900Z"))).toBe(150);
    expect(getMillisecondsUntilNextMinute(new Date("2026-06-01T08:59:00.000Z"))).toBe(60_050);
  });
});
