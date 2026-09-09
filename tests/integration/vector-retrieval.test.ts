import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";
import { startEmbeddingDouble, deterministicEmbedding, type EmbeddingDouble } from "@/../tests/support/embedding-double";

/**
 * The vector half of retrieval cannot run on a database without pgvector, which
 * is every developer machine that has not installed it — so until this existed,
 * every retrieval test in this repository exercised the lexical path and the
 * product's central technical claim was an assertion rather than a result.
 *
 * The boundary is drawn three times: in the candidate SQL before the index is
 * consulted, in the Prisma fetch that hydrates the candidates, and once more in
 * filterAuthorizedContext. That is deliberate, and it means the end-to-end test
 * below cannot tell the three apart — deleting the first predicate and running
 * these tests leaves them all green, which was checked rather than assumed.
 *
 * So there are two kinds of test here. The first four and the fifth prove what
 * a person actually gets: an employee asking a question word-for-word identical
 * to a title they may not read gets nothing, with the vector path confirmed
 * active. The last block proves the innermost layer on its own, because the two
 * behind it would otherwise hide a regression in it — and that layer is what
 * keeps another team's rows from being ranked and pulled into this process at
 * all.
 *
 * Runs only where DATABASE_URL points at a database with pgvector; the CI job
 * that owns the extension runs it.
 */
const prisma = new PrismaClient();
let double: EmbeddingDouble;
let organizationId: string;
let openBranchId: string;
let closedBranchId: string;
let readerId: string;
let adminId: string;
let closedUnitId: string;

const OPEN_TITLE = "Ruecksendung beschaedigter Ware";
const CLOSED_TITLE = "Sonderkondition fuer Grosskunden Nordwind";

async function embed(id: string, text: string) {
  const literal = `[${deterministicEmbedding(text).join(",")}]`;
  await prisma.$executeRaw(Prisma.sql`UPDATE "KnowledgeUnit" SET "embedding" = ${literal}::vector, "embeddingModel" = 'test-double', "embeddedAt" = NOW() WHERE "id" = ${id}`);
}

beforeAll(async () => {
  double = await startEmbeddingDouble();
  process.env.OPENAI_API_KEY = "test-double";
  process.env.OPENAI_BASE_URL = double.baseUrl;

  const suffix = randomUUID().slice(0, 8);
  const organization = await prisma.organization.create({ data: { name: `Retrieval ${suffix}`, slug: `retrieval-${suffix}` } });
  organizationId = organization.id;

  const roles = await Promise.all((["COMPANY_ADMIN", "EMPLOYEE"] as const).map((key) =>
    prisma.role.create({ data: { organizationId, key, name: key } })));
  const [adminRole, employeeRole] = roles;

  const companyId = randomUUID();
  await prisma.branch.create({ data: { id: companyId, organizationId, kind: "COMPANY", name: "Wurzel", path: companyId, depth: 0 } });

  /* Two team branches under the root. Reading inherits upward, so a member of
     one cannot see into the other — which is the boundary under test. */
  openBranchId = randomUUID();
  closedBranchId = randomUUID();
  const company = { id: companyId, path: companyId, depth: 0 };
  for (const [id, name] of [[openBranchId, "Offen"], [closedBranchId, "Verschlossen"]] as const) {
    await prisma.branch.create({ data: { id, organizationId, parentId: company.id, kind: "TEAM", name, path: `${company.path}/${id}`, depth: 1 } });
  }

  const admin = await prisma.user.create({ data: { email: `admin-${suffix}@retrieval.local`, name: "Admin", organizationId, roleId: adminRole.id, status: "ACTIVE" } });
  const reader = await prisma.user.create({ data: { email: `reader-${suffix}@retrieval.local`, name: "Reader", organizationId, roleId: employeeRole.id, status: "ACTIVE" } });
  adminId = admin.id;
  readerId = reader.id;
  /* The reader is a member of the open branch only. */
  await prisma.branchMember.create({ data: { branchId: openBranchId, userId: reader.id, access: "READ", grantedBy: admin.id } });

  const open = await prisma.knowledgeUnit.create({ data: { organizationId, branchId: openBranchId, type: "FACT", title: OPEN_TITLE, content: "Beschaedigte Ware geht innerhalb von vierzehn Tagen zurueck an das Lager.", scope: "TEAM", status: "APPROVED", createdById: admin.id } });
  const closed = await prisma.knowledgeUnit.create({ data: { organizationId, branchId: closedBranchId, type: "FACT", title: CLOSED_TITLE, content: "Nordwind erhaelt zwoelf Prozent auf alle Ersatzteile, befristet bis Jahresende.", scope: "TEAM", status: "APPROVED", createdById: admin.id } });
  closedUnitId = closed.id;
  await embed(open.id, `${open.title}\n${open.content}`);
  await embed(closed.id, `${closed.title}\n${closed.content}`);
}, 60_000);

afterAll(async () => {
  if (organizationId) await prisma.organization.delete({ where: { id: organizationId } }).catch(() => {});
  await prisma.$disconnect();
  await double?.close();
});

const admin = () => ({ id: adminId, organizationId, role: { key: "COMPANY_ADMIN" as const } });
const reader = () => ({ id: readerId, organizationId, role: { key: "EMPLOYEE" as const } });

type Asker = { id: string; organizationId: string; role: { key: "COMPANY_ADMIN" | "EMPLOYEE" } };

/** Imported lazily so the env the provider reads is already set. */
async function retrieve(user: Asker, query: string) {
  const { retrieveAuthorizedContext } = await import("@/lib/retrieval/search");
  return retrieveAuthorizedContext(user, query);
}

describe("vector retrieval against a real pgvector database", () => {
  it("actually takes the vector path rather than falling back", async () => {
    const result = await retrieve(admin(), OPEN_TITLE);
    expect(result.diagnostics?.vectorSearch).toBe("used");
    expect(result.diagnostics?.candidateSource).toBe("hybrid");
  });

  it("finds a unit by a query that shares its words", async () => {
    const result = await retrieve(admin(), "Ruecksendung von beschaedigter Ware");
    expect(result.knowledge.map((hit) => hit.title)).toContain(OPEN_TITLE);
  });

  it("lets somebody who administers both branches see both", async () => {
    const result = await retrieve(admin(), CLOSED_TITLE);
    expect(result.knowledge.map((hit) => hit.title)).toContain(CLOSED_TITLE);
  });

  it("keeps the reader inside their own branch", async () => {
    const result = await retrieve(reader(), OPEN_TITLE);
    expect(result.knowledge.map((hit) => hit.title)).toContain(OPEN_TITLE);
  });

  /* The one that matters: a query identical to the title of knowledge the
     reader may not see. Nothing could rank higher, and the vector path is
     confirmed active — so an empty result is the predicate doing its job
     before similarity, not similarity happening to miss. */
  it("returns nothing when the nearest neighbour is out of bounds", async () => {
    const result = await retrieve(reader(), CLOSED_TITLE);
    expect(result.diagnostics?.vectorSearch).toBe("used");
    expect(result.knowledge.map((hit) => hit.title)).not.toContain(CLOSED_TITLE);
  });
});

describe("the predicate inside the candidate queries, on its own", () => {
  it("keeps out-of-bounds rows from being ranked at all", async () => {
    const { vectorCandidates } = await import("@/lib/retrieval/search");
    const embedding = deterministicEmbedding(CLOSED_TITLE);

    const forAdmin = await vectorCandidates(organizationId, adminId, [openBranchId, closedBranchId], embedding);
    const forReader = await vectorCandidates(organizationId, readerId, [openBranchId], embedding);

    /* The admin's candidate set contains it, so the query and the embedding
       are working; the reader's does not, so the filter is the reason. */
    expect([...forAdmin.keys()]).toContain(closedUnitId);
    expect([...forReader.keys()]).not.toContain(closedUnitId);
  });

  it("bounds the full-text half the same way", async () => {
    const { lexicalCandidateIds } = await import("@/lib/retrieval/search");
    const forAdmin = await lexicalCandidateIds(organizationId, adminId, [openBranchId, closedBranchId], CLOSED_TITLE);
    const forReader = await lexicalCandidateIds(organizationId, readerId, [openBranchId], CLOSED_TITLE);
    expect(forAdmin).toContain(closedUnitId);
    expect(forReader).not.toContain(closedUnitId);
  });
});
