import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AssetIconButton } from "./asset-primitives";

describe("AssetIconButton", () => {
  it("renders a transparent hit area with an enlarged separated action glyph", () => {
    const markup = renderToStaticMarkup(
      <AssetIconButton src="/manyang/ui/action-icons/action-bell.png" label="알림" size="header" />,
    );

    expect(markup).toContain("/manyang/ui/action-icons/action-bell.png");
    expect(markup).toContain("h-11");
    expect(markup).toContain("w-11");
    expect(markup).toContain("h-[2.05rem]");
    expect(markup).toContain("w-[2.05rem]");
    expect(markup).not.toContain("bg-[radial-gradient");
    expect(markup).not.toContain("ring-1");
    expect(markup).not.toContain("p-[0.72rem]");
  });
});
