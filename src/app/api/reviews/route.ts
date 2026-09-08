import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/authorize";
import { getVisibleBranches } from "@/lib/branches/access";
import { errorResponse } from "@/lib/http";

export async function GET() {
  try {
    const user = await requirePermission("APPROVE");
    const organizationId = user.organizationId;
    if (!organizationId) return NextResponse.json({ error: "Organization required" }, { status: 403 });
    const branches = await getVisibleBranches(user);
    const reviews = await prisma.review.findMany({ where: { organizationId, targetBranchId: { in: branches.map((branch) => branch.id) }, status: "PENDING" }, include: { knowledgeUnit: { include: { sources: { include: { source: true } } } }, targetBranch: { select: { id: true, name: true } }, requestedBy: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "asc" } });
    return NextResponse.json({ reviews });
  } catch (error) {
    return errorResponse(error);
  }
}
