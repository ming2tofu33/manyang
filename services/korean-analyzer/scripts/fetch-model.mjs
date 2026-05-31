// Kiwi 모델(사전)을 받아 models/ 에 푼다. kiwi-nlp 0.23.0과 같은 버전(v0.23.0)을 쓴다.
//   node scripts/fetch-model.mjs
// 시스템 tar에 의존하지 않도록 tar 패키지로 추출(로컬 Windows·Railway Linux 모두 동작).
import { existsSync, readdirSync } from "node:fs";
import { writeFile, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as tar from "tar";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const MODEL_VERSION = process.env.KIWI_MODEL_VERSION ?? "v0.23.0";
const url = `https://github.com/bab2min/Kiwi/releases/download/${MODEL_VERSION}/kiwi_model_${MODEL_VERSION}_base.tgz`;
const tgzPath = resolve(root, "model.tgz");
// kiwi.mjs의 KIWI_MODEL_DIR 기본값과 같은 경로. 이미 있으면 다시 받지 않는다(멱등).
const modelDir = resolve(root, "models", "cong", "base");

async function main() {
  if (existsSync(modelDir) && readdirSync(modelDir).length > 0) {
    console.log(`Model already present at ${modelDir}; skipping download.`);
    return;
  }

  console.log(`Downloading ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download model: ${response.status}`);
  }
  await writeFile(tgzPath, Buffer.from(await response.arrayBuffer()));

  // tgz 최상위가 models/ 이므로 root에 풀면 root/models/cong/base 가 된다.
  await tar.x({ file: tgzPath, cwd: root });
  await rm(tgzPath, { force: true });
  console.log(`Model ready under ${resolve(root, "models")} (cong/base/...).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
