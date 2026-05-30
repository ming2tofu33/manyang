import { describe, expect, test } from "vitest";

import type { DreamAnalysisRequest } from "../src/contracts/dream";
import { analyzeDream } from "../src/services/mock-analysis";
import type { DreamEmbeddingProvider } from "../src/services/dream-embedding-provider";
import { buildDreamRagChunks } from "../src/services/dream-rag-chunks";
import {
  createDreamReadingQualityMarkdown,
  dreamReadingQualityCases,
  runDreamReadingQualityEval,
} from "../src/services/dream-reading-quality-eval";
import type { DreamReadingLlmProvider, DreamReadingLlmRequest } from "../src/services/llm-provider";
import { createDreamVectorIndex } from "../src/services/dream-vector-index";

class PromptAwareProvider implements DreamReadingLlmProvider {
  readonly requests: DreamReadingLlmRequest[] = [];

  async generateJson(request: DreamReadingLlmRequest): Promise<unknown> {
    this.requests.push(request);

    const payload = JSON.parse(request.input) as {
      locale?: "ko" | "en";
      request?: DreamAnalysisRequest;
      retrievedSymbolEvidence?: Array<{ label?: string }>;
      deterministicBaseline?: {
        symbols?: string[];
        symbolReadings?: Array<{ symbol: string; reading: string }>;
      };
    };
    const locale = payload.locale ?? "ko";
    const evidenceSymbols = (payload.retrievedSymbolEvidence ?? [])
      .map((evidence) => evidence.label)
      .filter((label): label is string => Boolean(label));
    const symbolList = evidenceSymbols.length > 0 ? evidenceSymbols : payload.deterministicBaseline?.symbols ?? [];
    const symbol = symbolList[0] ?? "꿈";
    const dreamText = payload.request?.dreamText ?? "";
    const details = dreamText
      .split(/[ ,.?!。！？,]+/u)
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 5)
      .join(locale === "en" ? ", " : ", ");

    return {
      summary:
        locale === "en"
          ? `A grounded reading around ${symbol} and the remembered scene.`
          : `${symbol} 장면을 중심으로 읽는 꿈입니다.`,
      interpretation:
        locale === "en"
          ? `The reading stays with ${details}. ${symbol} is read only through the retrieved evidence, while the answer keeps the scene specific and avoids fixed predictions.`
          : `${details} 장면을 먼저 봅니다. ${symbol}은 검색된 근거 안에서만 읽고, 단정적인 예언보다 지금 마음에 남은 흐름을 구체적으로 정리합니다.`,
      symbolReadings: symbolList.slice(0, 5).map((readingSymbol) => ({
        symbol: readingSymbol,
        reading:
          locale === "en"
            ? `${readingSymbol} matters here because it is tied to the concrete scene rather than a generic meaning.`
            : `${readingSymbol}은 일반론이 아니라 꿈에 나온 구체적인 장면과 함께 볼 때 의미가 생깁니다.`,
      })),
      smallPrescription:
        locale === "en"
          ? "Write one sentence about the strongest image that stayed with you."
          : "가장 선명하게 남은 장면 하나를 한 문장으로 적어보세요.",
      card: {
        name: locale === "en" ? `Card of ${symbol}` : `${symbol}의 카드`,
        type: "soft_moon",
        keywords: [symbol, "scene", "grounded"],
        summary: locale === "en" ? "The scene is read with evidence." : "장면을 근거와 함께 읽습니다.",
        message: locale === "en" ? "Stay with what was actually shown." : "실제로 나온 장면에 머뭅니다.",
        theme: "grounding",
      },
    };
  }
}

class NeverResolvingProvider implements DreamReadingLlmProvider {
  async generateJson(): Promise<unknown> {
    return new Promise(() => undefined);
  }
}

class FakeEmbeddingProvider implements DreamEmbeddingProvider {
  readonly model = "fake-embedding";

  async embedTexts(texts: string[]): Promise<number[][]> {
    return texts.map(() => [1, 0]);
  }
}

describe("dream reading quality eval harness", () => {
  test("defines a fixed live quality set with required coverage", () => {
    expect(dreamReadingQualityCases.length).toBeGreaterThanOrEqual(15);
    expect(dreamReadingQualityCases.length).toBeLessThanOrEqual(20);
    expect(new Set(dreamReadingQualityCases.map((testCase) => testCase.id)).size).toBe(dreamReadingQualityCases.length);
    expect(dreamReadingQualityCases.flatMap((testCase) => testCase.qualityFocus)).toEqual(
      expect.arrayContaining(["specificity", "safety", "personaDifference", "ragGrounding", "timeoutFallback"]),
    );
    expect(dreamReadingQualityCases.some((testCase) => testCase.request.locale === "en")).toBe(true);
    expect(dreamReadingQualityCases.some((testCase) => testCase.request.locale === "ko")).toBe(true);
    expect(dreamReadingQualityCases.some((testCase) => testCase.personaCompareGroupId)).toBe(true);
  });

  test("defines RAG candidate boundary and promotion regression cases", () => {
    const candidateCase = dreamReadingQualityCases.find((testCase) => testCase.id === "en_rag_candidate_snake_hospital");
    const promotionCase = dreamReadingQualityCases.find((testCase) => testCase.id === "en_rag_promotion_train_path");
    const sensitiveGuardCase = dreamReadingQualityCases.find((testCase) => testCase.id === "en_rag_sensitive_vector_guard");

    expect(candidateCase).toMatchObject({
      expectedSymbols: expect.arrayContaining(["Snake"]),
      forbiddenSymbols: expect.arrayContaining(["Hospital"]),
      qualityFocus: expect.arrayContaining(["ragCandidateBoundary"]),
    });
    expect(promotionCase).toMatchObject({
      expectedSymbols: expect.arrayContaining(["Train"]),
      qualityFocus: expect.arrayContaining(["ragPromotion"]),
    });
    expect(sensitiveGuardCase).toMatchObject({
      forbiddenSymbols: expect.arrayContaining(["Hospital"]),
      qualityFocus: expect.arrayContaining(["ragCandidateBoundary"]),
    });
  });

  test("evaluates RAG candidate boundaries and semantic-vector promotion", async () => {
    const candidateCase = dreamReadingQualityCases.find((testCase) => testCase.id === "en_rag_candidate_snake_hospital");
    const promotionCase = dreamReadingQualityCases.find((testCase) => testCase.id === "en_rag_promotion_train_path");

    expect(candidateCase).toBeDefined();
    expect(promotionCase).toBeDefined();

    const candidateReport = await runDreamReadingQualityEval({
      cases: [candidateCase!],
      provider: new PromptAwareProvider(),
      generatedAt: "2026-05-30T00:00:00.000Z",
      providerTimeoutMs: 100,
    });
    const candidateResult = candidateReport.comparisons[0]?.after;

    expect(candidateResult?.metrics.rag.expectedSymbolHits).toContain("Snake");
    expect(candidateResult?.metrics.rag.forbiddenSymbolHits).toEqual([]);
    expect(candidateResult?.criteria.find((criterion) => criterion.criterion === "ragCandidateBoundary")?.status).toBe("pass");

    const trainChunk = buildDreamRagChunks("en").find((chunk) => chunk.chunkId === "train:en:searchText")!;
    const seaChunk = buildDreamRagChunks("en").find((chunk) => chunk.chunkId === "sea:en:searchText")!;
    const vectorIndex = createDreamVectorIndex({
      locale: "en",
      embeddingModel: "fake-embedding",
      items: [
        { chunk: trainChunk, embedding: [1, 0] },
        { chunk: seaChunk, embedding: [0, 1] },
      ],
    });

    const promotionReport = await runDreamReadingQualityEval({
      cases: [promotionCase!],
      provider: new PromptAwareProvider(),
      generatedAt: "2026-05-30T00:00:00.000Z",
      providerTimeoutMs: 100,
      analysisOptions: {
        vectorIndex,
        embeddingProvider: new FakeEmbeddingProvider(),
      },
    });
    const promotionResult = promotionReport.comparisons[0]?.after;

    expect(promotionResult?.metrics.rag.expectedSymbolHits).toContain("Train");
    expect(promotionResult?.metrics.rag.forbiddenSymbolHits).toEqual([]);
    expect(promotionResult?.criteria.find((criterion) => criterion.criterion === "ragPromotion")?.status).toBe("pass");
  });

  test("runs before/after evaluation and renders a markdown report", async () => {
    const provider = new PromptAwareProvider();
    const cases = dreamReadingQualityCases.slice(0, 4);
    const beforeByCaseId = Object.fromEntries(
      cases.map((testCase) => [testCase.id, analyzeDream(testCase.request)]),
    );

    const report = await runDreamReadingQualityEval({
      cases,
      provider,
      beforeByCaseId,
      generatedAt: "2026-05-30T00:00:00.000Z",
      providerTimeoutMs: 100,
    });
    const markdown = createDreamReadingQualityMarkdown(report);

    expect(provider.requests).toHaveLength(cases.length);
    expect(report.generatedAt).toBe("2026-05-30T00:00:00.000Z");
    expect(report.summary.totalCases).toBe(cases.length);
    expect(report.comparisons[0]?.before).toBeDefined();
    expect(report.comparisons[0]?.after.metrics.specificity.expectedDetailHitCount).toBeGreaterThan(0);
    expect(report.comparisons[0]?.after.metrics.rag.expectedSymbolHitCount).toBeGreaterThan(0);
    expect(report.personaComparisons.length).toBeGreaterThan(0);
    expect(markdown).toContain("## Quality Summary");
    expect(markdown).toContain("Specificity");
    expect(markdown).toContain("RAG Grounding");
    expect(markdown).toContain("Persona Difference");
    expect(markdown).toContain("Timeout Fallback");
  });

  test("records timeout fallback as a quality signal", async () => {
    const timeoutCase = dreamReadingQualityCases.find((testCase) =>
      testCase.qualityFocus.includes("timeoutFallback"),
    );

    expect(timeoutCase).toBeDefined();

    const report = await runDreamReadingQualityEval({
      cases: [timeoutCase!],
      provider: new NeverResolvingProvider(),
      generatedAt: "2026-05-30T00:00:00.000Z",
      providerTimeoutMs: 5,
    });

    expect(report.comparisons[0]?.after.metrics.fallback.fallbackUsed).toBe(true);
    expect(report.comparisons[0]?.after.metrics.fallback.timeoutFallbackUsed).toBe(true);
    expect(report.comparisons[0]?.after.providerErrors.join(" ")).toContain("timed out");
    expect(report.summary.timeoutFallbackCount).toBe(1);
  });
});
