import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/home-mode", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/home-mode")>();

  return {
    ...actual,
    getHomeState: () => ({
      mode: "morning",
      question: "morning question",
      primary: { label: "primary", href: "/write" },
      secondary: { label: "secondary", href: "/morning" },
      tertiary: { label: "오늘 밤 기록 남기기", href: "/night" },
      checkInBadge: null,
    }),
  };
});

import { PrimaryDreamButton, TodayHomeActions } from "./today-home-actions";

describe("TodayHomeActions", () => {
  it("renders the primary dream button with a slimmer display size", () => {
    const markup = renderToStaticMarkup(<TodayHomeActions />);

    expect(markup).toContain("꿈 해몽하기");
    expect(markup).toContain('href="/write"');
    expect(markup).toContain("w-[76%]");
    expect(markup).toContain("max-w-[288px]");
    expect(markup).toContain("px-2");
    expect(markup).toContain("py-0");
    expect(markup).toContain("text-[1.42rem]");
    expect(markup).toContain('width="860"');
    expect(markup).toContain('height="235"');
    expect(markup).not.toContain('height="375"');
    expect(markup).not.toContain("w-[76%] max-w-[288px] px-2 py-0.5");
    expect(markup).not.toContain("w-[82%] max-w-[310px] px-3 py-2");
    expect(markup).not.toContain("text-[1.72rem]");
    expect(markup).not.toContain("text-[1.5rem]");
  });

  it("renders the forgotten-dream action as a text link", () => {
    const markup = renderToStaticMarkup(<TodayHomeActions />);

    expect(markup).toContain('href="/morning"');
    expect(markup).toContain("기억 나지 않아요");
    expect(markup).toContain("underline");
    expect(markup).not.toContain("/manyang/ui/buttons/dreammemory-forgot-frame.png");
  });

  it("uses the primary button frame for daily tarot as the second home action", () => {
    const markup = renderToStaticMarkup(<TodayHomeActions />);

    expect(markup).toContain('href="/tarot"');
    expect(markup).toContain("오늘의 타로 보기");
    expect(markup).toContain("w-[76%] max-w-[288px]");
    expect(markup.match(/height="235"/g)?.length).toBeGreaterThanOrEqual(2);
    expect(markup.indexOf("꿈 해몽하기")).toBeLessThan(markup.indexOf("오늘의 타로 보기"));
    expect(markup.indexOf("오늘의 타로 보기")).toBeLessThan(markup.indexOf("기억 나지 않아요"));
  });

  it("does not render the legacy dream seed home CTA", () => {
    const markup = renderToStaticMarkup(<TodayHomeActions />);

    expect(markup).not.toContain('href="/seed"');
    expect(markup).not.toContain("꿈 씨앗 심기");
    expect(markup).not.toContain("오늘 밤 꿈 씨앗 심기");
    expect(markup).not.toContain("/manyang/ui/buttons/dreamseed-archive-frame.png");
  });

  it("always renders the home dream-reading CTA as a write link", () => {
    const markup = renderToStaticMarkup(<PrimaryDreamButton />);

    expect(markup).toContain('href="/write"');
    expect(markup).toContain("꿈 해몽하기");
    expect(markup).toContain("<a ");
    expect(markup).not.toContain("<button");
  });
});
