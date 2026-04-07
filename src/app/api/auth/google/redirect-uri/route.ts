import { NextRequest, NextResponse } from 'next/server';
import { getGoogleOAuthRedirectUri } from '@/lib/google-oauth-redirect';

/**
 * Public helper: exact `redirect_uri` this app sends to Google for the current deployment.
 * Use this value in Google Cloud → Credentials → OAuth 2.0 Client → Authorized redirect URIs
 * when you see Error 400: redirect_uri_mismatch.
 */
export async function GET(request: NextRequest) {
  const redirectUri = getGoogleOAuthRedirectUri(request);
  const explicit = !!process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim();
  return NextResponse.json({
    redirectUri,
    usesExplicitRedirectUriEnv: explicit,
    instructions:
      'Google Cloud Console → APIs & Services → Credentials → your Web client → Authorized redirect URIs → Add URI (must match exactly, including https and no trailing slash).',
  });
}
