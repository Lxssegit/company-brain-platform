import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/authorize";
import { canArchiveKnowledge, canManageKnowledge, editNeedsReapproval, visibleKnowledgeWhere } from "@/lib/knowledge/access";
import { auditEvent } from "@/lib/audit/write";
import { errorResponse } from "@/lib/http";

const updateSchema = z.object({ title: z.string().trim().min(3).max(180).optional(), content: z.string().trim().min(10).max(12000).optional() });

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("READ");
    const { id } = await params;
    const where = await visibleKnowledgeWhere(user);
    if (!where) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const knowledge = await prisma.knowledgeUnit.findFirst({ where: { AND: [where, { id }] }, include: { branch: true, sources: { include: { source: true } }, reviews: { orderBy: { createdAt: "desc" }, take: 1 } } });
    return knowledge ? NextResponse.json({ knowledge }) : NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("EDIT");
    const organizationId = user.organizationId;
    if (!organizationId) return NextResponse.json({ error: "Organization required" }, { status: 403 });
    const { id } = await params;
    const where = await visibleKnowledgeWhere(user);
    if (!where) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const existing = await prisma.knowledgeUnit.findFirst({ where: { AND: [where, { id }] } });
    if (!existing || !canManageKnowledge(user, existing.createdById, "EDIT")) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const body = updateSchema.parse(await request.json());
    const changed = (body.title !== undefined && body.title !== existing.title) || (body.content !== undefined && body.content !== existing.content);
    /* An approval says somebody accountable read this exact text. Editing it in
       place would leave that approval standing over words nobody agreed to. */
    const reReview = changed && editNeedsReapproval(existing, user.role?.key);

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.knowledgeUnit.update({
        where: { id },
        data: reReview ? { ...body, status: "PENDING_REVIEW", approvedById: null, verifiedAt: null } : body,
      });
      if (reReview) {
        /* Reuse an open review rather than stacking a second one for the same
           unit; the queue must not show it twice. */
        const open = await tx.review.findFirst({ where: { knowledgeUnitId: id, status: "PENDING" } });
        if (!open) await tx.review.create({ data: { organizationId, knowledgeUnitId: id, targetBranchId: existing.branchId, requestedById: user.id } });
      }
      await auditEvent(tx, { organizationId, actorUserId: user.id, action: reReview ? "KNOWLEDGE_EDITED_PENDING_REVIEW" : "KNOWLEDGE_EDITED", entityType: "KnowledgeUnit", entityId: id, before: { title: existing.title, content: existing.content, status: existing.status }, after: { title: updated.title, content: updated.content, status: updated.status } });
      return updated;
    });
    return NextResponse.json({ knowledge: result, returnedToReview: reReview });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("DELETE");
    const organizationId = user.organizationId;
    if (!organizationId) return NextResponse.json({ error: "Organization required" }, { status: 403 });
    const { id } = await params;
    const where = await visibleKnowledgeWhere(user);
    if (!where) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const existing = await prisma.knowledgeUnit.findFirst({ where: { AND: [where, { id }] } });
    if (!existing || !canArchiveKnowledge(user, existing)) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.$transaction(async (tx) => {
      await tx.knowledgeUnit.update({ where: { id }, data: { status: "ARCHIVED" } });
      await auditEvent(tx, { organizationId, actorUserId: user.id, action: "KNOWLEDGE_ARCHIVED", entityType: "KnowledgeUnit", entityId: id, before: { status: existing.status }, after: { status: "ARCHIVED" } });
    });
    return NextResponse.json({ archived: true });
  } catch (error) {
    return errorResponse(error);
  }
}
