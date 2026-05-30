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
    expect(markup).not.toContain("brightness-[");
    expect(markup).not.toContain("contrast-[");
    expect(markup).not.toContain("saturate-[");
  });

  it("uses fixed stage content instead of an internal scroll container", () => {
    const markup = renderToStaticMarkup(<TodayHomeScene />);

    expect(markup).toContain('data-app-shell-content-mode="fixed"');
    expect(markup).toContain('data-home-action-stage="root"');
  });
});
