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
  isAdminUser as isAdminUserFromDb,
  type PersistCompletedTarotReadingInput,
} from "@/lib/server/manyang-db";
import { getAuthenticatedAccessPlan, getAuthenticatedUserId } from "@/lib/supabase/server";
import type {
  DailyTarotCardSelection,
  DailyTarotPosition,
  DailyTarotReading,
  TarotOrientation,
  TarotSpread,
} from "@/lib/daily-tarot";
import { isPaidAccessPlan, type AccessPlan } from "@/lib/access-policy";

export const runtime = "nodejs";

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

function createDailyTarotReadingFromGenerated(
  input: TarotReadingRequestBody,
  selections: DailyTarotCardSelection[],
  generated: Extract<TarotReadingResult, { status: "ok" }>["reading"],
): DailyTarotReading {
  const primarySelection = selections[0] as DailyTarotCardSelection & { card: TarotMajorCard };

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
    keywords: [...primarySelection.card.keywords],
    title: generated.title,
    message: generated.overview,
    advice: generated.advice,
    generated,
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

  if (validatedBody.value.spread === "daily_three_card" && !isAdmin && !isPaidAccessPlan(accessPlan)) {
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
      return Response.json(createUnavailablePayload("provider_missing", false), { status: 503 });
    }

    throw error;
  }

  if (!provider) {
    return Response.json(createUnavailablePayload("provider_missing", false), { status: 503 });
  }

  const selections = validatedBody.value.selections.map(resolveSelection);
  const result = await resolvedDependencies.generateTarotReadingForUser(
    createTarotReadingInput(validatedBody.value, selections),
    { provider },
  );

  if (result.status === "unavailable") {
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
