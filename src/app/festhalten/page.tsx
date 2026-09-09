import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getVisibleBranches } from "@/lib/branches/access";
import { canApproveWithoutReview } from "@/lib/knowledge/access";
import { hasRolePermission } from "@/lib/permissions/policy";
import { AppBar } from "@/components/AppBar";
import { CaptureForm, type TargetBranch } from "@/app/festhalten/CaptureForm";

export default async function CapturePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const account = await getCurrentUser().catch(() => null);
  if (!account || account.status !== "ACTIVE") redirect("/login");

  const mayCreate = hasRolePermission(account.role?.key, "CREATE");
  const mayApprove = hasRolePermission(account.role?.key, "APPROVE");

  let branches: TargetBranch[] = [];
  let unreachable = false;
  if (mayCreate) {
    try {
      /* Sharing into somebody's personal branch is not a thing the product
         does, so those never appear as a target. */
      branches = (await getVisibleBranches(account))
        .filter((branch) => branch.kind !== "PERSONAL")
        .map((branch) => ({ id: branch.id, name: branch.name, kind: branch.kind }));
    } catch {
      unreachable = true;
    }
  }

  return (
    <div className="app">
      <AppBar context="Festhalten" user={session.user.email} canApprove={mayApprove} />
      <main className="app-main app-main-narrow">
        <div className="app-head">
          <div>
            <h1 className="page-title">Was wissen Sie, das sonst verloren geht?</h1>
            <p>Ein Wissensstück ist eine Sache, die stimmt, und der Zusammenhang, in dem sie stimmt. Schreiben Sie es so auf, dass jemand es in zwei Jahren noch versteht, ohne Sie fragen zu müssen.</p>
          </div>
        </div>

        {!mayCreate ? (
          <section className="panel">
            <div className="state">
              <h3>Ihre Rolle darf nichts einstellen</h3>
              <p>Das Recht CREATE fehlt. Wenden Sie sich an die Verwaltung Ihrer Organisation, wenn das ein Fehler ist.</p>
            </div>
          </section>
        ) : unreachable ? (
          <section className="panel">
            <div className="state">
              <h3>Der Speicher ist nicht erreichbar</h3>
              <p>Die Zweige konnten nicht geladen werden. Lokal heißt das meistens, dass PostgreSQL noch nicht läuft.</p>
            </div>
          </section>
        ) : (
          <CaptureForm branches={branches} selfApproves={canApproveWithoutReview(account.role?.key)} />
        )}
      </main>
    </div>
  );
}
