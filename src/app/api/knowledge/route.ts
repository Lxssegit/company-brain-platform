import { NextResponse } from "next/server";
import { z } from "zod";
import type { KnowledgeStatus } from "@prisma/client";
import { KNOWLEDGE_SCOPE_VALUES, KNOWLEDGE_STATUS_VALUES, KNOWLEDGE_TYPE_VALUES, SOURCE_TYPE_VALUES } from "@/lib/domain/enums";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/authorize";
import { canApproveWithoutReview, visibleKnowledgeWhere } from "@/lib/knowledge/access";
import { auditEvent } from "@/lib/audit/write";
import { errorResponse } from "@/lib/http";

const createSchema = z.object({
  branchId: z.string().uuid().optional(),
  type: z.enum(KNOWLEDGE_TYPE_VALUES),
  title: z.string().trim().min(3).max(180),
  content: z.string().trim().min(10).max(12000),
  scope: z.enum(KNOWLEDGE_SCOPE_VALUES).default("PERSONAL"),
  confidence: z.number().min(0).max(1).optional(),
  source: z.object({ type: z.enum(SOURCE_TYPE_VALUES).default("EMPLOYEE_INPUT"), title: z.string().trim().min(2).max(180), externalUrl: z.string().url().optional(), externalId: z.string().max(180).optional() }).optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requirePermission("READ");
    const url = new URL(request.url);
    const branchId = url.searchParams.get("branchId") ?? undefined;
    const requestedStatus = url.searchParams.get("status") as KnowledgeStatus | null;
    const status = requestedStatus && KNOWLEDGE_STATUS_VALUES.includes(requestedStatus) ? requestedStatus : undefined;
    const where = await visibleKnowledgeWhere(user, branchId, status);
    if (!where) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const knowledge = await prisma.knowledgeUnit.findMany({ where, include: { branch: { select: { id: true, name: true, kind: true } }, sources: { include: { source: true } } }, orderBy: { updatedAt: "desc" } });
    return NextResponse.json({ knowledge });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission("CREATE");
    const organizationId = user.organizationId;
    if (!organizationId) return NextResponse.json({ error: "Organization required" }, { status: 403 });
    const body = createSchema.parse(await request.json());
    const branches = await import("@/lib/branches/access").then(({ getVisibleBranches }) => getVisibleBranches(user));
    const personalBranch = branches.find((branch) => branch.kind === "PERSONAL" && branch.ownerUserId === user.id);
    const branchId = body.branchId ?? personalBranch?.id;
    if (!branchId || !branches.some((branch) => branch.id === branchId)) return NextResponse.json({ error: "Branch is outside the authorized context" }, { status: 403 });
    if (body.scope !== "PERSONAL" && !body.branchId) return NextResponse.json({ error: "Shared knowledge requires a target branch" }, { status: 422 });
    if (body.scope === "PERSONAL" && personalBranch?.id !== branchId) return NextResponse.json({ error: "Personal knowledge must live in the personal branch" }, { status: 422 });

    const role = user.role?.key;
    const status = body.scope === "PERSONAL" || canApproveWithoutReview(role) ? "APPROVED" : "PENDING_REVIEW";
    const result = await prisma.$transaction(async (tx) => {
      const knowledge = await tx.knowledgeUnit.create({ data: { organizationId, branchId, type: body.type, title: body.title, content: body.content, scope: body.scope, status, createdById: user.id, confidence: body.confidence ?? (status === "APPROVED" ? 0.85 : null), approvedById: status === "APPROVED" ? user.id : undefined, verifiedAt: status === "APPROVED" ? new Date() : undefined } });
      if (body.source) {
        const source = await tx.source.create({ data: { organizationId, type: body.source.type, title: body.source.title, externalUrl: body.source.externalUrl, externalId: body.source.externalId } });
        await tx.knowledgeSource.create({ data: { knowledgeUnitId: knowledge.id, sourceId: source.id, relevance: 1 } });
      }
      if (status === "PENDING_REVIEW") await tx.review.create({ data: { organizationId, knowledgeUnitId: knowledge.id, targetBranchId: branchId, requestedById: user.id } });
      await auditEvent(tx, { organizationId, actorUserId: user.id, action: "KNOWLEDGE_CREATED", entityType: "KnowledgeUnit", entityId: knowledge.id, after: { title: knowledge.title, scope: knowledge.scope, status: knowledge.status } });
      return knowledge;
    });
    return NextResponse.json({ knowledge: result }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
