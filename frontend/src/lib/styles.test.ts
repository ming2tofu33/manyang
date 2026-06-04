import { describe, expect, it } from "vitest";

import { ui } from "./styles";

describe("ui style tokens", () => {
  it("keeps primary actions as visible full-width pill controls", () => {
    expect(ui.primaryAction).toContain("flex");
    expect(ui.primaryAction).toContain("w-full");
    expect(ui.primaryAction).toContain("rounded-full");
    expect(ui.primaryAction).toContain("border");
  });

  it("keeps framed panels visibly separated from the dark room background", () => {
    expect(ui.panel).toContain("border");
    expect(ui.panel).toContain("bg-[rgba(7,6,18,0.76)]");
    expect(ui.panel).toContain("backdrop-blur");
  });

  it("keeps selected controls inside the button box to avoid clipped neon borders", () => {
    expect(ui.selectedControl).toContain("shadow-[inset_0_0_0_1px");
    expect(ui.selectedControl).not.toContain("shadow-[0_0_");
    expect(ui.selectedPill).toContain("shadow-[inset_0_0_0_1px");
    expect(ui.selectedPill).not.toContain("shadow-[0_0_");
  });

  it("keeps focus rings inset for controls that may sit inside clipped containers", () => {
    expect(ui.insetFocus).toContain("focus:ring-inset");
    expect(ui.insetFocus).not.toContain("focus:ring-2 focus:ring-[#d799ff]");
  });
});
