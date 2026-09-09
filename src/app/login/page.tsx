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
        <Link className="auth-back" href="/"><ArrowLeft /> Back to Company Brain</Link>
        <BrandMark />
        <h1 className="page-title">Sign in.</h1>
        <p className="auth-lede">Your organization and role are resolved on the server. The browser never gets to claim them.</p>

        {localConfigured ? <LocalLoginForm /> : null}
        {localConfigured && googleConfigured ? <p className="auth-divider">or</p> : null}
        {googleConfigured ? <a className="btn btn-quiet btn-block" href="/api/auth/signin/google">Continue with Google <ArrowUpRight /></a> : null}

        {/* A first clone lands here with nothing configured, so this state
            teaches the two commands instead of only naming the problem. */}
        {nothingConfigured ? (
          <div className="state">
            <h3>No sign-in method is configured yet</h3>
            <p>Local development sign-in needs an <code>.env</code> file. From the project root:</p>
            <code className="code-block">cp .env.example .env
pnpm db:generate
pnpm dev</code>
            <p>That enables the local credentials provider with the demo account from <code>.env</code>. Google sign-in stays optional and needs real values for <code>AUTH_GOOGLE_ID</code> and <code>AUTH_GOOGLE_SECRET</code>.</p>
          </div>
        ) : null}

        <p className="auth-foot">Passwords are stored as scrypt hashes. Two-step codes are verified server-side.</p>
      </div>
    </main>
  );
}
