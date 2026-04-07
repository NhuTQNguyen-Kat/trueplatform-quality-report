import { NextResponse } from 'next/server';
import {
  getGoogleClientIdOrNull,
  getGoogleClientSecretOrNull,
  isGoogleOAuthRedirectReady,
} from '@/lib/google-oauth-config';

/**
 * Public login UI flags. `googleClientId` is the OAuth Web Client ID (public by design).
 * Google sign-in uses full-page OAuth redirect — requires client ID + client secret on the server.
 */
export async function GET() {
  const googleClientId = getGoogleClientIdOrNull();
  const googleClientSecret = getGoogleClientSecretOrNull();
  const googleOAuthReady = isGoogleOAuthRedirectReady();
  return NextResponse.json({
    passwordLoginEnabled: !!(process.env.AUTH_USERNAME?.trim() && process.env.AUTH_PASSWORD),
    googleLoginEnabled: googleOAuthReady,
    googleClientId,
    googleOAuthMisconfigured: !!googleClientId && !googleClientSecret,
  });
}
