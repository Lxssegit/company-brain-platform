import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/authorize";
import { canManageKnowledge, visibleKnowledgeWhere } from "@/lib/knowledge/access";
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
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.knowledgeUnit.update({ where: { id }, data: body });
      await auditEvent(tx, { organizationId, actorUserId: user.id, action: "KNOWLEDGE_EDITED", entityType: "KnowledgeUnit", entityId: id, before: { title: existing.title, content: existing.content }, after: { title: updated.title, content: updated.content } });
      return updated;
    });
    return NextResponse.json({ knowledge: result });
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
    if (!existing || !canManageKnowledge(user, existing.createdById, "DELETE")) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.$transaction(async (tx) => {
      await tx.knowledgeUnit.update({ where: { id }, data: { status: "ARCHIVED" } });
      await auditEvent(tx, { organizationId, actorUserId: user.id, action: "KNOWLEDGE_ARCHIVED", entityType: "KnowledgeUnit", entityId: id, before: { status: existing.status }, after: { status: "ARCHIVED" } });
    });
    return NextResponse.json({ archived: true });
  } catch (error) {
    return errorResponse(error);
  }
}
