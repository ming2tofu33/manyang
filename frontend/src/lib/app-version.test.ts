import { describe, expect, it } from "vitest";

import { getAppVersionLabel } from "./app-version";

describe("app version", () => {
  it("reads the frontend package version", () => {
    expect(getAppVersionLabel()).toMatch(/^v\d+\.\d+\.\d+$/);
  });
});
