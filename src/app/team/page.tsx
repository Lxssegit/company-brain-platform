import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdministrableBranches } from "@/lib/branches/access";
import { hasRolePermission } from "@/lib/permissions/policy";
import { prisma } from "@/lib/db/prisma";
import { AppBar } from "@/components/AppBar";
import { TeamPanel, type Member, type ParentBranch } from "@/app/team/TeamPanel";

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const account = await getCurrentUser().catch(() => null);
  if (!account) redirect("/login");
  /* Signed in and belonging nowhere is not "not signed in". Sending it to
     /login produced a loop: sign in, get bounced, sign in again. */
  if (!account.organizationId) redirect("/organisation");
  if (account.status !== "ACTIVE") redirect("/login");

  const mayManage = hasRolePermission(account.role?.key, "MANAGE_USERS");

  let members: Member[] = [];
  let parents: ParentBranch[] = [];
  let unreachable = false;
  if (mayManage) {
    try {
      const [rows, branches] = await Promise.all([
        prisma.user.findMany({
          where: { organizationId: account.organizationId! },
          select: { id: true, name: true, email: true, status: true, createdAt: true, role: { select: { key: true } } },
          orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        }),
        getAdministrableBranches(account),
      ]);
      members = rows.map((row) => ({
        id: row.id,
        name: row.name ?? row.email,
        email: row.email,
        status: row.status,
        roleKey: row.role?.key ?? null,
        isSelf: row.id === account.id,
      }));
      parents = branches.filter((branch) => branch.kind !== "PERSONAL").map((branch) => ({ id: branch.id, name: branch.name, kind: branch.kind }));
    } catch {
      unreachable = true;
    }
  }

  return (
    <div className="app">
      <AppBar context="Team" user={session.user.email} />
      <main className="app-main app-main-narrow">
        <div className="app-head">
          <div>
            <h1 className="page-title">Wer arbeitet mit.</h1>
            <p>Ein Betriebsgedächtnis mit einer Person darin ist ein Notizbuch. Jede eingeladene Person bekommt einen eigenen Zweig, in dem sie festhalten kann, bevor sie irgendetwas teilt.</p>
          </div>
        </div>

        {!mayManage ? (
          <section className="panel">
            <div className="state">
              <h3>Personen verwalten gehört nicht zu Ihrer Rolle</h3>
              <p>Das Recht MANAGE_USERS fehlt. Wer in Ihrer Organisation einladen darf, steht in der Rollenübersicht auf dem Dashboard.</p>
            </div>
          </section>
        ) : unreachable ? (
          <section className="panel">
            <div className="state">
              <h3>Die Personen sind nicht erreichbar</h3>
              <p>Der Speicher hat nicht geantwortet. Lokal heißt das meistens, dass PostgreSQL noch nicht läuft.</p>
            </div>
          </section>
        ) : (
          <TeamPanel initial={members} parents={parents} />
        )}
      </main>
    </div>
  );
}
