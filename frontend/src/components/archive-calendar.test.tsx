import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ArchiveCalendar } from "./archive-calendar";

describe("ArchiveCalendar", () => {
  it("uses the optimized calendar asset at runtime", () => {
    const markup = renderToStaticMarkup(<ArchiveCalendar />);

    expect(markup).toContain('src="/manyang/ui/calendar.webp"');
    expect(markup).not.toContain('src="/manyang/ui/calendar.png"');
    expect(markup).not.toContain("/_next/image");
  });

  it("uses separated semantic symbols for summary cards and date markers", () => {
    const markup = renderToStaticMarkup(<ArchiveCalendar />);

    expect(markup).toContain("/manyang/ui/semantic-icons/semantic-moon.png");
    expect(markup).toContain("/manyang/ui/semantic-icons/semantic-paw.png");
    expect(markup).toContain("/manyang/ui/semantic-icons/semantic-sparkles.png");
    expect(markup).toContain("/manyang/ui/semantic-icons/semantic-crystal-ball.png");
  });

  it("renders adjacent month cells with a muted visual scope", () => {
    const markup = renderToStaticMarkup(<ArchiveCalendar />);

    expect(markup).toContain('data-calendar-cell-scope="adjacent-month"');
    expect(markup).toContain("opacity-45");
  });
});
