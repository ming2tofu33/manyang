import type { DailyTarotReading } from "@/lib/daily-tarot";
import type { DreamRecord } from "@/lib/dream-storage";
import type { MorningMoodRecord } from "@/lib/morning-mood";
import type { NightCheckInRecord } from "@/lib/night-checkin";
import type { PawprintRecord } from "@/lib/pawprints";
import {
  listDreamRecordsForUser,
  listMorningCheckInsForUser,
  listNightCheckInsForUser,
  listPawprintsForUser,
  listTarotReadingsForUser,
} from "@/lib/server/manyang-db";

export type AuthenticatedProfileExportPayload = {
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

export type CreateProfileExportDependencies = {
  now?: () => Date;
  listDreamRecordsForUser?: (userId: string) => Promise<DreamRecord[]>;
  listPawprintsForUser?: (userId: string) => Promise<PawprintRecord[]>;
  listMorningCheckInsForUser?: (userId: string) => Promise<MorningMoodRecord[]>;
  listNightCheckInsForUser?: (userId: string) => Promise<NightCheckInRecord[]>;
  listTarotReadingsForUser?: (userId: string) => Promise<DailyTarotReading[]>;
};

export async function createProfileExportForUser(
  userId: string,
  dependencies: CreateProfileExportDependencies = {},
): Promise<AuthenticatedProfileExportPayload> {
  const resolvedDependencies: Required<CreateProfileExportDependencies> = {
    now: () => new Date(),
    listDreamRecordsForUser,
    listPawprintsForUser,
    listMorningCheckInsForUser,
    listNightCheckInsForUser,
    listTarotReadingsForUser,
    ...dependencies,
  };
  const [dreams, pawprints, morningCheckIns, nightCheckIns, tarotReadings] = await Promise.all([
    resolvedDependencies.listDreamRecordsForUser(userId),
    resolvedDependencies.listPawprintsForUser(userId),
    resolvedDependencies.listMorningCheckInsForUser(userId),
    resolvedDependencies.listNightCheckInsForUser(userId),
    resolvedDependencies.listTarotReadingsForUser(userId),
  ]);

  return {
    exportedAt: resolvedDependencies.now().toISOString(),
    identity: { type: "authenticated", userId },
    dreams,
    pawprints,
    morningCheckIns,
    nightCheckIns,
    tarotReadings,
  };
}
