import { deleteAllProductRecordsForUser } from "@/lib/server/manyang-db";
import { getAuthenticatedUserId } from "@/lib/supabase/server";

export const runtime = "nodejs";

export type ProfileRecordsRouteDependencies = {
  getAuthenticatedUserId?: () => Promise<string | null>;
  deleteAllProductRecordsForUser?: (userId: string) => Promise<void>;
};

export async function handleProfileRecordsRequest(
  request: Request,
  dependencies: ProfileRecordsRouteDependencies = {},
): Promise<Response> {
  const resolvedDependencies: Required<ProfileRecordsRouteDependencies> = {
    getAuthenticatedUserId,
    deleteAllProductRecordsForUser,
    ...dependencies,
  };

  if (request.method !== "DELETE") {
    return Response.json({ error: "method not allowed" }, { status: 405 });
  }

  const userId = await resolvedDependencies.getAuthenticatedUserId();

  if (!userId) {
    return Response.json({ error: "authentication required" }, { status: 401 });
  }

  await resolvedDependencies.deleteAllProductRecordsForUser(userId);

  return Response.json({ deleted: true });
}

export async function DELETE(request: Request): Promise<Response> {
  return handleProfileRecordsRequest(request);
}
