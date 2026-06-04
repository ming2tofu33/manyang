import { describe, expect, it } from "vitest";

import {
  archiveCalendarDateGridStyle,
  archiveCalendarDateNumberClassName,
  archiveCalendarDayCellClassName,
  archiveCalendarMarkerRowClassName,
  archiveCalendarPrimaryMarkerIconClassName,
  archiveCalendarSecondaryMarkerIconClassName,
} from "./archive-calendar-layout";

describe("archive calendar layout", () => {
  it("positions date numbers on the actual calendar cell grid", () => {
    expect(archiveCalendarDateGridStyle).toEqual({
      left: "5.2%",
      right: "5.3%",
      top: "26.9%",
      height: "59.6%",
    });
  });

  it("keeps date numbers high enough for icons below them", () => {
    expect(archiveCalendarDayCellClassName).toContain("items-start");
    expect(archiveCalendarDayCellClassName).toContain("pt-[0.22rem]");
    expect(archiveCalendarDateNumberClassName).toContain("h-6");
    expect(archiveCalendarMarkerRowClassName).toContain("top-[1.78rem]");
  });

  it("keeps the primary record marker slightly larger than secondary markers", () => {
    expect(archiveCalendarPrimaryMarkerIconClassName).toContain("h-3.5");
    expect(archiveCalendarSecondaryMarkerIconClassName).toContain("h-3");
  });

  it("arranges multiple daily markers in a compact row", () => {
    expect(archiveCalendarMarkerRowClassName).toContain("flex");
    expect(archiveCalendarMarkerRowClassName).toContain("gap-[0.08rem]");
  });
});
