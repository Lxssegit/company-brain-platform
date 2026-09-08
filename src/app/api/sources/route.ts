import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/authorize";
import { visibleKnowledgeWhere } from "@/lib/knowledge/access";
import { prisma } from "@/lib/db/prisma";
import { errorResponse } from "@/lib/http";

export async function GET() {
  try {
    const user = await requirePermission("READ");
    const where = await visibleKnowledgeWhere(user);
    if (!where) return NextResponse.json({ sources: [] });
    const knowledge = await prisma.knowledgeUnit.findMany({ where, select: { sources: { include: { source: true } } } });
    const sources = knowledge.flatMap((item) => item.sources.map((link) => ({ ...link.source, citation: link.citation, knowledgeUnitId: link.knowledgeUnitId })));
    return NextResponse.json({ sources });
  } catch (error) {
    return errorResponse(error);
  }
}
