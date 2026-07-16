import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

import { tarotMajorCardContent } from "@manyang/content/tarot";

import { resolveTarotWebImage } from "./tarot-web-assets";

describe("tarot web assets", () => {
  test("resolves every shared major image key to an existing public asset", () => {
    tarotMajorCardContent.forEach((card) => {
      const resolvedImage = resolveTarotWebImage(card.imageKey);

      expect(resolvedImage).toBe(`/manyang/tarot/${card.imageKey}`);
      expect(existsSync(path.join(process.cwd(), "public", resolvedImage.slice(1)))).toBe(true);
    });
  });

  test("preserves the known fool image URL", () => {
    expect(resolveTarotWebImage(tarotMajorCardContent[0].imageKey)).toBe(
      "/manyang/tarot/major/00-the-fool.png",
    );
  });

  test.each(["", "/major/00-the-fool.png", "../major/00-the-fool.png", "major/../fool.png"])(
    "rejects invalid image key %j",
    (imageKey) => {
      expect(() => resolveTarotWebImage(imageKey)).toThrow(`Invalid tarot image key: ${imageKey}`);
    },
  );
});
