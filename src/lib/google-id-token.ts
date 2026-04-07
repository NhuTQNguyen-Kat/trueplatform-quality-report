import type { TokenPayload } from 'google-auth-library';
import { OAuth2Client } from 'google-auth-library';

export type GoogleLoginRejectReason =
  | 'missing_email'
  | 'email_not_verified'
  | 'domain_not_allowed'
  | 'hosted_domain_mismatch'
  | 'invalid_token';

export type VerifiedKatalonUser = {
  email: string;
  sub: string;
  name?: string;
  picture?: string;
};

function getExpectedEmailDomain(): string {
  return (process.env.ALLOWED_GOOGLE_EMAIL_DOMAIN || 'katalon.com').trim().toLowerCase().replace(/^@/, '');
}

/** Workspace “hd” claim; defaults to same as email domain. */
function getExpectedHostedDomain(): string {
  const raw = process.env.ALLOWED_GOOGLE_WORKSPACE_HD?.trim();
  if (raw) return raw.toLowerCase().replace(/^@/, '');
  return getExpectedEmailDomain();
}

/**
 * Verifies a Google ID token (JWT) from GIS, then enforces Katalon-only access on the server.
 * Does not trust any client-supplied profile fields without verification.
 */
export async function verifyGoogleCredentialAndAllowKatalon(
  idToken: string
): Promise<{ ok: true; user: VerifiedKatalonUser } | { ok: false; reason: GoogleLoginRejectReason; message: string }> {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    return { ok: false, reason: 'invalid_token', message: 'Google sign-in is not configured.' };
  }

  const client = new OAuth2Client(clientId);
  let payload: TokenPayload | undefined;

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });
    payload = ticket.getPayload() ?? undefined;
    if (!payload) {
      return { ok: false, reason: 'invalid_token', message: 'Token verification failed.' };
    }
  } catch {
    return { ok: false, reason: 'invalid_token', message: 'Invalid or expired Google credential.' };
  }

  const email = payload.email?.trim().toLowerCase();
  if (!email) {
    return { ok: false, reason: 'missing_email', message: 'Google account has no email.' };
  }

  if (payload.email_verified !== true) {
    return {
      ok: false,
      reason: 'email_not_verified',
      message: 'Your Google email must be verified before you can sign in.',
    };
  }

  const domain = getExpectedEmailDomain();
  const emailParts = email.split('@');
  const emailDomain = emailParts.length >= 2 ? emailParts[emailParts.length - 1] : '';
  if (emailDomain !== domain) {
    return {
      ok: false,
      reason: 'domain_not_allowed',
      message: `Only @${domain} accounts can access this application.`,
    };
  }

  const expectedHd = getExpectedHostedDomain();
  if (payload.hd != null && String(payload.hd).toLowerCase() !== expectedHd) {
    return {
      ok: false,
      reason: 'hosted_domain_mismatch',
      message: 'This Google workspace does not match the allowed organization.',
    };
  }

  return {
    ok: true,
    user: {
      email,
      sub: payload.sub,
      name: payload.name,
      picture: payload.picture,
    },
  };
}
