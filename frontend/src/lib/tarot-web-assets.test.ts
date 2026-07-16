import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

import { tarotCardContent } from "@manyang/content/tarot";

import { resolveTarotWebImage } from "./tarot-web-assets";

describe("tarot web assets", () => {
  test("resolves every shared tarot image key to an existing public asset", () => {
    expect(tarotCardContent).toHaveLength(78);

    tarotCardContent.forEach((card) => {
      const resolvedImage = resolveTarotWebImage(card.imageKey);

      expect(resolvedImage).toBe(`/manyang/tarot/${card.imageKey}`);
      expect(existsSync(path.join(process.cwd(), "public", resolvedImage.slice(1)))).toBe(true);
    });
  });

  test("preserves the known fool image URL", () => {
    expect(resolveTarotWebImage(tarotCardContent[0].imageKey)).toBe(
      "/manyang/tarot/major/00-the-fool.png",
    );
  });

  test("preserves the known ace of wands image URL", () => {
    expect(resolveTarotWebImage(tarotCardContent[22].imageKey)).toBe(
      "/manyang/tarot/minor-cutout/wands/01-ace-of-wands.png",
    );
  });

  test.each(["", "/major/00-the-fool.png", "../major/00-the-fool.png", "major/../fool.png"])(
    "rejects invalid image key %j",
    (imageKey) => {
      expect(() => resolveTarotWebImage(imageKey)).toThrow(`Invalid tarot image key: ${imageKey}`);
    },
  );
});
