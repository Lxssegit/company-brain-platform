import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { canReadBranch, getVisibleBranches } from "@/lib/branches/access";
import { getInheritancePath } from "@/lib/branches/tree";
import { AppBar } from "@/components/AppBar";

export default async function BranchPage({ params }: { params: Promise<{ branchId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = { id: session.user.id, organizationId: session.user.organizationId, role: session.user.role ? { key: session.user.role as "SUPER_ADMIN" | "COMPANY_ADMIN" | "DEPARTMENT_ADMIN" | "MANAGER" | "EMPLOYEE" } : null };
  const { branchId } = await params;
  /* An unreachable store is not the same as an unauthorized branch, and the
     reader deserves to be told which one happened. */
  let branches: Awaited<ReturnType<typeof getVisibleBranches>>;
  try {
    if (!(await canReadBranch(user, branchId))) notFound();
    branches = await getVisibleBranches(user);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    return (
      <div className="app">
        <AppBar context="Branch" user={session.user.email} />
        <main className="app-main">
          <section className="panel">
            <div className="state">
              <h3>This branch is unreachable</h3>
              <p>The branch store did not answer, so nothing about this branch can be shown. In local development, start PostgreSQL and run the migrations, then reload.</p>
              <Link className="btn btn-quiet" href="/brain">Back to the tree</Link>
            </div>
          </section>
        </main>
      </div>
    );
  }
  const branch = branches.find((item) => item.id === branchId);
  if (!branch) notFound();

  const inheritance = getInheritancePath(branch.id, branches).map((node) => branches.find((candidate) => candidate.id === node.id)).filter((node) => node !== undefined);
  const children = branches.filter((item) => item.parentId === branch.id);

  return (
    <div className="app">
      <AppBar context={branch.name} user={session.user.email} />
      <main className="app-main">
        <nav aria-label="Branch path">
          <ol className="crumbs">
            <li><Link href="/brain">Knowledge tree</Link></li>
            {inheritance.map((node) => (
              <li key={node.id}>
                {node.id === branch.id ? <span aria-current="page">{node.name}</span> : <Link href={`/brain/${node.id}`}>{node.name}</Link>}
              </li>
            ))}
          </ol>
        </nav>

        <div className="app-head" style={{ marginTop: 22 }}>
          <div className={`branch-head kind-${branch.kind.toLowerCase()}`}>
            <span className="tree-dot" aria-hidden="true" />
            <div>
              <p className="branch-kind-label">{branch.kind.toLowerCase()} branch</p>
              <h1 className="page-title">{branch.name}</h1>
              <p>{branch.description ?? "No description has been written for this branch yet."}</p>
            </div>
          </div>
        </div>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Inherited context</h2>
              <p>This branch reads everything approved above it in the chain. Context flows down; it is never copied.</p>
            </div>
          </div>
          <ul className="tree">
            {inheritance.map((node) => (
              <li key={node.id}>
                <Link className={`tree-link kind-${node.kind.toLowerCase()}`} href={`/brain/${node.id}`} aria-current={node.id === branch.id ? "page" : undefined}>
                  <span className="tree-dot" aria-hidden="true" />
                  <span>{node.name}</span>
                  <span className="tree-kind">{node.id === branch.id ? "current" : node.kind.toLowerCase()}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Below this branch</h2>
              <p>Branches nested directly under {branch.name} that you are allowed to read.</p>
            </div>
          </div>
          {children.length ? (
            <ul className="tree">
              {children.map((child) => (
                <li key={child.id}>
                  <Link className={`tree-link kind-${child.kind.toLowerCase()}`} href={`/brain/${child.id}`}>
                    <span className="tree-dot" aria-hidden="true" />
                    <span>{child.name}</span>
                    <span className="tree-kind">{child.kind.toLowerCase()}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="state">
              <h3>Nothing nested here</h3>
              <p>{branch.name} has no readable branches under it. That either means it is a leaf of the tree, or the branches below it have not been granted to you.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
