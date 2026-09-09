import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { ROLE_KEYS } from "@/lib/domain/enums";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/authorize";
import { auditEvent } from "@/lib/audit/write";
import { errorResponse } from "@/lib/http";

const userSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  role: z.enum(ROLE_KEYS).default("EMPLOYEE"),
  parentBranchId: z.string().uuid().optional(),
});

export async function GET() {
  try {
    const actor = await requirePermission("READ");
    const users = await prisma.user.findMany({
      where: { organizationId: actor.organizationId },
      select: { id: true, name: true, email: true, status: true, createdAt: true, role: { select: { key: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ users });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requirePermission("MANAGE_USERS");
    const organizationId = actor.organizationId;
    if (!organizationId) return NextResponse.json({ error: "Organization required" }, { status: 403 });
    const body = userSchema.parse(await request.json());
    const email = body.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    const role = await prisma.role.findUnique({ where: { organizationId_key: { organizationId, key: body.role } } });
    if (!role) return NextResponse.json({ error: "Role not configured" }, { status: 409 });

    const parent = body.parentBranchId
      ? await prisma.branch.findFirst({ where: { id: body.parentBranchId, organizationId } })
      : await prisma.branch.findFirst({ where: { organizationId, kind: "COMPANY", depth: 0 } });
    if (!parent) return NextResponse.json({ error: "Parent branch not found" }, { status: 404 });
    const personalBranchId = randomUUID();
    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({ data: { name: body.name, email, organizationId, roleId: role.id, status: "INVITED" }, select: { id: true, name: true, email: true, status: true, role: { select: { key: true, name: true } } } });
      const personalBranch = await tx.branch.create({ data: { id: personalBranchId, organizationId, parentId: parent.id, kind: "PERSONAL", name: body.name, path: `${parent.path}/${personalBranchId}`, depth: parent.depth + 1, ownerUserId: created.id } });
      await tx.branchMember.create({ data: { branchId: personalBranch.id, userId: created.id, access: "READ", grantedBy: actor.id } });
      await auditEvent(tx, { organizationId, actorUserId: actor.id, action: "USER_INVITED", entityType: "User", entityId: created.id, after: { email: created.email, role: body.role, personalBranchId: personalBranch.id } });
      return { user: created, personalBranch };
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
