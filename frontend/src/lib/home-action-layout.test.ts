import { describe, expect, test } from "vitest";

import { nightHomeActionGroupClassName } from "./home-action-layout";

describe("home action layout", () => {
  test("moves night home actions down without transform-based scroll overflow", () => {
    expect(nightHomeActionGroupClassName).toContain("mt-4");
    expect(nightHomeActionGroupClassName).toContain("-mb-4");
    expect(nightHomeActionGroupClassName).not.toContain("translate");
  });
});
