import { describe, expect, test } from "vitest";

import { getManyangAppDate } from "./app-date";

describe("manyang app date", () => {
  test("uses the Korea date before and after the midnight boundary", () => {
    expect(getManyangAppDate(new Date("2026-05-31T14:59:00.000Z"))).toBe("2026-05-31");
    expect(getManyangAppDate(new Date("2026-05-31T15:00:00.000Z"))).toBe("2026-06-01");
  });
});
