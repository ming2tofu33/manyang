import {
  buildTarotReadingPrompt,
  TAROT_READING_DRAFT_JSON_SCHEMA,
  TAROT_READING_DRAFT_SCHEMA_NAME,
  type TarotReadingPosition,
  type TarotReadingPromptInput,
} from "./tarot-reading-prompt";
import { LlmProviderTimeoutError, type DreamReadingLlmProvider, type DreamReadingLlmRequest } from "./llm-provider";

export type TarotReadingInput = TarotReadingPromptInput;

export type TarotGeneratedCardReading = {
  position: TarotReadingPosition;
  heading: string;
  reading: string;
};

export type TarotGeneratedReading = {
  title: string;
  overview: string;
  keywords: string[];
  cardReadings: TarotGeneratedCardReading[];
};

export type TarotReadingUnavailableReason = "provider_missing" | "timeout" | "invalid_response" | "provider_error";

export type TarotReadingResult =
  | {
      status: "ok";
      reading: TarotGeneratedReading;
    }
  | {
      status: "unavailable";
      reason: TarotReadingUnavailableReason;
      retryable: boolean;
    };

export type GenerateTarotReadingOptions = {
  provider?: DreamReadingLlmProvider;
  model?: string;
  providerTimeoutMs?: number;
  onProviderError?: (error: unknown) => void;
};

const DEFAULT_TAROT_LLM_PROVIDER_TIMEOUT_MS = 25_000;

class InvalidTarotReadingDraftError extends Error {
  constructor() {
    super("LLM provider returned an invalid tarot reading draft");
    this.name = "InvalidTarotReadingDraftError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const trailingLlmArtifactPatterns = [
  /\s*[}\])]{2,}\s*(?:PMID|PMCID|DOI|ID)?:?[}\])]*\s*$/iu,
  /\s*(?:PMID|PMCID):?[}\])]*\s*$/iu,
  /\s*[}\])]{2,}\s*$/u,
] as const;

const promptInternalFieldNamePattern =
  /\b(?:cardMessage|cardReadings|dailyFlow|outputContract|readingScene|reflectionQuestion|selectedMeaning|smallAction|symbolMeanings|visualSymbols)\b/iu;

const displayKeywordSpacingByCompactValue = new Map([
  ["새출발", "새 출발"],
  ["억눌린감정", "억눌린 감정"],
  ["희망의단서", "희망의 단서"],
]);
const naturalKeywordByAwkwardCompactValue = new Map([
  ["불씨의흥분", "시작의 불씨"],
  ["가능성의흥분", "새 가능성"],
  ["지속되는흥분", "남은 의욕"],
  ["계속되는흥분", "남은 의욕"],
]);
const generatedCardReadingHeadingByPosition = {
  today: "오늘의 리딩",
  situation: "지금 드러난 조건",
  flow: "이어지는 국면",
  advice: "판단의 기준",
} satisfies Record<TarotReadingPosition, string>;

function getGeneratedCardReadingHeading(position: TarotReadingPosition): string {
  return generatedCardReadingHeadingByPosition[position] ?? "오늘의 리딩";
}

function stripTrailingLlmArtifacts(value: string): string {
  let cleaned = value.trim();
  let previous = "";

  while (cleaned && cleaned !== previous) {
    previous = cleaned;

    for (const pattern of trailingLlmArtifactPatterns) {
      cleaned = cleaned.replace(pattern, "").trim();
    }
  }

  return cleaned;
}

function normalizeUserFacingCopy(value: string): string {
  return value
    .replaceAll("정위치", "정방향")
    .replaceAll("역위치", "역방향")
    .replace(/시각적으로는\s*/gu, "");
}

function normalizeDisplayKeyword(value: string): string {
  const normalizedValue = normalizeUserFacingCopy(value);
  const compactValue = normalizedValue.replace(/\s+/g, "");

  return (
    naturalKeywordByAwkwardCompactValue.get(compactValue) ??
    displayKeywordSpacingByCompactValue.get(compactValue) ??
    normalizedValue
  );
}

function containsPromptInternalFieldName(value: string): boolean {
  return promptInternalFieldNamePattern.test(value);
}

function cleanString(value: unknown, maxLength = 1400): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = normalizeUserFacingCopy(stripTrailingLlmArtifacts(value).slice(0, maxLength)).trim();

  return trimmed ? trimmed.slice(0, maxLength) : undefined;
}

function isTarotReadingPosition(value: unknown): value is TarotReadingPosition {
  return value === "today" || value === "situation" || value === "flow" || value === "advice";
}

function parseStringArray(value: unknown, maxItems: number, maxItemLength: number): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const strings: string[] = [];

  for (const item of value) {
    const cleaned = cleanString(item, maxItemLength);
    const displayValue = cleaned ? normalizeDisplayKeyword(cleaned) : undefined;

    if (!displayValue || seen.has(displayValue)) {
      continue;
    }

    seen.add(displayValue);
    strings.push(displayValue);

    if (strings.length >= maxItems) {
      break;
    }
  }

  return strings;
}

function parseCardReadings(value: unknown): TarotGeneratedCardReading[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }

    const position = item.position;
    const heading = cleanString(item.heading, 120);
    const reading = cleanString(item.reading, 520);

    return isTarotReadingPosition(position) && heading && reading
      ? [{ position, heading: getGeneratedCardReadingHeading(position), reading }]
      : [];
  });
}

function expectedPositionsForInput(input: TarotReadingInput): TarotReadingPosition[] {
  return input.spread === "daily_three_card" ? ["situation", "flow", "advice"] : [];
}

function hasExactPositions(readings: TarotGeneratedCardReading[], expectedPositions: TarotReadingPosition[]): boolean {
  if (readings.length !== expectedPositions.length) {
    return false;
  }

  return expectedPositions.every((position, index) => readings[index]?.position === position);
}

function hasPromptInternalFieldNameLeak(reading: TarotGeneratedReading): boolean {
  return (
    [reading.title, reading.overview, ...reading.keywords].some(containsPromptInternalFieldName) ||
    reading.cardReadings.some((cardReading) =>
      [cardReading.heading, cardReading.reading].some(containsPromptInternalFieldName),
    )
  );
}

function parseTarotReadingDraft(input: TarotReadingInput, value: unknown): TarotGeneratedReading | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const title = cleanString(value.title, 160);
  const overview = cleanString(value.overview, 1200);
  const keywords = parseStringArray(value.keywords, 5, 32);

  if (!Array.isArray(value.cardReadings)) {
    return undefined;
  }

  const cardReadings = parseCardReadings(value.cardReadings);

  if (
    !title ||
    !overview ||
    keywords.length < 3 ||
    cardReadings.length !== value.cardReadings.length ||
    !hasExactPositions(cardReadings, expectedPositionsForInput(input))
  ) {
    return undefined;
  }

  const reading = {
    title,
    overview,
    keywords,
    cardReadings,
  };

  return hasPromptInternalFieldNameLeak(reading) ? undefined : reading;
}

function normalizeProviderTimeoutMs(timeoutMs: number | undefined): number {
  if (typeof timeoutMs !== "number" || !Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return DEFAULT_TAROT_LLM_PROVIDER_TIMEOUT_MS;
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

function classifyUnavailableError(error: unknown): Pick<Extract<TarotReadingResult, { status: "unavailable" }>, "reason" | "retryable"> {
  if (error instanceof LlmProviderTimeoutError) {
    return { reason: "timeout", retryable: true };
  }

  if (error instanceof InvalidTarotReadingDraftError) {
    return { reason: "invalid_response", retryable: true };
  }

  return { reason: "provider_error", retryable: true };
}

export async function generateTarotReadingForUser(
  input: TarotReadingInput,
  options: GenerateTarotReadingOptions = {},
): Promise<TarotReadingResult> {
  if (!options.provider) {
    return {
      status: "unavailable",
      reason: "provider_missing",
      retryable: false,
    };
  }

  try {
    const prompt = buildTarotReadingPrompt(input);
    const timeoutMs = normalizeProviderTimeoutMs(options.providerTimeoutMs);
    const rawDraft = await generateJsonWithTimeout(
      options.provider,
      {
        instructions: prompt.instructions,
        input: prompt.input,
        schemaName: TAROT_READING_DRAFT_SCHEMA_NAME,
        jsonSchema: TAROT_READING_DRAFT_JSON_SCHEMA,
        timeoutMs,
        ...(options.model ? { model: options.model } : {}),
      },
      timeoutMs,
    );
    const reading = parseTarotReadingDraft(input, rawDraft);

    if (!reading) {
      throw new InvalidTarotReadingDraftError();
    }

    return {
      status: "ok",
      reading,
    };
  } catch (error) {
    options.onProviderError?.(error);
    const unavailable = classifyUnavailableError(error);

    return {
      status: "unavailable",
      reason: unavailable.reason,
      retryable: unavailable.retryable,
    };
  }
}
