import { createMorningMoodRecord, morningThoughtMaxLength, type MorningMoodRecord } from "@/lib/morning-mood";
import {
  listMorningCheckInsForUser,
  persistMorningCheckInForUser,
  type PersistMorningCheckInForUserInput,
} from "@/lib/server/manyang-db";
import { getAuthenticatedUserId } from "@/lib/supabase/server";

export const runtime = "nodejs";

const FIELD_MAX_LENGTH = 80;
const COLOR_MAX_LENGTH = 40;

export type MorningCheckInsRouteDependencies = {
  getAuthenticatedUserId?: () => Promise<string | null>;
  listMorningCheckInsForUser?: (userId: string) => Promise<MorningMoodRecord[]>;
  persistMorningCheckInForUser?: (input: PersistMorningCheckInForUserInput) => Promise<MorningMoodRecord>;
};

type MorningCheckInValidationResult =
  | {
      ok: true;
      value: Omit<PersistMorningCheckInForUserInput, "userId">;
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
  fieldName: "mood" | "moodColor" | "bodyFeeling",
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

export function validateMorningCheckInRequestBody(body: unknown): MorningCheckInValidationResult {
  if (!isRecord(body)) {
    return { ok: false, error: "request body must be an object" };
  }

  if (typeof body.moodDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.moodDate)) {
    return { ok: false, error: "moodDate must use YYYY-MM-DD" };
  }

  const mood = requiredStringField(body, "mood", FIELD_MAX_LENGTH);
  if (!mood.ok) {
    return mood;
  }

  const moodColor = requiredStringField(body, "moodColor", COLOR_MAX_LENGTH);
  if (!moodColor.ok) {
    return moodColor;
  }

  const bodyFeeling = requiredStringField(body, "bodyFeeling", FIELD_MAX_LENGTH);
  if (!bodyFeeling.ok) {
    return bodyFeeling;
  }

  if (body.thought !== undefined && typeof body.thought !== "string") {
    return { ok: false, error: "thought must be a string" };
  }

  const thought = typeof body.thought === "string" ? body.thought.trim().slice(0, morningThoughtMaxLength) : "";

  return {
    ok: true,
    value: createMorningMoodRecord({
      moodDate: body.moodDate,
      mood: mood.value,
      moodColor: moodColor.value,
      bodyFeeling: bodyFeeling.value,
      thought,
    }),
  };
}

export async function handleMorningCheckInsRequest(
  request: Request,
  dependencies: MorningCheckInsRouteDependencies = {},
): Promise<Response> {
  const resolvedDependencies: Required<MorningCheckInsRouteDependencies> = {
    getAuthenticatedUserId,
    listMorningCheckInsForUser,
    persistMorningCheckInForUser,
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

    const validatedBody = validateMorningCheckInRequestBody(body);

    if (!validatedBody.ok) {
      return Response.json({ error: validatedBody.error }, { status: 400 });
    }

    const record = await resolvedDependencies.persistMorningCheckInForUser({
      userId,
      ...validatedBody.value,
    });

    return Response.json({ record }, { status: 201 });
  }

  if (request.method !== "GET") {
    return Response.json({ error: "method not allowed" }, { status: 405 });
  }

  const records = await resolvedDependencies.listMorningCheckInsForUser(userId);

  return Response.json({ records });
}

export async function GET(request: Request): Promise<Response> {
  return handleMorningCheckInsRequest(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleMorningCheckInsRequest(request);
}
