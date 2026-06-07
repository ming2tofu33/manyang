// 만양 해몽 내용 채점 하니스.
//   꿈세트 → (프로덕션 경로로) 해몽 생성 → LLM judge + 결정론 게이트로 rubric 채점 → 리포트.
//
// 실행: npm run rubric:check            (기본 꿈세트 전체)
//       npm run rubric:check -- "꿈1" "꿈2"   (직접 꿈 지정)
//
// 생성은 reasoning:low(빠름), 채점 judge는 reasoning:medium(더 깐깐하게)로 분리한다.
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { analyzeDreamWithLlm } from "../services/llm-dream-analysis";
import { analyzeDreamStructure } from "../services/structured-dream-analysis";
import { retrieveDreamEvidenceSet } from "../services/dream-rag-retriever";
import { createOpenAIResponsesProviderFromEnv, OpenAIResponsesProvider } from "../services/openai-responses-provider";
import { createOpenAIEmbeddingsProviderFromEnv } from "../services/openai-embeddings-provider";
import { loadDreamVectorIndex, type DreamVectorIndex } from "../services/dream-vector-index";
import {
  scoreDreamReadingWithRubric,
  type RubricEvidenceSymbol,
  type RubricResult,
} from "../services/dream-reading-rubric";

const scriptDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(scriptDir, "../../..");

function loadEnv(): void {
  const envPath = resolve(repoRoot, "frontend", ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const k = t.slice(0, i).trim();
    if (!process.env[k]) process.env[k] = t.slice(i + 1).trim();
  }
}

const DEFAULT_DREAMS = [
  "내 땅에 큰 구렁이와 뱀이 수십 마리 나왔어.",
  "돼지가 우리 집으로 들어왔어.",
  "맑은 강에서 커다란 잉어가 내 품으로 뛰어들었어.",
  "높은 곳에서 갑자기 떨어졌어.",
  "시험을 보는데 아무리 봐도 답을 모르겠더라.",
  "회사에서 발표하는데 목소리가 안 나왔어.",
  "장면은 흐릿한데 계속 불안하고 쫓기는 느낌만 남았어.",
  "친구랑 카페에서 그냥 수다 떨다가 깼어.",
];

function toEvidence(symbols: { label: string; evidence: { coreMeanings: string[]; lightReadings: string[]; shadowReadings: string[]; fortune?: unknown } }[]): RubricEvidenceSymbol[] {
  return symbols.map((m) => ({
    label: m.label,
    coreMeanings: m.evidence.coreMeanings,
    lightReadings: m.evidence.lightReadings,
    shadowReadings: m.evidence.shadowReadings,
    ...(m.evidence.fortune ? { fortune: m.evidence.fortune } : {}),
  }));
}

type CaseResult = {
  dreamText: string;
  confirmedLabels: string[];
  reading: { summary: string; interpretation: string; symbolReadings: { symbol: string; reading: string }[] };
  rubric: RubricResult;
};

function bar(score0to10: number): string {
  const n = Math.round(score0to10);
  return "█".repeat(n) + "░".repeat(10 - n);
}

function renderReport(results: CaseResult[]): string {
  const subs: Array<[string, (r: RubricResult) => number]> = [
    ["extraction.recall", (r) => r.groups.extraction.recall.score],
    ["extraction.precision", (r) => r.groups.extraction.precision.score],
    ["ownership.sceneBinding", (r) => r.groups.ownership.sceneBinding.score],
    ["ownership.nonGeneric", (r) => r.groups.ownership.nonGeneric.score],
    ["sense.coherence", (r) => r.groups.sense.coherence.score],
    ["resonance.warmth", (r) => r.groups.resonance.warmth.score],
    ["resonance.landsOnFeeling", (r) => r.groups.resonance.landsOnFeeling.score],
    ["delight.fortuneClarity", (r) => r.groups.delight.fortuneClarity.score],
    ["delight.folkFraming", (r) => r.groups.delight.folkFraming.score],
    ["depth.development", (r) => r.groups.depth.development.score],
    ["overall.gestalt", (r) => r.groups.overall.gestalt.score],
  ];
  const lines: string[] = ["# 만양 해몽 Rubric 채점 리포트", ""];

  const avgFinal = Math.round(results.reduce((a, r) => a + r.rubric.finalScore, 0) / results.length);
  lines.push(`- 케이스: ${results.length}개`);
  lines.push(`- 평균 최종점수: **${avgFinal}/100**`);
  lines.push("");
  lines.push("## sub-score 평균 (0-10)");
  for (const [name, get] of subs) {
    const avg = results.reduce((a, r) => a + get(r.rubric), 0) / results.length;
    lines.push(`- \`${name}\` ${bar(avg)} ${avg.toFixed(1)}`);
  }
  lines.push("");

  const issueCounts = new Map<string, number>();
  for (const r of results) for (const i of r.rubric.issues) issueCounts.set(i.type, (issueCounts.get(i.type) ?? 0) + 1);
  if (issueCounts.size > 0) {
    lines.push("## issue 플래그");
    for (const [type, n] of issueCounts) lines.push(`- \`${type}\`: ${n}건`);
    lines.push("");
  }

  const allMissed = new Map<string, number>();
  const allSpurious = new Map<string, number>();
  for (const r of results) {
    for (const s of r.rubric.groups.extraction.recall.missedSymbols) allMissed.set(s, (allMissed.get(s) ?? 0) + 1);
    for (const s of r.rubric.groups.extraction.precision.spuriousSymbols) allSpurious.set(s, (allSpurious.get(s) ?? 0) + 1);
  }
  const byCount = (m: Map<string, number>) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).map(([s, n]) => `${s}(${n})`).join(", ");
  if (allMissed.size > 0 || allSpurious.size > 0) {
    lines.push("## 추출 갭 (매처/백과 보강 타깃)");
    if (allMissed.size > 0) lines.push(`- 놓친 심볼: ${byCount(allMissed)}`);
    if (allSpurious.size > 0) lines.push(`- 헛 심볼: ${byCount(allSpurious)}`);
    lines.push("");
  }

  lines.push("## 케이스별 (최종점수 오름차순)");
  for (const r of [...results].sort((a, b) => a.rubric.finalScore - b.rubric.finalScore)) {
    lines.push(`### ${r.rubric.finalScore}/100 — "${r.dreamText}"`);
    lines.push(`- 근거 심볼: ${r.confirmedLabels.join(", ") || "없음"} | weighted=${r.rubric.weightedScore} raw=${r.rubric.rawScore}`);
    lines.push(`- 총평: ${r.rubric.verdict}`);
    if (r.rubric.issues.length > 0) {
      lines.push(`- ⚠️ issues: ${r.rubric.issues.map((i) => `${i.type}(${i.evidence})`).join(" / ")}`);
    }
    const missed = r.rubric.groups.extraction.recall.missedSymbols;
    const spurious = r.rubric.groups.extraction.precision.spuriousSymbols;
    if (missed.length > 0 || spurious.length > 0) {
      lines.push(`- 🔎 추출: 놓침[${missed.join(", ") || "-"}] / 헛심볼[${spurious.join(", ") || "-"}]`);
    }
    for (const [name, get] of subs) {
      const sub = name.split(".").reduce<any>((o, k) => o[k], r.rubric.groups);
      lines.push(`  - \`${name}\` ${get(r.rubric)} — ${sub.evidence}`);
    }
    lines.push(`- SUMMARY: ${r.reading.summary}`);
    lines.push(`- INTERP: ${r.reading.interpretation}`);
    lines.push("");
  }
  return lines.join("\n");
}

async function run(): Promise<void> {
  loadEnv();
  if (!process.env.MANYANG_ANALYSIS_MODE) process.env.MANYANG_ANALYSIS_MODE = "llm";

  const genProvider = createOpenAIResponsesProviderFromEnv(process.env);
  if (!genProvider) throw new Error("OpenAI provider not configured (check frontend/.env)");
  // judge는 더 깐깐하게 — reasoning medium.
  const judgeProvider = new OpenAIResponsesProvider({
    apiKey: process.env.OPENAI_API_KEY ?? "",
    model: process.env.MANYANG_OPENAI_MODEL ?? "gpt-5-mini",
    reasoningEffort: "medium",
  });
  const embeddingProvider = createOpenAIEmbeddingsProviderFromEnv(process.env) ?? undefined;
  let vectorIndex: DreamVectorIndex | undefined;
  const indexPath = resolve(repoRoot, "output", "rag", "dream-rag-ko.json");
  if (embeddingProvider && existsSync(indexPath)) vectorIndex = await loadDreamVectorIndex(indexPath);

  const dreams = process.argv.slice(2).length > 0 ? process.argv.slice(2) : DEFAULT_DREAMS;
  const results: CaseResult[] = [];

  for (const dreamText of dreams) {
    const structuredAnalysis = analyzeDreamStructure({ dreamText, locale: "ko" });
    const evidenceSet = retrieveDreamEvidenceSet({ dreamText, locale: "ko", structuredAnalysis, limit: 5 });
    const reading = await analyzeDreamWithLlm(
      { dreamText, locale: "ko" },
      { provider: genProvider, ...(embeddingProvider ? { embeddingProvider } : {}), ...(vectorIndex ? { vectorIndex } : {}), providerTimeoutMs: 45000 },
    );
    const rubric = await scoreDreamReadingWithRubric(judgeProvider, {
      dreamText,
      reading: { summary: reading.summary, interpretation: reading.interpretation, symbolReadings: reading.symbolReadings },
      confirmedEvidence: toEvidence(evidenceSet.confirmedEvidence),
      selectedFeelings: [],
      locale: "ko",
    });
    results.push({
      dreamText,
      confirmedLabels: evidenceSet.confirmedEvidence.map((m) => m.label),
      reading: { summary: reading.summary, interpretation: reading.interpretation, symbolReadings: reading.symbolReadings },
      rubric,
    });
    console.log(`[${rubric.finalScore}/100] ${rubric.issues.length ? "⚠️" : "  "} "${dreamText.slice(0, 26)}" — ${rubric.verdict.slice(0, 50)}`);
  }

  const outDir = resolve(repoRoot, "output", "eval");
  await mkdir(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const mdPath = resolve(outDir, `rubric-quality-${stamp}.md`);
  const jsonPath = resolve(outDir, `rubric-quality-${stamp}.json`);
  await writeFile(mdPath, renderReport(results), "utf8");
  await writeFile(jsonPath, JSON.stringify(results, null, 2), "utf8");
  console.log(`\n리포트: ${mdPath}`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
