import { NextResponse } from 'next/server';
import { clearAuthSessionCookie } from '@/lib/auth-server';

export async function POST() {
  const res = NextResponse.json({ success: true });
  clearAuthSessionCookie(res);
  return res;
}
