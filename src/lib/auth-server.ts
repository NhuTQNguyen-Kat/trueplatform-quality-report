import { createHmac } from 'crypto';
import type { NextResponse } from 'next/server';
import { AUTH_SESSION_COOKIE } from '@/lib/auth-constants';

export { AUTH_SESSION_COOKIE };

const MAX_AGE_SEC = 24 * 60 * 60;

export type AuthMethod = 'google' | 'password';

/**
 * Signs a session token (username or email) + auth method.
 * Format v2: `method|subject|exp|sig` (pipe-separated; subject must not contain `|`).
 * Legacy v1 (still verified in middleware): `subject:exp:sig` (colon-separated).
 */
export function signAuthSessionToken(userSubject: string, method: AuthMethod = 'password'): string {
  const secret = process.env.AUTH_SECRET || 'fallback-secret';
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const payload = `${method}|${userSubject}|${exp}`;
  const sig = createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(`${payload}|${sig}`).toString('base64url');
}

/**
 * Parse and verify a session cookie value (Node API routes). Returns null if invalid or expired.
 */
export function parseAuthSessionToken(token: string | undefined): {
  subject: string;
  method: AuthMethod;
} | null {
  if (!token?.trim()) return null;
  const secret = process.env.AUTH_SECRET || 'fallback-secret';
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const pipe = decoded.split('|');
    if (pipe.length === 4) {
      const [method, subject, expStr, actualSig] = pipe;
      if (method !== 'google' && method !== 'password') return null;
      const exp = parseInt(expStr, 10);
      if (!Number.isFinite(exp) || exp < Date.now() / 1000) return null;
      const payload = `${method}|${subject}|${expStr}`;
      const expectedSig = createHmac('sha256', secret).update(payload).digest('hex');
      if (actualSig !== expectedSig) return null;
      return { subject, method: method as AuthMethod };
    }
    const colon = decoded.split(':');
    if (colon.length === 3) {
      const [user, expStr, actualSig] = colon;
      const exp = parseInt(expStr, 10);
      if (!Number.isFinite(exp) || exp < Date.now() / 1000) return null;
      const payload = `${user}:${expStr}`;
      const expectedSig = createHmac('sha256', secret).update(payload).digest('hex');
      if (actualSig !== expectedSig) return null;
      const method: AuthMethod = user.includes('@') ? 'google' : 'password';
      return { subject: user, method };
    }
    return null;
  } catch {
    return null;
  }
}

export function authSessionCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax';
  maxAge: number;
  path: string;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE_SEC,
    path: '/',
  };
}

/** Clear session cookie — must mirror {@link authSessionCookieOptions} or browsers keep the old cookie (esp. `Secure`). */
export function clearAuthSessionCookie(res: NextResponse): void {
  res.cookies.set(AUTH_SESSION_COOKIE, '', {
    ...authSessionCookieOptions(),
    maxAge: 0,
  });
}
