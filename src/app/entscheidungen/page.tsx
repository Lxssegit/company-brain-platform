import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdministrableBranches } from "@/lib/branches/access";
import { visibleDecisionWhere } from "@/lib/decisions/access";
import { effectiveDecisionState } from "@/lib/decisions/status";
import { hasRolePermission } from "@/lib/permissions/policy";
import { prisma } from "@/lib/db/prisma";
import { AppBar } from "@/components/AppBar";
import { DecisionBoard, type DecisionCard, type TargetBranch } from "@/app/entscheidungen/DecisionBoard";

export default async function DecisionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const account = await getCurrentUser().catch(() => null);
  if (!account) redirect("/login");
  /* Signed in and belonging nowhere is not "not signed in". Sending it to
     /login produced a loop: sign in, get bounced, sign in again. */
  if (!account.organizationId) redirect("/organisation");
  if (account.status !== "ACTIVE") redirect("/login");

  const mayManage = hasRolePermission(account.role?.key, "MANAGE_DECISIONS");

  let decisions: DecisionCard[] = [];
  let branches: TargetBranch[] = [];
  let unreachable = false;
  try {
    const where = await visibleDecisionWhere(account);
    if (where) {
      const [rows, administrable] = await Promise.all([
        prisma.decision.findMany({
          where,
          include: {
            affectedBranches: { include: { branch: { select: { id: true, name: true } } } },
            sources: { include: { source: { select: { title: true } } } },
            /* The relation is a list because the schema permits several
               successors; only the route's ACTIVE guard keeps it to one. */
            supersededBy: { select: { id: true, title: true }, take: 1 },
            supersedes: { select: { id: true, title: true } },
            createdBy: { select: { name: true, email: true } },
          },
          orderBy: [{ validFrom: "desc" }, { createdAt: "desc" }],
        }),
        mayManage ? getAdministrableBranches(account) : Promise.resolve([]),
      ]);
      decisions = rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        reason: row.reason,
        state: effectiveDecisionState(row.status, row.validUntil),
        validFrom: row.validFrom.toISOString(),
        validUntil: row.validUntil?.toISOString() ?? null,
        branches: row.affectedBranches.map((link) => link.branch.name),
        exceptions: Array.isArray(row.exceptions) ? (row.exceptions as unknown[]).map(String) : [],
        sources: row.sources.map((link) => link.source.title),
        author: row.createdBy?.name ?? row.createdBy?.email ?? "unbekannt",
        replacedBy: row.supersededBy[0] ? { id: row.supersededBy[0].id, title: row.supersededBy[0].title } : null,
        replaces: row.supersedes ? { id: row.supersedes.id, title: row.supersedes.title } : null,
      }));
      branches = administrable.filter((branch) => branch.kind !== "PERSONAL").map((branch) => ({ id: branch.id, name: branch.name }));
    }
  } catch {
    unreachable = true;
  }

  return (
    <div className="app">
      <AppBar context="Entscheidungen" user={session.user.email} />
      <main className="app-main app-main-narrow">
        <div className="app-head">
          <div>
            <h1 className="page-title">Was gilt, und seit wann.</h1>
            <p>Eine Entscheidung ist keine Notiz, sondern eine Regel mit einem Anfang und oft einem Ende. Wer sie kennt, weiß nicht automatisch, ob sie noch gilt — deshalb steht das hier.</p>
          </div>
        </div>

        {unreachable ? (
          <section className="panel">
            <div className="state">
              <h3>Die Entscheidungen sind nicht erreichbar</h3>
              <p>Der Speicher hat nicht geantwortet. Lokal heißt das meistens, dass PostgreSQL noch nicht läuft.</p>
            </div>
          </section>
        ) : (
          <DecisionBoard initial={decisions} branches={branches} mayManage={mayManage} />
        )}
      </main>
    </div>
  );
}
