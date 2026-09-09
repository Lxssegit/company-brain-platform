import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getVisibleBranches } from "@/lib/branches/access";
import { hasRolePermission } from "@/lib/permissions/policy";
import { AppBar } from "@/components/AppBar";
import { AskPanel } from "@/app/fragen/AskPanel";

export default async function AskPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const account = await getCurrentUser().catch(() => null);
  if (!account || account.status !== "ACTIVE") redirect("/login");

  /* The branch filter offers only what this account may read, so the control
     itself cannot be used to probe for branches that exist but are not theirs. */
  let branches: Array<{ id: string; name: string; kind: string }> = [];
  let unreachable = false;
  try {
    branches = (await getVisibleBranches(account)).map((branch) => ({ id: branch.id, name: branch.name, kind: branch.kind }));
  } catch {
    unreachable = true;
  }

  return (
    <div className="app">
      <AppBar context="Fragen" user={session.user.email} canApprove={hasRolePermission(account?.role?.key, "APPROVE")} />
      <main className="app-main">
        <div className="app-head">
          <div>
            <h1 className="page-title">Was möchten Sie wissen?</h1>
            <p>Gesucht wird ausschließlich in dem Wissen, das Ihre Organisation, Ihre Rolle und Ihre Freigaben zulassen. Findet sich keine belastbare Grundlage, sagt Company Brain das — statt etwas zu erfinden.</p>
          </div>
        </div>
        <AskPanel branches={branches} branchesUnreachable={unreachable} />
      </main>
    </div>
  );
}
