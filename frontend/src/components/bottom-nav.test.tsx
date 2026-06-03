import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { manyangAssets } from "@/lib/manyang-assets";
import { mobileLayout } from "@/lib/mobile-layout";

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
    expect(markup).toContain("rgba(255,185,92");
    expect(markup).not.toContain("rgba(159,74,255,0.30)");
  });

  it("uses an embedded active glow without a separated border plate", () => {
    const markup = renderToStaticMarkup(<BottomNav />);

    expect(markup).toContain('data-bottom-nav-active-indicator="true"');
    expect(markup).not.toContain("border border-[#b86cff]");
    expect(markup).not.toContain("top-[0.45rem] h-[3.55rem] w-[4rem]");
  });

  it("keeps menu items inside the footer frame corners", () => {
    const markup = renderToStaticMarkup(<BottomNav />);

    expect(markup).toContain(mobileLayout.shellBleedClassName);
    expect(markup).not.toContain("-mx-6");
    expect(markup).not.toContain("w-[calc(100%+3rem)]");
    expect(markup).toContain("h-[88px]");
    expect(markup).toContain("inset-x-[8%]");
    expect(markup).toContain("top-[0.8rem]");
    expect(markup).toContain("bottom-[0.4rem]");
    expect(markup).toContain("object-bottom");
  });
});
