"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  getEmptyNightCheckInRecordsSnapshot,
  getNightCheckInRecordsSnapshotFromBrowser,
  subscribeToNightCheckIn,
  type NightCheckInRecord,
} from "./night-checkin";
import {
  getEmptyPawprintSnapshot,
  getPawprintSnapshotFromBrowser,
  subscribeToPawprints,
  type PawprintRecord,
  type PawprintSaveResult,
} from "./pawprints";
import { fetchNightCheckInsFromApi, fetchPawprintsFromApi } from "./routine-record-api";
import { createSupabaseBrowserClient } from "./supabase/client";

export type RoutineRecordSource = "server" | "local";

export type RemoteRoutineRecordsSnapshot = {
  status: "loading" | "server" | "guest";
  pawprints: PawprintRecord[];
  nightCheckInRecords: NightCheckInRecord[];
};

const emptyRemoteRoutineRecordsSnapshot: RemoteRoutineRecordsSnapshot = {
  status: "loading",
  pawprints: [],
  nightCheckInRecords: [],
};

let remoteRoutineRecordsSnapshot: RemoteRoutineRecordsSnapshot = emptyRemoteRoutineRecordsSnapshot;
let remoteRoutineRecordsLoad: Promise<void> | null = null;
const remoteRoutineRecordsListeners = new Set<() => void>();

function emitRemoteRoutineRecordsChange(): void {
  for (const listener of remoteRoutineRecordsListeners) {
    listener();
  }
}

function setRemoteRoutineRecordsSnapshot(snapshot: RemoteRoutineRecordsSnapshot): void {
  remoteRoutineRecordsSnapshot = snapshot;
  emitRemoteRoutineRecordsChange();
}

function mergePawprint(records: PawprintRecord[], record: PawprintRecord): PawprintRecord[] {
  const existingIndex = records.findIndex(
    (storedRecord) =>
      storedRecord.id === record.id ||
      storedRecord.appDate === record.appDate ||
      (storedRecord.source === record.source && storedRecord.sourceId === record.sourceId),
  );

  if (existingIndex === -1) {
    return [record, ...records];
  }

  const nextRecords = [...records];
  nextRecords[existingIndex] = record;

  return nextRecords;
}

function mergeNightCheckIn(records: NightCheckInRecord[], record: NightCheckInRecord): NightCheckInRecord[] {
  return [record, ...records.filter((storedRecord) => storedRecord.checkInDate !== record.checkInDate)];
}

async function hasSupabaseBrowserSession(): Promise<boolean> {
  try {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();

    return Boolean(data.session);
  } catch {
    return false;
  }
}

export function subscribeToRemoteRoutineRecords(onStoreChange: () => void): () => void {
  remoteRoutineRecordsListeners.add(onStoreChange);

  return () => {
    remoteRoutineRecordsListeners.delete(onStoreChange);
  };
}

export function getRemoteRoutineRecordsSnapshot(): RemoteRoutineRecordsSnapshot {
  return remoteRoutineRecordsSnapshot;
}

export function getRemoteRoutineRecordsServerSnapshot(): RemoteRoutineRecordsSnapshot {
  return emptyRemoteRoutineRecordsSnapshot;
}

export function resolveRoutineRecordState(
  localPawprints: PawprintRecord[],
  localNightCheckInRecords: NightCheckInRecord[],
  remoteSnapshot: RemoteRoutineRecordsSnapshot,
): {
  pawprints: PawprintRecord[];
  nightCheckInRecords: NightCheckInRecord[];
  source: RoutineRecordSource;
  isLoadingRoutineRecords: boolean;
  canViewRoutines: boolean;
} {
  if (remoteSnapshot.status === "server") {
    return {
      pawprints: remoteSnapshot.pawprints,
      nightCheckInRecords: remoteSnapshot.nightCheckInRecords,
      source: "server",
      isLoadingRoutineRecords: false,
      canViewRoutines: true,
    };
  }

  return {
    pawprints: localPawprints,
    nightCheckInRecords: localNightCheckInRecords,
    source: "local",
    isLoadingRoutineRecords: remoteSnapshot.status === "loading",
    canViewRoutines: true,
  };
}

export async function refreshRemoteRoutineRecords(options: { force?: boolean } = {}): Promise<void> {
  if (!options.force && remoteRoutineRecordsSnapshot.status !== "loading") {
    return;
  }

  remoteRoutineRecordsLoad ??= hasSupabaseBrowserSession()
    .then(async (hasSession) => {
      if (!hasSession) {
        setRemoteRoutineRecordsSnapshot({
          status: "guest",
          pawprints: [],
          nightCheckInRecords: [],
        });
        return;
      }

      const [pawprintsResult, nightCheckInsResult] = await Promise.all([
        fetchPawprintsFromApi(),
        fetchNightCheckInsFromApi(),
      ]);

      if (pawprintsResult.status === "unauthenticated" && nightCheckInsResult.status === "unauthenticated") {
        setRemoteRoutineRecordsSnapshot({
          status: "guest",
          pawprints: [],
          nightCheckInRecords: [],
        });
        return;
      }

      setRemoteRoutineRecordsSnapshot({
        status: "server",
        pawprints: pawprintsResult.status === "ok" ? pawprintsResult.records : [],
        nightCheckInRecords: nightCheckInsResult.status === "ok" ? nightCheckInsResult.records : [],
      });
    })
    .finally(() => {
      remoteRoutineRecordsLoad = null;
    });

  await remoteRoutineRecordsLoad;
}

export function mergeRemotePawprintResult(result: PawprintSaveResult): void {
  const currentSnapshot =
    remoteRoutineRecordsSnapshot.status === "server"
      ? remoteRoutineRecordsSnapshot
      : {
          status: "server" as const,
          pawprints: [],
          nightCheckInRecords: [],
        };

  setRemoteRoutineRecordsSnapshot({
    ...currentSnapshot,
    pawprints: mergePawprint(currentSnapshot.pawprints, result.record),
  });
}

export function mergeRemoteNightCheckInRecord(record: NightCheckInRecord): void {
  const currentSnapshot =
    remoteRoutineRecordsSnapshot.status === "server"
      ? remoteRoutineRecordsSnapshot
      : {
          status: "server" as const,
          pawprints: [],
          nightCheckInRecords: [],
        };

  setRemoteRoutineRecordsSnapshot({
    ...currentSnapshot,
    nightCheckInRecords: mergeNightCheckIn(currentSnapshot.nightCheckInRecords, record),
  });
}

export function useRoutineRecords(): {
  pawprints: PawprintRecord[];
  nightCheckInRecords: NightCheckInRecord[];
  source: RoutineRecordSource;
  isLoadingRoutineRecords: boolean;
  canViewRoutines: boolean;
} {
  const localPawprints = useSyncExternalStore(
    subscribeToPawprints,
    getPawprintSnapshotFromBrowser,
    getEmptyPawprintSnapshot,
  );
  const localNightCheckInRecords = useSyncExternalStore(
    subscribeToNightCheckIn,
    getNightCheckInRecordsSnapshotFromBrowser,
    getEmptyNightCheckInRecordsSnapshot,
  );
  const remoteSnapshot = useSyncExternalStore(
    subscribeToRemoteRoutineRecords,
    getRemoteRoutineRecordsSnapshot,
    getRemoteRoutineRecordsServerSnapshot,
  );
  const resolvedState = resolveRoutineRecordState(localPawprints, localNightCheckInRecords, remoteSnapshot);

  useEffect(() => {
    void refreshRemoteRoutineRecords({ force: true });
  }, []);

  return resolvedState;
}
