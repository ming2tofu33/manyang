import { describe, expect, it } from "vitest";

import { formatMonthGridCellDate, getMonthGrid, getMonthGridCells } from "./calendar";

describe("calendar grid", () => {
  it("builds a six-week grid for May 2026 starting on Friday", () => {
    const grid = getMonthGrid(2026, 5);

    expect(grid).toHaveLength(42);
    expect(grid.slice(0, 5)).toEqual([null, null, null, null, null]);
    expect(grid[5]).toBe(1);
    expect(grid[28]).toBe(24);
    expect(grid[35]).toBe(31);
  });

  it("builds a six-week grid with adjacent month dates", () => {
    const grid = getMonthGridCells(2026, 5);

    expect(grid).toHaveLength(42);
    expect(grid.slice(0, 5).map((cell) => formatMonthGridCellDate(cell))).toEqual([
      "2026-04-26",
      "2026-04-27",
      "2026-04-28",
      "2026-04-29",
      "2026-04-30",
    ]);
    expect(grid[5]).toMatchObject({ year: 2026, month: 5, day: 1, isCurrentMonth: true, monthOffset: 0 });
    expect(grid[35]).toMatchObject({ year: 2026, month: 5, day: 31, isCurrentMonth: true, monthOffset: 0 });
    expect(grid.slice(36, 42).map((cell) => formatMonthGridCellDate(cell))).toEqual([
      "2026-06-01",
      "2026-06-02",
      "2026-06-03",
      "2026-06-04",
      "2026-06-05",
      "2026-06-06",
    ]);
  });
});
