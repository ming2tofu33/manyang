import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..", "..");
const sourceDir = path.join(repoRoot, "ref", "tarot cards");
const outputDir = path.join(repoRoot, "frontend", "public", "manyang", "tarot", "major");

const cards = [
  ["00_0_the fool.png", "00-the-fool.png"],
  ["01_I_the magician.png", "01-the-magician.png"],
  ["02_the high priestess.png", "02-the-high-priestess.png"],
  ["03_III_the empress.png", "03-the-empress.png"],
  ["04_IV_the emperor.png", "04-the-emperor.png"],
  ["05_V_the hierophant.png", "05-the-hierophant.png"],
  ["06_VI_the lovers.png", "06-the-lovers.png"],
  ["07_VII_the chariot.png", "07-the-chariot.png"],
  ["08_VIII_strength.png", "08-strength.png"],
  ["09_IX_the hermit.png", "09-the-hermit.png"],
  ["10_X_wheel of fortune.png", "10-wheel-of-fortune.png"],
  ["11_XI_justice.png", "11-justice.png"],
  ["12_XII_the hanged man.png", "12-the-hanged-man.png"],
  ["13_XIII_death.png", "13-death.png"],
  ["14_XIV_temperance.png", "14-temperance.png"],
  ["15_XV_the devil.png", "15-the-devil.png"],
  ["16_XVI_the tower.png", "16-the-tower.png"],
  ["17_XVII_the star.png", "17-the-star.png"],
  ["18_XVIII_the moon.png", "18-the-moon.png"],
  ["19_XIX_the sun.png", "19-the-sun.png"],
  ["20_XX_judgement.png", "20-judgement.png"],
  ["21_XXI_the world.png", "21-the-world.png"],
];

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

async function createCutout(sourceFileName, outputFileName) {
  const inputPath = path.join(sourceDir, sourceFileName);
  const outputPath = path.join(outputDir, outputFileName);
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
      `${sourceFileName} produced an unexpected transparent area: ${(transparentRatio * 100).toFixed(2)}%`,
    );
  }

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
    outputFileName,
    width: info.width,
    height: info.height,
    transparentRatio,
  };
}

await fs.mkdir(outputDir, { recursive: true });

const results = [];

for (const [sourceFileName, outputFileName] of cards) {
  results.push(await createCutout(sourceFileName, outputFileName));
}

for (const result of results) {
  const percent = (result.transparentRatio * 100).toFixed(2).padStart(5, " ");
  console.log(`${result.outputFileName} ${result.width}x${result.height} transparent=${percent}%`);
}

console.log(`Generated ${results.length} tarot major cutouts in ${path.relative(repoRoot, outputDir)}`);
