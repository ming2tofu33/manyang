import { describe, expect, test } from "vitest";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

import { manyangAssets } from "./manyang-assets";

const publicAssetExists = (assetPath: string) =>
  existsSync(path.join(process.cwd(), "public", assetPath.replace(/^\//, "")));

function publicAssetPath(assetPath: string): string {
  return path.join(process.cwd(), "public", assetPath.replace(/^\//, ""));
}

function readPngSizeFromFile(filePath: string): { width: number; height: number } {
  const png = readFileSync(filePath);

  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
  };
}

function readWebpSizeFromFile(filePath: string): { width: number; height: number } {
  const webp = readFileSync(filePath);

  if (webp.toString("ascii", 0, 4) !== "RIFF" || webp.toString("ascii", 8, 12) !== "WEBP") {
    throw new Error(`Not a WebP file: ${filePath}`);
  }

  let offset = 12;

  while (offset + 8 <= webp.length) {
    const chunkType = webp.toString("ascii", offset, offset + 4);
    const chunkSize = webp.readUInt32LE(offset + 4);
    const dataOffset = offset + 8;

    if (chunkType === "VP8X") {
      return {
        width: 1 + webp.readUIntLE(dataOffset + 4, 3),
        height: 1 + webp.readUIntLE(dataOffset + 7, 3),
      };
    }

    if (chunkType === "VP8 ") {
      return {
        width: webp.readUInt16LE(dataOffset + 6) & 0x3fff,
        height: webp.readUInt16LE(dataOffset + 8) & 0x3fff,
      };
    }

    if (chunkType === "VP8L") {
      const bits = webp.readUInt32LE(dataOffset + 1);

      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1,
      };
    }

    offset += 8 + chunkSize + (chunkSize % 2);
  }

  throw new Error(`Unsupported WebP file: ${filePath}`);
}

function readImageSize(assetPath: string): { width: number; height: number } {
  const filePath = publicAssetPath(assetPath);

  if (assetPath.endsWith(".webp")) {
    return readWebpSizeFromFile(filePath);
  }

  return readPngSizeFromFile(filePath);
}

function readSha256(filePath: string): string {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

describe("manyang assets", () => {
  test("exposes cat-specific home background and reader portrait assets", () => {
    expect(manyangAssets.backgrounds.blackCatHome).toBe("/manyang/backgrounds/home-black-cat.webp");
    expect(manyangAssets.backgrounds.whiteCatHome).toBe("/manyang/backgrounds/home-white-cat-ref.webp");
    expect(manyangAssets.backgrounds.cheeseCatHome).toBe("/manyang/backgrounds/home-cheese-cat.webp");
    expect(manyangAssets.backgrounds.grayCatHome).toBe("/manyang/backgrounds/home-gray-cat.webp");
    expect(manyangAssets.backgrounds.default).toBe("/manyang/backgrounds/default.webp");
    expect(manyangAssets.backgrounds.blackCatInterpretation).toBe("/manyang/backgrounds/interpretation-black-cat.webp");
    expect(manyangAssets.backgrounds.whiteCatInterpretation).toBe("/manyang/backgrounds/interpretation-white-cat.webp");
    expect(manyangAssets.backgrounds.cheeseCatInterpretation).toBe("/manyang/backgrounds/interpretation-cheese-cat.webp");
    expect(manyangAssets.backgrounds.grayCatInterpretation).toBe("/manyang/backgrounds/interpretation-gray-cat.webp");
    expect(manyangAssets.illustrations.dreamseed).toBe("/manyang/backgrounds/dreamseed.webp");
    expect(manyangAssets.illustrations.morning).toBe("/manyang/backgrounds/morning-illustration.webp");
    expect(manyangAssets.illustrations.blackCatProfile).toBe("/manyang/references/cat-black-profile.webp");
    expect(manyangAssets.illustrations.whiteCatProfile).toBe("/manyang/references/cat-white-profile.webp");
    expect(manyangAssets.illustrations.cheeseCatProfile).toBe("/manyang/references/cat-cheese-profile.webp");
    expect(manyangAssets.illustrations.grayCatProfile).toBe("/manyang/references/cat-gray-profile.webp");
    expect(manyangAssets.illustrations.blackCat).toBe("/manyang/references/cat-black-profile.webp");
    expect(manyangAssets.illustrations.whiteCat).toBe("/manyang/references/cat-white-profile.webp");
    expect(manyangAssets.illustrations.cheeseCat).toBe("/manyang/references/cat-cheese-profile.webp");
    expect(manyangAssets.illustrations.grayCat).toBe("/manyang/references/cat-gray-profile.webp");
    expect(manyangAssets.orbs.base).toBe("/manyang/orbs/orb-transparent.webp");
    expect(manyangAssets.orbs.one).toBe("/manyang/orbs/orb-1-transparent.webp");
    expect(manyangAssets.orbs.two).toBe("/manyang/orbs/orb-2-transparent.webp");
    expect(manyangAssets.orbs.three).toBe("/manyang/orbs/orb-3-transparent.webp");

    [
      manyangAssets.backgrounds.blackCatHome,
      manyangAssets.backgrounds.whiteCatHome,
      manyangAssets.backgrounds.cheeseCatHome,
      manyangAssets.backgrounds.grayCatHome,
      manyangAssets.backgrounds.default,
      manyangAssets.backgrounds.blackCatInterpretation,
      manyangAssets.backgrounds.whiteCatInterpretation,
      manyangAssets.backgrounds.cheeseCatInterpretation,
      manyangAssets.backgrounds.grayCatInterpretation,
      manyangAssets.illustrations.dreamseed,
      manyangAssets.illustrations.morning,
      manyangAssets.illustrations.blackCatProfile,
      manyangAssets.illustrations.whiteCatProfile,
      manyangAssets.illustrations.cheeseCatProfile,
      manyangAssets.illustrations.grayCatProfile,
      manyangAssets.illustrations.blackCat,
      manyangAssets.illustrations.whiteCat,
      manyangAssets.illustrations.cheeseCat,
      manyangAssets.illustrations.grayCat,
      manyangAssets.orbs.base,
      manyangAssets.orbs.one,
      manyangAssets.orbs.two,
      manyangAssets.orbs.three,
    ].forEach((assetPath) => {
      expect(publicAssetExists(assetPath)).toBe(true);
    });
  });

  test("keeps cat home backgrounds at their reference sizes", () => {
    expect(readImageSize(manyangAssets.backgrounds.blackCatHome)).toEqual({ width: 853, height: 1844 });
    expect(readImageSize(manyangAssets.backgrounds.whiteCatHome)).toEqual({ width: 896, height: 1755 });
    expect(readImageSize(manyangAssets.backgrounds.cheeseCatHome)).toEqual({ width: 852, height: 1846 });
    expect(readImageSize(manyangAssets.backgrounds.grayCatHome)).toEqual({ width: 853, height: 1844 });
  });

  test("keeps optimized shared runtime assets at their source dimensions", () => {
    expect(readImageSize(manyangAssets.backgrounds.default)).toEqual({ width: 853, height: 1844 });
    expect(readImageSize(manyangAssets.backgrounds.blackCatInterpretation)).toEqual({ width: 853, height: 1844 });
    expect(readImageSize(manyangAssets.backgrounds.whiteCatInterpretation)).toEqual({ width: 853, height: 1844 });
    expect(readImageSize(manyangAssets.backgrounds.cheeseCatInterpretation)).toEqual({ width: 941, height: 1672 });
    expect(readImageSize(manyangAssets.backgrounds.grayCatInterpretation)).toEqual({ width: 852, height: 1846 });
    expect(readImageSize(manyangAssets.illustrations.dreamseed)).toEqual({ width: 1254, height: 1254 });
    expect(readImageSize(manyangAssets.illustrations.morning)).toEqual({ width: 1254, height: 1254 });
    expect(readImageSize(manyangAssets.illustrations.blackCatProfile)).toEqual({ width: 1254, height: 1254 });
    expect(readImageSize(manyangAssets.illustrations.whiteCatProfile)).toEqual({ width: 1254, height: 1254 });
    expect(readImageSize(manyangAssets.illustrations.cheeseCatProfile)).toEqual({ width: 1254, height: 1254 });
    expect(readImageSize(manyangAssets.illustrations.grayCatProfile)).toEqual({ width: 1254, height: 1254 });
    expect(readImageSize(manyangAssets.orbs.base)).toEqual({ width: 1254, height: 1254 });
    expect(readImageSize(manyangAssets.orbs.one)).toEqual({ width: 1254, height: 1254 });
    expect(readImageSize(manyangAssets.orbs.two)).toEqual({ width: 1254, height: 1254 });
    expect(readImageSize(manyangAssets.orbs.three)).toEqual({ width: 1254, height: 1254 });
  });

  test("uses optimized WebP home backgrounds that are smaller than their source PNGs", () => {
    [
      ["home-black-cat", manyangAssets.backgrounds.blackCatHome],
      ["home-white-cat-ref", manyangAssets.backgrounds.whiteCatHome],
      ["home-cheese-cat", manyangAssets.backgrounds.cheeseCatHome],
      ["home-gray-cat", manyangAssets.backgrounds.grayCatHome],
    ].forEach(([sourceName, optimizedAssetPath]) => {
      const sourcePath = publicAssetPath(`/manyang/backgrounds/${sourceName}.png`);
      const optimizedPath = publicAssetPath(optimizedAssetPath);

      expect(statSync(optimizedPath).size).toBeLessThan(statSync(sourcePath).size * 0.2);
    });
  });

  test("uses optimized WebP shared runtime assets that are smaller than their source PNGs", () => {
    [
      ["/manyang/backgrounds/default.png", manyangAssets.backgrounds.default, 0.2],
      ["/manyang/backgrounds/interpretation-black-cat.png", manyangAssets.backgrounds.blackCatInterpretation, 0.2],
      ["/manyang/backgrounds/interpretation-white-cat.png", manyangAssets.backgrounds.whiteCatInterpretation, 0.2],
      ["/manyang/backgrounds/interpretation-cheese-cat.png", manyangAssets.backgrounds.cheeseCatInterpretation, 0.2],
      ["/manyang/backgrounds/interpretation-gray-cat.png", manyangAssets.backgrounds.grayCatInterpretation, 0.2],
      ["/manyang/backgrounds/dreamseed.png", manyangAssets.illustrations.dreamseed, 0.35],
      ["/manyang/backgrounds/morning-illustration.png", manyangAssets.illustrations.morning, 0.35],
      ["/manyang/references/cat-black-profile.png", manyangAssets.illustrations.blackCatProfile, 0.35],
      ["/manyang/references/cat-white-profile.png", manyangAssets.illustrations.whiteCatProfile, 0.35],
      ["/manyang/references/cat-cheese-profile.png", manyangAssets.illustrations.cheeseCatProfile, 0.35],
      ["/manyang/references/cat-gray-profile.png", manyangAssets.illustrations.grayCatProfile, 0.35],
      ["/manyang/orbs/orb-transparent.png", manyangAssets.orbs.base, 0.35],
      ["/manyang/orbs/orb-1-transparent.png", manyangAssets.orbs.one, 0.35],
      ["/manyang/orbs/orb-2-transparent.png", manyangAssets.orbs.two, 0.35],
      ["/manyang/orbs/orb-3-transparent.png", manyangAssets.orbs.three, 0.35],
    ].forEach(([sourceAssetPath, optimizedAssetPath, maxRatio]) => {
      const sourcePath = publicAssetPath(sourceAssetPath as string);
      const optimizedPath = publicAssetPath(optimizedAssetPath as string);

      expect(statSync(optimizedPath).size).toBeLessThan(statSync(sourcePath).size * (maxRatio as number));
    });
  });

  test("uses the latest reference white cat home background", () => {
    const publicWhitePath = publicAssetPath("/manyang/backgrounds/home-white-cat-ref.png");
    const referenceWhitePath = path.join(process.cwd(), "..", "ref", "whitecat_home.png");

    expect(readSha256(publicWhitePath)).toBe(readSha256(referenceWhitePath));
  });

  test("uses the latest reference cheese cat home background", () => {
    const publicCheesePath = publicAssetPath("/manyang/backgrounds/home-cheese-cat.png");
    const referenceCheesePath = path.join(process.cwd(), "..", "ref", "cheesecat_home.png");

    expect(readSha256(publicCheesePath)).toBe(readSha256(referenceCheesePath));
  });

  test("uses the latest reference gray cat home background", () => {
    const publicGrayPath = publicAssetPath("/manyang/backgrounds/home-gray-cat.png");
    const referenceGrayPath = path.join(process.cwd(), "..", "ref", "graycat_home.png");

    expect(readSha256(publicGrayPath)).toBe(readSha256(referenceGrayPath));
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
    expect(manyangAssets.footer.icons.profile).toBe("/manyang/ui/footer/footer-icon-profile.png");

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
