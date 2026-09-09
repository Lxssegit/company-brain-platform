import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getVisibleBranches } from "@/lib/branches/access";
import { hasRolePermission } from "@/lib/permissions/policy";
import { AppBar } from "@/components/AppBar";
import { BRANCH_KIND_LABEL, branchCount } from "@/lib/i18n/de";

type Branches = Awaited<ReturnType<typeof getVisibleBranches>>;

function Tree({ branches, parentId = null }: { branches: Branches; parentId?: string | null }) {
  const children = branches.filter((branch) => branch.parentId === parentId);
  if (!children.length) return null;
  return (
    <ul className="tree">
      {children.map((branch) => (
        <li key={branch.id}>
          <Link className={`tree-link kind-${branch.kind.toLowerCase()}`} href={`/brain/${branch.id}`}>
            <span className="tree-dot" aria-hidden="true" />
            <span>{branch.name}</span>
            <span className="tree-kind">{BRANCH_KIND_LABEL[branch.kind]}</span>
          </Link>
          <Tree branches={branches} parentId={branch.id} />
        </li>
      ))}
    </ul>
  );
}

export default async function BrainPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  /* The tree reads from PostgreSQL. If that is unreachable the page used to
     throw; it now says so, because a blank 500 teaches the reader nothing. */
  let branches: Branches = [];
  let unreachable = false;
  let canApprove = false;
  try {
    /* Role and organization come from the record, never from the token: a
       session outlives the account state it was minted with. */
    const account = await getCurrentUser();
    if (!account || account.status !== "ACTIVE") redirect("/login");
    canApprove = hasRolePermission(account.role?.key, "APPROVE");
    branches = await getVisibleBranches(account);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    unreachable = true;
  }

  return (
    <div className="app">
      <AppBar context="Wissensbaum" user={session.user.email} canApprove={canApprove} />
      <main className="app-main">
        <div className="app-head">
          <div>
            <h1 className="page-title">Ihr berechtigter Kontext.</h1>
            <p>Jeder Zweig hier unten wurde auf dem Server gegen Ihre Organisation, Ihre Rolle und Ihre Freigaben gefiltert. Einen Zweig, den Sie nicht lesen dürfen, gibt es auf dieser Seite gar nicht.</p>
          </div>
        </div>

        <section className="panel">
          <div className="tree-panel-head">
            <h2>{unreachable ? "Zweige" : branchCount(branches.length)}</h2>
            <span className={`pill ${unreachable ? "pill-off" : "pill-on"}`}>{unreachable ? "Nicht erreichbar" : "Berechtigungsgefiltert"}</span>
          </div>
          {unreachable ? (
            <div className="state">
              <h3>Der Wissensbaum ist nicht erreichbar</h3>
              <p>Der Zweig-Speicher hat nicht geantwortet. Lokal heißt das meistens, dass PostgreSQL noch nicht läuft:</p>
              <code className="code-block">{"docker compose up -d db\npnpm db:migrate\npnpm db:seed"}</code>
              <Link className="btn btn-quiet" href="/dashboard">Zurück zur Übersicht</Link>
            </div>
          ) : branches.length ? (
            <Tree branches={branches} />
          ) : (
            /* An empty tree is almost always a missing grant, not an empty
               company, so the state says what to do about it. */
            <div className="state">
              <h3>Für Sie ist noch kein Zweig lesbar</h3>
              <p>Ihr Konto ist angemeldet, aber ihm wurde noch kein Zweig freigegeben. Wer die Berechtigung zur Zweigverwaltung hat, kann Sie über <code>POST /api/branches/:id/members</code> hinzufügen oder Ihnen beim Anlegen des Kontos einen persönlichen Zweig zuweisen.</p>
              <Link className="btn btn-quiet" href="/dashboard">Zurück zur Übersicht</Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
