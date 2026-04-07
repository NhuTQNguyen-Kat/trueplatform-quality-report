import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getGoogleClientSecretOrNull } from '@/lib/google-oauth-config';
import {
  GS_OAUTH_NEXT_COOKIE,
  GS_OAUTH_STATE_COOKIE,
  getGoogleOAuthRedirectUri,
  safeInternalPath,
} from '@/lib/google-oauth-redirect';

const COOKIE_MAX_AGE = 600;

/**
 * Starts OAuth 2.0 authorization (full-page redirect). Works in embedded browsers where GIS popups fail.
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    return NextResponse.json({ error: 'Google sign-in is not configured' }, { status: 500 });
  }
  if (!getGoogleClientSecretOrNull()) {
    return NextResponse.redirect(new URL('/login?google_error=oauth_not_configured', request.url));
  }

  const next = safeInternalPath(request.nextUrl.searchParams.get('next'));
  const redirectUri = getGoogleOAuthRedirectUri(request);
  const state = randomBytes(16).toString('hex');

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('prompt', 'select_account');

  const res = NextResponse.redirect(authUrl.toString());
  const base = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  };
  res.cookies.set(GS_OAUTH_STATE_COOKIE, state, base);
  res.cookies.set(GS_OAUTH_NEXT_COOKIE, next, base);
  return res;
}
