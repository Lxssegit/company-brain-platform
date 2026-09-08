import Link from "next/link";
import { LocalLoginForm } from "@/app/login/LocalLoginForm";

export default function LoginPage() {
  const googleConfigured = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  const localConfigured = process.env.NODE_ENV !== "production" && process.env.AUTH_DEV_LOGIN_ENABLED !== "false" && Boolean(process.env.AUTH_DEV_EMAIL && process.env.AUTH_DEV_PASSWORD);
  return (
    <main className="foundation-shell">
      <div className="login-card">
        <Link className="login-back" href="/">← Back to Company Brain</Link>
        <div className="foundation-mark"><span>✦</span></div>
        <p className="foundation-kicker">WELCOME BACK</p>
        <h1>Sign in to your brain.</h1>
        <p className="foundation-copy">Use your company identity to enter an organization-scoped workspace.</p>
        {localConfigured ? <><LocalLoginForm /><p className="login-divider">or</p></> : null}
        {googleConfigured ? <a className="foundation-button secondary full" href="/api/auth/signin/google">Continue with Google</a> : null}
        {!localConfigured && !googleConfigured ? <div className="config-note"><strong>Auth provider not configured yet.</strong><span>Set local development credentials or add Google OAuth credentials in `.env`, then restart the server.</span></div> : null}
        <p className="login-footnote">Authentication is server-side. Organization and role are never accepted from the browser.</p>
      </div>
    </main>
  );
}
