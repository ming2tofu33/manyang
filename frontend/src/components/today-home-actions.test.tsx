import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/home-mode", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/home-mode")>();

  return {
    ...actual,
    getHomeState: () => ({
      mode: "night",
      question: "night question",
      primary: { label: "primary", href: "/write" },
      secondary: { label: "secondary", href: "/seed" },
      tertiary: { label: "tertiary", href: "/archive" },
      seedBadge: null,
    }),
  };
});

import { TodayHomeActions } from "./today-home-actions";

describe("TodayHomeActions", () => {
  it("renders the primary dream button with a slimmer display size", () => {
    const markup = renderToStaticMarkup(<TodayHomeActions />);

    expect(markup).toContain("w-[76%]");
    expect(markup).toContain("max-w-[288px]");
    expect(markup).toContain("px-2");
    expect(markup).toContain("py-0.5");
    expect(markup).toContain("text-[1.5rem]");
    expect(markup).not.toContain("w-[82%] max-w-[310px] px-3 py-2");
    expect(markup).not.toContain("text-[1.72rem]");
  });

  it("renders the night dream seed button without extra vertical padding", () => {
    const markup = renderToStaticMarkup(<TodayHomeActions />);

    expect(markup).toContain("/manyang/ui/buttons/dreamseed-frame.png");
    expect(markup).toContain("w-[60%] max-w-[240px] px-2 py-0");
    expect(markup).not.toContain("w-[60%] max-w-[240px] px-2 py-1");
  });
});
