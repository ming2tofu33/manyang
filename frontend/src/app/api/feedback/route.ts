import {
  persistFeedbackEvent,
  type FeedbackSubjectType,
  type PersistFeedbackEventInput,
} from "@/lib/server/manyang-db";
import { getAuthenticatedUserId } from "@/lib/supabase/server";

export const runtime = "nodejs";

const feedbackSubjectTypes: FeedbackSubjectType[] = [
  "dream_reading",
  "tarot_reading",
  "archive_record",
  "app_flow",
];
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type FeedbackRouteDependencies = {
  getAuthenticatedUserId?: () => Promise<string | null>;
  persistFeedbackEvent?: (input: PersistFeedbackEventInput) => Promise<string>;
};

type FeedbackValidationResult =
  | {
      ok: true;
      value: Omit<PersistFeedbackEventInput, "userId"> & { guestId: string | null };
    }
  | {
      ok: false;
      error: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFeedbackSubjectType(value: unknown): value is FeedbackSubjectType {
  return typeof value === "string" && feedbackSubjectTypes.includes(value as FeedbackSubjectType);
}

function validateFeedbackRequestBody(body: unknown): FeedbackValidationResult {
  if (!isRecord(body)) {
    return { ok: false, error: "request body must be an object" };
  }

  if (!isFeedbackSubjectType(body.subjectType)) {
    return { ok: false, error: "subjectType is invalid" };
  }

  if (body.guestId !== undefined && (typeof body.guestId !== "string" || !uuidPattern.test(body.guestId))) {
    return { ok: false, error: "guestId must be a UUID" };
  }

  if (body.subjectId !== undefined && typeof body.subjectId !== "string") {
    return { ok: false, error: "subjectId must be a string" };
  }

  if (body.rating !== undefined && body.rating !== null) {
    if (typeof body.rating !== "number" || !Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) {
      return { ok: false, error: "rating must be 1 to 5" };
    }
  }

  if (body.feedbackText !== undefined && typeof body.feedbackText !== "string") {
    return { ok: false, error: "feedbackText must be a string" };
  }

  const feedbackText = typeof body.feedbackText === "string" ? body.feedbackText.trim() : null;

  if (feedbackText && feedbackText.length > 1000) {
    return { ok: false, error: "feedbackText must be at most 1000 characters" };
  }

  const metadata = isRecord(body.metadata) ? body.metadata : {};

  return {
    ok: true,
    value: {
      guestId: typeof body.guestId === "string" ? body.guestId : null,
      subjectType: body.subjectType,
      subjectId: typeof body.subjectId === "string" ? body.subjectId.trim() || null : null,
      rating: typeof body.rating === "number" ? body.rating : null,
      feedbackText,
      metadata,
    },
  };
}

export async function handleFeedbackRequest(
  request: Request,
  dependencies: FeedbackRouteDependencies = {},
): Promise<Response> {
  const resolvedDependencies: Required<FeedbackRouteDependencies> = {
    getAuthenticatedUserId,
    persistFeedbackEvent,
    ...dependencies,
  };

  if (request.method !== "POST") {
    return Response.json({ error: "method not allowed" }, { status: 405 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const validatedBody = validateFeedbackRequestBody(body);

  if (!validatedBody.ok) {
    return Response.json({ error: validatedBody.error }, { status: 400 });
  }

  const userId = await resolvedDependencies.getAuthenticatedUserId();

  if (!userId && !validatedBody.value.guestId) {
    return Response.json({ error: "guestId is required for guest feedback" }, { status: 400 });
  }

  const id = await resolvedDependencies.persistFeedbackEvent({
    userId,
    ...validatedBody.value,
  });

  return Response.json({ id }, { status: 201 });
}

export async function POST(request: Request): Promise<Response> {
  return handleFeedbackRequest(request);
}
