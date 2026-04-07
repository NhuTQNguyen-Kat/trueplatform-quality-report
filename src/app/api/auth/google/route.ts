import { NextRequest, NextResponse } from 'next/server';
import { AUTH_SESSION_COOKIE, authSessionCookieOptions, signAuthSessionToken } from '@/lib/auth-server';
import { verifyGoogleCredentialAndAllowKatalon } from '@/lib/google-id-token';

/**
 * Accepts GIS credential (JWT) in JSON body, verifies with Google, enforces @katalon.com server-side, then sets session cookie.
 */
export async function POST(request: NextRequest) {
  let body: { credential?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'invalid_body', message: 'Expected JSON with a credential field.' },
      { status: 400 }
    );
  }

  const credential = typeof body.credential === 'string' ? body.credential.trim() : '';
  if (!credential) {
    return NextResponse.json(
      { error: 'missing_credential', message: 'No Google credential was sent.' },
      { status: 400 }
    );
  }

  const result = await verifyGoogleCredentialAndAllowKatalon(credential);
  if (!result.ok) {
    const status =
      result.reason === 'invalid_token' || result.reason === 'missing_email' ? 401 : 403;
    return NextResponse.json(
      {
        error: result.reason,
        message: result.message,
      },
      { status }
    );
  }

  const token = signAuthSessionToken(result.user.email, 'google');
  const res = NextResponse.json({ success: true, email: result.user.email });
  res.cookies.set(AUTH_SESSION_COOKIE, token, authSessionCookieOptions());
  return res;
}
