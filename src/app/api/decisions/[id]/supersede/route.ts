import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/authorize";
import { getAdministrableBranches } from "@/lib/branches/access";
import { auditEvent } from "@/lib/audit/write";
import { visibleDecisionWhere } from "@/lib/decisions/access";
import { SOURCE_TYPE_VALUES } from "@/lib/domain/enums";
import { errorResponse } from "@/lib/http";

const supersedeSchema = z.object({ title: z.string().trim().min(3).max(240), description: z.string().trim().min(10).max(12000), reason: z.string().trim().min(3).max(5000), validFrom: z.coerce.date(), validUntil: z.coerce.date().optional(), branchIds: z.array(z.string().uuid()).min(1).max(20).optional(), exceptions: z.array(z.string().trim().min(1).max(500)).max(20).optional(), source: z.object({ type: z.enum(SOURCE_TYPE_VALUES).default("DECISION"), title: z.string().trim().min(2).max(180), externalUrl: z.string().url().optional(), externalId: z.string().max(180).optional() }).optional() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("MANAGE_DECISIONS");
    const organizationId = user.organizationId;
    if (!organizationId) return NextResponse.json({ error: "Organization required" }, { status: 403 });
    const { id } = await params;
    const where = await visibleDecisionWhere(user);
    if (!where) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const oldDecision = await prisma.decision.findFirst({ where: { AND: [where, { id }] }, include: { affectedBranches: true } });
    if (!oldDecision) return NextResponse.json({ error: "Not found" }, { status: 404 });
    /* Superseding a SUPERSEDED row forks the history into several live
       successors of the same decision. Only the current one can be replaced. */
    if (oldDecision.status !== "ACTIVE") return NextResponse.json({ error: "Only an active decision can be superseded" }, { status: 409 });
    const body = supersedeSchema.parse(await request.json());
    if (body.validUntil && body.validUntil <= body.validFrom) return NextResponse.json({ error: "validUntil must be after validFrom" }, { status: 422 });
    const branches = await getAdministrableBranches(user);
    const branchIds = body.branchIds ?? oldDecision.affectedBranches.map((item) => item.branchId);
    /* The replacement carries the department forward unless it is restated. */
    if (branchIds.some((branchId) => !branches.some((branch) => branch.id === branchId))) return NextResponse.json({ error: "Branch is outside the authorized context" }, { status: 403 });
    const result = await prisma.$transaction(async (tx) => {
      await tx.decision.update({ where: { id: oldDecision.id }, data: { status: "SUPERSEDED" } });
      const replacement = await tx.decision.create({ data: { organizationId, title: body.title, description: body.description, reason: body.reason, department: oldDecision.department, createdById: user.id, validFrom: body.validFrom, validUntil: body.validUntil, status: "ACTIVE", exceptions: body.exceptions ?? undefined, supersedesDecisionId: oldDecision.id, affectedBranches: { create: branchIds.map((branchId) => ({ branchId })) } } });
      if (body.source) {
        const source = await tx.source.create({ data: { organizationId, type: body.source.type, title: body.source.title, externalUrl: body.source.externalUrl, externalId: body.source.externalId } });
        await tx.decisionSource.create({ data: { decisionId: replacement.id, sourceId: source.id } });
      }
      await auditEvent(tx, { organizationId, actorUserId: user.id, action: "DECISION_SUPERSEDED", entityType: "Decision", entityId: replacement.id, before: { supersededDecisionId: oldDecision.id, status: oldDecision.status }, after: { replacementDecisionId: replacement.id, status: replacement.status } });
      return replacement;
    });
    return NextResponse.json({ decision: result }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
