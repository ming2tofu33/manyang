import fs from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const defaultQuality = 84;
const defaultEffort = 6;

function printUsage() {
  console.log(`Usage:
  node scripts/convert-to-webp.mjs --input <source.png> [--out <target.webp>] [--quality 84]
  node scripts/convert-to-webp.mjs --manifest <manifest.json>

Options:
  --input <path>       Source image path, resolved from the current working directory.
  --out <path>         Output WebP path. Defaults to source path with .webp extension.
  --quality <1-100>    WebP quality for lossy output. Default: ${defaultQuality}.
  --lossless           Use WebP lossless mode.
  --effort <0-6>       WebP encoder effort. Default: ${defaultEffort}.
  --manifest <path>    JSON manifest array with input/out/quality/lossless/effort fields.
  --dry-run            Print planned conversions without writing files.
  --help               Show this help.

Manifest example:
[
  {
    "input": "../ref/blackcat-home.png",
    "out": "public/manyang/backgrounds/home-black-cat.webp",
    "quality": 84
  }
]`);
}

function parseArgs(argv) {
  const options = {
    dryRun: false,
    lossless: false,
    quality: defaultQuality,
    effort: defaultEffort,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--lossless") {
      options.lossless = true;
      continue;
    }

    if (["--input", "--out", "--quality", "--effort", "--manifest"].includes(arg)) {
      const value = argv[index + 1];

      if (!value || value.startsWith("--")) {
        throw new Error(`${arg} requires a value.`);
      }

      const key = arg.slice(2);
      options[key] = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  return options;
}

function parseInteger(value, fieldName, min, max) {
  const parsed = Number.parseInt(String(value), 10);

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${fieldName} must be an integer from ${min} to ${max}.`);
  }

  return parsed;
}

function resolvePath(filePath) {
  return path.resolve(process.cwd(), filePath);
}

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KiB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
}

function getOutputPath(inputPath, outPath) {
  if (outPath) {
    return resolvePath(outPath);
  }

  const parsedPath = path.parse(inputPath);

  return path.join(parsedPath.dir, `${parsedPath.name}.webp`);
}

function normalizeJob(job, defaults = {}) {
  if (!job.input) {
    throw new Error("Each WebP conversion needs an input path.");
  }

  const inputPath = resolvePath(job.input);
  const outputPath = getOutputPath(inputPath, job.out);
  const lossless = Boolean(job.lossless ?? defaults.lossless);
  const quality = lossless
    ? undefined
    : parseInteger(job.quality ?? defaults.quality ?? defaultQuality, "quality", 1, 100);
  const effort = parseInteger(job.effort ?? defaults.effort ?? defaultEffort, "effort", 0, 6);

  return {
    input: job.input,
    out: job.out,
    inputPath,
    outputPath,
    lossless,
    quality,
    effort,
  };
}

async function loadJobs(options) {
  if (options.manifest) {
    const manifestPath = resolvePath(options.manifest);
    const manifestRaw = await fs.readFile(manifestPath, "utf8");
    const manifest = JSON.parse(manifestRaw);

    if (!Array.isArray(manifest)) {
      throw new Error("Manifest must be a JSON array.");
    }

    return manifest.map((job) =>
      normalizeJob(job, {
        quality: options.quality,
        lossless: options.lossless,
        effort: options.effort,
      }),
    );
  }

  if (!options.input) {
    throw new Error("Provide --input or --manifest.");
  }

  return [
    normalizeJob({
      input: options.input,
      out: options.out,
      quality: options.quality,
      lossless: options.lossless,
      effort: options.effort,
    }),
  ];
}

async function convertToWebp(job, dryRun) {
  const inputStat = await fs.stat(job.inputPath);
  const outputRelative = path.relative(process.cwd(), job.outputPath);
  const inputRelative = path.relative(process.cwd(), job.inputPath);
  const image = sharp(job.inputPath);
  const metadata = await image.metadata();
  const webpOptions = job.lossless
    ? { lossless: true, effort: job.effort }
    : { quality: job.quality, effort: job.effort };

  if (dryRun) {
    return {
      inputRelative,
      outputRelative,
      width: metadata.width,
      height: metadata.height,
      inputBytes: inputStat.size,
      outputBytes: null,
      dryRun: true,
      warning: null,
    };
  }

  await fs.mkdir(path.dirname(job.outputPath), { recursive: true });
  await image.webp(webpOptions).toFile(job.outputPath);

  const outputStat = await fs.stat(job.outputPath);
  const warning =
    outputStat.size >= inputStat.size
      ? "warning: WebP output is not smaller than the source"
      : null;

  return {
    inputRelative,
    outputRelative,
    width: metadata.width,
    height: metadata.height,
    inputBytes: inputStat.size,
    outputBytes: outputStat.size,
    dryRun: false,
    warning,
  };
}

function printResult(result) {
  const sizeText = `${result.width ?? "?"}x${result.height ?? "?"}`;
  const outputSize = result.dryRun ? "dry-run" : formatBytes(result.outputBytes);
  const savings =
    result.outputBytes === null
      ? ""
      : `, saved ${((1 - result.outputBytes / result.inputBytes) * 100).toFixed(1)}%`;

  console.log(
    `${result.inputRelative} -> ${result.outputRelative} | ${sizeText} | ${formatBytes(
      result.inputBytes,
    )} -> ${outputSize}${savings}`,
  );

  if (result.warning) {
    console.warn(result.warning);
  }
}

try {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    process.exit(0);
  }

  const jobs = await loadJobs(options);
  const results = [];

  for (const job of jobs) {
    results.push(await convertToWebp(job, options.dryRun));
  }

  for (const result of results) {
    printResult(result);
  }

  console.log(`Processed ${results.length} WebP conversion${results.length === 1 ? "" : "s"}.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  printUsage();
  process.exit(1);
}
