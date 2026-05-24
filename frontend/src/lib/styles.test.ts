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
});
