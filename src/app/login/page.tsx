import Link from "next/link";
import { LocalLoginForm } from "@/app/login/LocalLoginForm";
import { ArrowLeft, ArrowUpRight, BrandMark } from "@/components/icons";

export default function LoginPage() {
  const googleConfigured = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  const localConfigured = process.env.NODE_ENV !== "production" && process.env.AUTH_DEV_LOGIN_ENABLED !== "false" && Boolean(process.env.AUTH_DEV_EMAIL && process.env.AUTH_DEV_PASSWORD);
  const nothingConfigured = !localConfigured && !googleConfigured;

  return (
    <main className="app auth-shell">
      <div className="auth-card">
        <Link className="auth-back" href="/"><ArrowLeft /> Zurück zu Company Brain</Link>
        <BrandMark />
        <h1 className="page-title">Anmelden.</h1>
        <p className="auth-lede">Organisation und Rolle werden auf dem Server aufgelöst. Der Browser darf sie nie behaupten.</p>

        {localConfigured ? <LocalLoginForm /> : null}
        {localConfigured && googleConfigured ? <p className="auth-divider">oder</p> : null}
        {googleConfigured ? <a className="btn btn-quiet btn-block" href="/api/auth/signin/google">Mit Google fortfahren <ArrowUpRight /></a> : null}

        {/* Nach einem frischen Clone landet man genau hier. Dieser Zustand zeigt
            die zwei Befehle, statt das Problem nur zu benennen. */}
        {nothingConfigured ? (
          <div className="state">
            <h3>Es ist noch kein Anmeldeweg eingerichtet</h3>
            <p>Die lokale Anmeldung braucht eine Datei namens <code>.env</code> im Projektordner:</p>
            <code className="code-block">{"cp .env.example .env\npnpm db:generate\npnpm dev"}</code>
            <p>Damit ist der lokale Zugang mit dem Demo-Konto aus der <code>.env</code> aktiv. Für die Google-Anmeldung braucht es zusätzlich echte Werte für <code>AUTH_GOOGLE_ID</code> und <code>AUTH_GOOGLE_SECRET</code> — beides optional.</p>
          </div>
        ) : null}

        <p className="auth-foot">Passwörter werden als scrypt-Hash gespeichert. Zwei-Faktor-Codes prüft der Server.</p>
      </div>
    </main>
  );
}
