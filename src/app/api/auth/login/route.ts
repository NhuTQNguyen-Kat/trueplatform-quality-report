import { NextRequest, NextResponse } from 'next/server';
import { AUTH_SESSION_COOKIE, authSessionCookieOptions, signAuthSessionToken } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  const username = process.env.AUTH_USERNAME?.trim();
  const password = (process.env.AUTH_PASSWORD || '').replace(/^["']|["']$/g, '').trim();

  if (!username || !password) {
    return NextResponse.json({ error: 'Auth not configured' }, { status: 500 });
  }

  const body = await request.json();
  const inputUser = (body.username || '').trim();
  const inputPass = body.password || '';

  if (inputUser !== username || inputPass !== password) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  const token = signAuthSessionToken(inputUser, 'password');
  const res = NextResponse.json({ success: true });
  res.cookies.set(AUTH_SESSION_COOKIE, token, authSessionCookieOptions());
  return res;
}
