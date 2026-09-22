import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/password-policy";

const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16_384, r: 8, p: 1 } as const;

export { PASSWORD_MIN_LENGTH };

export function hashPassword(password: string) {
  if (password.length < PASSWORD_MIN_LENGTH) throw new Error(`Password must contain at least ${PASSWORD_MIN_LENGTH} characters`);
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEY_LENGTH, SCRYPT_OPTIONS);
  return `scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export function verifyPassword(password: string, encoded: string | null | undefined) {
  if (!encoded) return false;
  const [algorithm, saltText, hashText] = encoded.split("$");
  if (algorithm !== "scrypt" || !saltText || !hashText) return false;
  try {
    const salt = Buffer.from(saltText, "base64url");
    const expected = Buffer.from(hashText, "base64url");
    const actual = scryptSync(password, salt, expected.length, SCRYPT_OPTIONS);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
