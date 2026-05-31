import type { NightCheckInInput, NightCheckInRecord } from "./night-checkin";
import type { PawprintInput, PawprintRecord, PawprintSaveResult } from "./pawprints";

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type FetchPawprintsResult =
  | {
      status: "ok";
      records: PawprintRecord[];
    }
  | {
      status: "unauthenticated";
      records: [];
    }
  | {
      status: "error";
      records: [];
    };

export type FetchNightCheckInsResult =
  | {
      status: "ok";
      records: NightCheckInRecord[];
    }
  | {
      status: "unauthenticated";
      records: [];
    }
  | {
      status: "error";
      records: [];
    };

export type SavePawprintApiResult =
  | ({
      status: "saved";
    } & PawprintSaveResult)
  | {
      status: "unauthenticated";
    }
  | {
      status: "error";
    };

export type SaveNightCheckInApiResult =
  | {
      status: "saved";
      record: NightCheckInRecord;
    }
  | {
      status: "unauthenticated";
    }
  | {
      status: "error";
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPawprintRecordArray(value: unknown): value is PawprintRecord[] {
  return Array.isArray(value);
}

function isNightCheckInRecordArray(value: unknown): value is NightCheckInRecord[] {
  return Array.isArray(value);
}

function createNightCheckInRequestBody(record: NightCheckInInput | NightCheckInRecord): NightCheckInInput {
  return {
    checkInDate: record.checkInDate,
    moodId: record.moodId,
    moodLabel: record.moodLabel,
    conditionId: record.conditionId,
    conditionLabel: record.conditionLabel,
    note: record.note,
  };
}

export async function fetchPawprintsFromApi(fetcher: FetchLike = fetch): Promise<FetchPawprintsResult> {
  try {
    const response = await fetcher("/api/pawprints");

    if (response.status === 401) {
      return { status: "unauthenticated", records: [] };
    }

    if (!response.ok) {
      return { status: "error", records: [] };
    }

    const body = (await response.json()) as { records?: unknown };

    if (!isPawprintRecordArray(body.records)) {
      return { status: "error", records: [] };
    }

    return { status: "ok", records: body.records };
  } catch {
    return { status: "error", records: [] };
  }
}

export async function fetchNightCheckInsFromApi(fetcher: FetchLike = fetch): Promise<FetchNightCheckInsResult> {
  try {
    const response = await fetcher("/api/night-checkins");

    if (response.status === 401) {
      return { status: "unauthenticated", records: [] };
    }

    if (!response.ok) {
      return { status: "error", records: [] };
    }

    const body = (await response.json()) as { records?: unknown };

    if (!isNightCheckInRecordArray(body.records)) {
      return { status: "error", records: [] };
    }

    return { status: "ok", records: body.records };
  } catch {
    return { status: "error", records: [] };
  }
}

export async function savePawprintToApi(
  input: PawprintInput,
  fetcher: FetchLike = fetch,
): Promise<SavePawprintApiResult> {
  try {
    const response = await fetcher("/api/pawprints", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });

    if (response.status === 401) {
      return { status: "unauthenticated" };
    }

    if (!response.ok) {
      return { status: "error" };
    }

    const body = (await response.json()) as { created?: unknown; record?: unknown };

    if (typeof body.created !== "boolean" || !isRecord(body.record)) {
      return { status: "error" };
    }

    return {
      status: "saved",
      created: body.created,
      record: body.record as PawprintRecord,
    };
  } catch {
    return { status: "error" };
  }
}

export async function saveNightCheckInToApi(
  record: NightCheckInInput | NightCheckInRecord,
  fetcher: FetchLike = fetch,
): Promise<SaveNightCheckInApiResult> {
  try {
    const response = await fetcher("/api/night-checkins", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(createNightCheckInRequestBody(record)),
    });

    if (response.status === 401) {
      return { status: "unauthenticated" };
    }

    if (!response.ok) {
      return { status: "error" };
    }

    const body = (await response.json()) as { record?: unknown };

    if (!isRecord(body.record)) {
      return { status: "error" };
    }

    return {
      status: "saved",
      record: body.record as NightCheckInRecord,
    };
  } catch {
    return { status: "error" };
  }
}
