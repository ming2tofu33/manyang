import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { loadCachedDreamVectorIndex } from "../services/dream-vector-index";
import { retrieveDreamEvidenceSetWithVectorIndex } from "../services/dream-rag-retriever";
import { createOpenAIEmbeddingsProviderFromEnv } from "../services/openai-embeddings-provider";
import { createKoreanLemmatizerFromEnv } from "../services/http-korean-lemmatizer";
import { createEnglishLemmatizer } from "../services/english-lemmatizer";
import { safeLemmatize } from "../services/korean-lemmatizer";
import { evaluateRetrieval, RETRIEVAL_EVAL_CASES } from "../services/retrieval-eval";
import { loadEnvFile } from "./build-dream-rag-vector-index";
import type { SupportedLocale } from "../contracts/symbol-encyclopedia";

/**
 * (b)+(c): 렉시컬 baseline 대비 하이브리드(렉시컬+벡터) retrieval recall을 측정한다.
 * 사용: npm --prefix backend run eval:retrieval:vector
 *   - ../frontend/.env 의 OPENAI_API_KEY 사용, ../output/rag/dream-rag-{ko,en}.json 인덱스 로드.
 */

const KO_INDEX = "../output/rag/dream-rag-ko.json";
const EN_INDEX = "../output/rag/dream-rag-en.json";

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

async function main(): Promise<void> {
  loadEnvFile(resolve("../frontend/.env"), process.env);
  const embeddingProvider = createOpenAIEmbeddingsProviderFromEnv({
    ...process.env,
    MANYANG_RAG_EMBEDDINGS_MODE: process.env.MANYANG_RAG_EMBEDDINGS_MODE ?? "openai",
  });
  if (!embeddingProvider) {
    throw new Error("Embedding provider not configured (check ../frontend/.env)");
  }

  const indexByLocale: Record<SupportedLocale, Awaited<ReturnType<typeof loadCachedDreamVectorIndex>>> = {
    ko: await loadCachedDreamVectorIndex(resolve(KO_INDEX)),
    en: await loadCachedDreamVectorIndex(resolve(EN_INDEX)),
  };

  // 라이브 읽기 경로와 동일하게 형태소 lemma를 매처에 공급한다(ko=Kiwi HTTP, en=로컬 영어 스테머).
  const koLemmatizer = createKoreanLemmatizerFromEnv(process.env);
  const enLemmatizer = createEnglishLemmatizer();
  console.log("ko lemmatizer configured:", !!koLemmatizer);

  const k = 5;
  const lexical = evaluateRetrieval(RETRIEVAL_EVAL_CASES, k);

  // 하이브리드: confirmed + candidate evidence 전체를 검색 결과로 본다 (LLM이 받는 grounding).
  const rows = [] as Array<{ id: string; tag: string; expected: string[]; lexRecall: number; hybRecall: number; hybRetrieved: string[]; hybPrecision: number }>;
  let totalExpected = 0;
  let hybHits = 0;
  let precisionSum = 0;
  const byTag: Record<string, { count: number; lex: number; hyb: number }> = {};

  for (const testCase of RETRIEVAL_EVAL_CASES) {
    const lemmas = await safeLemmatize(testCase.locale === "ko" ? koLemmatizer : enLemmatizer, testCase.dreamText);
    const set = await retrieveDreamEvidenceSetWithVectorIndex({
      dreamText: testCase.dreamText,
      locale: testCase.locale,
      limit: k,
      vectorIndex: indexByLocale[testCase.locale],
      embeddingProvider,
      ...(lemmas.length > 0 ? { lemmas } : {}),
    });
    const retrieved = [...new Set([...set.confirmedEvidence, ...set.candidateEvidence].map((m) => m.entryId))];
    const retrievedSet = new Set(retrieved);
    const hits = testCase.expected.filter((id) => retrievedSet.has(id));
    const hybRecall = testCase.expected.length === 0 ? 1 : hits.length / testCase.expected.length;
    const hybPrecision = retrieved.length === 0 ? 0 : hits.length / retrieved.length;
    const lexRecall = lexical.cases.find((c) => c.id === testCase.id)?.recall ?? 0;

    totalExpected += testCase.expected.length;
    hybHits += hits.length;
    precisionSum += hybPrecision;
    const bucket = (byTag[testCase.tag] ??= { count: 0, lex: 0, hyb: 0 });
    bucket.count += 1;
    bucket.lex += lexRecall;
    bucket.hyb += hybRecall;

    rows.push({ id: testCase.id, tag: testCase.tag, expected: testCase.expected, lexRecall: round(lexRecall), hybRecall: round(hybRecall), hybRetrieved: retrieved, hybPrecision: round(hybPrecision) });
  }

  const hybMicro = round(hybHits / totalExpected);
  const hybMacro = round(rows.reduce((s, r) => s + r.hybRecall, 0) / rows.length);
  const hybPrecisionMacro = round(precisionSum / rows.length);

  const lines: string[] = [];
  lines.push(`# Retrieval Eval — Lexical vs Hybrid (k=${k}, vector=text-embedding-3-small)`);
  lines.push("");
  lines.push(`- lexical : micro ${lexical.aggregate.microRecall} / macro ${lexical.aggregate.macroRecall} / precision ${lexical.aggregate.macroPrecision}`);
  lines.push(`- hybrid  : micro ${hybMicro} / macro ${hybMacro} / precision ${hybPrecisionMacro}`);
  lines.push("");
  lines.push("## By tag (macro recall: lexical → hybrid)");
  lines.push("");
  lines.push("| tag | count | lexical | hybrid |");
  lines.push("| --- | --- | --- | --- |");
  for (const [tag, v] of Object.entries(byTag)) {
    lines.push(`| ${tag} | ${v.count} | ${round(v.lex / v.count)} | ${round(v.hyb / v.count)} |`);
  }
  lines.push("");
  lines.push("## Cases improved by hybrid (lexical < hybrid)");
  lines.push("");
  lines.push("| case | tag | lex | hyb | hybrid retrieved |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const r of rows) {
    if (r.hybRecall > r.lexRecall) {
      lines.push(`| ${r.id} | ${r.tag} | ${r.lexRecall} | ${r.hybRecall} | ${r.hybRetrieved.join(", ")} |`);
    }
  }
  lines.push("");
  lines.push("## Cases hybrid still misses (hybrid recall < 1)");
  lines.push("");
  for (const r of rows) {
    if (r.hybRecall < 1) {
      const missed = r.expected.filter((id) => !r.hybRetrieved.includes(id));
      lines.push(`- ${r.id} (${r.tag}): missed ${missed.join(", ")}`);
    }
  }

  const markdown = lines.join("\n");
  mkdirSync("output/eval", { recursive: true });
  writeFileSync("output/eval/retrieval-eval-hybrid.md", markdown + "\n", "utf8");
  console.log(markdown);
  console.log("\nsaved -> output/eval/retrieval-eval-hybrid.md");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
