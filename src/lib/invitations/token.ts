import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Invitations reuse the adapter's VerificationToken table rather than adding a
 * parallel one. Two rules make that safe:
 *
 * - The identifier is namespaced, so an invitation can never be mistaken for
 *   the email-verification tokens the adapter issues for the same address.
 * - Only the hash is stored. A leaked database row cannot be replayed as a
 *   link, the same reason password hashes exist.
 */
export const INVITE_TTL_DAYS = 7;

export function inviteIdentifier(userId: string) {
  return `invite:${userId}`;
}

export function newInviteSecret() {
  return randomBytes(32).toString("base64url");
}

export function hashInviteSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

/** Constant-time, so a wrong token cannot be narrowed by timing. */
export function inviteSecretMatches(secret: string, storedHash: string) {
  const a = Buffer.from(hashInviteSecret(secret), "hex");
  const b = Buffer.from(storedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function inviteExpiry(now = new Date()) {
  return new Date(now.getTime() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
}

/** The link an administrator passes on, since nothing here sends mail yet. */
export function inviteUrl(origin: string, userId: string, secret: string) {
  return `${origin.replace(/\/$/, "")}/einladung/${userId}.${secret}`;
}

/** Splits `<userId>.<secret>` back apart; returns null on anything malformed. */
export function parseInviteParam(param: string): { userId: string; secret: string } | null {
  const separator = param.indexOf(".");
  if (separator <= 0 || separator === param.length - 1) return null;
  const userId = param.slice(0, separator);
  const secret = param.slice(separator + 1);
  if (!/^[0-9a-fA-F-]{36}$/.test(userId) && !/^c[a-z0-9]{20,}$/.test(userId)) return null;
  if (!/^[A-Za-z0-9_-]{20,}$/.test(secret)) return null;
  return { userId, secret };
}
