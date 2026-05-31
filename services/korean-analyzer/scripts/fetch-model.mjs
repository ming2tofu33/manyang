// Kiwi 모델(사전)을 받아 models/ 에 푼다. kiwi-nlp 0.23.0과 같은 버전(v0.23.0)을 쓴다.
//   node scripts/fetch-model.mjs
import { createWriteStream } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const MODEL_VERSION = process.env.KIWI_MODEL_VERSION ?? "v0.23.0";
const url = `https://github.com/bab2min/Kiwi/releases/download/${MODEL_VERSION}/kiwi_model_${MODEL_VERSION}_base.tgz`;
const tgzPath = resolve(root, "model.tgz");
const modelsDir = resolve(root, "models");

async function main() {
  console.log(`Downloading ${url}`);
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download model: ${response.status}`);
  }
  await pipeline(response.body, createWriteStream(tgzPath));

  await mkdir(modelsDir, { recursive: true });
  const result = spawnSync("tar", ["xzf", tgzPath, "-C", modelsDir, "--strip-components=1"], {
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error("tar extraction failed (is `tar` available?)");
  }
  await rm(tgzPath, { force: true });
  console.log(`Model ready under ${modelsDir} (cong/base/...).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
