import { describe, expect, test } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";

import { manyangAssets } from "./manyang-assets";

const publicAssetExists = (assetPath: string) =>
  existsSync(path.join(process.cwd(), "public", assetPath.replace(/^\//, "")));

describe("manyang assets", () => {
  test("exposes cat-specific home background and reader portrait assets", () => {
    expect(manyangAssets.backgrounds.blackCatHome).toBe("/manyang/backgrounds/home-black-cat.png");
    expect(manyangAssets.backgrounds.whiteCatHome).toBe("/manyang/backgrounds/home-white-cat-ref.png");
    expect(manyangAssets.backgrounds.cheeseCatHome).toBe("/manyang/backgrounds/home-cheese-cat.png");
    expect(manyangAssets.backgrounds.grayCatHome).toBe("/manyang/backgrounds/home-gray-cat.png");
    expect(manyangAssets.backgrounds.blackCatInterpretation).toBe("/manyang/backgrounds/interpretation-black-cat.png");
    expect(manyangAssets.backgrounds.whiteCatInterpretation).toBe("/manyang/backgrounds/interpretation-white-cat.png");
    expect(manyangAssets.backgrounds.cheeseCatInterpretation).toBe("/manyang/backgrounds/interpretation-cheese-cat.png");
    expect(manyangAssets.backgrounds.grayCatInterpretation).toBe("/manyang/backgrounds/interpretation-gray-cat.png");
    expect(manyangAssets.illustrations.blackCatProfile).toBe("/manyang/references/cat-black-profile.png");
    expect(manyangAssets.illustrations.whiteCatProfile).toBe("/manyang/references/cat-white-profile.png");
    expect(manyangAssets.illustrations.cheeseCatProfile).toBe("/manyang/references/cat-cheese-profile.png");
    expect(manyangAssets.illustrations.grayCatProfile).toBe("/manyang/references/cat-gray-profile.png");
    expect(manyangAssets.illustrations.blackCat).toBe("/manyang/references/cat-black-profile.png");
    expect(manyangAssets.illustrations.whiteCat).toBe("/manyang/references/cat-white-profile.png");
    expect(manyangAssets.illustrations.cheeseCat).toBe("/manyang/references/cat-cheese-profile.png");
    expect(manyangAssets.illustrations.grayCat).toBe("/manyang/references/cat-gray-profile.png");

    [
      manyangAssets.backgrounds.blackCatHome,
      manyangAssets.backgrounds.whiteCatHome,
      manyangAssets.backgrounds.cheeseCatHome,
      manyangAssets.backgrounds.grayCatHome,
      manyangAssets.backgrounds.blackCatInterpretation,
      manyangAssets.backgrounds.whiteCatInterpretation,
      manyangAssets.backgrounds.cheeseCatInterpretation,
      manyangAssets.backgrounds.grayCatInterpretation,
      manyangAssets.illustrations.blackCatProfile,
      manyangAssets.illustrations.whiteCatProfile,
      manyangAssets.illustrations.cheeseCatProfile,
      manyangAssets.illustrations.grayCatProfile,
      manyangAssets.illustrations.blackCat,
      manyangAssets.illustrations.whiteCat,
      manyangAssets.illustrations.cheeseCat,
      manyangAssets.illustrations.grayCat,
    ].forEach((assetPath) => {
      expect(publicAssetExists(assetPath)).toBe(true);
    });
  });

  test("exposes the reference button image assets used by the home and write flows", () => {
    expect(manyangAssets.buttons.dreammemoryWrite).toBe("/manyang/ui/buttons/dreammemory-write-frame.png");
    expect(manyangAssets.buttons.dreammemoryForgot).toBe("/manyang/ui/buttons/dreammemory-forgot-frame.png");
    expect(manyangAssets.buttons.dreammemorySubmit).toBe("/manyang/ui/buttons/dreammemory-submit-frame.png");
    expect(manyangAssets.buttons.dreamseed).toBe("/manyang/ui/buttons/dreamseed-frame.png");
    expect(manyangAssets.buttons.dreamseedArchive).toBe("/manyang/ui/buttons/dreamseed-archive-frame.png");
    expect(manyangAssets.buttons.morningPawprint).toBe("/manyang/ui/buttons/morning-pawprint-frame.png");

    Object.values(manyangAssets.buttons).forEach((assetPath) => {
      expect(publicAssetExists(assetPath)).toBe(true);
    });
  });

  test("exposes the generated footer frame and navigation icon assets", () => {
    expect(manyangAssets.footer.frame).toBe("/manyang/ui/footer/footer-frame.png");
    expect(manyangAssets.footer.icons.today).toBe("/manyang/ui/footer/footer-icon-today.png");
    expect(manyangAssets.footer.icons.write).toBe("/manyang/ui/footer/footer-icon-write.png");
    expect(manyangAssets.footer.icons.archive).toBe("/manyang/ui/footer/footer-icon-archive.png");
    expect(manyangAssets.footer.icons.encyclopedia).toBe("/manyang/ui/footer/footer-icon-encyclopedia.png");

    [
      manyangAssets.footer.frame,
      ...Object.values(manyangAssets.footer.icons),
    ].forEach((assetPath) => {
      expect(publicAssetExists(assetPath)).toBe(true);
    });
  });

  test("exposes the added common action icon assets", () => {
    expect(manyangAssets.icons.close).toBe("/manyang/cutouts/icons/33-circle-close.png");
    expect(manyangAssets.icons.check).toBe("/manyang/cutouts/icons/34-circle-check.png");
    expect(manyangAssets.icons.help).toBe("/manyang/cutouts/icons/35-circle-help.png");

    [
      manyangAssets.icons.arrowLeft,
      manyangAssets.icons.share,
      manyangAssets.icons.bell,
      manyangAssets.icons.settings,
      manyangAssets.icons.trash,
      manyangAssets.icons.profile,
      manyangAssets.icons.bookmark,
      manyangAssets.icons.search,
      manyangAssets.icons.calendar,
      manyangAssets.icons.close,
      manyangAssets.icons.check,
      manyangAssets.icons.help,
    ].forEach((assetPath) => {
      expect(publicAssetExists(assetPath)).toBe(true);
    });
  });
});
