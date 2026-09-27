import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { PrismaClient, type RoleKey } from "@prisma/client";
import { loadNetwork } from "@/lib/people/network";

/**
 * The network page draws the company. A picture leaks the same way a search
 * result does — a dot with no label still says a team exists, roughly how big
 * it is and who sits next to it — so loadNetwork starts from the branches the
 * viewer may read and derives everything else from that set.
 *
 * The failure this guards against is the tempting one: build the whole graph,
 * then hide what the viewer should not see. That renders identically in the
 * happy case and ships the entire organization to the browser. So these tests
 * assert on the payload, not on the screen, and they check the edges as well as
 * the nodes: an edge to a branch that was filtered out names it just as loudly.
 *
 * Runs against a real database; the CI job that owns pgvector runs it.
 */
const prisma = new PrismaClient();

let organizationId: string;
let companyId: string;
let openTeamId: string;
let secretDeptId: string;
let readerId: string;

async function role(key: RoleKey) {
  return prisma.role.upsert({
    where: { organizationId_key: { organizationId, key } },
    update: {},
    create: { organizationId, key, name: key },
  });
}

async function makeBranch(name: string, kind: "COMPANY" | "DEPARTMENT" | "TEAM" | "PERSONAL", parent?: { id: string; path: string; depth: number }, ownerUserId?: string) {
  const id = randomUUID();
  return prisma.branch.create({
    data: {
      id, organizationId, name, kind, parentId: parent?.id ?? null, ownerUserId,
      path: parent ? `${parent.path}/${id}` : id,
      depth: parent ? parent.depth + 1 : 0,
    },
  });
}

beforeAll(async () => {
  const organization = await prisma.organization.create({ data: { name: `Netz ${randomUUID()}`, slug: `netz-${randomUUID()}` } });
  organizationId = organization.id;

  const employee = await role("EMPLOYEE");
  const reader = await prisma.user.create({ data: { email: `reader-${randomUUID()}@netz.local`, name: "Lea Reader", organizationId, roleId: employee.id, status: "ACTIVE" } });
  const insider = await prisma.user.create({ data: { email: `insider-${randomUUID()}@netz.local`, name: "Ines Insider", organizationId, roleId: employee.id, status: "ACTIVE" } });
  readerId = reader.id;

  const company = await makeBranch("Netz GmbH", "COMPANY");
  const openDept = await makeBranch("Offen", "DEPARTMENT", company);
  const openTeam = await makeBranch("Offenes Team", "TEAM", openDept);
  const secretDept = await makeBranch("Streng Vertraulich", "DEPARTMENT", company);
  const secretTeam = await makeBranch("Geheimes Team", "TEAM", secretDept);
  companyId = company.id;
  openTeamId = openTeam.id;
  secretDeptId = secretDept.id;

  await makeBranch(reader.name!, "PERSONAL", openTeam, reader.id);
  await makeBranch(insider.name!, "PERSONAL", secretTeam, insider.id);

  await prisma.branchMember.create({ data: { branchId: openTeam.id, userId: reader.id, access: "READ", grantedBy: reader.id } });
  await prisma.branchMember.create({ data: { branchId: secretTeam.id, userId: insider.id, access: "READ", grantedBy: insider.id } });

  await prisma.knowledgeUnit.create({
    data: { organizationId, branchId: secretTeam.id, type: "FACT", title: "Abfindung Geschaeftsfuehrung", content: "Nicht fuer andere.", scope: "TEAM", status: "APPROVED", createdById: insider.id },
  });
  await prisma.knowledgeUnit.create({
    data: { organizationId, branchId: openTeam.id, type: "FACT", title: "Oeffnungszeiten", content: "Werktags acht bis achtzehn.", scope: "TEAM", status: "APPROVED", createdById: reader.id },
  });
});

afterAll(async () => {
  if (organizationId) await prisma.organization.delete({ where: { id: organizationId } }).catch(() => undefined);
  await prisma.$disconnect();
});

const viewer = () => ({ id: readerId, organizationId, role: { key: "EMPLOYEE" as RoleKey } });

describe("the network payload honours the branch boundary", () => {
  it("draws the branches the viewer reads, and the context above them", async () => {
    const network = await loadNetwork(viewer());
    const labels = network.nodes.filter((node) => node.kind === "branch").map((node) => node.label).sort();
    expect(labels).toEqual(["Netz GmbH", "Offen", "Offenes Team"]);
  });

  it("does not name a branch the viewer may not read", async () => {
    const network = await loadNetwork(viewer());
    const text = JSON.stringify(network);
    expect(text).not.toContain("Streng Vertraulich");
    expect(text).not.toContain("Geheimes Team");
    expect(text).not.toContain(secretDeptId);
  });

  it("does not name a person who only sits behind that boundary", async () => {
    const network = await loadNetwork(viewer());
    expect(JSON.stringify(network)).not.toContain("Ines Insider");
    expect(network.nodes.some((node) => node.kind === "person" && node.label === "Lea Reader")).toBe(true);
  });

  it("does not carry knowledge from behind that boundary, not even as a title", async () => {
    const network = await loadNetwork(viewer());
    const text = JSON.stringify(network);
    expect(text).not.toContain("Abfindung");
    expect(text).toContain("Oeffnungszeiten");
  });

  /* An edge is a name too. A line drawn to a filtered-out branch would put its
     id in the payload and its position on the screen. */
  it("draws no edge that points outside what was loaded", async () => {
    const network = await loadNetwork(viewer());
    const known = new Set(network.nodes.map((node) => node.id));
    for (const edge of network.edges) {
      expect(known.has(edge.from), `edge from unknown node ${edge.from}`).toBe(true);
      expect(known.has(edge.to), `edge to unknown node ${edge.to}`).toBe(true);
    }
  });

  it("says how much it did not load, without saying what", async () => {
    const network = await loadNetwork(viewer());
    expect(network.omitted).toBeGreaterThan(0);
  });

  it("gives nothing at all to somebody outside the organization", async () => {
    const network = await loadNetwork({ id: readerId, organizationId: randomUUID(), role: { key: "EMPLOYEE" } });
    expect(network.nodes).toEqual([]);
    expect(network.edges).toEqual([]);
  });

  it("keeps the company root visible only as context, never its hidden siblings", async () => {
    const network = await loadNetwork(viewer());
    expect(network.nodes.some((node) => node.id === `b:${companyId}`)).toBe(true);
    expect(network.nodes.some((node) => node.id === `b:${openTeamId}`)).toBe(true);
  });
});
