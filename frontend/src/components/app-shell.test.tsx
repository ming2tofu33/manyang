import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

import { AppShell } from "./app-shell";

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

    expect(markup).toContain("theme-frame-black-cat-v3.png");
    expect(markup).toContain("object-contain object-top opacity-90");
    expect(markup).toContain('data-cat-theme-frame="current"');
    expect(markup).not.toContain('src="/manyang/backgrounds/default.webp"');
  });

  test("keeps the default bottom scrim lower for short theme frame panels", () => {
    const markup = renderToStaticMarkup(
      <AppShell showHeader={false}>
        <div>content</div>
      </AppShell>,
    );

    expect(markup).toContain("h-[30%]");
    expect(markup).toContain("#05040b_80%");
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
});
