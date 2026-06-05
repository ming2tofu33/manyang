export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export const profileGuestIdStorageKey = "manyang:profile-guest-id";

function createGuestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function getOrCreateProfileGuestId(storage: StorageLike): string {
  const existing = storage.getItem(profileGuestIdStorageKey)?.trim();

  if (existing) {
    return existing;
  }

  const guestId = createGuestId();
  storage.setItem(profileGuestIdStorageKey, guestId);

  return guestId;
}

export function getOrCreateProfileGuestIdFromBrowser(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return getOrCreateProfileGuestId(window.localStorage);
}
