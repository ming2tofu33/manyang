import { describe, expect, test } from "vitest";

import { dynamic } from "./page";

describe("tarot page rendering mode", () => {
  test("renders dynamically so the app date is not frozen at build time", () => {
    expect(dynamic).toBe("force-dynamic");
  });
});
