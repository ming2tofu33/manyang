import { dailyTarotStorageKey, getDailyTarotReadings, type DailyTarotReading } from "./daily-tarot";
import {
  getDreamRecords,
  getLatestAnalysis,
  type DreamRecord,
  type LatestAnalysisPayload,
  type StorageLike,
} from "./dream-storage";
import { getMorningMoodRecords, type MorningMoodRecord } from "./morning-mood";
import { getNightCheckInRecords, type NightCheckInRecord } from "./night-checkin";
import { getPawprints, type PawprintRecord } from "./pawprints";
import { getOrCreateProfileGuestId } from "./profile-guest-id";

type ProfileFetch = (input: string, init?: RequestInit) => Promise<Response>;

export type GuestProfileExportPayload = {
  exportedAt: string;
  identity: {
    type: "guest";
    guestId: string;
  };
  latestAnalysis: LatestAnalysisPayload | null;
  dreams: DreamRecord[];
  pawprints: PawprintRecord[];
  morningCheckIns: MorningMoodRecord[];
  nightCheckIns: NightCheckInRecord[];
  tarotReadings: DailyTarotReading[];
};

export type ProfileExportPayload =
  | GuestProfileExportPayload
  | {
      exportedAt: string;
      identity: {
        type: "authenticated";
        userId: string;
      };
      dreams: DreamRecord[];
      pawprints: PawprintRecord[];
      morningCheckIns: MorningMoodRecord[];
      nightCheckIns: NightCheckInRecord[];
      tarotReadings: DailyTarotReading[];
    };

export type ProfileExportResult =
  | {
      status: "ok";
    }
  | {
      status: "error";
    };

export function createProfileExportFileName(date = new Date()): string {
  return `manyang-records-${date.toISOString().slice(0, 10)}.json`;
}

export function downloadJsonFile(payload: unknown, filename: string): void {
  if (typeof document === "undefined") {
    return;
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function createGuestProfileExport(storage: StorageLike, date = new Date()): GuestProfileExportPayload {
  return {
    exportedAt: date.toISOString(),
    identity: {
      type: "guest",
      guestId: getOrCreateProfileGuestId(storage),
    },
    latestAnalysis: getLatestAnalysis(storage),
    dreams: getDreamRecords(storage),
    pawprints: getPawprints(storage),
    morningCheckIns: getMorningMoodRecords(storage),
    nightCheckIns: getNightCheckInRecords(storage),
    tarotReadings: getDailyTarotReadings(storage),
  };
}

export async function exportAuthenticatedProfile(
  fetcher: ProfileFetch = fetch,
  download: (payload: ProfileExportPayload, filename: string) => void = downloadJsonFile,
  date = new Date(),
): Promise<ProfileExportResult> {
  const response = await fetcher("/api/profile/export");

  if (!response.ok) {
    return { status: "error" };
  }

  const payload = (await response.json()) as ProfileExportPayload;
  download(payload, createProfileExportFileName(date));

  return { status: "ok" };
}

export function exportGuestProfileFromBrowser(
  download: (payload: ProfileExportPayload, filename: string) => void = downloadJsonFile,
  date = new Date(),
): ProfileExportResult {
  if (typeof window === "undefined") {
    return { status: "error" };
  }

  const payload = createGuestProfileExport(window.localStorage, date);
  download(payload, createProfileExportFileName(date));

  return { status: "ok" };
}

export { dailyTarotStorageKey };
