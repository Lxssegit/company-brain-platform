"use client";

import { useState, type FormEvent } from "react";

export function TwoFactorPanel({ enabled }: { enabled: boolean }) {
  const [secret, setSecret] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(enabled);

  async function startSetup() {
    setNote("");
    setFailed(false);
    setPending(true);
    const response = await fetch("/api/auth/2fa/setup", { method: "POST" });
    const data = await response.json().catch(() => ({})) as { secret?: string; otpauthUrl?: string; error?: string };
    setPending(false);
    if (!response.ok) {
      setFailed(true);
      setNote(data.error ?? "The setup request did not go through. Try again.");
      return;
    }
    setSecret(data.secret ?? "");
    setOtpauthUrl(data.otpauthUrl ?? "");
    setNote("Add the key below to an authenticator app, then confirm with the six-digit code it shows.");
  }

  async function confirmSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFailed(false);
    const response = await fetch("/api/auth/2fa/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) });
    const data = await response.json().catch(() => ({})) as { error?: string };
    setPending(false);
    if (!response.ok) {
      setFailed(true);
      setNote(data.error ?? "That code was not accepted. Codes expire after 30 seconds.");
      return;
    }
    setDone(true);
    setSecret("");
    setOtpauthUrl("");
    setCode("");
    setNote("Two-step authentication is on. Your next sign-in will ask for a code.");
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Two-step authentication</h2>
          <p>A time-based code from an authenticator app, checked on the server at sign-in.</p>
        </div>
        <span className={`pill ${done ? "pill-on" : "pill-off"}`}>{done ? "On" : "Off"}</span>
      </div>

      {!secret ? (
        <button className="btn btn-quiet" type="button" onClick={startSetup} aria-busy={pending} disabled={pending}>
          <span className="btn-spin" aria-hidden="true" />
          {pending ? "Preparing…" : done ? "Set up a new device" : "Turn on two-step"}
        </button>
      ) : (
        <form className="form" onSubmit={confirmSetup}>
          <div className="field">
            <label htmlFor="totp-secret">Setup key</label>
            <code className="code-block" id="totp-secret">{secret}</code>
            <span className="field-hint" style={{ overflowWrap: "anywhere" }}>Manual URI: {otpauthUrl}</span>
          </div>
          <div className="field field-code">
            <label htmlFor="totp-confirm">Current code</label>
            <input id="totp-confirm" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" required disabled={pending} aria-invalid={failed || undefined} />
          </div>
          <div>
            <button className="btn btn-primary" type="submit" aria-busy={pending} disabled={pending || code.length !== 6}>
              <span className="btn-spin" aria-hidden="true" />
              {pending ? "Checking…" : "Confirm and turn on"}
            </button>
          </div>
        </form>
      )}

      {note ? <p className={`form-note ${failed ? "form-note-error" : "form-note-ok"}`} role="status" style={{ marginTop: 16 }}>{note}</p> : null}
    </section>
  );
}
