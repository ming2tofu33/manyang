"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

import { deleteDreamRecordFromApi, fetchDreamRecordsFromApi } from "./dream-record-api";
import {
  getDreamRecordsSnapshotFromBrowser,
  getEmptyDreamRecordsSnapshot,
  saveDreamRecordAsLatestAnalysisToBrowser,
  subscribeToDreamStorage,
  type DreamRecord,
} from "./dream-storage";
import { createSupabaseBrowserClient } from "./supabase/client";

export type ArchiveDreamRecordSource = "server" | "guest" | "legacy_local";

export type RemoteDreamRecordsSnapshot = {
  status: "loading" | "server" | "guest" | "legacy_local";
  records: DreamRecord[];
};

const emptyRemoteDreamRecordsSnapshot: RemoteDreamRecordsSnapshot = {
  status: "loading",
  records: [],
};

let remoteDreamRecordsSnapshot: RemoteDreamRecordsSnapshot = emptyRemoteDreamRecordsSnapshot;
let remoteDreamRecordsLoad: Promise<void> | null = null;
const remoteDreamRecordsListeners = new Set<() => void>();

function emitRemoteDreamRecordsChange(): void {
  for (const listener of remoteDreamRecordsListeners) {
    listener();
  }
}

function setRemoteDreamRecordsSnapshot(snapshot: RemoteDreamRecordsSnapshot): void {
  remoteDreamRecordsSnapshot = snapshot;
  emitRemoteDreamRecordsChange();
}

export function subscribeToRemoteDreamRecords(onStoreChange: () => void): () => void {
  remoteDreamRecordsListeners.add(onStoreChange);

  return () => {
    remoteDreamRecordsListeners.delete(onStoreChange);
  };
}

export function getRemoteDreamRecordsSnapshot(): RemoteDreamRecordsSnapshot {
  return remoteDreamRecordsSnapshot;
}

export function getRemoteDreamRecordsServerSnapshot(): RemoteDreamRecordsSnapshot {
  return emptyRemoteDreamRecordsSnapshot;
}

export function resolveArchiveDreamRecordState(
  localDreamRecords: DreamRecord[],
  remoteSnapshot: RemoteDreamRecordsSnapshot,
): {
  dreamRecords: DreamRecord[];
  source: ArchiveDreamRecordSource;
  isLoadingServerRecords: boolean;
  canViewArchive: boolean;
} {
  if (remoteSnapshot.status === "server") {
    return {
      dreamRecords: remoteSnapshot.records,
      source: "server",
      isLoadingServerRecords: false,
      canViewArchive: true,
    };
  }

  if (remoteSnapshot.status === "legacy_local") {
    return {
      dreamRecords: localDreamRecords,
      source: "legacy_local",
      isLoadingServerRecords: false,
      canViewArchive: false,
    };
  }

  return {
    dreamRecords: [],
    source: "guest",
    isLoadingServerRecords: remoteSnapshot.status === "loading",
    canViewArchive: false,
  };
}

export async function refreshRemoteDreamRecords(options: { force?: boolean } = {}): Promise<void> {
  if (!options.force && remoteDreamRecordsSnapshot.status !== "loading") {
    return;
  }

  remoteDreamRecordsLoad ??= fetchDreamRecordsFromApi()
    .then((result) => {
      if (result.status === "ok") {
        setRemoteDreamRecordsSnapshot({
          status: "server",
          records: result.records,
        });
        return;
      }

      setRemoteDreamRecordsSnapshot({
        status: "guest",
        records: [],
      });
    })
    .finally(() => {
      remoteDreamRecordsLoad = null;
    });

  await remoteDreamRecordsLoad;
}

function removeRemoteDreamRecord(recordId: string): void {
  if (remoteDreamRecordsSnapshot.status !== "server") {
    return;
  }

  setRemoteDreamRecordsSnapshot({
    status: "server",
    records: remoteDreamRecordsSnapshot.records.filter((record) => record.id !== recordId),
  });
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

export function useArchiveDreamRecords(): {
  dreamRecords: DreamRecord[];
  source: ArchiveDreamRecordSource;
  isLoadingServerRecords: boolean;
  openDreamRecord: (record: DreamRecord) => boolean;
  deleteDreamRecord: (recordId: string) => Promise<boolean>;
  canViewArchive: boolean;
} {
  const localDreamRecords = useSyncExternalStore(
    subscribeToDreamStorage,
    getDreamRecordsSnapshotFromBrowser,
    getEmptyDreamRecordsSnapshot,
  );
  const remoteSnapshot = useSyncExternalStore(
    subscribeToRemoteDreamRecords,
    getRemoteDreamRecordsSnapshot,
    getRemoteDreamRecordsServerSnapshot,
  );
  const resolvedState = resolveArchiveDreamRecordState(localDreamRecords, remoteSnapshot);

  useEffect(() => {
    void hasSupabaseBrowserSession().then((hasSession) => {
      if (hasSession) {
        void refreshRemoteDreamRecords({ force: true });
        return;
      }

      setRemoteDreamRecordsSnapshot({
        status: "guest",
        records: [],
      });
    });
  }, []);

  const openDreamRecord = useCallback((record: DreamRecord) => saveDreamRecordAsLatestAnalysisToBrowser(record), []);

  const deleteDreamRecord = useCallback(
    async (recordId: string) => {
      if (resolvedState.source === "server") {
        const result = await deleteDreamRecordFromApi(recordId);

        if (result.status === "deleted" || result.status === "not_found") {
          removeRemoteDreamRecord(recordId);
          return true;
        }

        return false;
      }

      return false;
    },
    [resolvedState.source],
  );

  return {
    ...resolvedState,
    openDreamRecord,
    deleteDreamRecord,
  };
}
