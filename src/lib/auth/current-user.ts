import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { devAuthFallbackEnabled, getDevAuthUser } from "@/lib/auth/dev-store";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  try {
    const databaseUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: { include: { permissions: true } }, organization: true },
    });
    if (databaseUser || !devAuthFallbackEnabled()) return databaseUser;
  } catch (error) {
    if (!devAuthFallbackEnabled()) throw error;
  }
  const devUser = getDevAuthUser(session.user.email ?? undefined);
  if (!devUser) return null;
  return { ...devUser, status: "ACTIVE" as const, organization: { id: devUser.organizationId, name: "Local Company Brain", slug: "local-company-brain" }, role: { key: devUser.roleKey, permissions: [] } };
}

export async function requireOrganizationUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  /* A session outlives the account behind it. Without this check a user who was
     suspended keeps every permission their token was minted with until it
     expires, because nothing else re-reads the record. */
  if (user.status !== "ACTIVE") throw new Error("ACCOUNT_INACTIVE");
  if (!user.organizationId || !user.organization) throw new Error("ORGANIZATION_REQUIRED");
  return user;
}
