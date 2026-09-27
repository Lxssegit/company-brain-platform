import type { RoleKey } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { explainBranchAccess, type AccessReason } from "@/lib/branches/explain";
import { hasRolePermission } from "@/lib/permissions/policy";

type Viewer = { id: string; organizationId: string | null; role?: { key: RoleKey } | null };

const elevatedRoles: RoleKey[] = ["SUPER_ADMIN", "COMPANY_ADMIN"];

export type ProfileBranchAccess = {
  branchId: string;
  name: string;
  kind: "COMPANY" | "DEPARTMENT" | "TEAM" | "PERSONAL";
  depth: number;
  reason: AccessReason;
  visible: boolean;
  viaBranchName: string | null;
};

/**
 * Everything the profile page shows about one person, gathered in one place so
 * the page stays a layout and the rule about who may see what stays a rule.
 *
 * Two audiences, one page. A colleague sees who somebody is and where they sit.
 * What they may read is only shown to whoever can change it — MANAGE_USERS —
 * because a list of the branches a colleague cannot open is a map of where the
 * company keeps things, handed to everyone.
 */
export async function loadPersonProfile(viewer: Viewer, personId: string) {
  if (!viewer.organizationId) return null;

  const person = await prisma.user.findFirst({
    where: { id: personId, organizationId: viewer.organizationId },
    select: {
      id: true, name: true, email: true, jobTitle: true, bio: true, status: true, createdAt: true,
      role: { select: { key: true } },
      manager: { select: { id: true, name: true, email: true, jobTitle: true } },
      reports: { select: { id: true, name: true, email: true, jobTitle: true }, orderBy: [{ name: "asc" }] },
    },
  });
  if (!person) return null;

  const isSelf = person.id === viewer.id;
  /* Seeing your own access is not a privilege: you can determine it anyway by
     opening the tree. Seeing someone else's is, because it is the view that
     makes an over-broad grant reviewable — and equally the view that maps the
     company for someone who should not have it. */
  const maySeeAccess = isSelf || hasRolePermission(viewer.role?.key, "MANAGE_USERS");

  const [branches, grants, contributions, decisions] = await Promise.all([
    prisma.branch.findMany({
      where: { organizationId: viewer.organizationId },
      select: { id: true, parentId: true, path: true, depth: true, name: true, kind: true },
      orderBy: [{ depth: "asc" }, { name: "asc" }],
    }),
    maySeeAccess
      ? prisma.branchMember.findMany({ where: { userId: person.id, branch: { organizationId: viewer.organizationId } }, select: { branchId: true, access: true } })
      : Promise.resolve([]),
    prisma.knowledgeUnit.findMany({
      where: { organizationId: viewer.organizationId, createdById: person.id, status: { not: "ARCHIVED" } },
      select: { id: true, title: true, status: true, type: true, updatedAt: true, branch: { select: { id: true, name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.decision.findMany({
      where: { organizationId: viewer.organizationId, createdById: person.id },
      select: { id: true, title: true, status: true, validFrom: true },
      orderBy: { validFrom: "desc" },
      take: 10,
    }),
  ]);

  const nameById = new Map(branches.map((branch) => [branch.id, branch.name]));
  const elevated = elevatedRoles.includes(person.role?.key as RoleKey);
  const explained = maySeeAccess ? explainBranchAccess(branches, grants, elevated) : [];
  const byBranchId = new Map(explained.map((row) => [row.branchId, row]));

  const access: ProfileBranchAccess[] = maySeeAccess
    ? branches.map((branch) => {
        const row = byBranchId.get(branch.id);
        return {
          branchId: branch.id,
          name: branch.name,
          kind: branch.kind,
          depth: branch.depth,
          reason: row?.reason ?? "NONE",
          visible: row?.visible ?? false,
          viaBranchName: row?.viaBranchId ? nameById.get(row.viaBranchId) ?? null : null,
        };
      })
    : [];

  return {
    person: {
      id: person.id,
      name: person.name ?? person.email,
      email: person.email,
      jobTitle: person.jobTitle,
      bio: person.bio,
      status: person.status,
      roleKey: person.role?.key ?? null,
      since: person.createdAt,
    },
    isSelf,
    maySeeAccess,
    manager: person.manager ? { ...person.manager, name: person.manager.name ?? person.manager.email } : null,
    reports: person.reports.map((report) => ({ ...report, name: report.name ?? report.email })),
    access,
    contributions: contributions.map((unit) => ({
      id: unit.id,
      title: unit.title,
      status: unit.status,
      type: unit.type,
      branchId: unit.branch.id,
      branchName: unit.branch.name,
      updatedAt: unit.updatedAt,
    })),
    decisions: decisions.map((item) => ({ id: item.id, title: item.title, status: item.status, validFrom: item.validFrom })),
  };
}

export type PersonProfile = NonNullable<Awaited<ReturnType<typeof loadPersonProfile>>>;
