import { randomBytes } from "node:crypto";

import { createShareRecordPath, createShareUrl, validateCreateShareRecordRequestBody } from "@/lib/share-records";
import {
  persistSharedResult,
  type PersistSharedResultInput,
  type SharedResultRecord,
} from "@/lib/server/manyang-db";
import { getAuthenticatedUserId } from "@/lib/supabase/server";

export const runtime = "nodejs";

export type ShareResultsRouteDependencies = {
  createPublicId?: () => string;
  getAuthenticatedUserId?: () => Promise<string | null>;
  persistSharedResult?: (input: PersistSharedResultInput) => Promise<SharedResultRecord>;
};

function createPublicShareId(): string {
  return randomBytes(12).toString("base64url");
}

export async function handleShareResultsRequest(
  request: Request,
  dependencies: ShareResultsRouteDependencies = {},
): Promise<Response> {
  if (request.method !== "POST") {
    return Response.json({ error: "method not allowed" }, { status: 405 });
  }

  const resolvedDependencies: Required<ShareResultsRouteDependencies> = {
    createPublicId: createPublicShareId,
    getAuthenticatedUserId,
    persistSharedResult,
    ...dependencies,
  };

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const validatedBody = validateCreateShareRecordRequestBody(body);

  if (!validatedBody.ok) {
    return Response.json({ error: validatedBody.error }, { status: 400 });
  }

  const publicId = resolvedDependencies.createPublicId();
  const userId = await resolvedDependencies.getAuthenticatedUserId();
  const record = await resolvedDependencies.persistSharedResult({
    publicId,
    kind: validatedBody.value.kind,
    payload: validatedBody.value.payload,
    userId,
  });
  const path = createShareRecordPath(record.kind, record.id);

  return Response.json(
    {
      id: record.id,
      path,
      url: createShareUrl(new URL(request.url).origin, record.kind, record.id),
    },
    { status: 201 },
  );
}

export async function POST(request: Request): Promise<Response> {
  return handleShareResultsRequest(request);
}
