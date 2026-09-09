import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasRolePermission } from "@/lib/permissions/policy";
import { AppBar } from "@/components/AppBar";
import { ROLE_LABEL } from "@/lib/i18n/de";
import { ArrowUpRight } from "@/components/icons";
import { TwoFactorPanel } from "@/app/dashboard/TwoFactorPanel";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  /* Read the record rather than the token so the page shows the organization's
     name instead of its id. The session is the fallback, not the source. */
  const account = await getCurrentUser().catch(() => null);
  const organization = account?.organization?.name ?? null;
  const role = account?.role?.key ?? session.user.role ?? null;
  const name = account?.name ?? session.user.name ?? session.user.email ?? "Ihr Konto";
  const twoFactorOn = Boolean(account?.totpEnabled);

  return (
    <div className="app">
      <AppBar context="Übersicht" user={session.user.email} canApprove={hasRolePermission(account?.role?.key, "APPROVE")} />
      <main className="app-main">
        <div className="app-head">
          <div>
            <h1 className="page-title">Willkommen zurück, {name}.</h1>
            <p>Das ist die angemeldete Seite von Company Brain. Was Sie hier sehen, ist genau das, was Ihre Organisation und Ihre Rolle erlauben.</p>
          </div>
        </div>

        <dl className="facts">
          <div>
            <dt>Organisation</dt>
            <dd className={organization ? undefined : "is-empty"}>{organization ?? "Noch nicht zugewiesen"}</dd>
          </div>
          <div>
            <dt>Rolle</dt>
            <dd className={role ? undefined : "is-empty"}>{role ? (ROLE_LABEL[role as keyof typeof ROLE_LABEL] ?? role) : "Offen"}</dd>
          </div>
        </dl>

        <div className="panel" style={{ marginTop: 18 }}>
          <div className="panel-head">
            <div>
              <h2>Eine Frage stellen</h2>
              <p>Durchsucht wird nur, was Ihre Organisation, Ihre Rolle und Ihre Freigaben zulassen. Ohne belastbare Grundlage sagt Company Brain das, statt zu raten.</p>
            </div>
          </div>
          <Link className="btn btn-primary" href="/fragen">Zu den Fragen <ArrowUpRight /></Link>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Ihr Wissensbaum</h2>
              <p>Zweige werden auf dem Server nach Organisation, Rolle und Ihren Freigaben gefiltert. Nichts außerhalb dieses Kontexts wird ausgeliefert.</p>
            </div>
          </div>
          <Link className="btn btn-quiet" href="/brain">Baum öffnen <ArrowUpRight /></Link>
        </div>

        <TwoFactorPanel enabled={twoFactorOn} />
      </main>
    </div>
  );
}
