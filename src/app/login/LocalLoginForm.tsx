"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";

export function LocalLoginForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    const result = await signIn("local", {
      email: form.get("email"),
      password: form.get("password"),
      totpCode: form.get("totpCode"),
      redirect: false,
      callbackUrl: "/dashboard",
    });
    if (!result || result.error) {
      setError("That did not match an account. Check the email, the password, and the two-step code if you have enabled one.");
      setPending(false);
      return;
    }
    window.location.href = result.url ?? "/dashboard";
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="login-email">Email</label>
        <input id="login-email" name="email" type="email" autoComplete="email" placeholder="you@company.example" required disabled={pending} aria-invalid={error ? true : undefined} />
      </div>
      <div className="field">
        <label htmlFor="login-password">Password</label>
        <input id="login-password" name="password" type="password" autoComplete="current-password" required disabled={pending} aria-invalid={error ? true : undefined} />
      </div>
      <div className="field field-code">
        <label htmlFor="login-totp">Two-step code</label>
        <input id="login-totp" name="totpCode" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" disabled={pending} />
        <span className="field-hint">Only needed once you have turned on two-step authentication.</span>
      </div>
      {error ? <p className="form-note form-note-error" role="alert">{error}</p> : null}
      <button className="btn btn-primary btn-block" type="submit" aria-busy={pending} disabled={pending}>
        <span className="btn-spin" aria-hidden="true" />
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
