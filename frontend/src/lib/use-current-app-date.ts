"use client";

import { useSyncExternalStore } from "react";

let currentAppDateSnapshot: Date | null = null;

function updateCurrentAppDateSnapshot(): Date {
  currentAppDateSnapshot = new Date();

  return currentAppDateSnapshot;
}

export function getMillisecondsUntilNextMinute(date = new Date()): number {
  const elapsedInMinute = date.getSeconds() * 1000 + date.getMilliseconds();

  return 60_000 - elapsedInMinute + 50;
}

export function getCurrentAppDateSnapshot(): Date {
  currentAppDateSnapshot ??= new Date();

  return currentAppDateSnapshot;
}

export function getServerCurrentAppDateSnapshot(): Date | null {
  return null;
}

export function subscribeToCurrentAppDate(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  let timer: number | null = null;

  const syncCurrentDate = () => {
    updateCurrentAppDateSnapshot();
    onStoreChange();
  };

  const scheduleNextMinute = () => {
    timer = window.setTimeout(() => {
      syncCurrentDate();
      scheduleNextMinute();
    }, getMillisecondsUntilNextMinute());
  };

  const syncOnReturn = () => {
    if (document.visibilityState === "visible") {
      syncCurrentDate();
    }
  };

  syncCurrentDate();
  scheduleNextMinute();
  window.addEventListener("focus", syncCurrentDate);
  document.addEventListener("visibilitychange", syncOnReturn);

  return () => {
    if (timer !== null) {
      window.clearTimeout(timer);
    }

    window.removeEventListener("focus", syncCurrentDate);
    document.removeEventListener("visibilitychange", syncOnReturn);
  };
}

export function useCurrentAppDate(): Date | null {
  return useSyncExternalStore(
    subscribeToCurrentAppDate,
    getCurrentAppDateSnapshot,
    getServerCurrentAppDateSnapshot,
  );
}
