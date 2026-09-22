import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { BRANCH_KIND_VALUES } from "@/lib/domain/enums";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/authorize";
import { canAdministerBranch, getVisibleBranches } from "@/lib/branches/access";
import { auditEvent } from "@/lib/audit/write";
import { errorResponse } from "@/lib/http";
import { API_ERROR } from "@/lib/i18n/api";

const branchSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
  kind: z.enum(BRANCH_KIND_VALUES).default("TEAM"),
  parentId: z.string().uuid().nullable().optional(),
});

export async function GET() {
  try {
    const user = await requirePermission("READ");
    const branches = await getVisibleBranches(user);
    return NextResponse.json({ branches });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission("MANAGE_BRANCH");
    const organizationId = user.organizationId;
    if (!organizationId) return NextResponse.json({ error: API_ERROR.organizationRequired }, { status: 403 });
    const body = branchSchema.parse(await request.json());
    const parentId = body.parentId ?? null;
    let parent = null;
    if (parentId) {
      parent = await prisma.branch.findFirst({ where: { id: parentId, organizationId } });
      if (!parent) return NextResponse.json({ error: API_ERROR.parentBranchNotFound }, { status: 404 });
      if (!(await canAdministerBranch(user, parentId))) return NextResponse.json({ error: API_ERROR.parentBranchNotFound }, { status: 404 });
    } else if (body.kind !== "COMPANY") {
      return NextResponse.json({ error: API_ERROR.branchNeedsParent }, { status: 422 });
    }

    const id = randomUUID();
    /* Creating a branch changes who can see what, so it belongs in the audit
       trail as much as editing a knowledge unit does. */
    const branch = await prisma.$transaction(async (tx) => {
      const created = await tx.branch.create({
        data: { id, organizationId, parentId, kind: body.kind, name: body.name, description: body.description, path: parent ? `${parent.path}/${id}` : id, depth: parent ? parent.depth + 1 : 0 },
      });
      await auditEvent(tx, { organizationId, actorUserId: user.id, action: "BRANCH_CREATED", entityType: "Branch", entityId: created.id, after: { name: created.name, kind: created.kind, parentId: created.parentId } });
      return created;
    });
    return NextResponse.json({ branch }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
