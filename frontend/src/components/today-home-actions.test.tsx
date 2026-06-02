import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { HomeState } from "@/lib/home-mode";

const mockedHomeState = vi.hoisted((): { value: HomeState } => ({
  value: {
    mode: "morning",
    question: "morning question",
    primary: { label: "꿈 들려주기", href: "/write" },
    secondary: { label: "기억나지 않아요", href: "/morning" },
    tertiary: null,
    checkInBadge: null,
  },
}));

vi.mock("@/lib/home-mode", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/home-mode")>();

  return {
    ...actual,
    getHomeState: () => mockedHomeState.value,
  };
});

import { PrimaryDreamButton, TodayHomeActions } from "./today-home-actions";

describe("TodayHomeActions", () => {
  beforeEach(() => {
    mockedHomeState.value = {
      mode: "morning",
      question: "morning question",
      primary: { label: "꿈 들려주기", href: "/write" },
      secondary: { label: "기억나지 않아요", href: "/morning" },
      tertiary: null,
      checkInBadge: null,
    };
  });

  it("renders the primary dream button as dream telling copy", () => {
    const markup = renderToStaticMarkup(<TodayHomeActions />);

    expect(markup).toContain("꿈 들려주기");
    expect(markup).not.toContain("꿈 해몽하기");
    expect(markup).toContain('href="/write"');
    expect(markup).toContain("w-[76%]");
    expect(markup).toContain("max-w-[288px]");
    expect(markup).toContain("px-2");
    expect(markup).toContain("py-0");
    expect(markup).toContain("text-[1.42rem]");
    expect(markup).toContain("text-[var(--manyang-cat-button-text)]");
    expect(markup).toContain("[text-shadow:var(--manyang-cat-button-shadow)]");
    expect(markup).toContain('width="860"');
    expect(markup).toContain('height="235"');
    expect(markup).not.toContain('height="375"');
    expect(markup).not.toContain("w-[82%] max-w-[310px] px-3 py-2");
  });

  it("renders the forgotten-dream action as a text link", () => {
    const markup = renderToStaticMarkup(<TodayHomeActions />);

    expect(markup).toContain('href="/morning"');
    expect(markup).toContain("기억나지 않아요");
    expect(markup).toContain("underline");
    expect(markup).toContain("text-[var(--manyang-cat-link)]");
    expect(markup).toContain("decoration-[var(--manyang-cat-link-decoration)]");
    expect(markup).not.toContain("/manyang/ui/buttons/dreammemory-forgot-frame.png");
  });

  it("keeps daily tarot as the second home action", () => {
    const markup = renderToStaticMarkup(<TodayHomeActions />);

    expect(markup).toContain('href="/tarot"');
    expect(markup).toContain("오늘의 타로 보기");
    expect(markup).toContain("w-[76%] max-w-[288px]");
    expect(markup.match(/height="235"/g)?.length).toBeGreaterThanOrEqual(2);
    expect(markup.indexOf("꿈 들려주기")).toBeLessThan(markup.indexOf("오늘의 타로 보기"));
    expect(markup.indexOf("오늘의 타로 보기")).toBeLessThan(markup.indexOf("기억나지 않아요"));
  });

  it("does not render home cat theme switching controls", () => {
    const markup = renderToStaticMarkup(<TodayHomeActions />);

    expect(markup).not.toContain("오늘의 테마");
    expect(markup).not.toContain("바꾸기");
    expect(markup).not.toContain("고양이 테마 선택");
    expect(markup).not.toContain("home-cat-picker-trigger");
  });

  it("does not render the night check-in CTA on night home", () => {
    mockedHomeState.value = {
      mode: "night",
      question: "night question",
      primary: { label: "꿈 들려주기", href: "/write" },
      secondary: null,
      tertiary: null,
      checkInBadge: null,
    };

    const markup = renderToStaticMarkup(<TodayHomeActions />);

    expect(markup).toContain("꿈 들려주기");
    expect(markup).not.toContain('href="/night"');
    expect(markup).not.toContain("밤의 기록 남기기");
    expect(markup).not.toContain("오늘 밤 기록 남기기");
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
    expect(markup).toContain("꿈 들려주기");
    expect(markup).toContain("<a ");
    expect(markup).not.toContain("<button");
  });
});
