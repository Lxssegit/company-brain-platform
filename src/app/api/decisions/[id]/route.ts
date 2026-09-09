import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/authorize";
import { getAdministrableBranches } from "@/lib/branches/access";
import { auditEvent } from "@/lib/audit/write";
import { visibleDecisionWhere } from "@/lib/decisions/access";
import { effectiveDecisionState } from "@/lib/decisions/status";
import { errorResponse } from "@/lib/http";

const updateSchema = z.object({ title: z.string().trim().min(3).max(240).optional(), description: z.string().trim().min(10).max(12000).optional(), reason: z.string().trim().min(3).max(5000).optional(), department: z.string().trim().max(120).nullable().optional(), validUntil: z.coerce.date().nullable().optional(), exceptions: z.array(z.string().trim().min(1).max(500)).max(20).nullable().optional() });

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("READ");
    const { id } = await params;
    const where = await visibleDecisionWhere(user);
    if (!where) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const decision = await prisma.decision.findFirst({ where: { AND: [where, { id }] }, include: { affectedBranches: { include: { branch: true } }, sources: { include: { source: true } }, supersedes: true, supersededBy: { orderBy: { createdAt: "asc" } }, createdBy: { select: { id: true, name: true } } } });
    return decision ? NextResponse.json({ decision: { ...decision, effectiveStatus: effectiveDecisionState(decision.status, decision.validUntil) } }) : NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("MANAGE_DECISIONS");
    const organizationId = user.organizationId;
    if (!organizationId) return NextResponse.json({ error: "Organization required" }, { status: 403 });
    const { id } = await params;
    const where = await visibleDecisionWhere(user);
    if (!where) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const existing = await prisma.decision.findFirst({ where: { AND: [where, { id }] }, include: { affectedBranches: true } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    /* Reading a decision because one of its branches is above you is not the
       same as being allowed to rewrite it. */
    const administrable = await getAdministrableBranches(user);
    if (!existing.affectedBranches.some((link) => administrable.some((branch) => branch.id === link.branchId))) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const body = updateSchema.parse(await request.json());
    if (body.validUntil && body.validUntil <= existing.validFrom) return NextResponse.json({ error: "validUntil must be after validFrom" }, { status: 422 });
    const { exceptions, ...scalarFields } = body;
    const data = exceptions === null ? { ...scalarFields, exceptions: Prisma.JsonNull } : { ...scalarFields, ...(exceptions === undefined ? {} : { exceptions }) };
    const result = await prisma.$transaction(async (tx) => {
      const decision = await tx.decision.update({ where: { id }, data });
      await auditEvent(tx, { organizationId, actorUserId: user.id, action: "DECISION_EDITED", entityType: "Decision", entityId: id, before: { title: existing.title, description: existing.description, reason: existing.reason }, after: { title: decision.title, description: decision.description, reason: decision.reason } });
      return decision;
    });
    return NextResponse.json({ decision: result });
  } catch (error) {
    return errorResponse(error);
  }
}
