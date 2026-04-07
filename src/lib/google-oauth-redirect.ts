import { NextRequest } from 'next/server';
import { getGoogleClientSecretOrNull } from '@/lib/google-oauth-config';

/** CSRF + post-login path cookies for OAuth redirect flow. */
export const GS_OAUTH_STATE_COOKIE = 'gs_oauth_state';
export const GS_OAUTH_NEXT_COOKIE = 'gs_oauth_next';

const CALLBACK_PATH = '/api/auth/google/callback';

export function safeInternalPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/';
  return raw;
}

/** Strip trailing slash on path; Google requires exact match with GCP "Authorized redirect URIs". */
export function normalizeOAuthRedirectUri(uri: string): string {
  const t = uri.trim();
  if (!t) return t;
  try {
    const u = new URL(t);
    const path = u.pathname.replace(/\/+$/, '') || '/';
    return `${u.origin}${path}${u.search}${u.hash}`;
  } catch {
    return t.replace(/\/+$/, '');
  }
}

/**
 * Public origin as seen by the browser (Vercel / proxies set x-forwarded-*).
 * Prefer this over request.nextUrl.origin so redirect_uri matches GCP when proxies differ.
 */
export function getPublicOriginFromRequest(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  if (forwardedHost) {
    const host = forwardedHost.split(',')[0].trim();
    const proto = (forwardedProto?.split(',')[0]?.trim() || 'https').toLowerCase();
    return `${proto}://${host}`;
  }
  return request.nextUrl.origin;
}

/** Must match Authorized redirect URIs in Google Cloud exactly (scheme + host + path). */
export function getGoogleOAuthRedirectUri(request: NextRequest): string {
  const explicit = process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim();
  if (explicit) {
    return normalizeOAuthRedirectUri(explicit);
  }
  const origin = getPublicOriginFromRequest(request);
  return normalizeOAuthRedirectUri(`${origin}${CALLBACK_PATH}`);
}

export function getGoogleClientSecret(): string | undefined {
  return getGoogleClientSecretOrNull() ?? undefined;
}
