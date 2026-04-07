/**
 * Full-page OAuth redirect requires both Web Client ID and client secret (server-only).
 * Keep this in sync with /api/auth/config and middleware "is auth required" logic.
 */
function googleClientSecretFromEnv(): string | undefined {
  const s =
    process.env.GOOGLE_CLIENT_SECRET?.trim() ||
    process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim() ||
    process.env.CLIENT_SECRET?.trim();
  return s || undefined;
}

export function isGoogleOAuthRedirectReady(): boolean {
  const id = process.env.GOOGLE_CLIENT_ID?.trim();
  const secret = googleClientSecretFromEnv();
  return !!(id && secret);
}

export function getGoogleClientIdOrNull(): string | null {
  return process.env.GOOGLE_CLIENT_ID?.trim() || null;
}

export function getGoogleClientSecretOrNull(): string | null {
  return googleClientSecretFromEnv() ?? null;
}
