import { describe, expect, test } from "vitest";

import { createAuthRedirectPath, createGoogleOAuthSignInArgs, isValidAuthNextPath } from "./auth-redirect";

describe("auth redirect helpers", () => {
  test("allows only internal next paths", () => {
    expect(isValidAuthNextPath("/result?saveLatest=1")).toBe(true);
    expect(isValidAuthNextPath("/archive")).toBe(true);
    expect(isValidAuthNextPath("https://evil.example")).toBe(false);
    expect(isValidAuthNextPath("//evil.example")).toBe(false);
    expect(isValidAuthNextPath(null)).toBe(false);
  });

  test("creates a callback redirect URL for saving the latest receipt", () => {
    expect(createAuthRedirectPath("/result", true)).toBe("/auth/callback?next=%2Fresult%3FsaveLatest%3D1");
  });

  test("preserves existing query params when adding the save-latest flag", () => {
    expect(createAuthRedirectPath("/result?from=receipt", true)).toBe(
      "/auth/callback?next=%2Fresult%3Ffrom%3Dreceipt%26saveLatest%3D1",
    );
  });

  test("creates Google OAuth sign-in args with the callback redirect", () => {
    expect(createGoogleOAuthSignInArgs("https://manyang.example", "/result", true)).toEqual({
      provider: "google",
      options: {
        redirectTo: "https://manyang.example/auth/callback?next=%2Fresult%3FsaveLatest%3D1",
      },
    });
  });
});
