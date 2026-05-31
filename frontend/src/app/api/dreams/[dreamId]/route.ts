import { deleteDreamRecordForUser } from "@/lib/server/manyang-db";
import { getAuthenticatedUserId } from "@/lib/supabase/server";

export const runtime = "nodejs";

type DreamRecordRouteContext = {
  params: Promise<{
    dreamId: string;
  }>;
};

export type DeleteDreamRecordRouteDependencies = {
  getAuthenticatedUserId?: () => Promise<string | null>;
  deleteDreamRecordForUser?: (userId: string, dreamId: string) => Promise<boolean>;
};

export async function handleDeleteDreamRecordRequest(
  _request: Request,
  context: DreamRecordRouteContext,
  dependencies: DeleteDreamRecordRouteDependencies = {},
): Promise<Response> {
  const resolvedDependencies: Required<DeleteDreamRecordRouteDependencies> = {
    getAuthenticatedUserId,
    deleteDreamRecordForUser,
    ...dependencies,
  };
  const userId = await resolvedDependencies.getAuthenticatedUserId();

  if (!userId) {
    return Response.json({ error: "authentication required" }, { status: 401 });
  }

  const { dreamId } = await context.params;
  const deleted = await resolvedDependencies.deleteDreamRecordForUser(userId, dreamId);

  if (!deleted) {
    return Response.json({ error: "dream record not found" }, { status: 404 });
  }

  return Response.json({ deleted: true });
}

export async function DELETE(request: Request, context: DreamRecordRouteContext): Promise<Response> {
  return handleDeleteDreamRecordRequest(request, context);
}
