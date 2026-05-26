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
});
