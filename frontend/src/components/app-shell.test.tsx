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
});
