import { createProfileExportForUser, type AuthenticatedProfileExportPayload } from "@/lib/server/profile-export";
import { getAuthenticatedUserId } from "@/lib/supabase/server";

export const runtime = "nodejs";

export type ProfileExportRouteDependencies = {
  getAuthenticatedUserId?: () => Promise<string | null>;
  createProfileExportForUser?: (userId: string) => Promise<AuthenticatedProfileExportPayload>;
};

export async function handleProfileExportRequest(
  request: Request,
  dependencies: ProfileExportRouteDependencies = {},
): Promise<Response> {
  const resolvedDependencies: Required<ProfileExportRouteDependencies> = {
    getAuthenticatedUserId,
    createProfileExportForUser,
    ...dependencies,
  };

  if (request.method !== "GET") {
    return Response.json({ error: "method not allowed" }, { status: 405 });
  }

  const userId = await resolvedDependencies.getAuthenticatedUserId();

  if (!userId) {
    return Response.json({ error: "authentication required" }, { status: 401 });
  }

  const payload = await resolvedDependencies.createProfileExportForUser(userId);

  return Response.json(payload);
}

export async function GET(request: Request): Promise<Response> {
  return handleProfileExportRequest(request);
}
