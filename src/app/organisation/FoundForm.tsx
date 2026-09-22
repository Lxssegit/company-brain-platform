"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/domain/slug";

export function FoundForm() {
  const router = useRouter();
  const [organization, setOrganization] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const slug = slugify(organization);
  const tooShort = organization.trim().length > 0 && organization.trim().length < 2;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    let response: Response;
    try {
      response = await fetch("/api/organizations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: organization.trim() }) });
    } catch {
      setBusy(false);
      setError("Die Verbindung ist abgebrochen. Es wurde nichts gegründet.");
      return;
    }
    if (!response.ok) {
      setBusy(false);
      const data = await response.json().catch(() => ({})) as { error?: string };
      setError(data.error ?? "Das hat nicht funktioniert.");
      return;
    }
    /* The session was minted without an organization; it has to be re-read
       before any page will let this account past its own guard. */
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form className="form panel" onSubmit={submit}>
      <h2>Ein Unternehmen gründen</h2>
      {error ? <p className="form-note form-note-error" role="alert">{error}</p> : null}

      <div className="field">
        <label htmlFor="org-name">Wie heißt das Unternehmen?</label>
        <input id="org-name" value={organization} onChange={(event) => setOrganization(event.target.value)} minLength={2} maxLength={120} placeholder="Beispiel GmbH" aria-invalid={tooShort || undefined} disabled={busy} required />
        <span className="field-hint">{slug ? `Interne Kennung: ${slug}` : "Der Name steht später über dem ganzen Baum."}</span>
      </div>

      <p className="capture-consequence" role="status">
        Sie werden Unternehmens-Admin: Sie legen Zweige an, laden Menschen ein und entscheiden über Freigaben.
        Der Unternehmenszweig entsteht mit — er ist die Wurzel, unter der alles andere hängt.
      </p>

      <div className="review-actions">
        <button className="btn btn-primary" type="submit" aria-busy={busy} disabled={busy || organization.trim().length < 2}>
          <span className="btn-spin" aria-hidden="true" />
          {busy ? "Wird gegründet…" : "Unternehmen gründen"}
        </button>
      </div>
    </form>
  );
}
