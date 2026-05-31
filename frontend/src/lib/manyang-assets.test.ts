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
    expect(manyangAssets.backgrounds.blackCatInterpretation).toBe("/manyang/backgrounds/interpretation-black-cat.webp");
    expect(manyangAssets.backgrounds.whiteCatInterpretation).toBe("/manyang/backgrounds/interpretation-white-cat.webp");
    expect(manyangAssets.backgrounds.cheeseCatInterpretation).toBe("/manyang/backgrounds/interpretation-cheese-cat.webp");
    expect(manyangAssets.backgrounds.grayCatInterpretation).toBe("/manyang/backgrounds/interpretation-gray-cat.webp");
    expect(manyangAssets.illustrations.dreamseed).toBe("/manyang/backgrounds/dreamseed.webp");
    expect(manyangAssets.illustrations.dreamseedByCat.blackCat).toBe(
      "/manyang/backgrounds/dreamseed-background-black-cat-v2.png",
    );
    expect(manyangAssets.illustrations.dreamseedByCat.whiteCat).toBe(
      "/manyang/backgrounds/dreamseed-background-white-cat-v2.png",
    );
    expect(manyangAssets.illustrations.dreamseedByCat.cheeseCat).toBe(
      "/manyang/backgrounds/dreamseed-background-cheese-cat-v3.png",
    );
    expect(manyangAssets.illustrations.dreamseedByCat.grayCat).toBe(
      "/manyang/backgrounds/dreamseed-background-gray-cat-v2.png",
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
      manyangAssets.backgrounds.blackCatInterpretation,
      manyangAssets.backgrounds.whiteCatInterpretation,
      manyangAssets.backgrounds.cheeseCatInterpretation,
      manyangAssets.backgrounds.grayCatInterpretation,
      manyangAssets.illustrations.dreamseed,
      manyangAssets.illustrations.dreamseedByCat.blackCat,
      manyangAssets.illustrations.dreamseedByCat.whiteCat,
      manyangAssets.illustrations.dreamseedByCat.cheeseCat,
      manyangAssets.illustrations.dreamseedByCat.grayCat,
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
    expect(readImageSize(manyangAssets.illustrations.dreamseedByCat.blackCat)).toEqual({ width: 1254, height: 1254 });
    expect(readImageSize(manyangAssets.illustrations.dreamseedByCat.whiteCat)).toEqual({ width: 1254, height: 1254 });
    expect(readImageSize(manyangAssets.illustrations.dreamseedByCat.cheeseCat)).toEqual({ width: 1254, height: 1254 });
    expect(readImageSize(manyangAssets.illustrations.dreamseedByCat.grayCat)).toEqual({ width: 1254, height: 1254 });
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
      ["/manyang/backgrounds/dreamseed.png", manyangAssets.illustrations.dreamseed, 0.35],
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

  test("exposes profile room setting icon assets", () => {
    expect(manyangAssets.profileIcons.notifications).toBe("/manyang/ui/profile-icons/profile-notifications.png");
    expect(manyangAssets.profileIcons.privacy).toBe("/manyang/ui/profile-icons/profile-privacy.png");
    expect(manyangAssets.profileIcons.theme).toBe("/manyang/ui/profile-icons/profile-theme.png");
    expect(manyangAssets.profileIcons.moonPass).toBe("/manyang/ui/profile-icons/profile-moon-pass.png");
    expect(manyangAssets.profileIcons.service).toBe("/manyang/ui/profile-icons/profile-service.png");
    expect(manyangAssets.profileIcons.account).toBe("/manyang/ui/profile-icons/profile-account.png");

    Object.values(manyangAssets.profileIcons).forEach((assetPath) => {
      expect(publicAssetExists(assetPath)).toBe(true);
      expect(readImageSize(assetPath)).toEqual({ width: 192, height: 192 });
    });
  });

});
