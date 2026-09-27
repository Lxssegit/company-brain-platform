import Link from "next/link";
import { PasswordLoginForm } from "@/app/login/PasswordLoginForm";
import { ArrowLeft, ArrowUpRight, BrandMark } from "@/components/icons";
import { authRuntimeProblems } from "@/lib/auth/runtime";

/**
 * Rendered per request rather than prerendered, so the nonce in the
 * Content-Security-Policy can reach its scripts. A prerendered page's HTML is
 * written at build time and cannot carry a value that changes per request, so
 * every script on it is blocked under a nonce policy — the login form rendered
 * and never hydrated. Neither page fetches anything, so the cost is a template
 * render.
 */
export const dynamic = "force-dynamic";

export default function LoginPage() {
  const googleConfigured = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  /* Shown unless it has been switched off on purpose. This used to be gated on
     NODE_ENV, which meant a real deployment offered no way in at all unless
     Google happened to be configured — and an invitation, which signs people in
     through this same provider, could not be accepted either. */
  const passwordConfigured = process.env.AUTH_PASSWORD_LOGIN_ENABLED !== "false";
  const nothingConfigured = !passwordConfigured && !googleConfigured;
  /* A sign-in attempt against a half-configured server is refused in authorize,
     which is correct and tells the person nothing. Whoever deployed it sees it
     here instead, on the page they will open first, named rather than as a
     failed login they will blame on their password. */
  const problems = authRuntimeProblems();

  return (
    <main className="app auth-shell">
      <div className="auth-card">
        <Link className="auth-back" href="/"><ArrowLeft /> Zurück zu Company Brain</Link>
        <BrandMark />
        <h1 className="page-title">Anmelden.</h1>
        <p className="auth-lede">Organisation und Rolle werden auf dem Server aufgelöst. Der Browser darf sie nie behaupten.</p>

        {problems.length > 0 ? (
          <div className="state">
            <h3>Die Anmeldung ist nicht vollständig eingerichtet</h3>
            <p>Dieser Server nimmt keine Anmeldung an, bis das hier steht:</p>
            <ul className="plain-list">
              {problems.map((problem) => (
                <li key={problem.key}><code>{problem.key}</code> {problem.detail}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {passwordConfigured ? <PasswordLoginForm /> : null}
        {passwordConfigured && googleConfigured ? <p className="auth-divider">oder</p> : null}
        {/* This is a route handler, not a page: OAuth needs a real document
            navigation, so next/link would break the redirect. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        {googleConfigured ? <a className="btn btn-quiet btn-block" href="/api/auth/signin/google">Mit Google fortfahren <ArrowUpRight /></a> : null}

        {/* Nach einem frischen Clone landet man genau hier. Dieser Zustand zeigt
            die zwei Befehle, statt das Problem nur zu benennen. */}
        {nothingConfigured ? (
          <div className="state">
            <h3>Es ist kein Anmeldeweg eingerichtet</h3>
            <p>Die Anmeldung mit Passwort ist über <code>AUTH_PASSWORD_LOGIN_ENABLED=&quot;false&quot;</code> abgeschaltet, und für Google fehlen die Zugangsdaten. Damit kommt niemand herein.</p>
            <p>Lokal reicht eine Datei namens <code>.env</code> im Projektordner:</p>
            <code className="code-block">{"cp .env.example .env\npnpm db:generate\npnpm dev"}</code>
          </div>
        ) : null}

        <p className="auth-foot">Passwörter werden als scrypt-Hash gespeichert. Zwei-Faktor-Codes prüft der Server.</p>
      </div>
    </main>
  );
}
