"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";

export function LocalLoginForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    const result = await signIn("local", { email: form.get("email"), password: form.get("password"), totpCode: form.get("totpCode"), redirect: false, callbackUrl: "/dashboard" });
    if (result?.error) {
      setError("Login fehlgeschlagen. Bitte E-Mail, Passwort und gegebenenfalls den 2FA-Code prüfen.");
      setPending(false);
      return;
    }
    window.location.href = result?.url ?? "/dashboard";
  }

  return <form className="local-login-form" onSubmit={handleSubmit}>
    <label>Email<input name="email" type="email" autoComplete="email" placeholder="demo@example-gmbh.local" required /></label>
    <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
    <label>2FA-Code <span className="optional-label">optional until enabled</span><input name="totpCode" inputMode="numeric" pattern="[0-9 ]{6,7}" autoComplete="one-time-code" placeholder="123456" /></label>
    {error ? <p className="login-error" role="alert">{error}</p> : null}
    <button className="foundation-button primary full" type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in locally"}</button>
  </form>;
}
