import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

import { AppShell } from "./app-shell";
import { mobileLayout } from "@/lib/mobile-layout";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("./bottom-nav", () => ({
  BottomNav: () => <nav data-testid="bottom-nav" />,
}));

describe("AppShell", () => {
  test("renders background images from the public asset path instead of the Next image cache", () => {
    const markup = renderToStaticMarkup(
      <AppShell background="/manyang/backgrounds/home-white-cat-ref.png" showHeader={false}>
        <div>content</div>
      </AppShell>,
    );

    expect(markup).toContain('src="/manyang/backgrounds/home-white-cat-ref.png"');
    expect(markup).not.toContain("/_next/image");
  });

  test("does not add the removed purple circular bottom scrim by default", () => {
    const markup = renderToStaticMarkup(
      <AppShell showHeader={false}>
        <div>content</div>
      </AppShell>,
    );

    expect(markup).not.toContain("radial-gradient(circle_at_50%_18%");
    expect(markup).not.toContain("rgba(119,56,173");
  });

  test("uses the selected-cat theme frame for the shared default background", () => {
    const markup = renderToStaticMarkup(
      <AppShell showHeader={false}>
        <div>content</div>
      </AppShell>,
    );

    expect(markup).toContain("theme-background-black-cat-v4.png");
    expect(markup).toContain("object-cover object-top opacity-90");
    expect(markup).toContain('data-cat-theme-frame="current"');
    expect(markup).not.toContain('src="/manyang/backgrounds/default.webp"');
  });

  test("keeps the default bottom scrim lower for short theme frame panels", () => {
    const markup = renderToStaticMarkup(
      <AppShell showHeader={false}>
        <div>content</div>
      </AppShell>,
    );

    expect(markup).toContain("h-[24%]");
    expect(markup).toContain("#05040b_82%");
    expect(markup).not.toContain("h-[34%]");
    expect(markup).not.toContain("h-[42%]");
  });

  test("uses a custom background layer when provided", () => {
    const markup = renderToStaticMarkup(
      <AppShell
        background="/manyang/backgrounds/home-white-cat-ref.png"
        backgroundLayer={<div data-testid="custom-background-layer" />}
        showHeader={false}
      >
        <div>content</div>
      </AppShell>,
    );

    expect(markup).toContain('data-testid="custom-background-layer"');
    expect(markup).not.toContain('src="/manyang/backgrounds/home-white-cat-ref.png"');
  });

  test("can hide the bottom navigation on focused task pages", () => {
    const markup = renderToStaticMarkup(
      <AppShell showHeader={false} showBottomNav={false}>
        <div>focused task</div>
      </AppShell>,
    );

    expect(markup).toContain("focused task");
    expect(markup).not.toContain('data-testid="bottom-nav"');
  });

  test("can reserve header space without rendering a right action", () => {
    const markup = renderToStaticMarkup(
      <AppShell title="Result" rightAction="none" showBottomNav={false}>
        <div>content</div>
      </AppShell>,
    );

    expect(markup).toContain("Result");
    expect(markup).not.toContain("settings");
    expect(markup).not.toContain("share");
  });

  test("uses a larger centered title icon for task pages", () => {
    const markup = renderToStaticMarkup(
      <AppShell title="꿈의 발자국" titleIconSrc="/manyang/ui/page-icons/page-morning-pawprint.png" showBottomNav={false}>
        <div>content</div>
      </AppShell>,
    );

    expect(markup).toContain("relative mx-auto mb-1.5 block h-11 w-11");
    expect(markup).toContain("/manyang/ui/page-icons/page-morning-pawprint.png");
    expect(markup).not.toContain("relative mx-auto mb-1.5 block h-9 w-9");
  });

  test("keeps the subtitle in the scroll area while the title remains in the header", () => {
    const markup = renderToStaticMarkup(
      <AppShell title="밤의 기록" subtitle="잠들기 전의 마음과 몸 상태를 짧게 남겨요." showBottomNav={false}>
        <div>content</div>
      </AppShell>,
    );
    const headerIndex = markup.indexOf("<header");
    const contentModeIndex = markup.indexOf('data-app-shell-content-mode="scroll"');
    const subtitleIndex = markup.indexOf('data-app-shell-scroll-subtitle="true"');

    expect(headerIndex).toBeGreaterThan(-1);
    expect(contentModeIndex).toBeGreaterThan(headerIndex);
    expect(subtitleIndex).toBeGreaterThan(contentModeIndex);
    expect(markup).toContain("잠들기 전의 마음과 몸 상태를 짧게 남겨요.");
    expect(markup).not.toContain("mt-1.5 whitespace-pre-line text-[15px] leading-6");
  });

  test("uses shared mobile shell width tokens for the content inset", () => {
    const markup = renderToStaticMarkup(
      <AppShell showHeader={false} showBottomNav={false}>
        <div>content</div>
      </AppShell>,
    );

    expect(markup).toContain(mobileLayout.shellInlinePaddingClassName);
    expect(markup).not.toContain("px-6 pb-1.5 pt-8");
  });

  test("prevents wide child surfaces from creating horizontal page dragging", () => {
    const markup = renderToStaticMarkup(
      <AppShell showHeader={false} showBottomNav={false}>
        <div className="w-screen">wide receipt or tarot surface</div>
      </AppShell>,
    );

    expect(markup).toContain("w-full max-w-full overflow-hidden overscroll-x-none");
    expect(markup).toContain("overflow-y-auto overflow-x-hidden overscroll-x-none overscroll-y-contain");
    expect(markup).toContain('data-app-shell-content-mode="scroll"');
  });
});
