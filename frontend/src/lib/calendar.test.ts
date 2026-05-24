import { describe, expect, it } from "vitest";

import { getMonthGrid } from "./calendar";

describe("calendar grid", () => {
  it("builds a six-week grid for May 2026 starting on Friday", () => {
    const grid = getMonthGrid(2026, 5);

    expect(grid).toHaveLength(42);
    expect(grid.slice(0, 5)).toEqual([null, null, null, null, null]);
    expect(grid[5]).toBe(1);
    expect(grid[28]).toBe(24);
    expect(grid[35]).toBe(31);
  });
});
