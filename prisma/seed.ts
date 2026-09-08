import { PrismaClient, PermissionKey, RoleKey } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

const permissions: Record<RoleKey, PermissionKey[]> = {
  SUPER_ADMIN: Object.values(PermissionKey),
  COMPANY_ADMIN: Object.values(PermissionKey),
  DEPARTMENT_ADMIN: [PermissionKey.READ, PermissionKey.CREATE, PermissionKey.EDIT, PermissionKey.APPROVE, PermissionKey.MANAGE_BRANCH, PermissionKey.MANAGE_DECISIONS],
  MANAGER: [PermissionKey.READ, PermissionKey.CREATE, PermissionKey.EDIT, PermissionKey.APPROVE],
  EMPLOYEE: [PermissionKey.READ, PermissionKey.CREATE],
};

async function main() {
  const organization = await prisma.organization.upsert({ where: { slug: "example-gmbh" }, update: {}, create: { name: "Example GmbH", slug: "example-gmbh" } });
  const companyBranchId = `${organization.id}-company`;
  await prisma.branch.upsert({ where: { id: companyBranchId }, update: {}, create: { id: companyBranchId, organizationId: organization.id, kind: "COMPANY", name: organization.name, path: companyBranchId, depth: 0 } });
  for (const key of Object.values(RoleKey)) {
    const role = await prisma.role.upsert({ where: { organizationId_key: { organizationId: organization.id, key } }, update: {}, create: { organizationId: organization.id, key, name: key.replaceAll("_", " ") } });
    for (const permissionKey of permissions[key]) {
      await prisma.rolePermission.upsert({ where: { roleId_permissionKey: { roleId: role.id, permissionKey } }, update: {}, create: { roleId: role.id, permissionKey } });
    }
  }
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { organizationId_key: { organizationId: organization.id, key: RoleKey.COMPANY_ADMIN } } });
  const demoEmail = (process.env.AUTH_DEV_EMAIL ?? "demo@example-gmbh.local").trim().toLowerCase();
  const demoPassword = process.env.AUTH_DEV_PASSWORD ?? "company-brain-local";
  await prisma.user.upsert({ where: { email: demoEmail }, update: { organizationId: organization.id, roleId: adminRole.id, status: "ACTIVE", name: "Demo Admin", passwordHash: hashPassword(demoPassword) }, create: { email: demoEmail, name: "Demo Admin", organizationId: organization.id, roleId: adminRole.id, status: "ACTIVE", passwordHash: hashPassword(demoPassword) } });
  console.log(`Seeded ${organization.name}`);
}

main().finally(() => prisma.$disconnect());
