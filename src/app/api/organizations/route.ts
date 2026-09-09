import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { auth } from "@/auth";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { auditEvent } from "@/lib/audit/write";
import { errorResponse } from "@/lib/http";
import type { PermissionKey, RoleKey } from "@prisma/client";
import { PERMISSION_KEYS, ROLE_KEYS } from "@/lib/domain/enums";

const createOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80).optional(),
});

const rolePermissions: Record<RoleKey, PermissionKey[]> = {
  SUPER_ADMIN: [...PERMISSION_KEYS],
  COMPANY_ADMIN: [...PERMISSION_KEYS],
  DEPARTMENT_ADMIN: ["READ", "CREATE", "EDIT", "APPROVE", "MANAGE_BRANCH", "MANAGE_DECISIONS"],
  MANAGER: ["READ", "CREATE", "EDIT", "APPROVE"],
  EMPLOYEE: ["READ", "CREATE"],
};

const roleNames: Record<RoleKey, string> = {
  SUPER_ADMIN: "Super Admin",
  COMPANY_ADMIN: "Company Admin",
  DEPARTMENT_ADMIN: "Department Admin",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
};

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) return NextResponse.json({ organization: null });
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { id: true, name: true, slug: true, createdAt: true, _count: { select: { users: true, branches: true } } },
    });
    return NextResponse.json({ organization });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    /* session.user.organizationId is minted once at sign-in. Someone who signed
       in before being assigned an organization could otherwise create a second
       one and reassign themselves to it as its admin. */
    const account = await getCurrentUser();
    if (!account) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    if (account.status !== "ACTIVE") return NextResponse.json({ error: "Account is not active" }, { status: 403 });
    if (account.organizationId) return NextResponse.json({ error: "User already belongs to an organization" }, { status: 409 });

    const body = createOrganizationSchema.parse(await request.json());
    const slug = body.slug ?? slugify(body.name);
    const existing = await prisma.organization.findUnique({ where: { slug } });
    if (existing) return NextResponse.json({ error: "Slug already exists" }, { status: 409 });

    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({ data: { name: body.name, slug } });
      const companyBranchId = randomUUID();
      await tx.branch.create({ data: { id: companyBranchId, organizationId: organization.id, kind: "COMPANY", name: body.name, path: companyBranchId, depth: 0 } });
      const roles = [];
      for (const key of ROLE_KEYS) {
        const role = await tx.role.create({ data: { organizationId: organization.id, key, name: roleNames[key] } });
        await tx.rolePermission.createMany({ data: rolePermissions[key].map((permissionKey) => ({ roleId: role.id, permissionKey })) });
        roles.push(role);
      }
      const adminRole = roles.find((role) => role.key === "COMPANY_ADMIN");
      await tx.user.update({ where: { id: session.user.id }, data: { organizationId: organization.id, roleId: adminRole?.id, status: "ACTIVE" } });
      await auditEvent(tx, { organizationId: organization.id, actorUserId: session.user.id, action: "ORGANIZATION_CREATED", entityType: "Organization", entityId: organization.id, after: { name: organization.name, slug: organization.slug, founderUserId: session.user.id } });
      return organization;
    });

    return NextResponse.json({ organization: result }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
