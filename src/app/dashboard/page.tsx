import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { TwoFactorPanel } from "@/app/dashboard/TwoFactorPanel";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <main className="foundation-shell">
      <div className="foundation-card">
        <p className="foundation-kicker">AUTHENTICATED CONTEXT</p>
        <h1>Welcome to your company brain.</h1>
        <p className="foundation-copy">You are signed in as {session.user.name ?? session.user.email}. Organization and role claims are resolved server-side.</p>
        <div className="foundation-grid"><div><span>ORG</span><strong>{session.user.organizationId ?? "Not assigned"}</strong><small>Tenant scope</small></div><div><span>ROLE</span><strong>{session.user.role ?? "Pending"}</strong><small>Authorization ceiling</small></div><div><span>API</span><strong>Protected</strong><small>Permission gate active</small></div></div>
        <TwoFactorPanel />
        <div className="foundation-actions"><Link className="foundation-button secondary" href="/">Back to foundation</Link><a className="foundation-button secondary" href="http://localhost:4173/">Open UI prototype ↗</a></div>
      </div>
    </main>
  );
}
