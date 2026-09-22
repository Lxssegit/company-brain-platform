import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getCurrentUser } from "@/lib/auth/current-user";
import { BrandMark } from "@/components/icons";
import { SignOutButton } from "@/components/SignOutButton";
import { FoundForm } from "@/app/organisation/FoundForm";

/**
 * Where an account that belongs to nowhere lands. Before this page existed such
 * an account was sent back to /login by every other page — signed in, and
 * bounced to sign in again, forever.
 */
export const dynamic = "force-dynamic";

export default async function FoundOrganizationPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const account = await getCurrentUser().catch(() => null);
  if (account?.organizationId) redirect("/dashboard");

  const suspended = account?.status === "SUSPENDED";

  return (
    <div className="app">
      <header className="app-bar">
        <div className="app-bar-left">
          <Link className="app-brand" href="/"><BrandMark /><span>Company Brain</span></Link>
        </div>
        {/* Somebody who lands here and does not want to found anything needs a
            way out. Without this the page was a dead end with one exit. */}
        <SignOutButton />
      </header>
      <main className="app-main app-main-narrow">
        <div className="app-head">
          <div>
            <h1 className="page-title">Ihr Konto gehört noch zu keinem Unternehmen.</h1>
            <p>Entweder Sie gründen hier eines — dann verwalten Sie es und laden die anderen ein — oder Sie warten auf einen Einladungslink von jemandem, der schon eines hat.</p>
          </div>
        </div>

        {suspended ? (
          <section className="panel">
            <div className="state">
              <h3>Dieses Konto ist gesperrt</h3>
              <p>Solange die Sperre besteht, lässt sich damit nichts gründen und nichts betreten. Wenden Sie sich an die Person, die sie gesetzt hat.</p>
            </div>
          </section>
        ) : (
          <FoundForm />
        )}
      </main>
    </div>
  );
}
