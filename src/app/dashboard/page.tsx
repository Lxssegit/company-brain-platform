import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCurrentUser } from "@/lib/auth/current-user";
import { AppBar } from "@/components/AppBar";
import { ArrowUpRight } from "@/components/icons";
import { TwoFactorPanel } from "@/app/dashboard/TwoFactorPanel";

function titleCase(value: string) {
  return value.toLowerCase().split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  /* Read the record rather than the token so the page shows the organization's
     name instead of its id. The session is the fallback, not the source. */
  const account = await getCurrentUser().catch(() => null);
  const organization = account?.organization?.name ?? null;
  const role = account?.role?.key ?? session.user.role ?? null;
  const name = account?.name ?? session.user.name ?? session.user.email ?? "your account";
  const twoFactorOn = Boolean(account?.totpEnabled);

  return (
    <div className="app">
      <AppBar context="Overview" user={session.user.email} />
      <main className="app-main">
        <div className="app-head">
          <div>
            <h1 className="page-title">Welcome back, {name}.</h1>
            <p>This is the authenticated side of Company Brain. What you can see below is what your organization and role actually allow.</p>
          </div>
        </div>

        <dl className="facts">
          <div>
            <dt>Organization</dt>
            <dd className={organization ? undefined : "is-empty"}>{organization ?? "Not assigned yet"}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd className={role ? undefined : "is-empty"}>{role ? titleCase(role) : "Pending"}</dd>
          </div>
        </dl>

        <div className="panel" style={{ marginTop: 18 }}>
          <div className="panel-head">
            <div>
              <h2>Your knowledge tree</h2>
              <p>Branches are filtered on the server by organization, role and the grants made to you. Nothing outside that context is rendered.</p>
            </div>
          </div>
          <Link className="btn btn-quiet" href="/brain">Open the tree <ArrowUpRight /></Link>
        </div>

        <TwoFactorPanel enabled={twoFactorOn} />
      </main>
    </div>
  );
}
