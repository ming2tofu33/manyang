import type { DreamRecord } from "./dream-storage";

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type FetchDreamRecordsResult =
  | {
      status: "ok";
      records: DreamRecord[];
    }
  | {
      status: "unauthenticated";
      records: [];
    }
  | {
      status: "error";
      records: [];
    };

export type DeleteDreamRecordResult =
  | {
      status: "deleted";
    }
  | {
      status: "unauthenticated";
    }
  | {
      status: "not_found";
    }
  | {
      status: "error";
    };

function isDreamRecordArray(value: unknown): value is DreamRecord[] {
  return Array.isArray(value);
}

export async function fetchDreamRecordsFromApi(fetcher: FetchLike = fetch): Promise<FetchDreamRecordsResult> {
  try {
    const response = await fetcher("/api/dreams");

    if (response.status === 401) {
      return { status: "unauthenticated", records: [] };
    }

    if (!response.ok) {
      return { status: "error", records: [] };
    }

    const body = (await response.json()) as { records?: unknown };

    if (!isDreamRecordArray(body.records)) {
      return { status: "error", records: [] };
    }

    return { status: "ok", records: body.records };
  } catch {
    return { status: "error", records: [] };
  }
}

export async function deleteDreamRecordFromApi(
  recordId: string,
  fetcher: FetchLike = fetch,
): Promise<DeleteDreamRecordResult> {
  try {
    const response = await fetcher(`/api/dreams/${encodeURIComponent(recordId)}`, {
      method: "DELETE",
    });

    if (response.status === 401) {
      return { status: "unauthenticated" };
    }

    if (response.status === 404) {
      return { status: "not_found" };
    }

    if (!response.ok) {
      return { status: "error" };
    }

    return { status: "deleted" };
  } catch {
    return { status: "error" };
  }
}
