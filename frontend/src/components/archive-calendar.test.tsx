import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { mobileLayout } from "@/lib/mobile-layout";

import { ArchiveCalendar } from "./archive-calendar";

describe("ArchiveCalendar", () => {
  it("uses the optimized calendar asset at runtime", () => {
    const markup = renderToStaticMarkup(<ArchiveCalendar />);

    expect(markup).toContain('src="/manyang/ui/calendar.webp"');
    expect(markup).not.toContain('src="/manyang/ui/calendar.png"');
    expect(markup).not.toContain("/_next/image");
  });

  it("uses separated calendar record symbols for summary cards and date markers", () => {
    const markup = renderToStaticMarkup(<ArchiveCalendar />);

    expect(markup).toContain("/manyang/ui/calendar-record-icons/calendar-record-dream-gold-v3.png");
    expect(markup).toContain("/manyang/ui/calendar-record-icons/calendar-record-pawprint-gold-v2.png");
    expect(markup).toContain("/manyang/ui/calendar-record-icons/calendar-record-night-gold-v2.png");
    expect(markup).toContain("/manyang/ui/calendar-record-icons/calendar-record-symbol.png");
  });

  it("renders adjacent month cells with a muted visual scope", () => {
    const markup = renderToStaticMarkup(<ArchiveCalendar />);

    expect(markup).toContain('data-calendar-cell-scope="adjacent-month"');
    expect(markup).toContain("opacity-45");
  });

  it("uses the wider shared surface width for the calendar and monthly summary", () => {
    const markup = renderToStaticMarkup(<ArchiveCalendar />);

    expect(markup).toContain(mobileLayout.wideSurfaceMaxWidthClassName);
    expect(markup).not.toContain("max-w-[382px]");
  });
});
