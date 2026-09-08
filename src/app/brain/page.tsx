import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getVisibleBranches } from "@/lib/branches/access";

function Tree({ branches, parentId = null }: { branches: Awaited<ReturnType<typeof getVisibleBranches>>; parentId?: string | null }) {
  return <div className="server-tree">{branches.filter((branch) => branch.parentId === parentId).map((branch) => <div key={branch.id} className="server-tree-node"><Link href={`/brain/${branch.id}`}><span className={`server-tree-dot ${branch.kind.toLowerCase()}`}></span><span>{branch.name}</span><small>{branch.kind.toLowerCase()}</small></Link><Tree branches={branches} parentId={branch.id} /></div>)}</div>;
}

export default async function BrainPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = { id: session.user.id, organizationId: session.user.organizationId, role: session.user.role ? { key: session.user.role as "SUPER_ADMIN" | "COMPANY_ADMIN" | "DEPARTMENT_ADMIN" | "MANAGER" | "EMPLOYEE" } : null };
  const branches = await getVisibleBranches(user);
  return <main className="brain-shell"><div className="brain-top"><Link href="/">← Company Brain</Link><span>SERVER-SCOPED KNOWLEDGE TREE</span></div><section className="brain-heading"><p className="foundation-kicker">YOUR AUTHORIZED CONTEXT</p><h1>The tree behind the memory.</h1><p>Only branches granted to your organization, role, and user context are rendered here.</p></section><section className="brain-panel"><div className="brain-panel-top"><div><span className="foundation-kicker">LIVE FROM POSTGRESQL</span><h2>{branches.length} visible branches</h2></div><span className="secure-chip">✓ permission filtered</span></div>{branches.length ? <Tree branches={branches} /> : <p className="empty-state">No branches are assigned to this user yet.</p>}</section></main>;
}
