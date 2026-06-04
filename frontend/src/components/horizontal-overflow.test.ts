import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const scrollStripFiles = [
  "admin-tool-nav.tsx",
  "archive-records-client.tsx",
  "dream-result-receipt.tsx",
  "encyclopedia-search-client.tsx",
];

describe("horizontal scroll containment", () => {
  it("keeps intentional horizontal strips from chaining page drag", () => {
    for (const fileName of scrollStripFiles) {
      const source = readFileSync(path.join(process.cwd(), "src", "components", fileName), "utf8");
      const horizontalScrollClassNames = Array.from(source.matchAll(/className=(?:\{cn\()?["`]([^"`]*overflow-x-auto[^"`]*)["`]/g));

      expect(horizontalScrollClassNames.length, fileName).toBeGreaterThan(0);
      for (const [, className] of horizontalScrollClassNames) {
        expect(className, fileName).toContain("overscroll-x-contain");
      }
    }
  });
});
