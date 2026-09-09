import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/auth/authorize";
import { getAIProvider } from "@/lib/ai/provider";
import { prisma } from "@/lib/db/prisma";
import { canManageKnowledge, visibleKnowledgeWhere } from "@/lib/knowledge/access";
import { auditEvent } from "@/lib/audit/write";
import { clientKey, rateLimit, tooManyRequests } from "@/lib/security/rate-limit";
import { errorResponse } from "@/lib/http";

function vectorLiteral(values: number[]) {
  if (!values.length || values.some((value) => !Number.isFinite(value))) throw new Error("Invalid embedding");
  return `[${values.join(",")}]`;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const limited = rateLimit(clientKey(request, "embed"), 30, 60_000);
    if (!limited.ok) return tooManyRequests(limited.retryAfterSeconds);
    const user = await requirePermission("EDIT");
    if (!user.organizationId) return NextResponse.json({ error: "Organization required" }, { status: 403 });
    const organizationId = user.organizationId;
    const { id } = await params;
    const where = await visibleKnowledgeWhere(user);
    if (!where) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const knowledge = await prisma.knowledgeUnit.findFirst({ where: { AND: [where, { id }] }, include: { branch: true } });
    if (!knowledge) return NextResponse.json({ error: "Not found" }, { status: 404 });
    /* Embedding costs a provider call per unit. Being able to read something is
       not a reason to be able to spend on it — the same people who may edit a
       unit may re-embed it. */
    if (!canManageKnowledge(user, knowledge.createdById, "EDIT")) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const provider = getAIProvider();
    const embedding = await provider.generateEmbedding(`${knowledge.title}\n${knowledge.content}`);
    const literal = vectorLiteral(embedding);
    const model = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`UPDATE "KnowledgeUnit" SET "embedding" = ${literal}::vector, "embeddingModel" = ${model}, "embeddedAt" = NOW(), "updatedAt" = NOW() WHERE "id" = ${id} AND "organizationId" = ${organizationId}`);
      await auditEvent(tx, { organizationId, actorUserId: user.id, action: "KNOWLEDGE_EMBEDDED", entityType: "KnowledgeUnit", entityId: id, after: { embeddingModel: model } });
    });
    return NextResponse.json({ embedded: true, knowledgeUnitId: id, embeddingModel: model });
  } catch (error) {
    return errorResponse(error);
  }
}
