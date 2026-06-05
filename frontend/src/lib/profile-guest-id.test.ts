import { describe, expect, it } from "vitest";

import { getOrCreateProfileGuestId, profileGuestIdStorageKey, type StorageLike } from "./profile-guest-id";

function createStorage(): StorageLike {
  const map = new Map<string, string>();

  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value),
    removeItem: (key) => map.delete(key),
  };
}

describe("profile guest id", () => {
  it("creates and reuses a UUID for guest feedback", () => {
    const storage = createStorage();
    const first = getOrCreateProfileGuestId(storage);
    const second = getOrCreateProfileGuestId(storage);

    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f-]{36}$/i);
    expect(storage.getItem(profileGuestIdStorageKey)).toBe(first);
  });
});
