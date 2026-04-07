import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuthCookie } from '@/lib/auth';
import { isGoogleOAuthRedirectReady } from '@/lib/google-oauth-config';

export async function middleware(request: NextRequest) {
  const legacyAuthEnabled = !!(process.env.AUTH_USERNAME?.trim() && process.env.AUTH_PASSWORD);
  /** Match redirect OAuth: ID alone is not enough (would lock the app with no way to sign in). */
  const googleAuthEnabled = isGoogleOAuthRedirectReady();
  const authEnabled = legacyAuthEnabled || googleAuthEnabled;
  if (!authEnabled) return NextResponse.next();

  const cookieHeader = request.headers.get('cookie');
  const isLoggedIn = await verifyAuthCookie(cookieHeader);

  const isLogin = request.nextUrl.pathname === '/login';
  const isAuthApi = request.nextUrl.pathname.startsWith('/api/auth');

  if (isLogin || isAuthApi) {
    if (isLogin && isLoggedIn) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    // API routes: return 401 JSON so fetch() gets proper error (redirect would return HTML)
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized', loginUrl: '/login' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
