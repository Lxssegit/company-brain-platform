import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdministrableBranches } from "@/lib/branches/access";
import { hasRolePermission } from "@/lib/permissions/policy";
import { prisma } from "@/lib/db/prisma";
import { AppBar } from "@/components/AppBar";
import { ReviewQueue, type PendingReview } from "@/app/freigaben/ReviewQueue";

export default async function ReviewsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const account = await getCurrentUser().catch(() => null);
  if (!account || account.status !== "ACTIVE") redirect("/login");

  const mayApprove = hasRolePermission(account.role?.key, "APPROVE");

  let reviews: PendingReview[] = [];
  let unreachable = false;
  if (mayApprove) {
    try {
      /* The queue lists what this account can actually act on, which is the
         branches it administers — not the wider set it can merely read. */
      const branches = await getAdministrableBranches(account);
      const rows = await prisma.review.findMany({
        where: { organizationId: account.organizationId!, targetBranchId: { in: branches.map((branch) => branch.id) }, status: "PENDING" },
        include: {
          knowledgeUnit: { include: { sources: { include: { source: true } } } },
          targetBranch: { select: { id: true, name: true } },
          requestedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      });
      reviews = rows.map((row) => ({
        id: row.id,
        createdAt: row.createdAt.toISOString(),
        branchName: row.targetBranch.name,
        requestedBy: row.requestedBy.name ?? row.requestedBy.email,
        isOwnSubmission: row.requestedById === account.id,
        unit: {
          title: row.knowledgeUnit.title,
          content: row.knowledgeUnit.content,
          type: row.knowledgeUnit.type,
          scope: row.knowledgeUnit.scope,
          sources: row.knowledgeUnit.sources.map((link) => link.source.title),
        },
      }));
    } catch {
      unreachable = true;
    }
  }

  return (
    <div className="app">
      <AppBar context="Freigaben" user={session.user.email} canApprove={mayApprove} />
      <main className="app-main app-main-narrow">
        <div className="app-head">
          <div>
            <h1 className="page-title">Was auf Freigabe wartet.</h1>
            <p>Wissen, das über den persönlichen Zweig hinausgeht, wird erst nach Freigabe sichtbar. Bis dahin sieht es niemand außer der Person, die es geschrieben hat, und Ihnen.</p>
          </div>
        </div>

        {!mayApprove ? (
          <section className="panel">
            <div className="state">
              <h3>Freigaben gehören nicht zu Ihrer Rolle</h3>
              <p>Ihre Rolle trägt das Recht APPROVE nicht. Wissen, das Sie über Ihren persönlichen Zweig hinaus einstellen, geht an die Verantwortlichen des Zielzweigs.</p>
            </div>
          </section>
        ) : unreachable ? (
          <section className="panel">
            <div className="state">
              <h3>Die Warteschlange ist nicht erreichbar</h3>
              <p>Der Speicher hat nicht geantwortet. Lokal heißt das meistens, dass PostgreSQL noch nicht läuft.</p>
            </div>
          </section>
        ) : (
          <ReviewQueue initial={reviews} />
        )}
      </main>
    </div>
  );
}
