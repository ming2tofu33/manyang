import type { LatestAnalysisPayload } from "./dream-storage";

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type SaveLatestDreamToArchiveResult =
  | {
      status: "saved";
      dreamId: string;
    }
  | {
      status: "not_completed" | "unauthenticated" | "error";
    };

export async function saveLatestDreamToArchive(
  payload: LatestAnalysisPayload | null,
  fetcher: FetchLike = fetch,
): Promise<SaveLatestDreamToArchiveResult> {
  if (!payload || payload.status === "unavailable") {
    return { status: "not_completed" };
  }

  try {
    const response = await fetcher("/api/dreams", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.status === 401) {
      return { status: "unauthenticated" };
    }

    if (!response.ok) {
      return { status: "error" };
    }

    const body = (await response.json()) as { dreamId?: unknown };

    return {
      status: "saved",
      dreamId: typeof body.dreamId === "string" ? body.dreamId : "",
    };
  } catch {
    return { status: "error" };
  }
}
