import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..", "..");
const sourceDir = path.join(repoRoot, "ref", "tarot cards minor");
const outputDir = path.join(repoRoot, "frontend", "public", "manyang", "tarot", "minor-cutout");

const suitByPrefix = {
  1: "wands",
  2: "cups",
  3: "swords",
  4: "pentacles",
};

const suitPrefixes = ["1", "2", "3", "4"];
const rankNumbers = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14"];

const rankByNumber = {
  "01": "ace",
  "02": "two",
  "03": "three",
  "04": "four",
  "05": "five",
  "06": "six",
  "07": "seven",
  "08": "eight",
  "09": "nine",
  10: "ten",
  11: "page",
  12: "knight",
  13: "queen",
  14: "king",
};

function getPixelOffset(x, y, width) {
  return (y * width + x) * 4;
}

function computeBackgroundColor(data, width, height) {
  const samples = [];
  const edgeInset = 2;
  const xStep = Math.max(1, Math.floor(width / 24));
  const yStep = Math.max(1, Math.floor(height / 24));

  function addSample(x, y) {
    const offset = getPixelOffset(x, y, width);
    samples.push([data[offset], data[offset + 1], data[offset + 2]]);
  }

  for (let x = 0; x < width; x += xStep) {
    addSample(x, edgeInset);
    addSample(x, height - 1 - edgeInset);
  }

  for (let y = 0; y < height; y += yStep) {
    addSample(edgeInset, y);
    addSample(width - 1 - edgeInset, y);
  }

  samples.sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));

  const darkEdgeSamples = samples.slice(0, Math.max(4, Math.floor(samples.length * 0.65)));
  const total = darkEdgeSamples.reduce(
    (sum, sample) => [sum[0] + sample[0], sum[1] + sample[1], sum[2] + sample[2]],
    [0, 0, 0],
  );

  return total.map((value) => value / darkEdgeSamples.length);
}

function isBackgroundCandidate(data, offset, backgroundColor) {
  const red = data[offset];
  const green = data[offset + 1];
  const blue = data[offset + 2];
  const maxChannel = Math.max(red, green, blue);
  const minChannel = Math.min(red, green, blue);
  const colorDistance =
    Math.abs(red - backgroundColor[0]) +
    Math.abs(green - backgroundColor[1]) +
    Math.abs(blue - backgroundColor[2]);
  const backgroundBrightness = Math.max(...backgroundColor);

  return (
    colorDistance <= 42 &&
    maxChannel <= Math.max(42, backgroundBrightness + 34) &&
    maxChannel - minChannel <= 30
  );
}

function findConnectedBackground(data, width, height, backgroundColor) {
  const pixelCount = width * height;
  const outside = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  let readIndex = 0;
  let writeIndex = 0;

  function push(pixelIndex) {
    if (outside[pixelIndex]) {
      return;
    }

    outside[pixelIndex] = 1;
    queue[writeIndex] = pixelIndex;
    writeIndex += 1;
  }

  for (let x = 0; x < width; x += 1) {
    const top = x;
    const bottom = (height - 1) * width + x;

    if (isBackgroundCandidate(data, top * 4, backgroundColor)) {
      push(top);
    }

    if (isBackgroundCandidate(data, bottom * 4, backgroundColor)) {
      push(bottom);
    }
  }

  for (let y = 0; y < height; y += 1) {
    const left = y * width;
    const right = y * width + width - 1;

    if (isBackgroundCandidate(data, left * 4, backgroundColor)) {
      push(left);
    }

    if (isBackgroundCandidate(data, right * 4, backgroundColor)) {
      push(right);
    }
  }

  const directions = [1, -1, width, -width];

  while (readIndex < writeIndex) {
    const pixelIndex = queue[readIndex];
    const x = pixelIndex % width;
    readIndex += 1;

    for (const direction of directions) {
      if ((direction === 1 && x === width - 1) || (direction === -1 && x === 0)) {
        continue;
      }

      const nextIndex = pixelIndex + direction;

      if (nextIndex < 0 || nextIndex >= pixelCount || outside[nextIndex]) {
        continue;
      }

      if (isBackgroundCandidate(data, nextIndex * 4, backgroundColor)) {
        push(nextIndex);
      }
    }
  }

  return outside;
}

function parseMinorCardFile(fileName) {
  const match = fileName.match(/^([1-4])-([0-9]{2})_/);

  if (!match) {
    return null;
  }

  const [, suitPrefix, rankNumber] = match;
  const suit = suitByPrefix[suitPrefix];
  const rank = rankByNumber[rankNumber];

  if (!suit || !rank) {
    return null;
  }

  return {
    key: `${suitPrefix}-${rankNumber}`,
    outputFileName: `${rankNumber}-${rank}-of-${suit}.png`,
    outputSubdir: suit,
    rankNumber,
    sourceFileName: fileName,
    suit,
    suitPrefix,
  };
}

async function createCutout(card) {
  const inputPath = path.join(sourceDir, card.sourceFileName);
  const targetDir = path.join(outputDir, card.outputSubdir);
  const outputPath = path.join(targetDir, card.outputFileName);
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const backgroundColor = computeBackgroundColor(data, info.width, info.height);
  const outside = findConnectedBackground(data, info.width, info.height, backgroundColor);
  let transparentPixels = 0;

  for (let pixelIndex = 0; pixelIndex < outside.length; pixelIndex += 1) {
    if (!outside[pixelIndex]) {
      continue;
    }

    data[pixelIndex * 4 + 3] = 0;
    transparentPixels += 1;
  }

  const transparentRatio = transparentPixels / outside.length;

  if (transparentRatio < 0.02 || transparentRatio > 0.25) {
    throw new Error(
      `${card.sourceFileName} produced an unexpected transparent area: ${(transparentRatio * 100).toFixed(2)}%`,
    );
  }

  await fs.mkdir(targetDir, { recursive: true });
  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath);

  return {
    outputFileName: path.join(card.outputSubdir, card.outputFileName),
    sourceFileName: card.sourceFileName,
    transparentRatio,
    width: info.width,
    height: info.height,
  };
}

async function readMinorCards() {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  const cards = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".png"))
    .map((entry) => parseMinorCardFile(entry.name))
    .filter(Boolean)
    .sort((a, b) => a.suitPrefix.localeCompare(b.suitPrefix) || a.rankNumber.localeCompare(b.rankNumber));

  const cardKeys = new Set(cards.map((card) => card.key));
  const missing = [];

  for (const suitPrefix of suitPrefixes) {
    for (const rankNumber of rankNumbers) {
      const key = `${suitPrefix}-${rankNumber}`;

      if (!cardKeys.has(key)) {
        missing.push(`${key}_${rankByNumber[rankNumber]} of ${suitByPrefix[suitPrefix]}.png`);
      }
    }
  }

  return { cards, missing };
}

await fs.mkdir(outputDir, { recursive: true });

const { cards, missing } = await readMinorCards();
const results = [];

for (const card of cards) {
  results.push(await createCutout(card));
}

for (const result of results) {
  const percent = (result.transparentRatio * 100).toFixed(2).padStart(5, " ");
  console.log(
    `${result.outputFileName} ${result.width}x${result.height} transparent=${percent}% source="${result.sourceFileName}"`,
  );
}

if (missing.length > 0) {
  console.warn(`Missing ${missing.length} expected tarot minor source file(s):`);
  for (const fileName of missing) {
    console.warn(`- ${fileName}`);
  }
}

console.log(`Generated ${results.length} tarot minor cutouts in ${path.relative(repoRoot, outputDir)}`);
