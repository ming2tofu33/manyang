type EnvLike = Record<string, string | undefined>;

export const guestIdCookieName = "manyang_guest_id";
const guestIdCookieMaxAgeSeconds = 60 * 60 * 24 * 400;

export type GuestSession = {
  guestId: string;
  shouldSetCookie: boolean;
};

export function isValidGuestId(value: string | undefined): value is string {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  );
}

export function getRequestCookie(request: Request, cookieName: string): string | undefined {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return undefined;
  }

  for (const cookiePart of cookieHeader.split(";")) {
    const [name, ...valueParts] = cookiePart.trim().split("=");

    if (name === cookieName) {
      return valueParts.join("=");
    }
  }

  return undefined;
}

export function resolveGuestSession(request: Request, createGuestId: () => string): GuestSession {
  const existingGuestId = getRequestCookie(request, guestIdCookieName);

  if (isValidGuestId(existingGuestId)) {
    return { guestId: existingGuestId, shouldSetCookie: false };
  }

  return { guestId: createGuestId(), shouldSetCookie: true };
}

export function createGuestIdCookie(guestId: string, env: EnvLike = process.env): string {
  return [
    `${guestIdCookieName}=${guestId}`,
    "Path=/",
    `Max-Age=${guestIdCookieMaxAgeSeconds}`,
    "HttpOnly",
    "SameSite=Lax",
    env.NODE_ENV === "production" ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}
