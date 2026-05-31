import type { NightCheckInRecord } from "@/lib/night-checkin";
import { nightCheckInNoteMaxLength } from "@/lib/night-checkin-options";
import {
  listNightCheckInsForUser,
  persistNightCheckInForUser,
  type PersistNightCheckInForUserInput,
} from "@/lib/server/manyang-db";
import { getAuthenticatedUserId } from "@/lib/supabase/server";

export const runtime = "nodejs";

const OPTION_ID_MAX_LENGTH = 48;
const OPTION_LABEL_MAX_LENGTH = 80;

export type NightCheckInsRouteDependencies = {
  getAuthenticatedUserId?: () => Promise<string | null>;
  listNightCheckInsForUser?: (userId: string) => Promise<NightCheckInRecord[]>;
  persistNightCheckInForUser?: (input: PersistNightCheckInForUserInput) => Promise<NightCheckInRecord>;
};

type NightCheckInValidationResult =
  | {
      ok: true;
      value: Omit<PersistNightCheckInForUserInput, "userId">;
    }
  | {
      ok: false;
      error: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredStringField(
  body: Record<string, unknown>,
  fieldName: "moodId" | "moodLabel" | "conditionId" | "conditionLabel",
  maxLength: number,
): { ok: true; value: string } | { ok: false; error: string } {
  const value = body[fieldName];

  if (typeof value !== "string") {
    return { ok: false, error: `${fieldName} is required` };
  }

  const trimmed = value.trim();

  if (trimmed.length === 0 || trimmed.length > maxLength) {
    return { ok: false, error: `${fieldName} must be 1 to ${maxLength} characters` };
  }

  return { ok: true, value: trimmed };
}

export function validateNightCheckInRequestBody(body: unknown): NightCheckInValidationResult {
  if (!isRecord(body)) {
    return { ok: false, error: "request body must be an object" };
  }

  if (typeof body.checkInDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.checkInDate)) {
    return { ok: false, error: "checkInDate must use YYYY-MM-DD" };
  }

  const moodId = requiredStringField(body, "moodId", OPTION_ID_MAX_LENGTH);
  if (!moodId.ok) {
    return moodId;
  }

  const moodLabel = requiredStringField(body, "moodLabel", OPTION_LABEL_MAX_LENGTH);
  if (!moodLabel.ok) {
    return moodLabel;
  }

  const conditionId = requiredStringField(body, "conditionId", OPTION_ID_MAX_LENGTH);
  if (!conditionId.ok) {
    return conditionId;
  }

  const conditionLabel = requiredStringField(body, "conditionLabel", OPTION_LABEL_MAX_LENGTH);
  if (!conditionLabel.ok) {
    return conditionLabel;
  }

  if (body.note !== undefined && typeof body.note !== "string") {
    return { ok: false, error: "note must be a string" };
  }

  const note = typeof body.note === "string" ? body.note.trim().slice(0, nightCheckInNoteMaxLength) : "";

  return {
    ok: true,
    value: {
      checkInDate: body.checkInDate,
      moodId: moodId.value,
      moodLabel: moodLabel.value,
      conditionId: conditionId.value,
      conditionLabel: conditionLabel.value,
      note,
    },
  };
}

export async function handleNightCheckInsRequest(
  request: Request,
  dependencies: NightCheckInsRouteDependencies = {},
): Promise<Response> {
  const resolvedDependencies: Required<NightCheckInsRouteDependencies> = {
    getAuthenticatedUserId,
    listNightCheckInsForUser,
    persistNightCheckInForUser,
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

    const validatedBody = validateNightCheckInRequestBody(body);

    if (!validatedBody.ok) {
      return Response.json({ error: validatedBody.error }, { status: 400 });
    }

    const record = await resolvedDependencies.persistNightCheckInForUser({
      userId,
      ...validatedBody.value,
    });

    return Response.json({ record }, { status: 201 });
  }

  if (request.method !== "GET") {
    return Response.json({ error: "method not allowed" }, { status: 405 });
  }

  const records = await resolvedDependencies.listNightCheckInsForUser(userId);

  return Response.json({ records });
}

export async function GET(request: Request): Promise<Response> {
  return handleNightCheckInsRequest(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleNightCheckInsRequest(request);
}
