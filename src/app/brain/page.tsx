import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getVisibleBranches } from "@/lib/branches/access";
import { AppBar } from "@/components/AppBar";

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
            <span className="tree-kind">{branch.kind.toLowerCase()}</span>
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
  const user = { id: session.user.id, organizationId: session.user.organizationId, role: session.user.role ? { key: session.user.role as "SUPER_ADMIN" | "COMPANY_ADMIN" | "DEPARTMENT_ADMIN" | "MANAGER" | "EMPLOYEE" } : null };
  /* The tree reads from PostgreSQL. If that is unreachable the page used to
     throw; it now says so, because a blank 500 teaches the reader nothing. */
  let branches: Branches = [];
  let unreachable = false;
  try {
    branches = await getVisibleBranches(user);
  } catch {
    unreachable = true;
  }

  return (
    <div className="app">
      <AppBar context="Knowledge tree" user={session.user.email} />
      <main className="app-main">
        <div className="app-head">
          <div>
            <h1 className="page-title">Your authorized context.</h1>
            <p>Every branch below was filtered on the server against your organization, your role and the grants made to you. A branch you cannot read is not rendered here at all.</p>
          </div>
        </div>

        <section className="panel">
          <div className="tree-panel-head">
            <h2>{unreachable ? "Branches" : `${branches.length} ${branches.length === 1 ? "branch" : "branches"}`}</h2>
            <span className={`pill ${unreachable ? "pill-off" : "pill-on"}`}>{unreachable ? "Unavailable" : "Permission filtered"}</span>
          </div>
          {unreachable ? (
            <div className="state">
              <h3>The knowledge tree is unreachable</h3>
              <p>The branch store did not answer. In local development this usually means PostgreSQL is not running yet:</p>
              <code className="code-block">docker compose up -d db
pnpm db:migrate
pnpm db:seed</code>
              <Link className="btn btn-quiet" href="/dashboard">Back to overview</Link>
            </div>
          ) : branches.length ? (
            <Tree branches={branches} />
          ) : (
            /* An empty tree is almost always a missing grant, not an empty
               company, so the state says what to do about it. */
            <div className="state">
              <h3>No branches are readable for you yet</h3>
              <p>Your account is signed in, but no branch has been granted to it. Someone with the branch-management permission can add you through <code>POST /api/branches/:id/members</code>, or assign you a personal branch when your user is created.</p>
              <Link className="btn btn-quiet" href="/dashboard">Back to overview</Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
