import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/authorize";
import { canAdministerBranch } from "@/lib/branches/access";
import { auditEvent } from "@/lib/audit/write";
import { errorResponse } from "@/lib/http";

const rejectSchema = z.object({ comment: z.string().trim().max(1000).optional() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("APPROVE");
    const organizationId = user.organizationId;
    if (!organizationId) return NextResponse.json({ error: "Organization required" }, { status: 403 });
    const { id } = await params;
    const review = await prisma.review.findFirst({ where: { id, organizationId, status: "PENDING" } });
    if (!review || !(await canAdministerBranch(user, review.targetBranchId))) return NextResponse.json({ error: "Review not found" }, { status: 404 });
    /* Holding APPROVE is not the same as being allowed to wave your own work
       through; a manager could otherwise submit and approve in two calls. */
    if (review.requestedById === user.id) return NextResponse.json({ error: "You cannot review your own submission" }, { status: 403 });
    const body = rejectSchema.parse(await request.json().catch(() => ({})));
    const result = await prisma.$transaction(async (tx) => {
      const rejected = await tx.knowledgeUnit.update({ where: { id: review.knowledgeUnitId }, data: { status: "REJECTED" } });
      const resolved = await tx.review.update({ where: { id: review.id }, data: { status: "REJECTED", reviewerId: user.id, resolvedAt: new Date(), comment: body.comment } });
      await auditEvent(tx, { organizationId, actorUserId: user.id, action: "KNOWLEDGE_REJECTED", entityType: "KnowledgeUnit", entityId: rejected.id, before: { status: "PENDING_REVIEW" }, after: { status: rejected.status, reviewId: resolved.id } });
      return { rejected, review: resolved };
    });
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
