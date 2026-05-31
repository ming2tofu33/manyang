import {
  analyzeDream,
  createOpenAIEmbeddingsProviderFromEnv,
  createEnglishLemmatizer,
  createKoreanLemmatizerFromEnv,
  createOpenAIResponsesProviderFromEnv,
  DEFAULT_LLM_PROVIDER_TIMEOUT_MS,
  EmbeddingProviderConfigurationError,
  generateDreamReadingForUser,
  loadCachedDreamVectorIndex,
  LlmProviderConfigurationError,
  type AnalyzeDreamWithLlmOptions,
  type CatReaderType,
  type DreamAnalysisRequest,
  type DreamAnalysisResponse,
  type DreamReadingResult,
  type DreamReadingUnavailableReason,
} from "@manyang/backend";
import { randomUUID } from "node:crypto";

import {
  findCompletedReadingForUserDreamOnDate,
  hasCompletedGuestBasicReadingOnDate,
  isAdminUser as isAdminUserFromDb,
  persistCompletedDreamReading,
  persistGuestBasicReadingUsage,
  type PersistGuestBasicReadingUsageInput,
} from "@/lib/server/manyang-db";
import {
  canRequestReading,
  getReadingKindForCatReader,
  type AccessPlan,
} from "@/lib/access-policy";
import { getManyangAppDate } from "@/lib/app-date";
import { getAuthenticatedAccessPlan, getAuthenticatedUserId } from "@/lib/supabase/server";
import type { PersistCompletedDreamReadingInput } from "@/lib/manyang-dream-records";

export const runtime = "nodejs";

type EnvLike = Record<string, string | undefined>;
const MIN_LLM_TIMEOUT_MS = 1_000;
const MAX_LLM_TIMEOUT_MS = 60_000;
export const DREAM_ANALYZE_MAX_DREAM_TEXT_LENGTH = 1000;
const OPTIONAL_TEXT_MAX_LENGTH = 160;
const NIGHT_CONTEXT_NOTE_MAX_LENGTH = 100;
const TIME_ZONE_MAX_LENGTH = 80;
const FEELING_IDS_MAX_ITEMS = 4;
const FEELING_ID_MAX_LENGTH = 32;
const FEELING_OTHER_MAX_LENGTH = 30;
const validLocales = new Set(["ko", "en"]);
const validCatReaderTypes = new Set(["black_cat", "white_cat", "cheese_cat", "gray_cat"]);
const guestIdCookieName = "manyang_guest_id";
const guestIdCookieMaxAgeSeconds = 60 * 60 * 24 * 400;

type GuestSession = {
  guestId: string;
  shouldSetCookie: boolean;
};

type DreamAnalyzeValidationResult =
  | {
      ok: true;
      value: DreamAnalysisRequest;
    }
  | {
      ok: false;
      error: string;
    };

type NightContextValidationResult =
  | {
      ok: true;
      value?: DreamAnalysisRequest["nightContext"];
    }
  | {
      ok: false;
      error: string;
    };

export type DreamAnalyzeRouteDependencies = {
  getAuthenticatedUserId?: () => Promise<string | null>;
  getAccessPlanForUser?: (userId: string | null) => Promise<AccessPlan>;
  isAdminUser?: (userId: string) => Promise<boolean>;
  findCompletedReadingForUserDreamOnDate?: (
    userId: string,
    dreamDate: string,
    dreamText: string,
  ) => Promise<DreamAnalysisResponse | null>;
  hasCompletedGuestBasicReadingOnDate?: (guestId: string, dreamDate: string) => Promise<boolean>;
  persistCompletedDreamReading?: (input: PersistCompletedDreamReadingInput) => Promise<unknown>;
  persistGuestBasicReadingUsage?: (input: PersistGuestBasicReadingUsageInput) => Promise<unknown>;
  createGuestId?: () => string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidGuestId(value: string | undefined): value is string {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  );
}

function getRequestCookie(request: Request, cookieName: string): string | undefined {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return undefined;
  }

  for (const cookiePart of cookieHeader.split(";")) {
    const [name, ...valueParts] = cookiePart.trim().split("=");

    if (name === cookieName) {
      return valueParts.join("=");
    }
  }

  return undefined;
}

function resolveGuestSession(request: Request, createGuestId: () => string): GuestSession {
  const existingGuestId = getRequestCookie(request, guestIdCookieName);

  if (isValidGuestId(existingGuestId)) {
    return {
      guestId: existingGuestId,
      shouldSetCookie: false,
    };
  }

  return {
    guestId: createGuestId(),
    shouldSetCookie: true,
  };
}

function createGuestIdCookie(guestId: string, env: EnvLike = process.env): string {
  return [
    `${guestIdCookieName}=${guestId}`,
    "Path=/",
    `Max-Age=${guestIdCookieMaxAgeSeconds}`,
    "HttpOnly",
    "SameSite=Lax",
    env.NODE_ENV === "production" ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function createJsonResponse(body: unknown, init?: ResponseInit, guestSession?: GuestSession | null): Response {
  const response = Response.json(body, init);

  if (guestSession?.shouldSetCookie) {
    response.headers.append("set-cookie", createGuestIdCookie(guestSession.guestId));
  }

  return response;
}

function optionalIdArrayField(
  body: Record<string, unknown>,
  fieldName: "dreamAtmospheres" | "dreamSensations",
): { ok: true; value?: string[] } | { ok: false; error: string } {
  const value = body[fieldName];

  if (value === undefined) {
    return { ok: true };
  }

  if (!Array.isArray(value)) {
    return { ok: false, error: `${fieldName} must be an array of strings` };
  }

  if (value.length > FEELING_IDS_MAX_ITEMS) {
    return { ok: false, error: `${fieldName} must have ${FEELING_IDS_MAX_ITEMS} items or fewer` };
  }

  const ids: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") {
      return { ok: false, error: `${fieldName} must be an array of strings` };
    }

    const trimmed = item.trim();
    if (trimmed.length === 0 || trimmed.length > FEELING_ID_MAX_LENGTH) {
      return { ok: false, error: `${fieldName} entries must be 1 to ${FEELING_ID_MAX_LENGTH} characters` };
    }

    if (!ids.includes(trimmed)) {
      ids.push(trimmed);
    }
  }

  return ids.length > 0 ? { ok: true, value: ids } : { ok: true };
}

function optionalStringField(
  body: Record<string, unknown>,
  fieldName: "dreamDate" | "wakeMood" | "dreamMood" | "userTimeZone" | "dreamSensationOther",
  maxLength: number,
): { ok: true; value?: string } | { ok: false; error: string } {
  const value = body[fieldName];

  if (value === undefined) {
    return { ok: true };
  }

  if (typeof value !== "string") {
    return { ok: false, error: `${fieldName} must be a string` };
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return { ok: true };
  }

  if (trimmed.length > maxLength) {
    return { ok: false, error: `${fieldName} must be ${maxLength} characters or fewer` };
  }

  return { ok: true, value: trimmed };
}

function validateNightContext(value: unknown): NightContextValidationResult {
  if (value === undefined) {
    return { ok: true };
  }

  if (!isRecord(value)) {
    return { ok: false, error: "nightContext must be an object" };
  }

  if (typeof value.checkInDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.checkInDate)) {
    return { ok: false, error: "nightContext.checkInDate must use YYYY-MM-DD" };
  }

  if (typeof value.moodLabel !== "string") {
    return { ok: false, error: "nightContext.moodLabel must be a string" };
  }

  const moodLabel = value.moodLabel.trim();
  if (moodLabel.length === 0 || moodLabel.length > OPTIONAL_TEXT_MAX_LENGTH) {
    return { ok: false, error: `nightContext.moodLabel must be 1 to ${OPTIONAL_TEXT_MAX_LENGTH} characters` };
  }

  if (typeof value.conditionLabel !== "string") {
    return { ok: false, error: "nightContext.conditionLabel must be a string" };
  }

  const conditionLabel = value.conditionLabel.trim();
  if (conditionLabel.length === 0 || conditionLabel.length > OPTIONAL_TEXT_MAX_LENGTH) {
    return { ok: false, error: `nightContext.conditionLabel must be 1 to ${OPTIONAL_TEXT_MAX_LENGTH} characters` };
  }

  if (value.note !== undefined && typeof value.note !== "string") {
    return { ok: false, error: "nightContext.note must be a string" };
  }

  const note = typeof value.note === "string" ? value.note.trim().slice(0, NIGHT_CONTEXT_NOTE_MAX_LENGTH) : "";

  return {
    ok: true,
    value: {
      checkInDate: value.checkInDate,
      moodLabel,
      conditionLabel,
      ...(note ? { note } : {}),
    },
  };
}

export function validateDreamAnalyzeRequestBody(body: unknown): DreamAnalyzeValidationResult {
  if (!isRecord(body)) {
    return { ok: false, error: "request body must be an object" };
  }

  if (typeof body.dreamText !== "string") {
    return { ok: false, error: "dreamText must be a string" };
  }

  const dreamText = body.dreamText.trim();

  if (!dreamText) {
    return { ok: false, error: "dreamText is required" };
  }

  if (dreamText.length > DREAM_ANALYZE_MAX_DREAM_TEXT_LENGTH) {
    return { ok: false, error: `dreamText must be ${DREAM_ANALYZE_MAX_DREAM_TEXT_LENGTH} characters or fewer` };
  }

  if (body.locale !== undefined && (typeof body.locale !== "string" || !validLocales.has(body.locale))) {
    return { ok: false, error: "locale must be one of: ko, en" };
  }

  if (
    body.catReaderType !== undefined &&
    (typeof body.catReaderType !== "string" || !validCatReaderTypes.has(body.catReaderType))
  ) {
    return { ok: false, error: "catReaderType must be one of: black_cat, white_cat, cheese_cat, gray_cat" };
  }

  const dreamDate = optionalStringField(body, "dreamDate", 10);
  if (!dreamDate.ok) {
    return dreamDate;
  }

  if (dreamDate.value && !/^\d{4}-\d{2}-\d{2}$/.test(dreamDate.value)) {
    return { ok: false, error: "dreamDate must use YYYY-MM-DD" };
  }

  const wakeMood = optionalStringField(body, "wakeMood", OPTIONAL_TEXT_MAX_LENGTH);
  if (!wakeMood.ok) {
    return wakeMood;
  }

  const dreamMood = optionalStringField(body, "dreamMood", OPTIONAL_TEXT_MAX_LENGTH);
  if (!dreamMood.ok) {
    return dreamMood;
  }

  const userTimeZone = optionalStringField(body, "userTimeZone", TIME_ZONE_MAX_LENGTH);
  if (!userTimeZone.ok) {
    return userTimeZone;
  }

  const dreamAtmospheres = optionalIdArrayField(body, "dreamAtmospheres");
  if (!dreamAtmospheres.ok) {
    return dreamAtmospheres;
  }

  const dreamSensations = optionalIdArrayField(body, "dreamSensations");
  if (!dreamSensations.ok) {
    return dreamSensations;
  }

  const dreamSensationOther = optionalStringField(body, "dreamSensationOther", FEELING_OTHER_MAX_LENGTH);
  if (!dreamSensationOther.ok) {
    return dreamSensationOther;
  }

  const nightContext = validateNightContext(body.nightContext);
  if (!nightContext.ok) {
    return nightContext;
  }

  return {
    ok: true,
    value: {
      dreamText,
      ...(dreamDate.value ? { dreamDate: dreamDate.value } : {}),
      ...(wakeMood.value ? { wakeMood: wakeMood.value } : {}),
      ...(dreamMood.value ? { dreamMood: dreamMood.value } : {}),
      ...(dreamAtmospheres.value ? { dreamAtmospheres: dreamAtmospheres.value } : {}),
      ...(dreamSensations.value ? { dreamSensations: dreamSensations.value } : {}),
      ...(dreamSensationOther.value ? { dreamSensationOther: dreamSensationOther.value } : {}),
      ...(nightContext.value ? { nightContext: nightContext.value } : {}),
      ...(body.catReaderType ? { catReaderType: body.catReaderType as CatReaderType } : {}),
      ...(body.locale ? { locale: body.locale as "ko" | "en" } : {}),
      ...(userTimeZone.value ? { userTimeZone: userTimeZone.value } : {}),
    },
  };
}

export function resolveDreamRagVectorIndexPath(locale: unknown, env: EnvLike = process.env): string | undefined {
  if (locale === "ko") {
    return env.MANYANG_RAG_VECTOR_INDEX_PATH_KO ?? env.MANYANG_RAG_VECTOR_INDEX_PATH;
  }

  if (locale === "en") {
    return env.MANYANG_RAG_VECTOR_INDEX_PATH_EN ?? env.MANYANG_RAG_VECTOR_INDEX_PATH;
  }

  return env.MANYANG_RAG_VECTOR_INDEX_PATH;
}

export function resolveDreamLlmTimeoutMs(env: EnvLike = process.env): number {
  const configuredTimeoutMs = Number(env.MANYANG_LLM_TIMEOUT_MS);

  if (!Number.isFinite(configuredTimeoutMs) || configuredTimeoutMs <= 0) {
    return DEFAULT_LLM_PROVIDER_TIMEOUT_MS;
  }

  return Math.min(MAX_LLM_TIMEOUT_MS, Math.max(MIN_LLM_TIMEOUT_MS, Math.round(configuredTimeoutMs)));
}

export function shouldAllowMockDreamAnalysis(env: EnvLike = process.env): boolean {
  if (env.MANYANG_ANALYSIS_MODE === "llm") {
    return false;
  }

  if (env.NODE_ENV === "production") {
    return env.MANYANG_ALLOW_MOCK_ANALYSIS === "1";
  }

  return true;
}

async function createVectorAnalysisOptions(
  locale: unknown,
): Promise<Pick<AnalyzeDreamWithLlmOptions, "embeddingProvider" | "vectorIndex">> {
  const embeddingProvider = createOpenAIEmbeddingsProviderFromEnv(process.env);
  const vectorIndexPath = resolveDreamRagVectorIndexPath(locale);

  if (!embeddingProvider || !vectorIndexPath) {
    return {};
  }

  return {
    embeddingProvider,
    vectorIndex: await loadCachedDreamVectorIndex(vectorIndexPath),
  };
}

function createUnavailablePayload(
  reason: DreamReadingUnavailableReason,
  retryable: boolean,
  safetyNotice?: string,
): Extract<DreamReadingResult, { status: "unavailable" }> & { error: string } {
  return {
    status: "unavailable",
    error: "dream reading is unavailable",
    reason,
    retryable,
    ...(safetyNotice ? { safetyNotice } : {}),
  };
}

function getDefaultDreamDate(): string {
  return getManyangAppDate();
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

async function persistCompletedReadingForAuthenticatedUser(
  userId: string | null,
  requestBody: DreamAnalysisRequest,
  analysis: DreamAnalysisResponse,
  dependencies: Required<DreamAnalyzeRouteDependencies>,
): Promise<boolean> {
  if (!userId) {
    return false;
  }

  try {
    await dependencies.persistCompletedDreamReading({
      userId,
      dreamText: requestBody.dreamText,
      dreamDate: requestBody.dreamDate ?? getDefaultDreamDate(),
      ...(requestBody.catReaderType ? { catReaderType: requestBody.catReaderType } : {}),
      ...(requestBody.wakeMood ? { wakeMood: requestBody.wakeMood } : {}),
      ...(requestBody.dreamAtmospheres ? { dreamAtmospheres: requestBody.dreamAtmospheres } : {}),
      ...(requestBody.dreamSensations ? { dreamSensations: requestBody.dreamSensations } : {}),
      ...(requestBody.dreamSensationOther ? { dreamSensationOther: requestBody.dreamSensationOther } : {}),
      analysis,
    });

    return true;
  } catch {
    return false;
  }
}

async function findExistingReadingBestEffort(
  userId: string,
  dreamDate: string,
  dreamText: string,
  dependencies: Required<DreamAnalyzeRouteDependencies>,
): Promise<DreamAnalysisResponse | null> {
  try {
    return await dependencies.findCompletedReadingForUserDreamOnDate(userId, dreamDate, dreamText);
  } catch {
    return null;
  }
}

async function persistGuestBasicReadingUsageBestEffort(
  guestSession: GuestSession | null,
  dreamDate: string,
  dependencies: Required<DreamAnalyzeRouteDependencies>,
): Promise<boolean> {
  if (!guestSession) {
    return false;
  }

  try {
    await dependencies.persistGuestBasicReadingUsage({
      guestId: guestSession.guestId,
      dreamDate,
    });

    return true;
  } catch {
    return false;
  }
}

export async function handleDreamAnalyzeRequest(
  request: Request,
  dependencies: DreamAnalyzeRouteDependencies = {},
): Promise<Response> {
  const resolvedDependencies: Required<DreamAnalyzeRouteDependencies> = {
    getAuthenticatedUserId,
    getAccessPlanForUser: getDefaultAccessPlanForUser,
    isAdminUser: getDefaultIsAdminUser,
    findCompletedReadingForUserDreamOnDate,
    hasCompletedGuestBasicReadingOnDate,
    persistCompletedDreamReading,
    persistGuestBasicReadingUsage,
    createGuestId: randomUUID,
    ...dependencies,
  };

  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "invalid JSON body" }, { status: 400 });
    }

    const validatedBody = validateDreamAnalyzeRequestBody(body);

    if (!validatedBody.ok) {
      return Response.json({ error: validatedBody.error }, { status: 400 });
    }

    const userId = await resolvedDependencies.getAuthenticatedUserId();
    const accessPlan = await resolvedDependencies.getAccessPlanForUser(userId);
    const isAdmin = userId ? await resolvedDependencies.isAdminUser(userId) : false;
    const readingKind = getReadingKindForCatReader(validatedBody.value.catReaderType);
    const dreamDate = validatedBody.value.dreamDate ?? getDefaultDreamDate();

    // 리롤 잠금: 로그인 유저가 같은 날 같은 꿈을 다시 제출하면 새로 분석하지 않고
    // 이미 저장된 해몽을 그대로 돌려준다(같은 꿈 → 같은 해몽, 추가 비용 없음).
    // 어드민은 재테스트를 위해 통과시킨다.
    if (userId && !isAdmin) {
      const existingReading = await findExistingReadingBestEffort(
        userId,
        dreamDate,
        validatedBody.value.dreamText,
        resolvedDependencies,
      );

      if (existingReading) {
        return createJsonResponse(existingReading, undefined, null);
      }
    }

    const guestSession = !userId && readingKind === "basic"
      ? resolveGuestSession(request, resolvedDependencies.createGuestId)
      : null;
    // 횟수 제한은 게스트에게만 적용된다(로그인 유저는 서로 다른 꿈을 여러 번 기록 가능).
    const hasUsedBasicReadingToday = guestSession
      ? await resolvedDependencies.hasCompletedGuestBasicReadingOnDate(guestSession.guestId, dreamDate)
      : false;
    const readingGate = canRequestReading({
      accessPlan,
      readingKind,
      hasUsedBasicReadingToday,
      bypassAccessGate: isAdmin,
    });

    if (!readingGate.allowed) {
      return createJsonResponse(
        {
          error: "dream reading is locked",
          reason: readingGate.reason,
          ctaLabel: readingGate.ctaLabel,
          message: readingGate.message,
        },
        { status: 403 },
        guestSession,
      );
    }

    let provider: ReturnType<typeof createOpenAIResponsesProviderFromEnv>;

    try {
      provider = createOpenAIResponsesProviderFromEnv(process.env);
    } catch (error) {
      if (error instanceof LlmProviderConfigurationError) {
        const safetyNotice = analyzeDream(validatedBody.value).safetyNotice;

        return createJsonResponse(createUnavailablePayload("provider_missing", false, safetyNotice), { status: 503 }, guestSession);
      }

      throw error;
    }

    if (!provider && !shouldAllowMockDreamAnalysis()) {
      const safetyNotice = analyzeDream(validatedBody.value).safetyNotice;

      return createJsonResponse(createUnavailablePayload("provider_missing", false, safetyNotice), { status: 503 }, guestSession);
    }

    const vectorOptions = provider ? await createVectorAnalysisOptions(validatedBody.value.locale) : {};
    // 영어는 인-프로세스(서버 불필요), 그 외(ko)는 Kiwi 서비스(env로 on/off).
    const lemmatizer = provider
      ? validatedBody.value.locale === "en"
        ? createEnglishLemmatizer()
        : createKoreanLemmatizerFromEnv(process.env)
      : undefined;
    if (provider) {
      const result = await generateDreamReadingForUser(validatedBody.value, {
        provider,
        providerTimeoutMs: resolveDreamLlmTimeoutMs(),
        ...vectorOptions,
        ...(lemmatizer ? { lemmatizer } : {}),
      });

      if (result.status === "unavailable") {
        return createJsonResponse(
          createUnavailablePayload(result.reason, result.retryable, result.safetyNotice),
          { status: 503 },
          guestSession,
        );
      }

      await persistCompletedReadingForAuthenticatedUser(userId, validatedBody.value, result.response, resolvedDependencies);
      await persistGuestBasicReadingUsageBestEffort(guestSession, dreamDate, resolvedDependencies);

      return createJsonResponse(result.response, undefined, guestSession);
    }

    const analysis = analyzeDream(validatedBody.value);

    await persistCompletedReadingForAuthenticatedUser(userId, validatedBody.value, analysis, resolvedDependencies);
    await persistGuestBasicReadingUsageBestEffort(guestSession, dreamDate, resolvedDependencies);

    return createJsonResponse(analysis, undefined, guestSession);
  } catch (error) {
    if (error instanceof LlmProviderConfigurationError || error instanceof EmbeddingProviderConfigurationError) {
      return createJsonResponse(createUnavailablePayload("provider_missing", false), { status: 503 });
    }

    if (error instanceof Error && error.message === "dreamText is required") {
      return createJsonResponse({ error: error.message }, { status: 400 });
    }

    return createJsonResponse({ error: "failed to analyze dream" }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  return handleDreamAnalyzeRequest(request);
}
