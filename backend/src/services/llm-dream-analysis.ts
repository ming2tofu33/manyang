import type { DreamAnalysisRequest, DreamAnalysisResponse, DreamCardResponse } from "../contracts/dream";
import {
  buildDreamReadingPrompt,
  DREAM_READING_DRAFT_JSON_SCHEMA,
  DREAM_READING_DRAFT_SCHEMA_NAME,
} from "./dream-reading-prompt";
import { LlmProviderTimeoutError, type DreamReadingLlmProvider, type DreamReadingLlmRequest } from "./llm-provider";
import { analyzeDreamSafetyPolicy, applySafetyPolicyToResponse } from "./dream-safety-policy";
import { buildEvidenceGate, isVerifiedSymbolLabel, type EvidenceGateResult } from "./evidence-gate";
import { analyzeDream } from "./mock-analysis";
import {
  retrieveDreamEvidenceSet,
  retrieveDreamEvidenceSetWithVectorIndex,
} from "./dream-rag-retriever";
import type { DreamEmbeddingProvider } from "./dream-embedding-provider";
import type { DreamVectorIndex } from "./dream-vector-index";
import { analyzeDreamStructure } from "./structured-dream-analysis";
import { safeLemmatize, type KoreanLemmatizer } from "./korean-lemmatizer";

export type AnalyzeDreamWithLlmOptions = {
  provider?: DreamReadingLlmProvider;
  model?: string;
  providerTimeoutMs?: number;
  embeddingProvider?: DreamEmbeddingProvider;
  vectorIndex?: DreamVectorIndex;
  /** 한국어 형태소 분석 창구. 없으면 기존 어휘 매칭으로 폴백. */
  lemmatizer?: KoreanLemmatizer;
  onProviderError?: (error: unknown) => void;
};

export type DreamReadingUnavailableReason = "provider_missing" | "timeout" | "invalid_response" | "provider_error";

export type DreamReadingResult =
  | {
      status: "ok";
      response: DreamAnalysisResponse;
    }
  | {
      status: "unavailable";
      reason: DreamReadingUnavailableReason;
      retryable: boolean;
      safetyNotice?: string;
    };

export const DEFAULT_LLM_PROVIDER_TIMEOUT_MS = 25_000;

type DreamReadingDraft = {
  summary: string;
  interpretation: string;
  symbolReadings: {
    symbol: string;
    reading: string;
  }[];
  smallPrescription: string;
  card: DreamCardResponse;
};

class InvalidDreamReadingDraftError extends Error {
  constructor() {
    super("LLM provider returned an invalid dream reading draft");
    this.name = "InvalidDreamReadingDraftError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanString(value: unknown, maxLength = 1200): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  return trimmed.slice(0, maxLength);
}

function cleanStringArray(value: unknown, maxItems: number): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => cleanString(item, 80))
    .filter((item): item is string => Boolean(item))
    .slice(0, maxItems);
}

function parseCard(value: unknown): DreamCardResponse | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const name = cleanString(value.name, 80);
  const type = cleanString(value.type, 40);
  const keywords = cleanStringArray(value.keywords, 4);
  const summary = cleanString(value.summary, 180);
  const message = cleanString(value.message, 220);
  const theme = cleanString(value.theme, 80);

  if (!name || !type || keywords.length === 0 || !summary || !message || !theme) {
    return undefined;
  }

  return { name, type, keywords, summary, message, theme };
}

function parseSymbolReadings(value: unknown): DreamReadingDraft["symbolReadings"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .flatMap((item) => {
      if (!isRecord(item)) {
        return [];
      }

      const symbol = cleanString(item.symbol, 80);
      const reading = cleanString(item.reading, 320);

      return symbol && reading ? [{ symbol, reading }] : [];
    })
    .slice(0, 5);
}

function parseDreamReadingDraft(value: unknown): DreamReadingDraft | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const summary = cleanString(value.summary, 180);
  const interpretation = cleanString(value.interpretation, 1400);
  const symbolReadings = parseSymbolReadings(value.symbolReadings);
  const smallPrescription = cleanString(value.smallPrescription, 260);
  const card = parseCard(value.card);

  if (!summary || !interpretation || symbolReadings.length === 0 || !smallPrescription || !card) {
    return undefined;
  }

  return {
    summary,
    interpretation,
    symbolReadings,
    smallPrescription,
    card,
  };
}

function filterSymbolReadings(
  baseline: DreamAnalysisResponse,
  draft: DreamReadingDraft,
  evidenceGate: EvidenceGateResult,
): DreamReadingDraft["symbolReadings"] {
  const verifiedReadings = draft.symbolReadings.filter((reading) => isVerifiedSymbolLabel(reading.symbol, evidenceGate));

  return verifiedReadings.length > 0 ? verifiedReadings : baseline.symbolReadings;
}

function uniqueNonEmpty(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function textContainsTerm(text: string, term: string): boolean {
  const normalizedText = text.toLocaleLowerCase();
  const normalizedTerm = term.trim().toLocaleLowerCase();

  return Boolean(normalizedTerm) && normalizedText.includes(normalizedTerm);
}

const SCENE_ONLY_SYMBOLIC_INFERENCE_TERMS = [
  "meaning",
  "means",
  "symbol",
  "represents",
  "suggests",
  "indicates",
  "predicts",
  "prophecy",
  "omen",
  "points to",
  "reveals",
  "shows",
  "reflects",
  "뜻",
  "의미",
  "상징",
  "암시",
  "예지",
  "예고",
  "나타내",
  "보여",
  "드러",
  "가리",
  "연결",
  "읽",
  "소진",
  "에너지",
  "빠져나가",
];

function sceneOnlySymbolicTermsInSentence(sentence: string, evidenceGate: EvidenceGateResult): string[] {
  const lowerSentence = sentence.toLocaleLowerCase();

  if (!SCENE_ONLY_SYMBOLIC_INFERENCE_TERMS.some((marker) => lowerSentence.includes(marker))) {
    return [];
  }

  return evidenceGate.evidenceRules.sceneOnly.filter((term) => textContainsTerm(sentence, term));
}

function splitInterpretationSentences(interpretation: string): string[] {
  return interpretation.match(/[^.!?。！？\n]+[.!?。！？]?|\n+/gu) ?? [interpretation];
}

function buildLiteralSceneSentence(
  sceneOnlyTerms: string[],
  locale: DreamAnalysisRequest["locale"] = "ko",
): string {
  const visibleTerms = uniqueNonEmpty(sceneOnlyTerms).slice(0, 4);

  if (visibleTerms.length === 0) {
    return locale === "en"
      ? "Other vivid details are kept as literal dream details rather than evidence for a prediction, diagnosis, or guarantee."
      : "함께 나온 다른 세부 장면은 그대로의 장면으로 두고, 그 자체에 예언이나 진단의 의미를 붙이지 않습니다.";
  }

  return locale === "en"
    ? `Details such as ${visibleTerms.join(", ")} are kept visible as literal dream details, but they are not used as evidence for a prediction, diagnosis, or guarantee.`
    : `${visibleTerms.join(", ")} 같은 세부 장면은 꿈에 나온 그대로의 장면으로 언급하되, 그 자체에 예언이나 진단의 의미를 붙이지 않습니다.`;
}

function scrubSceneOnlySymbolicInference(
  interpretation: string,
  evidenceGate: EvidenceGateResult,
  locale: DreamAnalysisRequest["locale"] = "ko",
): { interpretation: string; changed: boolean } {
  const removedTerms: string[] = [];
  const keptSentences = splitInterpretationSentences(interpretation).filter((sentence) => {
    if (sentence.trim().length === 0) {
      return true;
    }

    const symbolicTerms = sceneOnlySymbolicTermsInSentence(sentence, evidenceGate);

    if (symbolicTerms.length === 0) {
      return true;
    }

    removedTerms.push(...symbolicTerms);
    return false;
  });

  if (removedTerms.length === 0) {
    return { interpretation, changed: false };
  }

  const keptText = keptSentences.join("").replace(/\s+/g, " ").trim();

  if (!keptText) {
    return { interpretation: "", changed: true };
  }

  return {
    interpretation: `${keptText} ${buildLiteralSceneSentence(removedTerms, locale)}`.trim(),
    changed: true,
  };
}

function buildEvidenceBoundedInterpretation(
  baseline: DreamAnalysisResponse,
  symbolReadings: DreamReadingDraft["symbolReadings"],
  locale: DreamAnalysisRequest["locale"] = "ko",
  evidenceGate?: EvidenceGateResult,
): string {
  const readings = symbolReadings.length > 0 ? symbolReadings : baseline.symbolReadings;
  const symbols = readings.map((reading) => reading.symbol).join(locale === "en" ? ", " : ", ");
  const readingText = readings
    .slice(0, 2)
    .map((reading) => reading.reading)
    .join(" ");
  const sceneOnlyTerms = uniqueNonEmpty(evidenceGate?.evidenceRules.sceneOnly ?? []).slice(0, 4);
  const literalSceneSentence = buildLiteralSceneSentence(sceneOnlyTerms, locale);

  if (locale === "en") {
    return [
      `The safest symbolic reading stays with the verified image${readings.length > 1 ? "s" : ""}: ${symbols}.`,
      readingText,
      literalSceneSentence,
    ]
      .filter(Boolean)
      .join(" ");
  }

  return [
    `가장 중심에 둘 수 있는 이미지는 ${symbols}입니다.`,
    readingText,
    literalSceneSentence,
  ]
    .filter(Boolean)
    .join(" ");
}

function mergeDraftIntoBaseline(
  baseline: DreamAnalysisResponse,
  draft: DreamReadingDraft,
  evidenceGate: EvidenceGateResult,
  locale: DreamAnalysisRequest["locale"] = "ko",
): DreamAnalysisResponse {
  const symbolReadings = filterSymbolReadings(baseline, draft, evidenceGate);
  const symbols = uniqueNonEmpty(symbolReadings.map((reading) => reading.symbol));
  const scrubbedInterpretation = scrubSceneOnlySymbolicInference(draft.interpretation, evidenceGate, locale);
  const interpretation =
    scrubbedInterpretation.changed && !scrubbedInterpretation.interpretation
      ? buildEvidenceBoundedInterpretation(baseline, symbolReadings, locale, evidenceGate)
      : scrubbedInterpretation.interpretation;

  return {
    ...baseline,
    symbols: symbols.length > 0 ? symbols : baseline.symbols,
    summary: draft.summary,
    interpretation,
    symbolReadings,
    smallPrescription: draft.smallPrescription,
    readingBasis: {
      ...baseline.readingBasis,
      usedSymbols: symbols.length > 0 ? symbols : baseline.readingBasis.usedSymbols,
    },
    card: draft.card,
  };
}

function normalizeProviderTimeoutMs(timeoutMs: number | undefined): number {
  if (typeof timeoutMs !== "number" || !Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return DEFAULT_LLM_PROVIDER_TIMEOUT_MS;
  }

  return Math.round(timeoutMs);
}

async function generateJsonWithTimeout(
  provider: DreamReadingLlmProvider,
  request: DreamReadingLlmRequest,
  timeoutMs: number,
): Promise<unknown> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      provider.generateJson(request),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new LlmProviderTimeoutError(timeoutMs)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

async function generateLlmDreamResponse(
  request: DreamAnalysisRequest,
  baseline: DreamAnalysisResponse,
  safetyPolicy: ReturnType<typeof analyzeDreamSafetyPolicy>,
  options: AnalyzeDreamWithLlmOptions,
): Promise<DreamAnalysisResponse> {
  if (!options.provider) {
    return applySafetyPolicyToResponse(baseline, safetyPolicy);
  }

  const locale = request.locale ?? "ko";
  // 해몽 시작 시 한 번 형태소 분석 창구에 물어보고(없으면 빈 배열로 폴백), 그 어간을 매처에 넘긴다.
  const lemmas = await safeLemmatize(options.lemmatizer, request.dreamText);
  const structuredAnalysis = analyzeDreamStructure({
    dreamText: request.dreamText,
    ...(request.dreamDate ? { dreamDate: request.dreamDate } : {}),
    ...(request.wakeMood ? { wakeMood: request.wakeMood } : {}),
    ...(request.dreamMood ? { dreamMood: request.dreamMood } : {}),
    ...(request.dreamAtmospheres ? { dreamAtmospheres: request.dreamAtmospheres } : {}),
    ...(request.dreamSensations ? { dreamSensations: request.dreamSensations } : {}),
    ...(request.dreamSensationOther ? { dreamSensationOther: request.dreamSensationOther } : {}),
    ...(lemmas.length > 0 ? { lemmas } : {}),
    locale,
  });
  const evidenceSet =
    options.embeddingProvider && options.vectorIndex
      ? await retrieveDreamEvidenceSetWithVectorIndex({
          dreamText: request.dreamText,
          locale,
          structuredAnalysis,
          limit: 5,
          embeddingProvider: options.embeddingProvider,
          vectorIndex: options.vectorIndex,
        })
      : retrieveDreamEvidenceSet({
          dreamText: request.dreamText,
          locale,
          structuredAnalysis,
          limit: 5,
        });
  const matches = evidenceSet.confirmedEvidence;
  const evidenceGate = buildEvidenceGate({
    structuredAnalysis,
    matches,
    candidateMatches: evidenceSet.candidateEvidence,
    safetyPolicy,
  });
  const prompt = buildDreamReadingPrompt({
    request,
    baseline,
    structuredAnalysis,
    matches,
    candidateMatches: evidenceSet.candidateEvidence,
    retrievalPolicy: evidenceSet.retrievalPolicy,
    safetyPolicy,
    evidenceGate,
  });
  const llmRequest = {
    instructions: prompt.instructions,
    input: prompt.input,
    schemaName: DREAM_READING_DRAFT_SCHEMA_NAME,
    jsonSchema: DREAM_READING_DRAFT_JSON_SCHEMA,
    timeoutMs: normalizeProviderTimeoutMs(options.providerTimeoutMs),
    ...(options.model ? { model: options.model } : {}),
  };
  const rawDraft = await generateJsonWithTimeout(options.provider, llmRequest, llmRequest.timeoutMs);
  const draft = parseDreamReadingDraft(rawDraft);

  if (!draft) {
    throw new InvalidDreamReadingDraftError();
  }

  return applySafetyPolicyToResponse(mergeDraftIntoBaseline(baseline, draft, evidenceGate, locale), safetyPolicy);
}

function classifyUnavailableError(error: unknown): Pick<Extract<DreamReadingResult, { status: "unavailable" }>, "reason" | "retryable"> {
  if (error instanceof LlmProviderTimeoutError) {
    return { reason: "timeout", retryable: true };
  }

  if (error instanceof InvalidDreamReadingDraftError) {
    return { reason: "invalid_response", retryable: true };
  }

  return { reason: "provider_error", retryable: true };
}

function createUnavailableResult(
  reason: DreamReadingUnavailableReason,
  retryable: boolean,
  safetyNotice?: string,
): Extract<DreamReadingResult, { status: "unavailable" }> {
  return {
    status: "unavailable",
    reason,
    retryable,
    ...(safetyNotice ? { safetyNotice } : {}),
  };
}

export async function analyzeDreamWithLlm(
  request: DreamAnalysisRequest,
  options: AnalyzeDreamWithLlmOptions = {},
): Promise<DreamAnalysisResponse> {
  const baseline = analyzeDream(request);
  const safetyPolicy = analyzeDreamSafetyPolicy(request);

  if (!options.provider) {
    return applySafetyPolicyToResponse(baseline, safetyPolicy);
  }

  try {
    return await generateLlmDreamResponse(request, baseline, safetyPolicy, options);
  } catch (error) {
    options.onProviderError?.(error);
    return applySafetyPolicyToResponse(baseline, safetyPolicy);
  }
}

export async function generateDreamReadingForUser(
  request: DreamAnalysisRequest,
  options: AnalyzeDreamWithLlmOptions = {},
): Promise<DreamReadingResult> {
  const baseline = analyzeDream(request);
  const safetyPolicy = analyzeDreamSafetyPolicy(request);
  const safetyAppliedBaseline = applySafetyPolicyToResponse(baseline, safetyPolicy);

  if (!options.provider) {
    return createUnavailableResult("provider_missing", false, safetyAppliedBaseline.safetyNotice);
  }

  try {
    return {
      status: "ok",
      response: await generateLlmDreamResponse(request, baseline, safetyPolicy, options),
    };
  } catch (error) {
    options.onProviderError?.(error);
    const unavailable = classifyUnavailableError(error);

    return createUnavailableResult(unavailable.reason, unavailable.retryable, safetyAppliedBaseline.safetyNotice);
  }
}
