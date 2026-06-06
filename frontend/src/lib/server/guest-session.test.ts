import { describe, expect, test } from "vitest";

import {
  createGuestIdCookie,
  guestIdCookieName,
  isValidGuestId,
  resolveGuestSession,
} from "./guest-session";

const validId = "00000000-0000-4000-8000-000000000abc";

function requestWithCookie(value: string): Request {
  return new Request("http://localhost/api/tarot/readings", {
    method: "POST",
    headers: { cookie: `${guestIdCookieName}=${value}` },
  });
}

describe("guest-session", () => {
  test("validates uuid-shaped guest ids", () => {
    expect(isValidGuestId(validId)).toBe(true);
    expect(isValidGuestId("nope")).toBe(false);
    expect(isValidGuestId(undefined)).toBe(false);
  });

  test("reuses an existing valid guest cookie without re-setting it", () => {
    const session = resolveGuestSession(requestWithCookie(validId), () => "unused");

    expect(session).toEqual({ guestId: validId, shouldSetCookie: false });
  });

  test("creates a new guest id when the cookie is missing or invalid", () => {
    const session = resolveGuestSession(requestWithCookie("garbage"), () => validId);

    expect(session).toEqual({ guestId: validId, shouldSetCookie: true });
  });

  test("builds an httpOnly cookie string", () => {
    const cookie = createGuestIdCookie(validId, { NODE_ENV: "production" });

    expect(cookie).toContain(`${guestIdCookieName}=${validId}`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
  });

  test("omits Secure outside production", () => {
    const cookie = createGuestIdCookie(validId, { NODE_ENV: "development" });

    expect(cookie).not.toContain("Secure");
  });
});
