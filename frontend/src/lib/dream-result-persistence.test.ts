import { describe, expect, test } from "vitest";

import { shouldSaveReadingToLocalArchive } from "./dream-result-persistence";

describe("dream result persistence policy", () => {
  test("saves completed guest readings to the local archive", () => {
    expect(shouldSaveReadingToLocalArchive({ isAuthenticated: false, status: "completed" })).toBe(true);
  });

  test("does not save unavailable attempts as permanent archive records", () => {
    expect(shouldSaveReadingToLocalArchive({ isAuthenticated: false, status: "unavailable" })).toBe(false);
  });

  test("does not use browser local archive as the permanent store for authenticated readings", () => {
    expect(shouldSaveReadingToLocalArchive({ isAuthenticated: true, status: "completed" })).toBe(false);
  });
});
