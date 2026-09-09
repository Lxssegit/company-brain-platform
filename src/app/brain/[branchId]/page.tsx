import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canReadBranch, getVisibleBranches } from "@/lib/branches/access";
import { getInheritancePath } from "@/lib/branches/tree";
import { hasRolePermission } from "@/lib/permissions/policy";
import { AppBar } from "@/components/AppBar";
import { BRANCH_KIND_LABEL } from "@/lib/i18n/de";

export default async function BranchPage({ params }: { params: Promise<{ branchId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { branchId } = await params;
  /* An unreachable store is not the same as an unauthorized branch, and the
     reader deserves to be told which one happened. */
  let branches: Awaited<ReturnType<typeof getVisibleBranches>>;
  let canApprove = false;
  try {
    /* Same reason as /brain: authorize against the record, not the token. */
    const account = await getCurrentUser();
    if (!account || account.status !== "ACTIVE") redirect("/login");
    canApprove = hasRolePermission(account.role?.key, "APPROVE");
    if (!(await canReadBranch(account, branchId))) notFound();
    branches = await getVisibleBranches(account);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    return (
      <div className="app">
        <AppBar context="Zweig" user={session.user.email} />
        <main className="app-main">
          <section className="panel">
            <div className="state">
              <h3>Dieser Zweig ist nicht erreichbar</h3>
              <p>Der Zweig-Speicher hat nicht geantwortet, deshalb lässt sich zu diesem Zweig nichts anzeigen. Lokal: PostgreSQL starten, Migrationen ausführen, neu laden.</p>
              <Link className="btn btn-quiet" href="/brain">Zurück zum Baum</Link>
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
      <AppBar context={branch.name} user={session.user.email} canApprove={canApprove} />
      <main className="app-main">
        <nav aria-label="Pfad des Zweigs">
          <ol className="crumbs">
            <li><Link href="/brain">Wissensbaum</Link></li>
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
              <p className="branch-kind-label">Zweig · {BRANCH_KIND_LABEL[branch.kind]}</p>
              <h1 className="page-title">{branch.name}</h1>
              <p>{branch.description ?? "Für diesen Zweig wurde noch keine Beschreibung hinterlegt."}</p>
            </div>
          </div>
        </div>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Geerbter Kontext</h2>
              <p>Dieser Zweig liest alles, was in der Kette über ihm freigegeben ist. Kontext fließt nach unten – kopiert wird er nie.</p>
            </div>
          </div>
          <ul className="tree">
            {inheritance.map((node) => (
              <li key={node.id}>
                <Link className={`tree-link kind-${node.kind.toLowerCase()}`} href={`/brain/${node.id}`} aria-current={node.id === branch.id ? "page" : undefined}>
                  <span className="tree-dot" aria-hidden="true" />
                  <span>{node.name}</span>
                  <span className="tree-kind">{node.id === branch.id ? "aktuell" : BRANCH_KIND_LABEL[node.kind]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Unter diesem Zweig</h2>
              <p>Zweige direkt unter {branch.name}, die Sie lesen dürfen.</p>
            </div>
          </div>
          {children.length ? (
            <ul className="tree">
              {children.map((child) => (
                <li key={child.id}>
                  <Link className={`tree-link kind-${child.kind.toLowerCase()}`} href={`/brain/${child.id}`}>
                    <span className="tree-dot" aria-hidden="true" />
                    <span>{child.name}</span>
                    <span className="tree-kind">{BRANCH_KIND_LABEL[child.kind]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="state">
              <h3>Hier ist nichts eingehängt</h3>
              <p>Unter {branch.name} liegt kein lesbarer Zweig. Entweder ist das ein Blatt des Baums – oder die Zweige darunter sind Ihnen nicht freigegeben.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
