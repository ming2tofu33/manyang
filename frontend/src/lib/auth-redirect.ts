export function isValidAuthNextPath(value: string | null | undefined): value is string {
  return Boolean(value && value.startsWith("/") && !value.startsWith("//"));
}

function appendSaveLatestFlag(nextPath: string): string {
  const separator = nextPath.includes("?") ? "&" : "?";

  return `${nextPath}${separator}saveLatest=1`;
}

export function createAuthRedirectPath(nextPath: string, saveLatest: boolean): string {
  const resolvedNextPath = saveLatest ? appendSaveLatestFlag(nextPath) : nextPath;

  return `/auth/callback?next=${encodeURIComponent(resolvedNextPath)}`;
}

export function createGoogleOAuthSignInArgs(origin: string, nextPath: string, saveLatest: boolean) {
  return {
    provider: "google" as const,
    options: {
      redirectTo: `${origin}${createAuthRedirectPath(nextPath, saveLatest)}`,
    },
  };
}
