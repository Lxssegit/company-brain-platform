"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

const MIN = 10;

export function AcceptForm({ invite, name, email }: { invite: string; name: string; email: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const tooShort = password.length > 0 && password.length < MIN;
  const mismatch = repeat.length > 0 && repeat !== password;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    let response: Response;
    try {
      response = await fetch("/api/invitations/accept", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ invite, password }) });
    } catch {
      setBusy(false);
      setError("Die Verbindung ist abgebrochen. Das Passwort wurde nicht gesetzt — bitte erneut versuchen.");
      return;
    }
    if (!response.ok) {
      setBusy(false);
      const data = await response.json().catch(() => ({})) as { error?: string };
      setError(data.error ?? "Das hat nicht funktioniert. Bitte versuchen Sie es erneut.");
      return;
    }
    /* The account exists now, so the person should not have to type the same
       credentials again on a login screen they were just sent to. */
    const signedIn = await signIn("local", { email, password, redirect: false });
    setBusy(false);
    if (signedIn?.ok) { router.push("/dashboard"); router.refresh(); return; }
    router.push("/login");
  }

  return (
    <form className="form panel" onSubmit={submit}>
      {error ? <p className="form-note form-note-error" role="alert">{error}</p> : null}

      <div className="field">
        <label htmlFor="acc-email">Ihr Zugang</label>
        <input id="acc-email" value={email} readOnly aria-describedby="acc-email-hint" />
        <span className="field-hint" id="acc-email-hint">Auf diese Adresse lautet die Einladung. Sie ist nicht änderbar — {name} wurde damit eingeladen.</span>
      </div>

      <div className="field">
        <label htmlFor="acc-password">Passwort vergeben</label>
        <input id="acc-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={MIN} maxLength={200} autoComplete="new-password" aria-invalid={tooShort || undefined} disabled={busy} required />
        <span className="field-hint">Mindestens {MIN} Zeichen. Länge zählt mehr als Sonderzeichen — ein Satz, den nur Sie kennen, ist besser als „P@ssw0rt“.</span>
      </div>

      <div className="field">
        <label htmlFor="acc-repeat">Noch einmal</label>
        <input id="acc-repeat" type="password" value={repeat} onChange={(event) => setRepeat(event.target.value)} maxLength={200} autoComplete="new-password" aria-invalid={mismatch || undefined} disabled={busy} required />
        {mismatch ? <span className="field-hint" role="alert">Die beiden Eingaben stimmen nicht überein.</span> : null}
      </div>

      <div className="review-actions">
        <button className="btn btn-primary" type="submit" aria-busy={busy} disabled={busy || password.length < MIN || repeat !== password}>
          <span className="btn-spin" aria-hidden="true" />
          {busy ? "Wird eingerichtet…" : "Konto übernehmen"}
        </button>
      </div>
    </form>
  );
}
