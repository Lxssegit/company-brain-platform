import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/authorize";
import { canReadBranch } from "@/lib/branches/access";
import { errorResponse } from "@/lib/http";

const updateSchema = z.object({ name: z.string().trim().min(2).max(120).optional(), description: z.string().trim().max(500).nullable().optional() });

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("READ");
    const organizationId = user.organizationId;
    if (!organizationId) return NextResponse.json({ error: "Organization required" }, { status: 403 });
    const { id } = await params;
    if (!(await canReadBranch(user, id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const branch = await prisma.branch.findFirst({ where: { id, organizationId }, include: { children: true, memberships: { select: { userId: true, access: true } } } });
    return branch ? NextResponse.json({ branch }) : NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("MANAGE_BRANCH");
    const organizationId = user.organizationId;
    if (!organizationId) return NextResponse.json({ error: "Organization required" }, { status: 403 });
    const { id } = await params;
    if (!(await canReadBranch(user, id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const body = updateSchema.parse(await request.json());
    const branch = await prisma.branch.findFirst({ where: { id, organizationId } });
    if (!branch) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = await prisma.branch.update({ where: { id }, data: body });
    return NextResponse.json({ branch: updated });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("MANAGE_BRANCH");
    const organizationId = user.organizationId;
    if (!organizationId) return NextResponse.json({ error: "Organization required" }, { status: 403 });
    const { id } = await params;
    if (!(await canReadBranch(user, id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const branch = await prisma.branch.findFirst({ where: { id, organizationId } });
    if (!branch) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (branch.kind === "COMPANY") return NextResponse.json({ error: "Company root cannot be deleted" }, { status: 422 });
    await prisma.branch.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
