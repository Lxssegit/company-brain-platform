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
      setError("Das passte zu keinem Konto. Prüfen Sie E-Mail, Passwort und – falls aktiviert – den Zwei-Faktor-Code.");
      setPending(false);
      return;
    }
    window.location.href = result.url ?? "/dashboard";
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="login-email">E-Mail</label>
        <input id="login-email" name="email" type="email" autoComplete="email" placeholder="name@firma.example" required disabled={pending} aria-invalid={error ? true : undefined} />
      </div>
      <div className="field">
        <label htmlFor="login-password">Passwort</label>
        <input id="login-password" name="password" type="password" autoComplete="current-password" required disabled={pending} aria-invalid={error ? true : undefined} />
      </div>
      <div className="field field-code">
        <label htmlFor="login-totp">Zwei-Faktor-Code</label>
        <input id="login-totp" name="totpCode" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" disabled={pending} />
        <span className="field-hint">Nur nötig, sobald Sie die Zwei-Faktor-Anmeldung aktiviert haben.</span>
      </div>
      {error ? <p className="form-note form-note-error" role="alert">{error}</p> : null}
      <button className="btn btn-primary btn-block" type="submit" aria-busy={pending} disabled={pending}>
        <span className="btn-spin" aria-hidden="true" />
        {pending ? "Wird angemeldet…" : "Anmelden"}
      </button>
    </form>
  );
}
