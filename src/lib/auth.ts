import { AUTH_SESSION_COOKIE } from '@/lib/auth-constants';

async function hmacSha256Hex(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function decodeBase64Url(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  return atob(base64);
}

export async function verifyAuthCookie(cookieHeader: string | null): Promise<boolean> {
  if (!cookieHeader) return false;
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const idx = c.trim().indexOf('=');
      if (idx < 0) return [c.trim(), ''];
      const k = c.trim().slice(0, idx);
      const v = c.trim().slice(idx + 1).trim();
      return [k, v];
    })
  );
  const token = cookies[AUTH_SESSION_COOKIE];
  if (!token) return false;
  try {
    const secret = process.env.AUTH_SECRET || 'fallback-secret';
    const decoded = decodeBase64Url(token);
    const pipe = decoded.split('|');
    if (pipe.length === 4) {
      const [method, user, expStr, actualSig] = pipe;
      if (method !== 'google' && method !== 'password') return false;
      const exp = parseInt(expStr, 10);
      if (!Number.isFinite(exp) || exp < Date.now() / 1000) return false;
      const payload = `${method}|${user}|${expStr}`;
      const expectedSig = await hmacSha256Hex(payload, secret);
      return actualSig === expectedSig;
    }
    const parts = decoded.split(':');
    if (parts.length < 3) return false;
    const [user, expStr, actualSig] = parts;
    const payload = `${user}:${expStr}`;
    const exp = parseInt(expStr, 10);
    if (exp < Date.now() / 1000) return false;
    const expectedSig = await hmacSha256Hex(payload, secret);
    return actualSig === expectedSig;
  } catch {
    return false;
  }
}
