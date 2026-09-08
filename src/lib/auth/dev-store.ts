import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export type DevAuthUser = {
  isDevAuthUser: true;
  id: string;
  email: string;
  name: string;
  organizationId: string;
  roleKey: "COMPANY_ADMIN";
  passwordHash: string;
  totpEnabled: boolean;
  totpSecretEncrypted: string | null;
  totpPendingSecretEncrypted: string | null;
};

const storePath = join(process.cwd(), ".dev-auth.json");

function defaultUser(): DevAuthUser {
  return { isDevAuthUser: true, id: "dev-local-user", email: (process.env.AUTH_DEV_EMAIL ?? "demo@example-gmbh.local").trim().toLowerCase(), name: "Demo Admin", organizationId: "dev-local-organization", roleKey: "COMPANY_ADMIN", passwordHash: hashPassword(process.env.AUTH_DEV_PASSWORD ?? "company-brain-local"), totpEnabled: false, totpSecretEncrypted: null, totpPendingSecretEncrypted: null };
}

function readUser() {
  if (!existsSync(storePath)) {
    const user = defaultUser();
    writeFileSync(storePath, JSON.stringify(user, null, 2), { mode: 0o600 });
    return user;
  }
  try {
    return JSON.parse(readFileSync(storePath, "utf8")) as DevAuthUser;
  } catch {
    const user = defaultUser();
    writeFileSync(storePath, JSON.stringify(user, null, 2), { mode: 0o600 });
    return user;
  }
}

export function devAuthFallbackEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.AUTH_DEV_MEMORY_FALLBACK !== "false";
}

export function authenticateDevUser(email: string, password: string, totpCheck?: (user: DevAuthUser) => boolean) {
  if (!devAuthFallbackEnabled()) return null;
  const user = readUser();
  if (user.email !== email || !verifyPassword(password, user.passwordHash)) return null;
  if (user.totpEnabled && totpCheck && !totpCheck(user)) return null;
  if (user.totpEnabled && !totpCheck) return null;
  return user;
}

export function getDevAuthUser(email?: string) {
  if (!devAuthFallbackEnabled()) return null;
  const user = readUser();
  return !email || user.email === email.trim().toLowerCase() ? user : null;
}

export function updateDevAuthUser(update: Partial<Pick<DevAuthUser, "totpEnabled" | "totpSecretEncrypted" | "totpPendingSecretEncrypted">>) {
  const user = { ...readUser(), ...update };
  writeFileSync(storePath, JSON.stringify(user, null, 2), { mode: 0o600 });
  return user;
}

export function isDevAuthUser(user: object): user is DevAuthUser {
  return "isDevAuthUser" in user && user.isDevAuthUser === true;
}
