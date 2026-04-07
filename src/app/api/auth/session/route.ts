import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_SESSION_COOKIE } from '@/lib/auth-constants';
import { parseAuthSessionToken } from '@/lib/auth-server';

/**
 * Current session (subject + sign-in method). Requires valid auth cookie; 401 otherwise.
 */
export async function GET() {
  const token = cookies().get(AUTH_SESSION_COOKIE)?.value;
  const session = parseAuthSessionToken(token);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    subject: session.subject,
    method: session.method,
  });
}
