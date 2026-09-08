import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { canReadBranch, getVisibleBranches } from "@/lib/branches/access";
import { getInheritancePath } from "@/lib/branches/tree";

export default async function BranchPage({ params }: { params: Promise<{ branchId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = { id: session.user.id, organizationId: session.user.organizationId, role: session.user.role ? { key: session.user.role as "SUPER_ADMIN" | "COMPANY_ADMIN" | "DEPARTMENT_ADMIN" | "MANAGER" | "EMPLOYEE" } : null };
  const { branchId } = await params;
  if (!(await canReadBranch(user, branchId))) notFound();
  const branches = await getVisibleBranches(user);
  const branch = branches.find((item) => item.id === branchId);
  if (!branch) notFound();
  const inheritance = getInheritancePath(branch.id, branches);
  return <main className="brain-shell"><div className="brain-top"><Link href="/brain">← Knowledge tree</Link><span>BRANCH DETAIL</span></div><section className="branch-server-card"><span className={`server-tree-dot ${branch.kind.toLowerCase()}`}></span><p className="foundation-kicker">{branch.kind} BRANCH</p><h1>{branch.name}</h1><p>{branch.description ?? "A permission-scoped company context."}</p><div className="server-inheritance"><span>INHERITED CONTEXT</span>{inheritance.map((item) => { const named = branches.find((candidate) => candidate.id === item.id); return named ? <Link key={item.id} href={`/brain/${item.id}`}>{named.name}</Link> : null; })}</div></section></main>;
}
