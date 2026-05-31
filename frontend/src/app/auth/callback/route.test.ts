import { describe, expect, test } from "vitest";

import { handleAuthCallbackRequest, resolveSafeAuthRedirect } from "./route";

describe("auth callback route", () => {
  test("keeps safe internal redirect paths", () => {
    expect(resolveSafeAuthRedirect("/result?saveLatest=1")).toBe("/result?saveLatest=1");
    expect(resolveSafeAuthRedirect("/archive")).toBe("/archive");
  });

  test("falls back for unsafe redirect paths", () => {
    expect(resolveSafeAuthRedirect("https://evil.example")).toBe("/archive");
    expect(resolveSafeAuthRedirect("//evil.example")).toBe("/archive");
    expect(resolveSafeAuthRedirect(null)).toBe("/archive");
  });

  test("exchanges an OAuth code and redirects to the safe next path", async () => {
    const exchangedCodes: string[] = [];

    const response = await handleAuthCallbackRequest(
      new Request("https://manyang.example/auth/callback?code=oauth-code&next=%2Fresult%3FsaveLatest%3D1"),
      {
        exchangeCodeForSession: async (code) => {
          exchangedCodes.push(code);
        },
      },
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://manyang.example/result?saveLatest=1");
    expect(exchangedCodes).toEqual(["oauth-code"]);
  });

  test("skips code exchange when OAuth code is missing", async () => {
    let exchangeCallCount = 0;

    const response = await handleAuthCallbackRequest(new Request("https://manyang.example/auth/callback"), {
      exchangeCodeForSession: async () => {
        exchangeCallCount += 1;
      },
    });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://manyang.example/archive");
    expect(exchangeCallCount).toBe(0);
  });
});
