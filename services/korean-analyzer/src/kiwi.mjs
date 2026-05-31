import { readFileSync, readdirSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

// wasm 엔진은 kiwi-nlp 패키지에 포함. 모델(사전)은 scripts/fetch-model.mjs로 받아 models/에 둔다.
const WASM_PATH =
  process.env.KIWI_WASM_PATH ?? resolve(here, "../node_modules/kiwi-nlp/dist/kiwi-wasm.wasm");
const MODEL_DIR = process.env.KIWI_MODEL_DIR ?? resolve(here, "../models/cong/base");

// 매칭에 쓸 '내용 형태소'만 남긴다: 명사(N*)·용언(V*: 동사/형용사)·어근(XR)·외국어(SL).
// 조사(J*)·어미(E*)·기호 등은 버린다. 어간(기본형)이 나오므로 활용형이 정규화된다.
const CONTENT_TAG = /^(N|V|XR|SL)/;

export async function loadKiwiLemmatizer() {
  const { KiwiBuilder } = await import("kiwi-nlp");

  const modelFiles = {};
  for (const fileName of readdirSync(MODEL_DIR)) {
    modelFiles[basename(fileName)] = new Uint8Array(readFileSync(resolve(MODEL_DIR, fileName)));
  }

  const builder = await KiwiBuilder.create(WASM_PATH);
  const kiwi = await builder.build({ modelFiles, modelType: "cong" });

  return {
    /** 문장 -> 내용 형태소 어간 목록(중복 제거). */
    lemmatize(text) {
      const tokens = kiwi.tokenize(String(text ?? ""));
      const stems = [];
      for (const token of tokens) {
        if (CONTENT_TAG.test(token.tag) && typeof token.str === "string" && token.str.length > 0) {
          stems.push(token.str);
        }
      }
      return [...new Set(stems)];
    },
    version: () => builder.version(),
  };
}
