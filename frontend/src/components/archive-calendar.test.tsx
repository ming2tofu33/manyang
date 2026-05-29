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
});
