import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { manyangAssets } from "@/lib/manyang-assets";

vi.mock("next/navigation", () => ({
  usePathname: () => "/profile",
}));

import { BottomNav } from "./bottom-nav";

describe("BottomNav", () => {
  it("renders generated footer assets with text labels", () => {
    const markup = renderToStaticMarkup(<BottomNav />);

    expect(markup).toContain(manyangAssets.footer.frame);
    expect(markup).toContain(manyangAssets.footer.icons.today);
    expect(markup).toContain(manyangAssets.footer.icons.write);
    expect(markup).toContain(manyangAssets.footer.icons.archive);
    expect(markup).toContain(manyangAssets.footer.icons.encyclopedia);
    expect(markup).toContain(manyangAssets.footer.icons.profile);
    expect(markup).toContain("오늘");
    expect(markup).toContain("꿈쓰기");
    expect(markup).toContain("기록");
    expect(markup).toContain("백과");
    expect(markup).toContain("내방");
    expect(markup).toContain("aria-current=\"page\"");
    expect(markup).toContain("bg-[radial-gradient");
  });
});
