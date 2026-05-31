import {
  listPawprintsForUser,
  persistPawprintForUser,
  type PersistPawprintForUserInput,
} from "@/lib/server/manyang-db";
import { getAuthenticatedUserId } from "@/lib/supabase/server";
import type { PawprintRecord, PawprintSaveResult, PawprintSource } from "@/lib/pawprints";

export const runtime = "nodejs";

const validPawprintSources = new Set<PawprintSource>(["morning_record", "forgotten_dream", "receipt_saved"]);
const SOURCE_ID_MAX_LENGTH = 160;

export type PawprintsRouteDependencies = {
  getAuthenticatedUserId?: () => Promise<string | null>;
  listPawprintsForUser?: (userId: string) => Promise<PawprintRecord[]>;
  persistPawprintForUser?: (input: PersistPawprintForUserInput) => Promise<PawprintSaveResult>;
};

type PawprintValidationResult =
  | {
      ok: true;
      value: Omit<PersistPawprintForUserInput, "userId">;
    }
  | {
      ok: false;
      error: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validatePawprintRequestBody(body: unknown): PawprintValidationResult {
  if (!isRecord(body)) {
    return { ok: false, error: "request body must be an object" };
  }

  if (typeof body.appDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.appDate)) {
    return { ok: false, error: "appDate must use YYYY-MM-DD" };
  }

  if (typeof body.source !== "string" || !validPawprintSources.has(body.source as PawprintSource)) {
    return { ok: false, error: "source must be one of: morning_record, forgotten_dream, receipt_saved" };
  }

  if (typeof body.sourceId !== "string") {
    return { ok: false, error: "sourceId is required" };
  }

  const sourceId = body.sourceId.trim();

  if (sourceId.length === 0 || sourceId.length > SOURCE_ID_MAX_LENGTH) {
    return { ok: false, error: `sourceId must be 1 to ${SOURCE_ID_MAX_LENGTH} characters` };
  }

  return {
    ok: true,
    value: {
      appDate: body.appDate,
      source: body.source as PawprintSource,
      sourceId,
    },
  };
}

export async function handlePawprintsRequest(
  request: Request,
  dependencies: PawprintsRouteDependencies = {},
): Promise<Response> {
  const resolvedDependencies: Required<PawprintsRouteDependencies> = {
    getAuthenticatedUserId,
    listPawprintsForUser,
    persistPawprintForUser,
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

    const validatedBody = validatePawprintRequestBody(body);

    if (!validatedBody.ok) {
      return Response.json({ error: validatedBody.error }, { status: 400 });
    }

    const result = await resolvedDependencies.persistPawprintForUser({
      userId,
      ...validatedBody.value,
    });

    return Response.json(result, { status: result.created ? 201 : 200 });
  }

  if (request.method !== "GET") {
    return Response.json({ error: "method not allowed" }, { status: 405 });
  }

  const records = await resolvedDependencies.listPawprintsForUser(userId);

  return Response.json({ records });
}

export async function GET(request: Request): Promise<Response> {
  return handlePawprintsRequest(request);
}

export async function POST(request: Request): Promise<Response> {
  return handlePawprintsRequest(request);
}
