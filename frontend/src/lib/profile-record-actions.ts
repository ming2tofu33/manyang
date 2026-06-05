import { dailyTarotChangedEvent, dailyTarotStorageKey } from "./daily-tarot";
import {
  dreamDraftKey,
  dreamRecordsKey,
  dreamStorageChangedEvent,
  latestAnalysisKey,
  type StorageLike,
} from "./dream-storage";
import { morningMoodChangedEvent, morningMoodRecordsKey } from "./morning-mood";
import { nightCheckInChangedEvent, nightCheckInKey, nightCheckInRecordsKey } from "./night-checkin";
import { pawprintChangedEvent, pawprintRecordsKey } from "./pawprints";

type ProfileFetch = (input: string, init?: RequestInit) => Promise<Response>;

export const profileRecordsDeletedEvent = "manyang:profile-records-deleted";

export type ProfileRecordActionResult =
  | {
      status: "ok";
    }
  | {
      status: "error";
    };

const guestRecordStorageKeys = [
  latestAnalysisKey,
  dreamRecordsKey,
  dreamDraftKey,
  pawprintRecordsKey,
  morningMoodRecordsKey,
  nightCheckInKey,
  nightCheckInRecordsKey,
  dailyTarotStorageKey,
];

const guestRecordChangedEvents = [
  dreamStorageChangedEvent,
  pawprintChangedEvent,
  morningMoodChangedEvent,
  nightCheckInChangedEvent,
  dailyTarotChangedEvent,
  profileRecordsDeletedEvent,
];

export async function deleteAuthenticatedProfileRecords(
  fetcher: ProfileFetch = fetch,
): Promise<ProfileRecordActionResult> {
  const response = await fetcher("/api/profile/records", {
    method: "DELETE",
  });

  return response.ok ? { status: "ok" } : { status: "error" };
}

export function deleteGuestProfileRecords(storage: StorageLike): void {
  for (const key of guestRecordStorageKeys) {
    storage.removeItem(key);
  }
}

function notifyGuestProfileRecordsDeleted(): void {
  if (typeof window === "undefined") {
    return;
  }

  for (const eventName of guestRecordChangedEvents) {
    window.dispatchEvent(new Event(eventName));
  }
}

export function deleteGuestProfileRecordsFromBrowser(): ProfileRecordActionResult {
  if (typeof window === "undefined") {
    return { status: "error" };
  }

  deleteGuestProfileRecords(window.localStorage);
  notifyGuestProfileRecordsDeleted();

  return { status: "ok" };
}
