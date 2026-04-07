import { OAuth2Client } from 'google-auth-library';
import { NextRequest, NextResponse } from 'next/server';
import { AUTH_SESSION_COOKIE, authSessionCookieOptions, signAuthSessionToken } from '@/lib/auth-server';
import {
  GS_OAUTH_NEXT_COOKIE,
  GS_OAUTH_STATE_COOKIE,
  getGoogleClientSecret,
  getGoogleOAuthRedirectUri,
} from '@/lib/google-oauth-redirect';
import { verifyGoogleCredentialAndAllowKatalon } from '@/lib/google-id-token';

function clearOauthCookies(res: NextResponse) {
  res.cookies.set(GS_OAUTH_STATE_COOKIE, '', { maxAge: 0, path: '/' });
  res.cookies.set(GS_OAUTH_NEXT_COOKIE, '', { maxAge: 0, path: '/' });
}

export async function GET(request: NextRequest) {
  const err = request.nextUrl.searchParams.get('error');
  if (err) {
    const login = new URL('/login', request.url);
    login.searchParams.set('google_error', err);
    const res = NextResponse.redirect(login);
    clearOauthCookies(res);
    return res;
  }

  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const cookieState = request.cookies.get(GS_OAUTH_STATE_COOKIE)?.value;
  const nextPath = request.cookies.get(GS_OAUTH_NEXT_COOKIE)?.value || '/';

  if (!code || !state || !cookieState || state !== cookieState) {
    const res = NextResponse.redirect(new URL('/login?google_error=invalid_state', request.url));
    clearOauthCookies(res);
    return res;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = getGoogleClientSecret();
  if (!clientId || !clientSecret) {
    const res = NextResponse.redirect(new URL('/login?google_error=oauth_not_configured', request.url));
    clearOauthCookies(res);
    return res;
  }

  const redirectUri = getGoogleOAuthRedirectUri(request);
  const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);

  let idToken: string | undefined;
  try {
    const { tokens } = await oauth2Client.getToken({
      code,
      redirect_uri: redirectUri,
    });
    idToken = tokens.id_token ?? undefined;
  } catch {
    const res = NextResponse.redirect(new URL('/login?google_error=token_exchange', request.url));
    clearOauthCookies(res);
    return res;
  }

  if (!idToken) {
    const res = NextResponse.redirect(new URL('/login?google_error=no_id_token', request.url));
    clearOauthCookies(res);
    return res;
  }

  const result = await verifyGoogleCredentialAndAllowKatalon(idToken);
  if (!result.ok) {
    const u = new URL('/login', request.url);
    u.searchParams.set('google_error', result.reason);
    const res = NextResponse.redirect(u);
    clearOauthCookies(res);
    return res;
  }

  const sessionToken = signAuthSessionToken(result.user.email, 'google');
  const res = NextResponse.redirect(new URL(nextPath, request.url));
  res.cookies.set(AUTH_SESSION_COOKIE, sessionToken, authSessionCookieOptions());
  clearOauthCookies(res);
  return res;
}
