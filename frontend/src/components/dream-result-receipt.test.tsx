import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DreamResultReceipt } from "./dream-result-receipt";

describe("DreamResultReceipt", () => {
  it("uses the optimized receipt asset at runtime", () => {
    const markup = renderToStaticMarkup(<DreamResultReceipt />);

    expect(markup).toContain('src="/manyang/receipts/empty.webp"');
    expect(markup).not.toContain('src="/manyang/receipts/empty.png"');
    expect(markup).not.toContain("/_next/image");
  });
});
