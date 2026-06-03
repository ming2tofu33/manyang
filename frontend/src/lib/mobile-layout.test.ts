import { describe, expect, it } from "vitest";

import { mobileLayout } from "./mobile-layout";

describe("mobile layout contract", () => {
  it("keeps the 390x844 design viewport and supported verification sizes", () => {
    expect(mobileLayout.designViewport).toEqual({ width: 390, height: 844 });
    expect(mobileLayout.verificationViewports).toEqual([
      { width: 375, height: 667 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
    ]);
  });

  it("uses a wider shell inset than the previous 24px mobile padding", () => {
    expect(mobileLayout.shellMaxWidth).toBe(430);
    expect(mobileLayout.shellInlinePaddingClassName).toContain("px-4");
    expect(mobileLayout.shellInlinePaddingClassName).toContain("min-[420px]:px-[18px]");
    expect(mobileLayout.shellInlinePaddingClassName).not.toContain("px-6");
  });

  it("keeps footer bleed tied to the same shell inset token", () => {
    expect(mobileLayout.shellBleedClassName).toContain("-mx-4");
    expect(mobileLayout.shellBleedClassName).toContain("w-[calc(100%+2rem)]");
    expect(mobileLayout.shellBleedClassName).toContain("min-[420px]:-mx-[18px]");
    expect(mobileLayout.shellBleedClassName).not.toContain("-mx-6");
    expect(mobileLayout.shellBleedClassName).not.toContain("w-[calc(100%+3rem)]");
  });

  it("defines a wider surface max width for list and calendar screens", () => {
    expect(mobileLayout.wideSurfaceMaxWidth).toBe(394);
    expect(mobileLayout.wideSurfaceMaxWidthClassName).toBe("max-w-[394px]");
  });
});
