import { describe, expect, test } from "vitest";

import { getArchiveAccessState } from "./auth-session";

describe("auth session helpers", () => {
  test("treats missing session as guest archive access", () => {
    expect(getArchiveAccessState(null)).toEqual({
      status: "guest",
      canPersistDreams: false,
      canViewArchive: false,
    });
  });

  test("treats a user session as authenticated archive access", () => {
    expect(getArchiveAccessState({ user: { id: "user-1" } })).toEqual({
      status: "authenticated",
      canPersistDreams: true,
      canViewArchive: true,
    });
  });
});
