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

function readJpegSizeFromFile(filePath: string): { width: number; height: number } {
  const jpeg = readFileSync(filePath);

  if (jpeg[0] !== 0xff || jpeg[1] !== 0xd8) {
    throw new Error(`Not a JPEG file: ${filePath}`);
  }

  let offset = 2;
  const sizeMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

  while (offset + 4 < jpeg.length) {
    if (jpeg[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = jpeg[offset + 1];
    const length = jpeg.readUInt16BE(offset + 2);

    if (sizeMarkers.has(marker)) {
      return {
        height: jpeg.readUInt16BE(offset + 5),
        width: jpeg.readUInt16BE(offset + 7),
      };
    }

    offset += 2 + length;
  }

  throw new Error(`Unsupported JPEG file: ${filePath}`);
}

function readImageSize(assetPath: string): { width: number; height: number } {
  const filePath = publicAssetPath(assetPath);

  if (assetPath.endsWith(".webp")) {
    return readWebpSizeFromFile(filePath);
  }

  if (assetPath.endsWith(".jpg") || assetPath.endsWith(".jpeg")) {
    return readJpegSizeFromFile(filePath);
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
    expect(manyangAssets.backgrounds.themeFrames.blackCat).toBe("/manyang/backgrounds/theme-background-black-cat-v4.png");
    expect(manyangAssets.backgrounds.themeFrames.whiteCat).toBe("/manyang/backgrounds/theme-background-white-cat-v4.png");
    expect(manyangAssets.backgrounds.themeFrames.cheeseCat).toBe("/manyang/backgrounds/theme-background-cheese-cat-v4.png");
    expect(manyangAssets.backgrounds.themeFrames.grayCat).toBe("/manyang/backgrounds/theme-background-gray-cat-v4.png");
    expect(manyangAssets.backgrounds.blackCatInterpretation).toBe("/manyang/backgrounds/interpretation-black-cat.webp");
    expect(manyangAssets.backgrounds.whiteCatInterpretation).toBe("/manyang/backgrounds/interpretation-white-cat.webp");
    expect(manyangAssets.backgrounds.cheeseCatInterpretation).toBe("/manyang/backgrounds/interpretation-cheese-cat.webp");
    expect(manyangAssets.backgrounds.grayCatInterpretation).toBe("/manyang/backgrounds/interpretation-gray-cat.webp");
    expect(manyangAssets.illustrations.dreamseedByCat.blackCat).toBe(
      "/manyang/backgrounds/dreamseed-background-black-cat-v2.webp",
    );
    expect(manyangAssets.illustrations.dreamseedByCat.whiteCat).toBe(
      "/manyang/backgrounds/dreamseed-background-white-cat-v2.webp",
    );
    expect(manyangAssets.illustrations.dreamseedByCat.cheeseCat).toBe(
      "/manyang/backgrounds/dreamseed-background-cheese-cat-v3.webp",
    );
    expect(manyangAssets.illustrations.dreamseedByCat.grayCat).toBe(
      "/manyang/backgrounds/dreamseed-background-gray-cat-v2.webp",
    );
    expect(manyangAssets.illustrations.encyclopediaBanners.blackCat).toBe(
      "/manyang/encyclopedia/encyclopedia-banner-black-cat-v3.webp",
    );
    expect(manyangAssets.illustrations.encyclopediaBanners.whiteCat).toBe(
      "/manyang/encyclopedia/encyclopedia-banner-white-cat-v3.webp",
    );
    expect(manyangAssets.illustrations.encyclopediaBanners.cheeseCat).toBe(
      "/manyang/encyclopedia/encyclopedia-banner-cheese-cat-v3.webp",
    );
    expect(manyangAssets.illustrations.encyclopediaBanners.grayCat).toBe(
      "/manyang/encyclopedia/encyclopedia-banner-gray-cat-v3.webp",
    );
    expect(manyangAssets.illustrations.morning).toBe("/manyang/backgrounds/morning-illustration.webp");
    expect(manyangAssets.illustrations.blackCatProfile).toBe("/manyang/references/cat-black-profile.webp");
    expect(manyangAssets.illustrations.whiteCatProfile).toBe("/manyang/references/cat-white-profile.webp");
    expect(manyangAssets.illustrations.cheeseCatProfile).toBe("/manyang/references/cat-cheese-profile.webp");
    expect(manyangAssets.illustrations.grayCatProfile).toBe("/manyang/references/cat-gray-profile.webp");
    expect(manyangAssets.illustrations.blackCat).toBe("/manyang/references/cat-black-profile.webp");
    expect(manyangAssets.illustrations.whiteCat).toBe("/manyang/references/cat-white-profile.webp");
    expect(manyangAssets.illustrations.cheeseCat).toBe("/manyang/references/cat-cheese-profile.webp");
    expect(manyangAssets.illustrations.grayCat).toBe("/manyang/references/cat-gray-profile.webp");
    expect(manyangAssets.loadingReaders.blackCat).toBe("/manyang/references/loading-black-cat.webp");
    expect(manyangAssets.loadingReaders.whiteCat).toBe("/manyang/references/loading-white-cat.webp");
    expect(manyangAssets.loadingReaders.cheeseCat).toBe("/manyang/references/loading-cheese-cat.webp");
    expect(manyangAssets.loadingReaders.grayCat).toBe("/manyang/references/loading-gray-cat.webp");
    expect(manyangAssets.orbs.base).toBe("/manyang/orbs/orb-transparent.webp");
    expect(manyangAssets.orbs.one).toBe("/manyang/orbs/orb-1-transparent.webp");
    expect(manyangAssets.orbs.two).toBe("/manyang/orbs/orb-2-transparent.webp");
    expect(manyangAssets.orbs.three).toBe("/manyang/orbs/orb-3-transparent.webp");
    expect(manyangAssets.receiptStamps.blackCat).toBe("/manyang/receipts/stamps/stamp-black-cat-seal.png");
    expect(manyangAssets.receiptStamps.whiteCat).toBe("/manyang/receipts/stamps/stamp-white-cat-seal.png");
    expect(manyangAssets.receiptStamps.cheeseCat).toBe("/manyang/receipts/stamps/stamp-cheese-cat-seal.png");
    expect(manyangAssets.receiptStamps.grayCat).toBe("/manyang/receipts/stamps/stamp-gray-cat-seal.png");

    [
      manyangAssets.backgrounds.blackCatHome,
      manyangAssets.backgrounds.whiteCatHome,
      manyangAssets.backgrounds.cheeseCatHome,
      manyangAssets.backgrounds.grayCatHome,
      manyangAssets.backgrounds.default,
      manyangAssets.backgrounds.themeFrames.blackCat,
      manyangAssets.backgrounds.themeFrames.whiteCat,
      manyangAssets.backgrounds.themeFrames.cheeseCat,
      manyangAssets.backgrounds.themeFrames.grayCat,
      manyangAssets.backgrounds.blackCatInterpretation,
      manyangAssets.backgrounds.whiteCatInterpretation,
      manyangAssets.backgrounds.cheeseCatInterpretation,
      manyangAssets.backgrounds.grayCatInterpretation,
      manyangAssets.illustrations.dreamseedByCat.blackCat,
      manyangAssets.illustrations.dreamseedByCat.whiteCat,
      manyangAssets.illustrations.dreamseedByCat.cheeseCat,
      manyangAssets.illustrations.dreamseedByCat.grayCat,
      manyangAssets.illustrations.encyclopediaBanners.blackCat,
      manyangAssets.illustrations.encyclopediaBanners.whiteCat,
      manyangAssets.illustrations.encyclopediaBanners.cheeseCat,
      manyangAssets.illustrations.encyclopediaBanners.grayCat,
      manyangAssets.illustrations.morning,
      manyangAssets.illustrations.blackCatProfile,
      manyangAssets.illustrations.whiteCatProfile,
      manyangAssets.illustrations.cheeseCatProfile,
      manyangAssets.illustrations.grayCatProfile,
      manyangAssets.illustrations.blackCat,
      manyangAssets.illustrations.whiteCat,
      manyangAssets.illustrations.cheeseCat,
      manyangAssets.illustrations.grayCat,
      manyangAssets.loadingReaders.blackCat,
      manyangAssets.loadingReaders.whiteCat,
      manyangAssets.loadingReaders.cheeseCat,
      manyangAssets.loadingReaders.grayCat,
      manyangAssets.orbs.base,
      manyangAssets.orbs.one,
      manyangAssets.orbs.two,
      manyangAssets.orbs.three,
      manyangAssets.receiptStamps.blackCat,
      manyangAssets.receiptStamps.whiteCat,
      manyangAssets.receiptStamps.cheeseCat,
      manyangAssets.receiptStamps.grayCat,
    ].forEach((assetPath) => {
      expect(publicAssetExists(assetPath)).toBe(true);
    });
  });

  test("keeps cat home backgrounds at their reference sizes", () => {
    expect(readImageSize(manyangAssets.backgrounds.blackCatHome)).toEqual({ width: 853, height: 1844 });
    expect(readImageSize(manyangAssets.backgrounds.whiteCatHome)).toEqual({ width: 853, height: 1844 });
    expect(readImageSize(manyangAssets.backgrounds.cheeseCatHome)).toEqual({ width: 853, height: 1844 });
    expect(readImageSize(manyangAssets.backgrounds.grayCatHome)).toEqual({ width: 853, height: 1844 });
  });

  test("keeps optimized shared runtime assets at their source dimensions", () => {
    expect(readImageSize(manyangAssets.backgrounds.default)).toEqual({ width: 853, height: 1844 });
    expect(readImageSize(manyangAssets.backgrounds.themeFrames.blackCat)).toEqual({ width: 853, height: 1660 });
    expect(readImageSize(manyangAssets.backgrounds.themeFrames.whiteCat)).toEqual({ width: 853, height: 1660 });
    expect(readImageSize(manyangAssets.backgrounds.themeFrames.cheeseCat)).toEqual({ width: 853, height: 1660 });
    expect(readImageSize(manyangAssets.backgrounds.themeFrames.grayCat)).toEqual({ width: 853, height: 1660 });
    expect(readImageSize(manyangAssets.backgrounds.blackCatInterpretation)).toEqual({ width: 853, height: 1844 });
    expect(readImageSize(manyangAssets.backgrounds.whiteCatInterpretation)).toEqual({ width: 853, height: 1844 });
    expect(readImageSize(manyangAssets.backgrounds.cheeseCatInterpretation)).toEqual({ width: 941, height: 1672 });
    expect(readImageSize(manyangAssets.backgrounds.grayCatInterpretation)).toEqual({ width: 852, height: 1846 });
    expect(readImageSize(manyangAssets.illustrations.dreamseedByCat.blackCat)).toEqual({ width: 1254, height: 1254 });
    expect(readImageSize(manyangAssets.illustrations.dreamseedByCat.whiteCat)).toEqual({ width: 1254, height: 1254 });
    expect(readImageSize(manyangAssets.illustrations.dreamseedByCat.cheeseCat)).toEqual({ width: 1254, height: 1254 });
    expect(readImageSize(manyangAssets.illustrations.dreamseedByCat.grayCat)).toEqual({ width: 1254, height: 1254 });
    expect(readImageSize(manyangAssets.illustrations.encyclopediaBanners.blackCat)).toEqual({ width: 1536, height: 1024 });
    expect(readImageSize(manyangAssets.illustrations.encyclopediaBanners.whiteCat)).toEqual({ width: 1536, height: 1024 });
    expect(readImageSize(manyangAssets.illustrations.encyclopediaBanners.cheeseCat)).toEqual({ width: 1536, height: 1024 });
    expect(readImageSize(manyangAssets.illustrations.encyclopediaBanners.grayCat)).toEqual({ width: 1536, height: 1024 });
    expect(readImageSize(manyangAssets.illustrations.morning)).toEqual({ width: 1254, height: 1254 });
    expect(readImageSize(manyangAssets.illustrations.blackCatProfile)).toEqual({ width: 1254, height: 1254 });
    expect(readImageSize(manyangAssets.illustrations.whiteCatProfile)).toEqual({ width: 1254, height: 1254 });
    expect(readImageSize(manyangAssets.illustrations.cheeseCatProfile)).toEqual({ width: 1254, height: 1254 });
    expect(readImageSize(manyangAssets.illustrations.grayCatProfile)).toEqual({ width: 1254, height: 1254 });
    expect(readImageSize(manyangAssets.loadingReaders.blackCat)).toEqual({ width: 1254, height: 1254 });
    expect(readImageSize(manyangAssets.loadingReaders.whiteCat)).toEqual({ width: 1254, height: 1254 });
    expect(readImageSize(manyangAssets.loadingReaders.cheeseCat)).toEqual({ width: 1254, height: 1254 });
    expect(readImageSize(manyangAssets.loadingReaders.grayCat)).toEqual({ width: 1254, height: 1254 });
    expect(readImageSize(manyangAssets.orbs.base)).toEqual({ width: 1254, height: 1254 });
    expect(readImageSize(manyangAssets.orbs.one)).toEqual({ width: 1254, height: 1254 });
    expect(readImageSize(manyangAssets.orbs.two)).toEqual({ width: 1254, height: 1254 });
    expect(readImageSize(manyangAssets.orbs.three)).toEqual({ width: 1254, height: 1254 });
    expect(readImageSize(manyangAssets.receiptStamps.blackCat)).toEqual({ width: 1254, height: 1254 });
    expect(readImageSize(manyangAssets.receiptStamps.whiteCat)).toEqual({ width: 1254, height: 1254 });
    expect(readImageSize(manyangAssets.receiptStamps.cheeseCat)).toEqual({ width: 1254, height: 1254 });
    expect(readImageSize(manyangAssets.receiptStamps.grayCat)).toEqual({ width: 1254, height: 1254 });
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
      ["/manyang/backgrounds/dreamseed-background-black-cat-v2.png", manyangAssets.illustrations.dreamseedByCat.blackCat, 0.2],
      ["/manyang/backgrounds/dreamseed-background-white-cat-v2.png", manyangAssets.illustrations.dreamseedByCat.whiteCat, 0.2],
      ["/manyang/backgrounds/dreamseed-background-cheese-cat-v3.png", manyangAssets.illustrations.dreamseedByCat.cheeseCat, 0.2],
      ["/manyang/backgrounds/dreamseed-background-gray-cat-v2.png", manyangAssets.illustrations.dreamseedByCat.grayCat, 0.2],
      ["../ref/encyclopedia-illustrations/encyclopedia-banner-black-cat-v3.png", manyangAssets.illustrations.encyclopediaBanners.blackCat, 0.18],
      ["../ref/encyclopedia-illustrations/encyclopedia-banner-white-cat-v3.png", manyangAssets.illustrations.encyclopediaBanners.whiteCat, 0.18],
      ["../ref/encyclopedia-illustrations/encyclopedia-banner-cheese-cat-v3.png", manyangAssets.illustrations.encyclopediaBanners.cheeseCat, 0.18],
      ["../ref/encyclopedia-illustrations/encyclopedia-banner-gray-cat-v3.png", manyangAssets.illustrations.encyclopediaBanners.grayCat, 0.18],
      ["/manyang/backgrounds/morning-illustration.png", manyangAssets.illustrations.morning, 0.35],
      ["/manyang/references/cat-black-profile.png", manyangAssets.illustrations.blackCatProfile, 0.35],
      ["/manyang/references/cat-white-profile.png", manyangAssets.illustrations.whiteCatProfile, 0.35],
      ["/manyang/references/cat-cheese-profile.png", manyangAssets.illustrations.cheeseCatProfile, 0.35],
      ["/manyang/references/cat-gray-profile.png", manyangAssets.illustrations.grayCatProfile, 0.35],
      ["../ref/blackcat.png", manyangAssets.loadingReaders.blackCat, 0.35],
      ["../ref/whitecat.png", manyangAssets.loadingReaders.whiteCat, 0.35],
      ["../ref/cheesecat.png", manyangAssets.loadingReaders.cheeseCat, 0.35],
      ["../ref/graycat.png", manyangAssets.loadingReaders.grayCat, 0.35],
      ["/manyang/orbs/orb-transparent.png", manyangAssets.orbs.base, 0.35],
      ["/manyang/orbs/orb-1-transparent.png", manyangAssets.orbs.one, 0.35],
      ["/manyang/orbs/orb-2-transparent.png", manyangAssets.orbs.two, 0.35],
      ["/manyang/orbs/orb-3-transparent.png", manyangAssets.orbs.three, 0.35],
    ].forEach(([sourceAssetPath, optimizedAssetPath, maxRatio]) => {
      const sourcePath = (sourceAssetPath as string).startsWith("../")
        ? path.join(process.cwd(), sourceAssetPath as string)
        : publicAssetPath(sourceAssetPath as string);
      const optimizedPath = publicAssetPath(optimizedAssetPath as string);

      expect(statSync(optimizedPath).size).toBeLessThan(statSync(sourcePath).size * (maxRatio as number));
    });
  });

  test("exposes the black cat social preview image for shared links", () => {
    expect(manyangAssets.social.sharePreview).toBe("/manyang/social/og-blackcat.jpg");
    expect(publicAssetExists(manyangAssets.social.sharePreview)).toBe(true);
    expect(readImageSize(manyangAssets.social.sharePreview)).toEqual({ width: 1200, height: 1200 });
    expect(statSync(publicAssetPath(manyangAssets.social.sharePreview)).size).toBeLessThan(500_000);
  });

  test("uses the latest reference white cat home background", () => {
    const publicWhitePath = publicAssetPath("/manyang/backgrounds/home-white-cat-ref.png");
    const referenceWhitePath = path.join(process.cwd(), "..", "ref", "whitecat-home.png");

    expect(readSha256(publicWhitePath)).toBe(readSha256(referenceWhitePath));
  });

  test("uses the latest reference black cat home background", () => {
    const publicBlackPath = publicAssetPath("/manyang/backgrounds/home-black-cat.png");
    const referenceBlackPath = path.join(process.cwd(), "..", "ref", "blackcat-home.png");

    expect(readSha256(publicBlackPath)).toBe(readSha256(referenceBlackPath));
  });

  test("uses the latest reference cheese cat home background", () => {
    const publicCheesePath = publicAssetPath("/manyang/backgrounds/home-cheese-cat.png");
    const referenceCheesePath = path.join(process.cwd(), "..", "ref", "cheesecat-home.png");

    expect(readSha256(publicCheesePath)).toBe(readSha256(referenceCheesePath));
  });

  test("uses the latest reference gray cat home background", () => {
    const publicGrayPath = publicAssetPath("/manyang/backgrounds/home-gray-cat.png");
    const referenceGrayPath = path.join(process.cwd(), "..", "ref", "graycat-home.png");

    expect(readSha256(publicGrayPath)).toBe(readSha256(referenceGrayPath));
  });

  test("exposes the reference button image assets used by the home and write flows", () => {
    expect(manyangAssets.buttons.dreammemoryWrite).toBe("/manyang/ui/buttons/dreammemory-write-frame-slim.png");
    expect(manyangAssets.buttons.dreammemoryForgot).toBe("/manyang/ui/buttons/dreammemory-forgot-frame.png");
    expect(manyangAssets.buttons.dreammemorySubmit).toBe("/manyang/ui/buttons/dreammemory-submit-frame-slim.png");
    expect(manyangAssets.buttons.dreamseed).toBe("/manyang/ui/buttons/dreamseed-frame.png");
    expect(manyangAssets.buttons.dreamseedArchive).toBe("/manyang/ui/buttons/dreamseed-archive-frame.png");
    expect(manyangAssets.buttons.morningPawprint).toBe("/manyang/ui/buttons/morning-pawprint-frame.png");
    expect(manyangAssets.buttons.compactPrimary).toBe("/manyang/ui/buttons/common-compact-primary-frame.png");
    expect(manyangAssets.buttons.mediumPrimary).toBe("/manyang/ui/buttons/common-medium-primary-frame.png");
    expect(manyangAssets.buttons.mediumSecondary).toBe("/manyang/ui/buttons/common-medium-secondary-frame.png");

    Object.values(manyangAssets.buttons).forEach((assetPath) => {
      expect(publicAssetExists(assetPath)).toBe(true);
    });

    expect(readImageSize(manyangAssets.buttons.compactPrimary)).toEqual({ width: 640, height: 200 });
    expect(readImageSize(manyangAssets.buttons.dreammemoryWrite)).toEqual({ width: 860, height: 235 });
    expect(readImageSize(manyangAssets.buttons.dreammemorySubmit)).toEqual({ width: 857, height: 200 });
    expect(readImageSize(manyangAssets.buttons.mediumPrimary)).toEqual({ width: 850, height: 150 });
    expect(readImageSize(manyangAssets.buttons.mediumSecondary)).toEqual({ width: 850, height: 150 });
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

  test("exposes tarot card back and major arcana assets", () => {
    expect(manyangAssets.tarot.cardBack).toBe("/manyang/tarot/card-back.png");
    expect(Object.keys(manyangAssets.tarot.major)).toEqual([
      "fool",
      "magician",
      "highPriestess",
      "empress",
      "emperor",
      "hierophant",
      "lovers",
      "chariot",
      "strength",
      "hermit",
      "wheelOfFortune",
      "justice",
      "hangedMan",
      "death",
      "temperance",
      "devil",
      "tower",
      "star",
      "moon",
      "sun",
      "judgement",
      "world",
    ]);
    expect(manyangAssets.tarot.major.fool).toBe("/manyang/tarot/major/00-the-fool.png");
    expect(manyangAssets.tarot.major.world).toBe("/manyang/tarot/major/21-the-world.png");

    [
      manyangAssets.tarot.cardBack,
      ...Object.values(manyangAssets.tarot.major),
    ].forEach((assetPath) => {
      expect(publicAssetExists(assetPath)).toBe(true);
    });
  });

  test("exposes separated action glyph assets for CSS circle icon buttons", () => {
    expect(manyangAssets.actionIcons.arrowLeft).toBe("/manyang/ui/action-icons/action-arrow-left.png");
    expect(manyangAssets.actionIcons.bell).toBe("/manyang/ui/action-icons/action-bell.png");
    expect(manyangAssets.actionIcons.settings).toBe("/manyang/ui/action-icons/action-settings.png");
    expect(manyangAssets.actionIcons.book).toBe("/manyang/ui/action-icons/action-book.png");
    expect(manyangAssets.actionIcons.trash).toBe("/manyang/ui/action-icons/action-trash.png");

    Object.values(manyangAssets.actionIcons).forEach((assetPath) => {
      expect(publicAssetExists(assetPath)).toBe(true);
    });
  });

  test("exposes basic and page icon assets for shared page UI", () => {
    expect(Object.keys(manyangAssets.basicIcons)).toHaveLength(8);
    expect(manyangAssets.basicIcons.moon).toBe("/manyang/ui/basic-icons/basic-moon.png");
    expect(manyangAssets.basicIcons.profile).toBe("/manyang/ui/basic-icons/basic-profile.png");

    Object.values(manyangAssets.basicIcons).forEach((assetPath) => {
      expect(publicAssetExists(assetPath)).toBe(true);
      expect(readImageSize(assetPath)).toEqual({ width: 256, height: 256 });
    });

    expect(Object.keys(manyangAssets.pageIcons)).toHaveLength(9);
    expect(manyangAssets.pageIcons.write).toBe("/manyang/ui/page-icons/page-write.png");
    expect(manyangAssets.pageIcons.morningPawprint).toBe("/manyang/ui/page-icons/page-morning-pawprint.png");
    expect(manyangAssets.pageIcons.dreamReceipt).toBe("/manyang/ui/page-icons/page-dream-receipt.png");

    Object.values(manyangAssets.pageIcons).forEach((assetPath) => {
      expect(publicAssetExists(assetPath)).toBe(true);
      expect(readImageSize(assetPath)).toEqual({ width: 256, height: 256 });
    });
  });

  test("exposes separated semantic symbol assets for chips, cards, and calendar markers", () => {
    expect(manyangAssets.semanticIcons.moon).toBe("/manyang/ui/semantic-icons/semantic-moon.png");
    expect(manyangAssets.semanticIcons.paw).toBe("/manyang/ui/semantic-icons/semantic-paw.png");
    expect(manyangAssets.semanticIcons.sparkles).toBe("/manyang/ui/semantic-icons/semantic-sparkles.png");
    expect(manyangAssets.semanticIcons.cloud).toBe("/manyang/ui/semantic-icons/semantic-cloud.png");
    expect(manyangAssets.semanticIcons.feather).toBe("/manyang/ui/semantic-icons/semantic-feather.png");
    expect(manyangAssets.semanticIcons.lantern).toBe("/manyang/ui/semantic-icons/semantic-lantern.png");
    expect(manyangAssets.semanticIcons.potion).toBe("/manyang/ui/semantic-icons/semantic-potion.png");
    expect(manyangAssets.semanticIcons.key).toBe("/manyang/ui/semantic-icons/semantic-key.png");
    expect(manyangAssets.semanticIcons.door).toBe("/manyang/ui/semantic-icons/semantic-door.png");
    expect(manyangAssets.semanticIcons.crystalBall).toBe("/manyang/ui/semantic-icons/semantic-crystal-ball.png");
    expect(manyangAssets.semanticIcons.crystals).toBe("/manyang/ui/semantic-icons/semantic-crystals.png");
    expect(manyangAssets.semanticIcons.star).toBe("/manyang/ui/semantic-icons/semantic-star.png");

    Object.values(manyangAssets.semanticIcons).forEach((assetPath) => {
      expect(publicAssetExists(assetPath)).toBe(true);
    });
  });

  test("exposes calendar record and encyclopedia category icon assets", () => {
    expect(Object.keys(manyangAssets.calendarRecordIcons)).toHaveLength(4);
    expect(manyangAssets.calendarRecordIcons.dream).toBe("/manyang/ui/calendar-record-icons/calendar-record-dream.png");
    expect(manyangAssets.calendarRecordIcons.pawprint).toBe(
      "/manyang/ui/calendar-record-icons/calendar-record-pawprint.png",
    );

    Object.values(manyangAssets.calendarRecordIcons).forEach((assetPath) => {
      expect(publicAssetExists(assetPath)).toBe(true);
      expect(readImageSize(assetPath)).toEqual({ width: 256, height: 256 });
    });

    expect(Object.keys(manyangAssets.encyclopediaIcons)).toHaveLength(11);
    expect(manyangAssets.encyclopediaIcons.place).toBe("/manyang/ui/encyclopedia-icons/encyclopedia-place.png");
    expect(manyangAssets.encyclopediaIcons.abstract).toBe(
      "/manyang/ui/encyclopedia-icons/encyclopedia-abstract.png",
    );

    Object.values(manyangAssets.encyclopediaIcons).forEach((assetPath) => {
      expect(publicAssetExists(assetPath)).toBe(true);
      expect(readImageSize(assetPath)).toEqual({ width: 256, height: 256 });
    });
  });

  test("exposes keyword and section icon assets for routine chips", () => {
    expect(Object.keys(manyangAssets.keywordIcons)).toHaveLength(44);
    expect(manyangAssets.keywordIcons.peaceful).toBe("/manyang/ui/keyword-icons/keyword-peaceful.png");
    expect(manyangAssets.keywordIcons.coldSweat).toBe("/manyang/ui/keyword-icons/keyword-cold-sweat.png");
    expect(manyangAssets.keywordIcons.lightBody).toBe("/manyang/ui/keyword-icons/keyword-light-body.png");

    Object.values(manyangAssets.keywordIcons).forEach((assetPath) => {
      expect(publicAssetExists(assetPath)).toBe(true);
      expect(readImageSize(assetPath)).toEqual({ width: 256, height: 256 });
    });

    expect(Object.keys(manyangAssets.sectionIcons)).toHaveLength(9);
    expect(manyangAssets.sectionIcons.dreamAtmosphere).toBe("/manyang/ui/section-icons/section-dream-atmosphere.png");
    expect(manyangAssets.sectionIcons.nightCondition).toBe("/manyang/ui/section-icons/section-night-condition.png");

    Object.values(manyangAssets.sectionIcons).forEach((assetPath) => {
      expect(publicAssetExists(assetPath)).toBe(true);
      expect(readImageSize(assetPath)).toEqual({ width: 256, height: 256 });
    });
  });

  test("exposes profile room setting icon assets", () => {
    expect(manyangAssets.profileIcons.notifications).toBe("/manyang/ui/profile-icons/profile-notifications.png");
    expect(manyangAssets.profileIcons.privacy).toBe("/manyang/ui/profile-icons/profile-privacy.png");
    expect(manyangAssets.profileIcons.theme).toBe("/manyang/ui/profile-icons/profile-theme.png");
    expect(manyangAssets.profileIcons.moonPass).toBe("/manyang/ui/profile-icons/profile-moon-pass.png");
    expect(manyangAssets.profileIcons.service).toBe("/manyang/ui/profile-icons/profile-service.png");
    expect(manyangAssets.profileIcons.account).toBe("/manyang/ui/profile-icons/profile-account.png");

    Object.values(manyangAssets.profileIcons).forEach((assetPath) => {
      expect(publicAssetExists(assetPath)).toBe(true);
      expect(readImageSize(assetPath)).toEqual({ width: 256, height: 256 });
    });

    expect(manyangAssets.profileMenuIcons.recordBackup).toBe(
      "/manyang/ui/profile-menu-icons/profile-menu-record-backup.png",
    );
    expect(manyangAssets.profileMenuIcons.recordExport).toBe(
      "/manyang/ui/profile-menu-icons/profile-menu-record-export.png",
    );
    expect(manyangAssets.profileMenuIcons.recordDelete).toBe(
      "/manyang/ui/profile-menu-icons/profile-menu-record-delete.png",
    );
    expect(manyangAssets.profileMenuIcons.feedback).toBe(
      "/manyang/ui/profile-menu-icons/profile-menu-feedback.png",
    );
    expect(manyangAssets.profileMenuIcons.terms).toBe("/manyang/ui/profile-menu-icons/profile-menu-terms.png");
    expect(manyangAssets.profileMenuIcons.privacySecurity).toBe(
      "/manyang/ui/profile-menu-icons/profile-menu-privacy-security.png",
    );
    expect(manyangAssets.profileMenuIcons.privacyPolicy).toBe(
      "/manyang/ui/profile-menu-icons/profile-menu-privacy-policy.png",
    );
    expect(manyangAssets.profileMenuIcons.appVersion).toBe(
      "/manyang/ui/profile-menu-icons/profile-menu-app-version.png",
    );
    expect(manyangAssets.profileMenuIcons.morningPawprint).toBe(
      "/manyang/ui/profile-menu-icons/profile-menu-morning-pawprint.png",
    );

    Object.values(manyangAssets.profileMenuIcons).forEach((assetPath) => {
      expect(publicAssetExists(assetPath)).toBe(true);
      expect(readImageSize(assetPath)).toEqual({ width: 256, height: 256 });
    });
  });

});
