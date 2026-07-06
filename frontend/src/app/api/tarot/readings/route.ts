import {
  createOpenAIResponsesProviderFromEnv,
  generateTarotReadingForUser,
  LlmProviderConfigurationError,
  type DreamReadingLlmProvider,
  type GenerateTarotReadingOptions,
  type TarotReadingInput,
  type TarotReadingResult,
} from "@manyang/backend";

import { randomUUID } from "node:crypto";

import { getTarotCardById, type TarotCard } from "@/lib/tarot-cards";
import {
  persistCompletedTarotReading,
  findCompletedTarotReadingForUser,
  isAdminUser as isAdminUserFromDb,
  hasReadingUsageForUserOnDate,
  hasReadingUsageForGuestOnDate,
  incrementReadingUsageForUser,
  incrementReadingUsageForGuest,
  type PersistCompletedTarotReadingInput,
  type ReadingUsageFeatureKey,
} from "@/lib/server/manyang-db";
import {
  createGuestIdCookie,
  resolveGuestSession,
  type GuestSession,
} from "@/lib/server/guest-session";
import { getAuthenticatedAccessPlan, getAuthenticatedUserId } from "@/lib/supabase/server";
import type {
  DailyTarotCardSelection,
  DailyTarotGeneratedReading,
  DailyTarotPosition,
  DailyTarotQuestionContext,
  DailyTarotReading,
  TarotUnlockMethod,
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
  questionContext?: DailyTarotQuestionContext;
  unlockMethod?: TarotUnlockMethod;
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
const MAX_LLM_TIMEOUT_MS = 90_000;
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
    readingKey?: string,
  ) => Promise<DailyTarotReading | null>;
  logTarotEvent?: (event: TarotReadingLogEvent) => void;
  hasReadingUsageForUserOnDate?: (
    userId: string,
    usageDate: string,
    featureKey: ReadingUsageFeatureKey,
  ) => Promise<boolean>;
  hasReadingUsageForGuestOnDate?: (
    guestId: string,
    usageDate: string,
    featureKey: ReadingUsageFeatureKey,
  ) => Promise<boolean>;
  incrementReadingUsageForUser?: (
    userId: string,
    usageDate: string,
    featureKey: ReadingUsageFeatureKey,
  ) => Promise<void>;
  incrementReadingUsageForGuest?: (
    guestId: string,
    usageDate: string,
    featureKey: ReadingUsageFeatureKey,
  ) => Promise<void>;
  createGuestId?: () => string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTarotSpread(value: unknown): value is TarotSpread {
  return value === "daily_one_card" || value === "question_one_card" || value === "daily_three_card";
}

function isTarotOrientation(value: unknown): value is TarotOrientation {
  return value === "upright" || value === "reversed";
}

function isDailyTarotPosition(value: unknown): value is DailyTarotPosition {
  return value === "today" || value === "situation" || value === "flow" || value === "advice";
}

function isDailyTarotQuestionContext(value: unknown): value is DailyTarotQuestionContext {
  return (
    isRecord(value) &&
    typeof value.stateKey === "string" &&
    value.stateKey.trim().length > 0 &&
    typeof value.stateLabel === "string" &&
    value.stateLabel.trim().length > 0 &&
    typeof value.questionKey === "string" &&
    value.questionKey.trim().length > 0 &&
    typeof value.questionText === "string" &&
    value.questionText.trim().length > 0
  );
}

function isTarotUnlockMethod(value: unknown): value is TarotUnlockMethod {
  return value === "daily_free" || value === "rewarded_ad" || value === "moon_pass" || value === "admin";
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
  return (
    normalizeLlmTimeoutMs(env.MANYANG_TAROT_LLM_TIMEOUT_MS) ??
    normalizeLlmTimeoutMs(env.MANYANG_LLM_TIMEOUT_MS) ??
    DEFAULT_TAROT_LLM_TIMEOUT_MS
  );
}

function readTrimmedEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
}

function normalizeLlmTimeoutMs(value: string | undefined): number | undefined {
  const configuredTimeoutMs = Number(value);

  if (!Number.isFinite(configuredTimeoutMs) || configuredTimeoutMs <= 0) {
    return undefined;
  }

  return Math.min(MAX_LLM_TIMEOUT_MS, Math.max(MIN_LLM_TIMEOUT_MS, Math.round(configuredTimeoutMs)));
}

export function resolveTarotLlmModel(env: EnvLike = process.env): string | undefined {
  return (
    readTrimmedEnv(env.MANYANG_TAROT_OPENAI_MODEL) ??
    readTrimmedEnv(env.MANYANG_OPENAI_MODEL) ??
    readTrimmedEnv(env.OPENAI_MODEL)
  );
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

    if (!getTarotCardById(selection.cardId)) {
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
      unlockMethod: "daily_free",
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
    return { ok: false, error: "spread must be daily_one_card, question_one_card, or daily_three_card" };
  }

  if (typeof body.selectedAt !== "string" || body.selectedAt.trim().length === 0) {
    return { ok: false, error: "selectedAt is required" };
  }

  const unlockMethod = body.unlockMethod === undefined ? "daily_free" : body.unlockMethod;

  if (!isTarotUnlockMethod(unlockMethod)) {
    return { ok: false, error: "unlockMethod must be daily_free, rewarded_ad, moon_pass, or admin" };
  }

  const questionContext =
    body.spread === "question_one_card" && isDailyTarotQuestionContext(body.questionContext)
      ? body.questionContext
      : undefined;

  if (body.spread === "question_one_card" && !questionContext) {
    return { ok: false, error: "questionContext is required for question_one_card" };
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
      ...(body.spread === "question_one_card"
        ? { questionContext, unlockMethod }
        : {}),
    },
  };
}

function resolveSelection(selection: TarotReadingSelectionRequest): DailyTarotCardSelection {
  const card = getTarotCardById(selection.cardId);

  if (!card) {
    throw new Error(`Unknown tarot card id: ${selection.cardId}`);
  }

  return {
    position: selection.position,
    orientation: selection.orientation,
    card,
  };
}

function createReadingId(input: TarotReadingRequestBody): string {
  if (input.spread === "question_one_card" && input.questionContext) {
    return `daily-tarot-question_one_card-${input.appDate}-${input.questionContext.stateKey}-${input.questionContext.questionKey}-${input.unlockMethod ?? "daily_free"}`;
  }

  return `daily-tarot-${input.spread}-${input.appDate}`;
}

function createReadingPersistenceKeyFromRequest(input: TarotReadingRequestBody): string {
  if (input.spread !== "question_one_card" || !input.questionContext) {
    return "daily";
  }

  return `question:${input.questionContext.stateKey}:${input.questionContext.questionKey}:${input.unlockMethod ?? "daily_free"}`;
}

function resolvePrimaryDictionaryCardMessage(selections: DailyTarotCardSelection[]): string {
  const adviceSelection = selections.find((selection) => selection.position === "advice") ?? selections[0];

  return adviceSelection?.card[adviceSelection.orientation].cardMessage ?? "";
}

function createGeneratedReadingWithDictionaryAdvice(
  generated: Extract<TarotReadingResult, { status: "ok" }>["reading"],
  cardMessage: string,
): DailyTarotGeneratedReading {
  return {
    ...generated,
    advice: cardMessage,
  };
}

function createDailyTarotReadingFromGenerated(
  input: TarotReadingRequestBody,
  selections: DailyTarotCardSelection[],
  generated: Extract<TarotReadingResult, { status: "ok" }>["reading"],
): DailyTarotReading {
  const primarySelection = selections[0] as DailyTarotCardSelection & { card: TarotCard };
  const cardMessage = resolvePrimaryDictionaryCardMessage(selections);
  const generatedWithAdvice = createGeneratedReadingWithDictionaryAdvice(generated, cardMessage);

  return {
    id: createReadingId(input),
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
    advice: cardMessage,
    generated: generatedWithAdvice,
    ...(input.spread === "question_one_card" && input.questionContext
      ? {
          questionContext: input.questionContext,
          unlockMethod: input.unlockMethod ?? "daily_free",
        }
      : {}),
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
    ...(requestBody.spread === "question_one_card" && requestBody.questionContext
      ? { questionContext: requestBody.questionContext }
      : {}),
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
  readingKey: string,
  find: (
    userId: string,
    appDate: string,
    spread: TarotSpread,
    readingKey?: string,
  ) => Promise<DailyTarotReading | null>,
): Promise<DailyTarotReading | null> {
  try {
    return await find(userId, appDate, spread, readingKey);
  } catch {
    return null;
  }
}

function createJsonResponse(body: unknown, init?: ResponseInit, guestSession?: GuestSession | null): Response {
  const response = Response.json(body, init);

  if (guestSession?.shouldSetCookie) {
    response.headers.append("set-cookie", createGuestIdCookie(guestSession.guestId));
  }

  return response;
}

function tarotUsageFeatureKey(spread: TarotSpread): ReadingUsageFeatureKey {
  if (spread === "daily_three_card") {
    return "tarot_three_card";
  }

  if (spread === "question_one_card") {
    return "tarot_question_one_card";
  }

  return "tarot_one_card";
}

function createQuestionRewardedAdRequiredPayload() {
  return {
    error: "question tarot requires rewarded ad",
    reason: "rewarded_ad_required",
    rewardedAdAvailable: false,
    message: "오늘의 질문 타로는 이미 열었어요. 다음에는 광고를 보고 한 번 더 볼 수 있게 준비할게요.",
  };
}

async function incrementUserQuestionTarotUsageBestEffort(
  userId: string | null,
  appDate: string,
  spread: TarotSpread,
  increment: (userId: string, usageDate: string, featureKey: ReadingUsageFeatureKey) => Promise<void>,
): Promise<void> {
  if (!userId || spread !== "question_one_card") {
    return;
  }

  try {
    await increment(userId, appDate, tarotUsageFeatureKey(spread));
  } catch {
    // The generated reading can still be returned even if usage metering fails.
  }
}

async function incrementGuestTarotUsageBestEffort(
  guestSession: GuestSession | null,
  appDate: string,
  spread: TarotSpread,
  increment: (guestId: string, usageDate: string, featureKey: ReadingUsageFeatureKey) => Promise<void>,
): Promise<void> {
  if (!guestSession) {
    return;
  }

  try {
    await increment(guestSession.guestId, appDate, tarotUsageFeatureKey(spread));
  } catch {
    // 리딩은 그대로 반환된다. 사용량 기록 실패가 사용자 경험을 막지 않는다.
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
    hasReadingUsageForUserOnDate,
    hasReadingUsageForGuestOnDate,
    incrementReadingUsageForUser,
    incrementReadingUsageForGuest,
    createGuestId: randomUUID,
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
  const requestBody: TarotReadingRequestBody =
    validatedBody.value.spread === "question_one_card"
      ? {
          ...validatedBody.value,
          unlockMethod: isAdmin ? "admin" : "daily_free",
        }
      : validatedBody.value;
  const readingKey = createReadingPersistenceKeyFromRequest(requestBody);

  // 재요청 단락: 로그인 유저가 같은 날 같은 스프레드로 이미 받은 리딩이 있으면
  // LLM을 다시 부르지 않고 저장본을 그대로 돌려준다(같은 날 → 같은 리딩, 추가 비용 없음).
  // 어드민은 재테스트를 위해 통과시킨다.
  if (userId && !isAdmin) {
    const existingReading = await findExistingTarotReadingBestEffort(
      userId,
      requestBody.appDate,
      requestBody.spread,
      readingKey,
      resolvedDependencies.findCompletedTarotReadingForUser,
    );

    if (existingReading) {
      return Response.json(existingReading);
    }
  }

  // 게스트만 레이트리밋 대상이다. 로그인 유저는 위 단락이 하루 LLM 호출을 묶는다.
  const guestSession = userId ? null : resolveGuestSession(request, resolvedDependencies.createGuestId);

  if (
    requestBody.spread === "daily_three_card" &&
    !canUseTarotThreeCardReading({ accessPlan, isAdmin })
  ) {
    return createJsonResponse(
      {
        error: "tarot reading is locked",
        reason: "tarot_three_card_locked",
        ctaLabel: "Moon Pass로 세 장 리딩 열기",
        message: "상황, 흐름, 조언을 연결하는 세 장 타로는 Moon Pass에서 열려요.",
      },
      { status: 403 },
      guestSession,
    );
  }

  if (userId && !isAdmin && requestBody.spread === "question_one_card") {
    const alreadyUsed = await resolvedDependencies.hasReadingUsageForUserOnDate(
      userId,
      requestBody.appDate,
      tarotUsageFeatureKey(requestBody.spread),
    );

    if (alreadyUsed) {
      return createJsonResponse(createQuestionRewardedAdRequiredPayload(), { status: 403 }, guestSession);
    }
  }

  if (guestSession) {
    const featureKey = tarotUsageFeatureKey(requestBody.spread);
    const alreadyUsed = await resolvedDependencies.hasReadingUsageForGuestOnDate(
      guestSession.guestId,
      requestBody.appDate,
      featureKey,
    );

    if (alreadyUsed) {
      if (requestBody.spread === "question_one_card") {
        return createJsonResponse(createQuestionRewardedAdRequiredPayload(), { status: 403 }, guestSession);
      }

      return createJsonResponse(
        {
          error: "tarot reading is rate limited",
          reason: "tarot_rate_limited",
          retryable: false,
          message: "오늘의 무료 타로는 이미 펼쳤어요. 내일 다시 만나요.",
        },
        { status: 429 },
        guestSession,
      );
    }
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
        spread: requestBody.spread,
        appDate: requestBody.appDate,
        authenticated: Boolean(userId),
      });
      return createJsonResponse(createUnavailablePayload("provider_missing", false), { status: 503 }, guestSession);
    }

    throw error;
  }

  if (!provider) {
    resolvedDependencies.logTarotEvent({
      type: "unavailable",
      reason: "provider_missing",
      retryable: false,
      spread: requestBody.spread,
      appDate: requestBody.appDate,
      authenticated: Boolean(userId),
    });
    return createJsonResponse(createUnavailablePayload("provider_missing", false), { status: 503 }, guestSession);
  }

  const selections = requestBody.selections.map(resolveSelection);
  const model = resolveTarotLlmModel();
  const result = await resolvedDependencies.generateTarotReadingForUser(
    createTarotReadingInput(requestBody, selections),
    {
      provider,
      providerTimeoutMs: resolveTarotLlmTimeoutMs(),
      ...(model ? { model } : {}),
      onProviderError: (error) =>
        resolvedDependencies.logTarotEvent({
          type: "provider_error",
          spread: requestBody.spread,
          appDate: requestBody.appDate,
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
      spread: requestBody.spread,
      appDate: requestBody.appDate,
      authenticated: Boolean(userId),
    });
    return createJsonResponse(createUnavailablePayload(result.reason, result.retryable), { status: 503 }, guestSession);
  }

  const reading = createDailyTarotReadingFromGenerated(requestBody, selections, result.reading);

  await persistCompletedTarotReadingBestEffort(
    userId,
    reading,
    resolvedDependencies.persistCompletedTarotReading,
  );

  await incrementUserQuestionTarotUsageBestEffort(
    userId && !isAdmin ? userId : null,
    requestBody.appDate,
    requestBody.spread,
    resolvedDependencies.incrementReadingUsageForUser,
  );

  await incrementGuestTarotUsageBestEffort(
    guestSession,
    requestBody.appDate,
    requestBody.spread,
    resolvedDependencies.incrementReadingUsageForGuest,
  );

  return createJsonResponse(reading, undefined, guestSession);
}

export async function POST(request: Request): Promise<Response> {
  return handleTarotReadingRequest(request);
}
