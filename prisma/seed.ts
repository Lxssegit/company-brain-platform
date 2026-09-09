import { randomUUID } from "node:crypto";
import { PrismaClient, PermissionKey, RoleKey, type BranchKind } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

const permissions: Record<RoleKey, PermissionKey[]> = {
  SUPER_ADMIN: Object.values(PermissionKey),
  COMPANY_ADMIN: Object.values(PermissionKey),
  DEPARTMENT_ADMIN: [PermissionKey.READ, PermissionKey.CREATE, PermissionKey.EDIT, PermissionKey.APPROVE, PermissionKey.MANAGE_BRANCH, PermissionKey.MANAGE_DECISIONS],
  MANAGER: [PermissionKey.READ, PermissionKey.CREATE, PermissionKey.EDIT, PermissionKey.APPROVE],
  EMPLOYEE: [PermissionKey.READ, PermissionKey.CREATE],
};

const roleNames: Record<RoleKey, string> = {
  SUPER_ADMIN: "Super-Admin",
  COMPANY_ADMIN: "Unternehmens-Admin",
  DEPARTMENT_ADMIN: "Abteilungs-Admin",
  MANAGER: "Teamleitung",
  EMPLOYEE: "Mitarbeitend",
};

async function main() {
  const organization = await prisma.organization.upsert({
    where: { slug: "example-gmbh" },
    update: {},
    create: { name: "Example GmbH", slug: "example-gmbh" },
  });

  for (const key of Object.values(RoleKey)) {
    const role = await prisma.role.upsert({
      where: { organizationId_key: { organizationId: organization.id, key } },
      update: { name: roleNames[key] },
      create: { organizationId: organization.id, key, name: roleNames[key] },
    });
    for (const permissionKey of permissions[key]) {
      await prisma.rolePermission.upsert({ where: { roleId_permissionKey: { roleId: role.id, permissionKey } }, update: {}, create: { roleId: role.id, permissionKey } });
    }
  }
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { organizationId_key: { organizationId: organization.id, key: RoleKey.COMPANY_ADMIN } } });

  /* Branch ids must be real UUIDs: the API validates every branchId it is given
     with z.string().uuid(), so a readable id like `${org.id}-company` produced
     seed data the application then refused to accept. */
  async function branch(name: string, kind: BranchKind, parent?: { id: string; path: string; depth: number }, description?: string, ownerUserId?: string) {
    const existing = await prisma.branch.findFirst({ where: { organizationId: organization.id, name, parentId: parent?.id ?? null } });
    if (existing) return existing;
    const id = randomUUID();
    return prisma.branch.create({
      data: { id, organizationId: organization.id, parentId: parent?.id ?? null, kind, name, description, ownerUserId, path: parent ? `${parent.path}/${id}` : id, depth: parent ? parent.depth + 1 : 0 },
    });
  }

  const company = await branch("Example GmbH", "COMPANY", undefined, "Das gemeinsame Gedächtnis des ganzen Unternehmens.");
  const tech = await branch("Produkt & Technik", "DEPARTMENT", company, "Die Menschen und Systeme, die aus Kundenbedürfnissen ein besseres Produkt machen.");
  const service = await branch("Service", "TEAM", tech, "Das Team, das Kunden am Laufen hält: Support, Störungen und alles dazwischen.");

  const demoEmail = (process.env.AUTH_DEV_EMAIL ?? "demo@example-gmbh.local").trim().toLowerCase();
  const demoPassword = process.env.AUTH_DEV_PASSWORD ?? "company-brain-local";
  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: { organizationId: organization.id, roleId: adminRole.id, status: "ACTIVE", name: "Demo Admin", passwordHash: hashPassword(demoPassword) },
    create: { email: demoEmail, name: "Demo Admin", organizationId: organization.id, roleId: adminRole.id, status: "ACTIVE", passwordHash: hashPassword(demoPassword) },
  });

  /* Without a personal branch and a membership, POST /api/knowledge with the
     default PERSONAL scope has nowhere to write and fails for the very account
     the seed exists to make usable. */
  const personal = await branch("Demo Admin", "PERSONAL", service, "Notizen und Entwürfe, die privat bleiben, bis sie freigegeben werden.", user.id);
  await prisma.branchMember.upsert({
    where: { branchId_userId: { branchId: personal.id, userId: user.id } },
    update: {},
    create: { branchId: personal.id, userId: user.id, access: "READ", grantedBy: user.id },
  });

  console.log(`Seeded ${organization.name}: ${demoEmail} / ${demoPassword}`);
}

main()
  .catch((error) => {
    /* A seed that fails must fail loudly. This used to end in .finally alone,
       so a broken run still exited 0 and CI called it green. */
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
