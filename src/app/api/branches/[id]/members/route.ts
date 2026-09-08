import { NextResponse } from "next/server";
import { z } from "zod";
import { BRANCH_ACCESS_VALUES } from "@/lib/domain/enums";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/authorize";
import { canReadBranch } from "@/lib/branches/access";
import { errorResponse } from "@/lib/http";

const memberSchema = z.object({ userId: z.string().min(1), access: z.enum(BRANCH_ACCESS_VALUES) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePermission("MANAGE_BRANCH");
    const { id: branchId } = await params;
    if (!(await canReadBranch(actor, branchId))) return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    const organizationId = actor.organizationId;
    if (!organizationId) return NextResponse.json({ error: "Organization required" }, { status: 403 });
    const body = memberSchema.parse(await request.json());
    const [branch, user] = await Promise.all([
      prisma.branch.findFirst({ where: { id: branchId, organizationId } }),
      prisma.user.findFirst({ where: { id: body.userId, organizationId } }),
    ]);
    if (!branch || !user) return NextResponse.json({ error: "Branch or user not found" }, { status: 404 });
    const membership = await prisma.branchMember.upsert({ where: { branchId_userId: { branchId, userId: body.userId } }, update: { access: body.access, grantedBy: actor.id }, create: { branchId, userId: body.userId, access: body.access, grantedBy: actor.id } });
    return NextResponse.json({ membership }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
