"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import type { AccessRole } from "./access-policy";
import {
  adminLabTimeOverrideChangedEvent,
  type AdminLabTimeOverride,
  getAdminLabDateForOverride,
  getAdminLabTimeOverride,
  notifyAdminLabTimeOverrideChanged,
  saveAdminLabTimeOverride,
} from "./admin-lab-mode";

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function getAdminLabTimeOverrideSnapshotFromBrowser(): AdminLabTimeOverride {
  const storage = getBrowserStorage();

  return storage ? getAdminLabTimeOverride(storage) : "auto";
}

function getServerAdminLabTimeOverrideSnapshot(): AdminLabTimeOverride {
  return "auto";
}

function subscribeToAdminLabTimeOverride(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(adminLabTimeOverrideChangedEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(adminLabTimeOverrideChangedEvent, onStoreChange);
  };
}

export function useAdminLabTimeOverride(accessRole: AccessRole): {
  override: AdminLabTimeOverride;
  forcedDate: Date | null;
  isForced: boolean;
  setOverride: (override: AdminLabTimeOverride) => void;
} {
  const storedOverride = useSyncExternalStore(
    subscribeToAdminLabTimeOverride,
    getAdminLabTimeOverrideSnapshotFromBrowser,
    getServerAdminLabTimeOverrideSnapshot,
  );
  const override = accessRole === "admin" ? storedOverride : "auto";
  const forcedDate = useMemo(() => getAdminLabDateForOverride(override), [override]);

  const setOverride = useCallback(
    (nextOverride: AdminLabTimeOverride) => {
      if (accessRole !== "admin") {
        return;
      }

      const storage = getBrowserStorage();

      if (!storage) {
        return;
      }

      saveAdminLabTimeOverride(storage, nextOverride);
      notifyAdminLabTimeOverrideChanged();
    },
    [accessRole],
  );

  return {
    override,
    forcedDate,
    isForced: Boolean(forcedDate),
    setOverride,
  };
}
