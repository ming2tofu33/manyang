import {
  createOpenAIResponsesProviderFromEnv,
  generateTarotReadingForUser,
  LlmProviderConfigurationError,
  type DreamReadingLlmProvider,
  type GenerateTarotReadingOptions,
  type TarotReadingInput,
  type TarotReadingResult,
} from "@manyang/backend";

import { getTarotMajorCardById, type TarotMajorCard } from "@/lib/tarot-major-cards";
import {
  persistCompletedTarotReading,
  findCompletedTarotReadingForUser,
  isAdminUser as isAdminUserFromDb,
  type PersistCompletedTarotReadingInput,
} from "@/lib/server/manyang-db";
import { getAuthenticatedAccessPlan, getAuthenticatedUserId } from "@/lib/supabase/server";
import type {
  DailyTarotCardSelection,
  DailyTarotGeneratedReading,
  DailyTarotPosition,
  DailyTarotReading,
  TarotOrientation,
  TarotSpread,
} from "@/lib/daily-tarot";
import type { AccessPlan } from "@/lib/access-policy";
import { canUseTarotThreeCardReading } from "@/lib/tarot-event";

export const runtime = "nodejs";

type EnvLike = Record<string, string | undefined>;

type TarotReadingLogEvent =
  | {
      type: "provider_error";
      spread: TarotSpread;
      appDate: string;
      authenticated: boolean;
      error: unknown;
    }
  | {
      type: "unavailable";
      reason: Extract<TarotReadingResult, { status: "unavailable" }>["reason"];
      retryable: boolean;
      spread: TarotSpread;
      appDate: string;
      authenticated: boolean;
    };

function logTarotReadingEvent(event: TarotReadingLogEvent): void {
  const base = {
    scope: "tarot_reading",
    type: event.type,
    spread: event.spread,
    appDate: event.appDate,
    authenticated: event.authenticated,
  };

  if (event.type === "provider_error") {
    console.error(JSON.stringify(base), event.error);
    return;
  }

  console.warn(JSON.stringify({ ...base, reason: event.reason, retryable: event.retryable }));
}

type TarotReadingSelectionRequest = {
  cardId: number;
  orientation: TarotOrientation;
  position: DailyTarotPosition;
};

type TarotReadingRequestBody = {
  appDate: string;
  spread: TarotSpread;
  selectedAt: string;
  selections: TarotReadingSelectionRequest[];
};

type TarotReadingValidationResult =
  | {
      ok: true;
      value: TarotReadingRequestBody;
    }
  | {
      ok: false;
      error: string;
    };

const MIN_LLM_TIMEOUT_MS = 1_000;
const MAX_LLM_TIMEOUT_MS = 60_000;
const DEFAULT_TAROT_LLM_TIMEOUT_MS = 25_000;

export type TarotReadingsRouteDependencies = {
  getAuthenticatedUserId?: () => Promise<string | null>;
  getAccessPlanForUser?: (userId: string | null) => Promise<AccessPlan>;
  isAdminUser?: (userId: string) => Promise<boolean>;
  createProvider?: () => DreamReadingLlmProvider | undefined;
  generateTarotReadingForUser?: (
    input: TarotReadingInput,
    options?: GenerateTarotReadingOptions,
  ) => Promise<TarotReadingResult>;
  persistCompletedTarotReading?: (input: PersistCompletedTarotReadingInput) => Promise<unknown>;
  findCompletedTarotReadingForUser?: (
    userId: string,
    appDate: string,
    spread: TarotSpread,
  ) => Promise<DailyTarotReading | null>;
  logTarotEvent?: (event: TarotReadingLogEvent) => void;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTarotSpread(value: unknown): value is TarotSpread {
  return value === "daily_one_card" || value === "daily_three_card";
}

function isTarotOrientation(value: unknown): value is TarotOrientation {
  return value === "upright" || value === "reversed";
}

function isDailyTarotPosition(value: unknown): value is DailyTarotPosition {
  return value === "today" || value === "situation" || value === "flow" || value === "advice";
}

function expectedPositionsForSpread(spread: TarotSpread): DailyTarotPosition[] {
  return spread === "daily_three_card" ? ["situation", "flow", "advice"] : ["today"];
}

function createUnavailablePayload(reason: Extract<TarotReadingResult, { status: "unavailable" }>["reason"], retryable: boolean) {
  return {
    status: "unavailable",
    error: "tarot reading is unavailable",
    reason,
    retryable,
  };
}

export function resolveTarotLlmTimeoutMs(env: EnvLike = process.env): number {
  const configuredTimeoutMs = Number(env.MANYANG_LLM_TIMEOUT_MS);

  if (!Number.isFinite(configuredTimeoutMs) || configuredTimeoutMs <= 0) {
    return DEFAULT_TAROT_LLM_TIMEOUT_MS;
  }

  return Math.min(MAX_LLM_TIMEOUT_MS, Math.max(MIN_LLM_TIMEOUT_MS, Math.round(configuredTimeoutMs)));
}

async function getDefaultAccessPlanForUser(userId: string | null): Promise<AccessPlan> {
  if (!userId) {
    return "guest";
  }

  return getAuthenticatedAccessPlan();
}

async function getDefaultIsAdminUser(userId: string): Promise<boolean> {
  try {
    return await isAdminUserFromDb(userId);
  } catch {
    return false;
  }
}

function createDefaultProvider(): DreamReadingLlmProvider | undefined {
  return createOpenAIResponsesProviderFromEnv(process.env);
}

function validateSelections(spread: TarotSpread, selections: unknown): TarotReadingValidationResult {
  if (!Array.isArray(selections)) {
    return { ok: false, error: "selections must be an array" };
  }

  const expectedPositions = expectedPositionsForSpread(spread);

  if (selections.length !== expectedPositions.length) {
    return { ok: false, error: `selections must include ${expectedPositions.length} card(s)` };
  }

  const parsedSelections: TarotReadingSelectionRequest[] = [];
  const seenCardIds = new Set<number>();

  for (let index = 0; index < selections.length; index += 1) {
    const selection = selections[index];

    if (!isRecord(selection)) {
      return { ok: false, error: "selection entries must be objects" };
    }

    if (typeof selection.cardId !== "number" || !Number.isInteger(selection.cardId)) {
      return { ok: false, error: "selection.cardId must be an integer" };
    }

    if (seenCardIds.has(selection.cardId)) {
      return { ok: false, error: "selections must not repeat cards" };
    }

    if (!getTarotMajorCardById(selection.cardId)) {
      return { ok: false, error: "selection.cardId is unknown" };
    }

    if (!isTarotOrientation(selection.orientation)) {
      return { ok: false, error: "selection.orientation must be upright or reversed" };
    }

    if (!isDailyTarotPosition(selection.position) || selection.position !== expectedPositions[index]) {
      return { ok: false, error: `selection.position must be ${expectedPositions[index]}` };
    }

    seenCardIds.add(selection.cardId);
    parsedSelections.push({
      cardId: selection.cardId,
      orientation: selection.orientation,
      position: selection.position,
    });
  }

  return {
    ok: true,
    value: {
      appDate: "",
      spread,
      selectedAt: "",
      selections: parsedSelections,
    },
  };
}

export function validateTarotReadingRequestBody(body: unknown): TarotReadingValidationResult {
  if (!isRecord(body)) {
    return { ok: false, error: "request body must be an object" };
  }

  if (typeof body.appDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.appDate)) {
    return { ok: false, error: "appDate must use YYYY-MM-DD" };
  }

  if (!isTarotSpread(body.spread)) {
    return { ok: false, error: "spread must be daily_one_card or daily_three_card" };
  }

  if (typeof body.selectedAt !== "string" || body.selectedAt.trim().length === 0) {
    return { ok: false, error: "selectedAt is required" };
  }

  const selections = validateSelections(body.spread, body.selections);

  if (!selections.ok) {
    return selections;
  }

  return {
    ok: true,
    value: {
      appDate: body.appDate,
      spread: body.spread,
      selectedAt: body.selectedAt,
      selections: selections.value.selections,
    },
  };
}

function resolveSelection(selection: TarotReadingSelectionRequest): DailyTarotCardSelection {
  const card = getTarotMajorCardById(selection.cardId);

  if (!card) {
    throw new Error(`Unknown tarot major card id: ${selection.cardId}`);
  }

  return {
    position: selection.position,
    orientation: selection.orientation,
    card,
  };
}

function createReadingId(spread: TarotSpread, appDate: string): string {
  return `daily-tarot-${spread}-${appDate}`;
}

function resolveDictionaryAdvice(selections: DailyTarotCardSelection[]): string {
  const adviceSelection = selections.find((selection) => selection.position === "advice") ?? selections[0];

  return adviceSelection?.card[adviceSelection.orientation].advice ?? "";
}

function createGeneratedReadingWithDictionaryAdvice(
  generated: Extract<TarotReadingResult, { status: "ok" }>["reading"],
  advice: string,
): DailyTarotGeneratedReading {
  return {
    ...generated,
    advice,
  };
}

function createDailyTarotReadingFromGenerated(
  input: TarotReadingRequestBody,
  selections: DailyTarotCardSelection[],
  generated: Extract<TarotReadingResult, { status: "ok" }>["reading"],
): DailyTarotReading {
  const primarySelection = selections[0] as DailyTarotCardSelection & { card: TarotMajorCard };
  const advice = resolveDictionaryAdvice(selections);
  const generatedWithAdvice = createGeneratedReadingWithDictionaryAdvice(generated, advice);

  return {
    id: createReadingId(input.spread, input.appDate),
    spread: input.spread,
    source: "llm",
    appDate: input.appDate,
    selectedAt: input.selectedAt,
    card: primarySelection.card,
    orientation: primarySelection.orientation,
    position: primarySelection.position,
    cards: selections,
    keywords: [...generated.keywords],
    title: generated.title,
    message: generated.overview,
    advice,
    generated: generatedWithAdvice,
  };
}

function createTarotReadingInput(
  requestBody: TarotReadingRequestBody,
  selections: DailyTarotCardSelection[],
): TarotReadingInput {
  return {
    appDate: requestBody.appDate,
    locale: "ko",
    spread: requestBody.spread,
    cards: selections.map((selection) => ({
      position: selection.position,
      orientation: selection.orientation,
      card: selection.card,
    })),
  };
}

async function persistCompletedTarotReadingBestEffort(
  userId: string | null,
  reading: DailyTarotReading,
  persist: (input: PersistCompletedTarotReadingInput) => Promise<unknown>,
): Promise<void> {
  if (!userId) {
    return;
  }

  try {
    await persist({
      userId,
      reading,
    });
  } catch {
    // The generated reading can still be returned and stored locally by the client.
  }
}

async function findExistingTarotReadingBestEffort(
  userId: string,
  appDate: string,
  spread: TarotSpread,
  find: (userId: string, appDate: string, spread: TarotSpread) => Promise<DailyTarotReading | null>,
): Promise<DailyTarotReading | null> {
  try {
    return await find(userId, appDate, spread);
  } catch {
    return null;
  }
}

export async function handleTarotReadingRequest(
  request: Request,
  dependencies: TarotReadingsRouteDependencies = {},
): Promise<Response> {
  const resolvedDependencies: Required<TarotReadingsRouteDependencies> = {
    getAuthenticatedUserId,
    getAccessPlanForUser: getDefaultAccessPlanForUser,
    isAdminUser: getDefaultIsAdminUser,
    createProvider: createDefaultProvider,
    generateTarotReadingForUser,
    persistCompletedTarotReading,
    findCompletedTarotReadingForUser,
    logTarotEvent: logTarotReadingEvent,
    ...dependencies,
  };

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const validatedBody = validateTarotReadingRequestBody(body);

  if (!validatedBody.ok) {
    return Response.json({ error: validatedBody.error }, { status: 400 });
  }

  const userId = await resolvedDependencies.getAuthenticatedUserId();
  const accessPlan = await resolvedDependencies.getAccessPlanForUser(userId);
  const isAdmin = userId ? await resolvedDependencies.isAdminUser(userId) : false;

  // 재요청 단락: 로그인 유저가 같은 날 같은 스프레드로 이미 받은 리딩이 있으면
  // LLM을 다시 부르지 않고 저장본을 그대로 돌려준다(같은 날 → 같은 리딩, 추가 비용 없음).
  // 어드민은 재테스트를 위해 통과시킨다.
  if (userId && !isAdmin) {
    const existingReading = await findExistingTarotReadingBestEffort(
      userId,
      validatedBody.value.appDate,
      validatedBody.value.spread,
      resolvedDependencies.findCompletedTarotReadingForUser,
    );

    if (existingReading) {
      return Response.json(existingReading);
    }
  }

  if (
    validatedBody.value.spread === "daily_three_card" &&
    !canUseTarotThreeCardReading({ accessPlan, isAdmin })
  ) {
    return Response.json(
      {
        error: "tarot reading is locked",
        reason: "tarot_three_card_locked",
        ctaLabel: "Moon Pass로 세 장 리딩 열기",
        message: "상황, 흐름, 조언을 연결하는 세 장 타로는 Moon Pass에서 열려요.",
      },
      { status: 403 },
    );
  }

  let provider: DreamReadingLlmProvider | undefined;

  try {
    provider = resolvedDependencies.createProvider();
  } catch (error) {
    if (error instanceof LlmProviderConfigurationError) {
      resolvedDependencies.logTarotEvent({
        type: "unavailable",
        reason: "provider_missing",
        retryable: false,
        spread: validatedBody.value.spread,
        appDate: validatedBody.value.appDate,
        authenticated: Boolean(userId),
      });
      return Response.json(createUnavailablePayload("provider_missing", false), { status: 503 });
    }

    throw error;
  }

  if (!provider) {
    resolvedDependencies.logTarotEvent({
      type: "unavailable",
      reason: "provider_missing",
      retryable: false,
      spread: validatedBody.value.spread,
      appDate: validatedBody.value.appDate,
      authenticated: Boolean(userId),
    });
    return Response.json(createUnavailablePayload("provider_missing", false), { status: 503 });
  }

  const selections = validatedBody.value.selections.map(resolveSelection);
  const result = await resolvedDependencies.generateTarotReadingForUser(
    createTarotReadingInput(validatedBody.value, selections),
    {
      provider,
      providerTimeoutMs: resolveTarotLlmTimeoutMs(),
      onProviderError: (error) =>
        resolvedDependencies.logTarotEvent({
          type: "provider_error",
          spread: validatedBody.value.spread,
          appDate: validatedBody.value.appDate,
          authenticated: Boolean(userId),
          error,
        }),
    },
  );

  if (result.status === "unavailable") {
    resolvedDependencies.logTarotEvent({
      type: "unavailable",
      reason: result.reason,
      retryable: result.retryable,
      spread: validatedBody.value.spread,
      appDate: validatedBody.value.appDate,
      authenticated: Boolean(userId),
    });
    return Response.json(createUnavailablePayload(result.reason, result.retryable), { status: 503 });
  }

  const reading = createDailyTarotReadingFromGenerated(validatedBody.value, selections, result.reading);

  await persistCompletedTarotReadingBestEffort(
    userId,
    reading,
    resolvedDependencies.persistCompletedTarotReading,
  );

  return Response.json(reading);
}

export async function POST(request: Request): Promise<Response> {
  return handleTarotReadingRequest(request);
}
