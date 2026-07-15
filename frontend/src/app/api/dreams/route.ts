import { CAT_READER_TYPES } from "@manyang/contracts/dream";

import { listDreamRecordsForUser, persistCompletedDreamReading } from "@/lib/server/manyang-db";
import { getAuthenticatedUserId } from "@/lib/supabase/server";
import type { DreamCompletedPayload, DreamRecord } from "@/lib/dream-storage";
import type { PersistCompletedDreamReadingInput } from "@/lib/manyang-dream-records";

export const runtime = "nodejs";

const DREAM_TEXT_MAX_LENGTH = 1000;
const FEELING_IDS_MAX_ITEMS = 4;
const FEELING_ID_MAX_LENGTH = 32;
const FEELING_OTHER_MAX_LENGTH = 30;
const validCatReaderTypes = new Set<string>(CAT_READER_TYPES);

export type DreamRecordsRouteDependencies = {
  getAuthenticatedUserId?: () => Promise<string | null>;
  listDreamRecordsForUser?: (userId: string) => Promise<DreamRecord[]>;
  persistCompletedDreamReading?: (input: PersistCompletedDreamReadingInput) => Promise<string>;
};

type SaveLatestDreamValidationResult =
  | {
      ok: true;
      value: Omit<PersistCompletedDreamReadingInput, "userId">;
    }
  | {
      ok: false;
      error: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function optionalStringArrayField(
  body: Record<string, unknown>,
  fieldName: "dreamAtmospheres" | "dreamSensations",
): { ok: true; value?: string[] } | { ok: false; error: string } {
  const value = body[fieldName];

  if (value === undefined) {
    return { ok: true };
  }

  if (!isStringArray(value) || value.length > FEELING_IDS_MAX_ITEMS) {
    return { ok: false, error: `${fieldName} must be an array of strings` };
  }

  const ids: string[] = [];
  for (const item of value) {
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
  fieldName: "catReaderType" | "wakeMood" | "dreamSensationOther",
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

  if (!trimmed) {
    return { ok: true };
  }

  if (trimmed.length > maxLength) {
    return { ok: false, error: `${fieldName} must be ${maxLength} characters or fewer` };
  }

  return { ok: true, value: trimmed };
}

function hasRequiredDreamAnalysisShape(value: unknown): value is DreamCompletedPayload["analysis"] {
  if (!isRecord(value)) {
    return false;
  }

  if (
    typeof value.dreamId !== "string" ||
    typeof value.analysisId !== "string" ||
    typeof value.cardId !== "string" ||
    typeof value.summary !== "string" ||
    typeof value.interpretation !== "string" ||
    typeof value.smallPrescription !== "string"
  ) {
    return false;
  }

  if (
    !isStringArray(value.symbols) ||
    !isStringArray(value.emotions) ||
    !isStringArray(value.themes) ||
    !Array.isArray(value.symbolReadings)
  ) {
    return false;
  }

  if (!isRecord(value.reader) || !isRecord(value.readingBasis) || !isRecord(value.card)) {
    return false;
  }

  return (
    typeof value.reader.id === "string" &&
    typeof value.reader.name === "string" &&
    typeof value.reader.access === "string" &&
    isStringArray(value.readingBasis.usedSymbols) &&
    isStringArray(value.readingBasis.mainThemes) &&
    typeof value.readingBasis.confidence === "number" &&
    typeof value.card.name === "string" &&
    typeof value.card.type === "string" &&
    isStringArray(value.card.keywords) &&
    typeof value.card.summary === "string" &&
    typeof value.card.message === "string" &&
    typeof value.card.theme === "string"
  );
}

export function validateSaveLatestDreamRequestBody(body: unknown): SaveLatestDreamValidationResult {
  if (!isRecord(body)) {
    return { ok: false, error: "request body must be an object" };
  }

  if (typeof body.dreamText !== "string" || body.dreamText.trim().length === 0) {
    return { ok: false, error: "dreamText is required" };
  }

  const dreamText = body.dreamText.trim();
  if (dreamText.length > DREAM_TEXT_MAX_LENGTH) {
    return { ok: false, error: `dreamText must be ${DREAM_TEXT_MAX_LENGTH} characters or fewer` };
  }

  if (typeof body.dreamDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.dreamDate)) {
    return { ok: false, error: "dreamDate must use YYYY-MM-DD" };
  }

  const catReaderType = optionalStringField(body, "catReaderType", 32);
  if (!catReaderType.ok) {
    return catReaderType;
  }
  if (catReaderType.value && !validCatReaderTypes.has(catReaderType.value)) {
    return { ok: false, error: "catReaderType must be one of: black_cat, white_cat, cheese_cat, gray_cat" };
  }

  const wakeMood = optionalStringField(body, "wakeMood", 160);
  if (!wakeMood.ok) {
    return wakeMood;
  }

  const dreamAtmospheres = optionalStringArrayField(body, "dreamAtmospheres");
  if (!dreamAtmospheres.ok) {
    return dreamAtmospheres;
  }

  const dreamSensations = optionalStringArrayField(body, "dreamSensations");
  if (!dreamSensations.ok) {
    return dreamSensations;
  }

  const dreamSensationOther = optionalStringField(body, "dreamSensationOther", FEELING_OTHER_MAX_LENGTH);
  if (!dreamSensationOther.ok) {
    return dreamSensationOther;
  }

  if (!hasRequiredDreamAnalysisShape(body.analysis)) {
    return { ok: false, error: "analysis must be a completed dream analysis response" };
  }

  return {
    ok: true,
    value: {
      dreamText,
      dreamDate: body.dreamDate,
      ...(catReaderType.value ? { catReaderType: catReaderType.value as DreamCompletedPayload["catReaderType"] } : {}),
      ...(wakeMood.value ? { wakeMood: wakeMood.value } : {}),
      ...(dreamAtmospheres.value ? { dreamAtmospheres: dreamAtmospheres.value } : {}),
      ...(dreamSensations.value ? { dreamSensations: dreamSensations.value } : {}),
      ...(dreamSensationOther.value ? { dreamSensationOther: dreamSensationOther.value } : {}),
      analysis: body.analysis,
    },
  };
}

export async function handleDreamRecordsRequest(
  request: Request,
  dependencies: DreamRecordsRouteDependencies = {},
): Promise<Response> {
  const resolvedDependencies: Required<DreamRecordsRouteDependencies> = {
    getAuthenticatedUserId,
    listDreamRecordsForUser,
    persistCompletedDreamReading,
    ...dependencies,
  };
  const userId = await resolvedDependencies.getAuthenticatedUserId();

  if (!userId) {
    return Response.json({ error: "authentication required" }, { status: 401 });
  }

  if (request.method === "POST") {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "invalid JSON body" }, { status: 400 });
    }

    const validatedBody = validateSaveLatestDreamRequestBody(body);

    if (!validatedBody.ok) {
      return Response.json({ error: validatedBody.error }, { status: 400 });
    }

    const dreamId = await resolvedDependencies.persistCompletedDreamReading({
      userId,
      ...validatedBody.value,
    });

    return Response.json({ dreamId }, { status: 201 });
  }

  if (request.method !== "GET") {
    return Response.json({ error: "method not allowed" }, { status: 405 });
  }

  const records = await resolvedDependencies.listDreamRecordsForUser(userId);

  return Response.json({ records });
}

export async function GET(request: Request): Promise<Response> {
  return handleDreamRecordsRequest(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleDreamRecordsRequest(request);
}
