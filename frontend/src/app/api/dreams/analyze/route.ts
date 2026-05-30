import {
  analyzeDream,
  createOpenAIEmbeddingsProviderFromEnv,
  createOpenAIResponsesProviderFromEnv,
  DEFAULT_LLM_PROVIDER_TIMEOUT_MS,
  EmbeddingProviderConfigurationError,
  generateDreamReadingForUser,
  loadCachedDreamVectorIndex,
  LlmProviderConfigurationError,
  type AnalyzeDreamWithLlmOptions,
  type CatReaderType,
  type DreamAnalysisRequest,
  type DreamReadingResult,
  type DreamReadingUnavailableReason,
} from "@manyang/backend";

type EnvLike = Record<string, string | undefined>;
const MIN_LLM_TIMEOUT_MS = 1_000;
const MAX_LLM_TIMEOUT_MS = 60_000;
export const DREAM_ANALYZE_MAX_DREAM_TEXT_LENGTH = 1000;
const OPTIONAL_TEXT_MAX_LENGTH = 160;
const TIME_ZONE_MAX_LENGTH = 80;
const FEELING_IDS_MAX_ITEMS = 4;
const FEELING_ID_MAX_LENGTH = 32;
const FEELING_OTHER_MAX_LENGTH = 30;
const validLocales = new Set(["ko", "en"]);
const validCatReaderTypes = new Set(["black_cat", "white_cat", "cheese_cat", "gray_cat"]);

type DreamAnalyzeValidationResult =
  | {
      ok: true;
      value: DreamAnalysisRequest;
    }
  | {
      ok: false;
      error: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

export async function POST(request: Request): Promise<Response> {
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

    let provider: ReturnType<typeof createOpenAIResponsesProviderFromEnv>;

    try {
      provider = createOpenAIResponsesProviderFromEnv(process.env);
    } catch (error) {
      if (error instanceof LlmProviderConfigurationError) {
        const safetyNotice = analyzeDream(validatedBody.value).safetyNotice;

        return Response.json(createUnavailablePayload("provider_missing", false, safetyNotice), { status: 503 });
      }

      throw error;
    }

    const vectorOptions = provider ? await createVectorAnalysisOptions(validatedBody.value.locale) : {};
    if (provider) {
      const result = await generateDreamReadingForUser(validatedBody.value, {
        provider,
        providerTimeoutMs: resolveDreamLlmTimeoutMs(),
        ...vectorOptions,
      });

      if (result.status === "unavailable") {
        return Response.json(createUnavailablePayload(result.reason, result.retryable, result.safetyNotice), { status: 503 });
      }

      return Response.json(result.response);
    }

    return Response.json(analyzeDream(validatedBody.value));
  } catch (error) {
    if (error instanceof LlmProviderConfigurationError || error instanceof EmbeddingProviderConfigurationError) {
      return Response.json(createUnavailablePayload("provider_missing", false), { status: 503 });
    }

    if (error instanceof Error && error.message === "dreamText is required") {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ error: "failed to analyze dream" }, { status: 500 });
  }
}
