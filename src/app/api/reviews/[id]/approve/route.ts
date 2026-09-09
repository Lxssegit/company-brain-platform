import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/authorize";
import { canAdministerBranch } from "@/lib/branches/access";
import { auditEvent } from "@/lib/audit/write";
import { errorResponse } from "@/lib/http";
import { API_ERROR } from "@/lib/i18n/api";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("APPROVE");
    const organizationId = user.organizationId;
    if (!organizationId) return NextResponse.json({ error: API_ERROR.organizationRequired }, { status: 403 });
    const { id } = await params;
    const review = await prisma.review.findFirst({ where: { id, organizationId, status: "PENDING" } });
    if (!review || !(await canAdministerBranch(user, review.targetBranchId))) return NextResponse.json({ error: API_ERROR.reviewNotFound }, { status: 404 });
    /* Holding APPROVE is not the same as being allowed to wave your own work
       through; a manager could otherwise submit and approve in two calls. */
    if (review.requestedById === user.id) return NextResponse.json({ error: API_ERROR.ownSubmission }, { status: 403 });
    const result = await prisma.$transaction(async (tx) => {
      const approved = await tx.knowledgeUnit.update({ where: { id: review.knowledgeUnitId }, data: { status: "APPROVED", approvedById: user.id, verifiedAt: new Date(), confidence: 0.9 } });
      const resolved = await tx.review.update({ where: { id: review.id }, data: { status: "APPROVED", reviewerId: user.id, resolvedAt: new Date() } });
      await auditEvent(tx, { organizationId, actorUserId: user.id, action: "KNOWLEDGE_APPROVED", entityType: "KnowledgeUnit", entityId: approved.id, before: { status: "PENDING_REVIEW" }, after: { status: approved.status, reviewId: resolved.id } });
      return { approved, review: resolved };
    });
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
