"use client";

import { FormEvent, useState } from "react";

export function TwoFactorPanel() {
  const [secret, setSecret] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function startSetup() {
    setMessage("");
    setPending(true);
    const response = await fetch("/api/auth/2fa/setup", { method: "POST" });
    const data = await response.json() as { secret?: string; otpauthUrl?: string; error?: string };
    setPending(false);
    if (!response.ok) return setMessage(data.error ?? "2FA setup failed");
    setSecret(data.secret ?? "");
    setOtpauthUrl(data.otpauthUrl ?? "");
    setMessage("Secret erzeugt. Füge es in deine Authenticator-App ein und bestätige unten den aktuellen Code.");
  }

  async function confirmSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const response = await fetch("/api/auth/2fa/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) });
    const data = await response.json() as { error?: string };
    setPending(false);
    setMessage(response.ok ? "2FA ist aktiviert. Beim nächsten Login wird der sechsstellige Code verlangt." : data.error ?? "2FA verification failed");
    if (response.ok) { setSecret(""); setOtpauthUrl(""); setCode(""); }
  }

  return <section className="two-factor-panel">
    <div><p className="foundation-kicker">ACCOUNT SECURITY</p><h2>Two-step authentication</h2><p className="foundation-copy">Protect this account with a time-based code from an authenticator app.</p></div>
    {!secret ? <button className="foundation-button secondary" type="button" onClick={startSetup} disabled={pending}>{pending ? "Preparing…" : "Set up 2FA"}</button> : <form onSubmit={confirmSetup}>
      <p className="two-factor-instruction">Secret: <code>{secret}</code></p>
      <p className="two-factor-instruction">Manual setup URI: <code>{otpauthUrl}</code></p>
      <label>Current 2FA code<input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" pattern="[0-9]{6}" autoComplete="one-time-code" maxLength={6} required /></label>
      <button className="foundation-button primary" type="submit" disabled={pending}>{pending ? "Checking…" : "Enable 2FA"}</button>
    </form>}
    {message ? <p className="two-factor-message" role="status">{message}</p> : null}
  </section>;
}
