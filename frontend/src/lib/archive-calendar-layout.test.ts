import { describe, expect, it } from "vitest";

import {
  archiveCalendarDateGridStyle,
  archiveCalendarDayCellClassName,
  archiveCalendarDreamIconClassName,
  archiveCalendarNightCheckInIconClassName,
  archiveCalendarPawprintIconClassName,
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
    expect(archiveCalendarDayCellClassName).toContain("pt-[0.38rem]");
    expect(archiveCalendarDreamIconClassName).toContain("top-[1.72rem]");
  });

  it("positions pawprint markers below dream markers", () => {
    expect(archiveCalendarPawprintIconClassName).toContain("top-[2.62rem]");
    expect(archiveCalendarPawprintIconClassName).toContain("h-3");
  });

  it("positions night check-in markers beside pawprint markers", () => {
    expect(archiveCalendarNightCheckInIconClassName).toContain("top-[2.6rem]");
    expect(archiveCalendarNightCheckInIconClassName).toContain("h-3");
  });
});
