import type { KnowledgeScope, KnowledgeStatus, RoleKey } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { getVisibleBranches } from "@/lib/branches/access";
import { hasRolePermission } from "@/lib/permissions/policy";

const elevatedRoles: RoleKey[] = ["SUPER_ADMIN", "COMPANY_ADMIN"];
const reviewerRoles: RoleKey[] = ["SUPER_ADMIN", "COMPANY_ADMIN", "DEPARTMENT_ADMIN", "MANAGER"];

export async function visibleKnowledgeWhere(user: { id: string; organizationId: string | null; role?: { key: RoleKey } | null }, branchId?: string, status?: KnowledgeStatus): Promise<Prisma.KnowledgeUnitWhereInput | null> {
  if (!user.organizationId) return null;
  const branches = await getVisibleBranches(user);
  const branchIds = branches.map((branch) => branch.id);
  if (branchId && !branchIds.includes(branchId)) return null;

  /* Someone who may approve a unit must be able to read it, otherwise
     GET /api/knowledge?status=PENDING_REVIEW returns nothing for the very
     people /api/reviews already shows those units to. */
  const canReview = hasRolePermission(user.role?.key, "APPROVE");

  return {
    organizationId: user.organizationId,
    branchId: branchId ? branchId : { in: branchIds },
    ...(status ? { status } : {}),
    OR: [
      { status: "APPROVED", scope: { not: "PERSONAL" } },
      { createdById: user.id },
      ...(canReview ? [{ status: "PENDING_REVIEW" as const, scope: { not: "PERSONAL" as const } }] : []),
    ],
  };
}

/**
 * Who may edit a unit: its author, or someone whose role reviews that branch.
 *
 * This used to take a permission argument and answer for archiving too, and it
 * returned true for the author before looking at that argument at all — so it
 * said "yes" to an employee archiving their own entry while the route behind it
 * refused. Archiving now has its own rule, which needs the unit's state rather
 * than only its author, and this function no longer pretends to answer it.
 */
export function canManageKnowledge(user: { id: string; role?: { key: RoleKey } | null }, createdById: string, permission: "EDIT" = "EDIT") {
  const role = user.role?.key;
  if (!role || !hasRolePermission(role, permission)) return false;
  if (createdById === user.id) return true;
  return reviewerRoles.includes(role);
}

export function canApproveWithoutReview(role: RoleKey | null | undefined) {
  return role === "SUPER_ADMIN" || role === "COMPANY_ADMIN" || role === "DEPARTMENT_ADMIN";
}

/**
 * Knowledge that somebody accountable agreed to and other people can see. It is
 * the thing neither an edit nor an archive may quietly undo.
 */
function isAgreedSharedKnowledge(unit: { status: KnowledgeStatus; scope: KnowledgeScope }) {
  return unit.scope !== "PERSONAL" && unit.status === "APPROVED";
}

/**
 * Whether editing a unit has to send it back through review.
 *
 * Approval is a statement that somebody accountable read this exact text. An
 * author who could edit an approved unit in place would be able to get a
 * benign version approved and then change it — the approval would still be
 * recorded, for text nobody agreed to. Editing shared, approved knowledge
 * therefore returns it to the queue, unless the editor's own role could have
 * published it without review in the first place, in which case nothing is
 * gained by asking them to approve their own change.
 *
 * Personal units never enter review: nobody else can see them.
 */
export function editNeedsReapproval(
  unit: { status: KnowledgeStatus; scope: KnowledgeScope },
  role: RoleKey | null | undefined,
) {
  if (!isAgreedSharedKnowledge(unit)) return false;
  return !canApproveWithoutReview(role);
}

/**
 * Who may take a unit out of its branch.
 *
 * Archiving has no counterpart to review: nothing brings the entry back on
 * somebody else's say-so. So an author may archive their own work only while it
 * is still theirs alone — a personal note, a draft, something rejected or still
 * waiting. Once it is agreed shared knowledge, other people are relying on it,
 * and removing it is not a decision its author makes by themselves.
 */
export function canArchiveKnowledge(
  user: { id: string; role?: { key: RoleKey } | null },
  unit: { createdById: string; status: KnowledgeStatus; scope: KnowledgeScope },
) {
  const role = user.role?.key;
  if (!role || !hasRolePermission(role, "DELETE")) return false;
  if (elevatedRoles.includes(role)) return true;
  return unit.createdById === user.id && !isAgreedSharedKnowledge(unit);
}
