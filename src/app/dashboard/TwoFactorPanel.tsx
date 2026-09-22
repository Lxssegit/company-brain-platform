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
  const [reauth, setReauth] = useState(false);
  const [password, setPassword] = useState("");
  const [currentCode, setCurrentCode] = useState("");

  async function startSetup() {
    /* Replacing an active factor re-authenticates first, so the form has to
       collect the proof before the request is worth sending. */
    if (done && !reauth) { setReauth(true); setFailed(false); setNote(""); return; }
    setNote("");
    setFailed(false);
    setPending(true);
    const response = await fetch("/api/auth/2fa/setup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(done ? { password, code: currentCode } : {}),
    });
    const data = await response.json().catch(() => ({})) as { secret?: string; otpauthUrl?: string; error?: string };
    setPending(false);
    if (!response.ok) {
      setFailed(true);
      setNote(data.error ?? "Die Einrichtung ist nicht durchgegangen. Bitte erneut versuchen.");
      return;
    }
    setSecret(data.secret ?? "");
    setOtpauthUrl(data.otpauthUrl ?? "");
    setReauth(false);
    setPassword("");
    setCurrentCode("");
    setNote("Tragen Sie den Schlüssel unten in eine Authenticator-App ein und bestätigen Sie mit dem sechsstelligen Code, den sie anzeigt.");
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
      setNote(data.error ?? "Dieser Code wurde nicht akzeptiert. Codes laufen nach 30 Sekunden ab.");
      return;
    }
    setDone(true);
    setSecret("");
    setOtpauthUrl("");
    setCode("");
    setNote("Die Zwei-Faktor-Anmeldung ist aktiv. Bei der nächsten Anmeldung wird ein Code verlangt.");
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Zwei-Faktor-Anmeldung</h2>
          <p>Ein zeitbasierter Code aus einer Authenticator-App, den der Server bei der Anmeldung prüft.</p>
        </div>
        <span className={`pill ${done ? "pill-on" : "pill-off"}`}>{done ? "Aktiv" : "Aus"}</span>
      </div>

      {!secret && reauth ? (
        <form className="form" onSubmit={(event) => { event.preventDefault(); void startSetup(); }}>
          <div className="field">
            <label htmlFor="totp-reauth-password">Passwort</label>
            <input id="totp-reauth-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={pending} aria-invalid={failed || undefined} />
          </div>
          <div className="field field-code">
            <label htmlFor="totp-reauth-code">Aktueller Code des alten Geräts</label>
            <input id="totp-reauth-code" value={currentCode} onChange={(event) => setCurrentCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" required disabled={pending} aria-invalid={failed || undefined} />
            <span className="field-hint">Ohne beides lässt sich der zweite Faktor nicht austauschen.</span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-primary" type="submit" aria-busy={pending} disabled={pending || !password || currentCode.length !== 6}>
              <span className="btn-spin" aria-hidden="true" />
              {pending ? "Wird geprüft…" : "Weiter"}
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => { setReauth(false); setPassword(""); setCurrentCode(""); setNote(""); setFailed(false); }} disabled={pending}>Abbrechen</button>
          </div>
        </form>
      ) : !secret ? (
        <button className="btn btn-quiet" type="button" onClick={startSetup} aria-busy={pending} disabled={pending}>
          <span className="btn-spin" aria-hidden="true" />
          {pending ? "Wird vorbereitet…" : done ? "Neues Gerät einrichten" : "Zwei-Faktor aktivieren"}
        </button>
      ) : (
        <form className="form" onSubmit={confirmSetup}>
          <div className="field">
            <label htmlFor="totp-secret">Einrichtungsschlüssel</label>
            <code className="code-block" id="totp-secret">{secret}</code>
            <span className="field-hint" style={{ overflowWrap: "anywhere" }}>Manuelle URI: {otpauthUrl}</span>
          </div>
          <div className="field field-code">
            <label htmlFor="totp-confirm">Aktueller Code</label>
            <input id="totp-confirm" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" required disabled={pending} aria-invalid={failed || undefined} />
          </div>
          <div>
            <button className="btn btn-primary" type="submit" aria-busy={pending} disabled={pending || code.length !== 6}>
              <span className="btn-spin" aria-hidden="true" />
              {pending ? "Wird geprüft…" : "Bestätigen und aktivieren"}
            </button>
          </div>
        </form>
      )}

      {note ? <p className={`form-note ${failed ? "form-note-error" : "form-note-ok"}`} role="status" style={{ marginTop: 16 }}>{note}</p> : null}
    </section>
  );
}
