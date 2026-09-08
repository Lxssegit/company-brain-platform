import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/authorize";
import { getVisibleBranches } from "@/lib/branches/access";
import { auditEvent } from "@/lib/audit/write";
import { visibleDecisionWhere } from "@/lib/decisions/access";
import { effectiveDecisionState } from "@/lib/decisions/status";
import { DECISION_STATUS_VALUES, SOURCE_TYPE_VALUES } from "@/lib/domain/enums";
import { errorResponse } from "@/lib/http";

const decisionSchema = z.object({
  title: z.string().trim().min(3).max(240),
  description: z.string().trim().min(10).max(12000),
  reason: z.string().trim().min(3).max(5000),
  department: z.string().trim().max(120).optional(),
  branchIds: z.array(z.string().uuid()).min(1).max(20),
  validFrom: z.coerce.date(),
  validUntil: z.coerce.date().optional(),
  exceptions: z.array(z.string().trim().min(1).max(500)).max(20).optional(),
  source: z.object({ type: z.enum(SOURCE_TYPE_VALUES).default("DECISION"), title: z.string().trim().min(2).max(180), externalUrl: z.string().url().optional(), externalId: z.string().max(180).optional() }).optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requirePermission("READ");
    const url = new URL(request.url);
    const branchId = url.searchParams.get("branchId") ?? undefined;
    const statusParam = url.searchParams.get("status");
    const status = statusParam && DECISION_STATUS_VALUES.includes(statusParam as (typeof DECISION_STATUS_VALUES)[number]) ? statusParam : undefined;
    const where = await visibleDecisionWhere(user, branchId);
    if (!where) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const decisions = await prisma.decision.findMany({
      where: { ...where, ...(status ? { status: status as "ACTIVE" | "SUPERSEDED" | "EXPIRED" | "DRAFT" } : {}) },
      include: {
        affectedBranches: { include: { branch: { select: { id: true, name: true, kind: true } } } },
        sources: { include: { source: true } },
        supersedes: { select: { id: true, title: true, status: true } },
        supersededBy: { select: { id: true, title: true, status: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: [{ validFrom: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ decisions: decisions.map((decision) => ({ ...decision, effectiveStatus: effectiveDecisionState(decision.status, decision.validUntil) })) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission("MANAGE_DECISIONS");
    const organizationId = user.organizationId;
    if (!organizationId) return NextResponse.json({ error: "Organization required" }, { status: 403 });
    const body = decisionSchema.parse(await request.json());
    if (body.validUntil && body.validUntil <= body.validFrom) return NextResponse.json({ error: "validUntil must be after validFrom" }, { status: 422 });
    const branches = await getVisibleBranches(user);
    if (body.branchIds.some((branchId) => !branches.some((branch) => branch.id === branchId))) return NextResponse.json({ error: "Branch is outside the authorized context" }, { status: 403 });
    const result = await prisma.$transaction(async (tx) => {
      const decision = await tx.decision.create({ data: { organizationId, title: body.title, description: body.description, reason: body.reason, department: body.department, createdById: user.id, validFrom: body.validFrom, validUntil: body.validUntil, exceptions: body.exceptions ?? undefined, affectedBranches: { create: body.branchIds.map((branchId) => ({ branchId })) } } });
      if (body.source) {
        const source = await tx.source.create({ data: { organizationId, type: body.source.type, title: body.source.title, externalUrl: body.source.externalUrl, externalId: body.source.externalId } });
        await tx.decisionSource.create({ data: { decisionId: decision.id, sourceId: source.id } });
      }
      await auditEvent(tx, { organizationId, actorUserId: user.id, action: "DECISION_CREATED", entityType: "Decision", entityId: decision.id, after: { title: decision.title, status: decision.status, branchIds: body.branchIds } });
      return decision;
    });
    return NextResponse.json({ decision: result }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
