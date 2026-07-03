import type { DailyTarotReading } from "./daily-tarot";
import type { DreamCompletedPayload } from "./dream-storage";

export type ShareRecordKind = "dream" | "tarot";

export type CreateShareRecordInput = {
  kind: ShareRecordKind;
  payload: Record<string, unknown>;
};

export type CreateShareRecordValidationResult =
  | {
      ok: true;
      value: CreateShareRecordInput;
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

export function isShareRecordKind(value: unknown): value is ShareRecordKind {
  return value === "dream" || value === "tarot";
}

export function validateCreateShareRecordRequestBody(body: unknown): CreateShareRecordValidationResult {
  if (!isRecord(body)) {
    return { ok: false, error: "request body must be an object" };
  }

  if (!isShareRecordKind(body.kind)) {
    return { ok: false, error: "kind must be dream or tarot" };
  }

  if (!isRecord(body.payload)) {
    return { ok: false, error: "payload is required" };
  }

  return {
    ok: true,
    value: {
      kind: body.kind,
      payload: body.payload,
    },
  };
}

export function validateShareRecordSlug(slug: string): string | null {
  return /^[a-zA-Z0-9_-]{1,96}$/.test(slug) ? slug : null;
}

export function createShareRecordPath(kind: ShareRecordKind, slug: string): string {
  return `/share/${kind}/${slug}`;
}

export function createShareUrl(origin: string, kind: ShareRecordKind, slug: string): string {
  return new URL(createShareRecordPath(kind, slug), origin).toString();
}

export function isSharedDreamPayload(value: unknown): value is DreamCompletedPayload {
  if (!isRecord(value) || !isRecord(value.analysis)) {
    return false;
  }

  const analysis = value.analysis;

  return (
    typeof value.dreamText === "string" &&
    typeof value.dreamDate === "string" &&
    typeof analysis.dreamId === "string" &&
    typeof analysis.summary === "string" &&
    typeof analysis.interpretation === "string" &&
    typeof analysis.smallPrescription === "string" &&
    isStringArray(analysis.symbols) &&
    isStringArray(analysis.emotions) &&
    isStringArray(analysis.themes) &&
    Array.isArray(analysis.symbolReadings) &&
    isRecord(analysis.readingBasis) &&
    isRecord(analysis.card) &&
    isRecord(analysis.reader)
  );
}

function isTarotSpread(value: unknown): value is DailyTarotReading["spread"] {
  return value === "daily_one_card" || value === "question_one_card" || value === "daily_three_card";
}

function isTarotQuestionContext(value: unknown): value is NonNullable<DailyTarotReading["questionContext"]> {
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

function isTarotUnlockMethod(value: unknown): value is NonNullable<DailyTarotReading["unlockMethod"]> {
  return value === "daily_free" || value === "rewarded_ad" || value === "moon_pass" || value === "admin";
}

export function isSharedTarotPayload(value: unknown): value is DailyTarotReading {
  if (!isRecord(value) || !isRecord(value.card) || !isRecord(value.generated)) {
    return false;
  }

  const hasValidQuestionContext =
    value.spread === "question_one_card"
      ? isTarotQuestionContext(value.questionContext) && isTarotUnlockMethod(value.unlockMethod)
      : value.questionContext === undefined &&
        (value.unlockMethod === undefined || isTarotUnlockMethod(value.unlockMethod));

  return (
    typeof value.id === "string" &&
    typeof value.appDate === "string" &&
    typeof value.selectedAt === "string" &&
    isTarotSpread(value.spread) &&
    value.source === "llm" &&
    typeof value.card.id === "number" &&
    (value.orientation === "upright" || value.orientation === "reversed") &&
    (value.position === "today" || value.position === "situation" || value.position === "flow" || value.position === "advice") &&
    Array.isArray(value.cards) &&
    typeof value.generated.title === "string" &&
    typeof value.generated.overview === "string" &&
    Array.isArray(value.generated.cardReadings) &&
    typeof value.generated.advice === "string" &&
    isStringArray(value.keywords) &&
    typeof value.title === "string" &&
    typeof value.message === "string" &&
    typeof value.advice === "string" &&
    hasValidQuestionContext
  );
}
