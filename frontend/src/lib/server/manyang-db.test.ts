import { describe, expect, test, vi } from "vitest";

import { isAdminUser } from "./manyang-db";

describe("manyang db helpers", () => {
  test("returns true when a profile is marked as admin", async () => {
    const pool = {
      query: vi.fn(async () => ({ rows: [{ is_admin: true }] })),
    };

    await expect(isAdminUser("user-1", pool as never)).resolves.toBe(true);
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("manyang.profiles"), ["user-1"]);
  });

  test("returns false when a profile is not marked as admin", async () => {
    const pool = {
      query: vi.fn(async () => ({ rows: [{ is_admin: false }] })),
    };

    await expect(isAdminUser("user-1", pool as never)).resolves.toBe(false);
  });
});
