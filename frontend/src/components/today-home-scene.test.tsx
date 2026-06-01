import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

import { TodayHomeScene } from "./today-home-scene";

describe("TodayHomeScene", () => {
  it("renders the English reader title in all caps", () => {
    const markup = renderToStaticMarkup(<TodayHomeScene />);

    expect(markup).toContain("MANYANG DREAM READER");
    expect(markup).not.toContain("manyang dream reader");
  });

  it("renders the home cat background transition layer", () => {
    const markup = renderToStaticMarkup(<TodayHomeScene />);

    expect(markup).toContain('data-home-cat-transition="root"');
    expect(markup).toContain("home-cat-transition-current");
    expect(markup).toContain("home-cat-background");
    expect(markup).toContain("home-cat-background-black-cat");
    expect(markup).not.toContain("brightness-[");
    expect(markup).not.toContain("contrast-[");
    expect(markup).not.toContain("saturate-[");
  });

  it("scopes home UI colors to the selected cat reader theme", () => {
    const markup = renderToStaticMarkup(<TodayHomeScene />);

    expect(markup).toContain('data-cat-ui-theme="black_cat"');
    expect(markup).toMatch(/data-cat-ui-theme="black_cat"[^>]*class="contents"/);
    expect(markup).toContain("--manyang-cat-title:#ffd98a");
    expect(markup).toContain("--manyang-cat-accent:#d799ff");
  });

  it("uses fixed stage content instead of an internal scroll container", () => {
    const markup = renderToStaticMarkup(<TodayHomeScene />);

    expect(markup).toContain('data-app-shell-content-mode="fixed"');
    expect(markup).toContain('data-home-action-stage="root"');
  });
});
