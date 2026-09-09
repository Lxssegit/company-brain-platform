import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/authorize";
import { canAdministerBranch, canReadBranch } from "@/lib/branches/access";
import { auditEvent } from "@/lib/audit/write";
import { errorResponse } from "@/lib/http";

const updateSchema = z.object({ name: z.string().trim().min(2).max(120).optional(), description: z.string().trim().max(500).nullable().optional() });

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("READ");
    const organizationId = user.organizationId;
    if (!organizationId) return NextResponse.json({ error: "Organization required" }, { status: 403 });
    const { id } = await params;
    if (!(await canReadBranch(user, id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const branch = await prisma.branch.findFirst({ where: { id, organizationId }, include: { children: true, memberships: { select: { userId: true, access: true } } } });
    return branch ? NextResponse.json({ branch }) : NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("MANAGE_BRANCH");
    const organizationId = user.organizationId;
    if (!organizationId) return NextResponse.json({ error: "Organization required" }, { status: 403 });
    const { id } = await params;
    if (!(await canAdministerBranch(user, id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const body = updateSchema.parse(await request.json());
    const branch = await prisma.branch.findFirst({ where: { id, organizationId } });
    if (!branch) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.branch.update({ where: { id }, data: body });
      await auditEvent(tx, { organizationId, actorUserId: user.id, action: "BRANCH_UPDATED", entityType: "Branch", entityId: id, before: { name: branch.name, description: branch.description }, after: { name: next.name, description: next.description } });
      return next;
    });
    return NextResponse.json({ branch: updated });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("MANAGE_BRANCH");
    const organizationId = user.organizationId;
    if (!organizationId) return NextResponse.json({ error: "Organization required" }, { status: 403 });
    const { id } = await params;
    if (!(await canAdministerBranch(user, id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const branch = await prisma.branch.findFirst({ where: { id, organizationId } });
    if (!branch) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (branch.kind === "COMPANY") return NextResponse.json({ error: "Company root cannot be deleted" }, { status: 422 });

    /* Branch.parent cascades, so deleting a department would silently take its
       whole subtree with it. Knowledge is Restrict, so the same call can also
       fail on a raw foreign-key error instead of saying what is in the way.
       Both are answered here before anything is destroyed. */
    const [children, knowledge, decisions] = await Promise.all([
      prisma.branch.count({ where: { parentId: id } }),
      prisma.knowledgeUnit.count({ where: { branchId: id } }),
      prisma.decisionBranch.count({ where: { branchId: id } }),
    ]);
    if (children) return NextResponse.json({ error: `Branch still has ${children} nested branch(es). Move or delete them first.` }, { status: 409 });
    if (knowledge) return NextResponse.json({ error: `Branch still holds ${knowledge} knowledge unit(s). Move or archive them first.` }, { status: 409 });
    if (decisions) return NextResponse.json({ error: `Branch is still bound to ${decisions} decision(s). Detach them first.` }, { status: 409 });

    await prisma.$transaction(async (tx) => {
      await tx.branch.delete({ where: { id } });
      await auditEvent(tx, { organizationId, actorUserId: user.id, action: "BRANCH_DELETED", entityType: "Branch", entityId: id, before: { name: branch.name, kind: branch.kind, parentId: branch.parentId } });
    });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
