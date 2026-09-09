import { NextResponse } from "next/server";
import { z } from "zod";
import { BRANCH_ACCESS_VALUES } from "@/lib/domain/enums";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/authorize";
import { canAdministerBranch } from "@/lib/branches/access";
import { auditEvent } from "@/lib/audit/write";
import { errorResponse } from "@/lib/http";
import { API_ERROR } from "@/lib/i18n/api";

const memberSchema = z.object({ userId: z.string().min(1), access: z.enum(BRANCH_ACCESS_VALUES) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePermission("MANAGE_BRANCH");
    const { id: branchId } = await params;
    if (!(await canAdministerBranch(actor, branchId))) return NextResponse.json({ error: API_ERROR.branchNotFound }, { status: 404 });
    const organizationId = actor.organizationId;
    if (!organizationId) return NextResponse.json({ error: API_ERROR.organizationRequired }, { status: 403 });
    const body = memberSchema.parse(await request.json());
    const [branch, user] = await Promise.all([
      prisma.branch.findFirst({ where: { id: branchId, organizationId } }),
      prisma.user.findFirst({ where: { id: body.userId, organizationId } }),
    ]);
    if (!branch || !user) return NextResponse.json({ error: API_ERROR.branchOrUserNotFound }, { status: 404 });
    const previous = await prisma.branchMember.findUnique({ where: { branchId_userId: { branchId, userId: body.userId } } });
    const membership = await prisma.$transaction(async (tx) => {
      const next = await tx.branchMember.upsert({ where: { branchId_userId: { branchId, userId: body.userId } }, update: { access: body.access, grantedBy: actor.id }, create: { branchId, userId: body.userId, access: body.access, grantedBy: actor.id } });
      await auditEvent(tx, { organizationId, actorUserId: actor.id, action: previous ? "BRANCH_ACCESS_CHANGED" : "BRANCH_ACCESS_GRANTED", entityType: "BranchMember", entityId: `${branchId}:${body.userId}`, before: previous ? { access: previous.access } : undefined, after: { branchId, userId: body.userId, access: next.access } });
      return next;
    });
    return NextResponse.json({ membership }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
