"use client";

import { useState } from "react";
import type { BranchKind, RoleKey, UserStatus } from "@prisma/client";
import { ROLE_KEYS } from "@/lib/domain/enums";
import { BRANCH_KIND_LABEL, ROLE_LABEL, USER_STATUS_LABEL } from "@/lib/i18n/de";

export type Member = { id: string; name: string; email: string; status: UserStatus; roleKey: RoleKey | null; isSelf: boolean };
export type ParentBranch = { id: string; name: string; kind: BranchKind };

export function TeamPanel({ initial, parents }: { initial: Member[]; parents: ParentBranch[] }) {
  const [members, setMembers] = useState(initial);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleKey>("EMPLOYEE");
  const [parentBranchId, setParentBranchId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [link, setLink] = useState<{ url: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function invite(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setLink(null);
    const payload: Record<string, unknown> = { name: name.trim(), email: email.trim(), role };
    if (parentBranchId) payload.parentBranchId = parentBranchId;

    let response: Response;
    try {
      response = await fetch("/api/users", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    } catch {
      setBusy(false);
      setError("Die Verbindung ist abgebrochen. Es wurde niemand eingeladen — bitte erneut versuchen.");
      return;
    }
    setBusy(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({})) as { error?: string };
      setError(data.error ?? "Das hat nicht funktioniert. Bitte prüfen Sie die Eingaben.");
      return;
    }
    const data = await response.json() as { user: { id: string; name: string | null; email: string; status: UserStatus }; inviteUrl: string };
    setMembers((current) => [{ id: data.user.id, name: data.user.name ?? data.user.email, email: data.user.email, status: data.user.status, roleKey: role, isSelf: false }, ...current]);
    setLink({ url: data.inviteUrl, name: data.user.name ?? data.user.email });
    setCopied(false);
    setName("");
    setEmail("");
  }

  return (
    <>
      {link ? (
        /* Nothing sends mail yet, so the link is handed over here — once. It is
           stored only as a hash, which is why it cannot be shown again later. */
        <section className="panel panel-warn invite-link">
          <h2>Der Einladungslink für {link.name}</h2>
          <p>Geben Sie ihn weiter. Er gilt sieben Tage, lässt sich einmal einlösen — und wird hier nicht noch einmal angezeigt.</p>
          <code className="code-block">{link.url}</code>
          <div className="review-actions">
            <button className="btn btn-quiet" type="button" onClick={async () => {
              try { await navigator.clipboard.writeText(link.url); setCopied(true); } catch { setCopied(false); }
            }}>{copied ? "Kopiert" : "Link kopieren"}</button>
            <button className="btn btn-ghost" type="button" onClick={() => setLink(null)}>Ich habe ihn weitergegeben</button>
          </div>
        </section>
      ) : null}

      <form className="form panel" onSubmit={invite}>
        <h2>Jemanden einladen</h2>
        {error ? <p className="form-note form-note-error" role="alert">{error}</p> : null}

        <div className="field">
          <label htmlFor="inv-name">Name</label>
          <input id="inv-name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={120} placeholder="Vor- und Nachname" disabled={busy} required />
        </div>

        <div className="field">
          <label htmlFor="inv-email">E-Mail-Adresse</label>
          <input id="inv-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={255} placeholder="name@firma.de" disabled={busy} required />
          <span className="field-hint">Damit meldet sich die Person an. Sie ist später nicht änderbar.</span>
        </div>

        <div className="field">
          <label htmlFor="inv-role">Rolle</label>
          <select id="inv-role" value={role} onChange={(event) => setRole(event.target.value as RoleKey)} disabled={busy}>
            {ROLE_KEYS.map((value) => <option key={value} value={value}>{ROLE_LABEL[value]}</option>)}
          </select>
          <span className="field-hint">Die Rolle entscheidet, ob jemand freigeben, verwalten und ohne Freigabe veröffentlichen darf.</span>
        </div>

        {parents.length ? (
          <div className="field">
            <label htmlFor="inv-parent">Persönlicher Zweig hängt unter</label>
            <select id="inv-parent" value={parentBranchId} onChange={(event) => setParentBranchId(event.target.value)} disabled={busy}>
              <option value="">Unternehmenswurzel</option>
              {parents.map((branch) => <option key={branch.id} value={branch.id}>{branch.name} · {BRANCH_KIND_LABEL[branch.kind]}</option>)}
            </select>
            <span className="field-hint">Der Ort im Baum bestimmt, wessen Wissen die Person mitliest.</span>
          </div>
        ) : null}

        <div className="review-actions">
          <button className="btn btn-primary" type="submit" aria-busy={busy} disabled={busy || name.trim().length < 2 || !email.trim()}>
            <span className="btn-spin" aria-hidden="true" />
            {busy ? "Wird eingeladen…" : "Einladen"}
          </button>
        </div>
      </form>

      <h2 className="hit-group-title">Im Unternehmen</h2>
      <ul className="hit-list member-list">
        {members.map((member) => (
          <li className="hit" key={member.id}>
            <h3>{member.name}{member.isSelf ? " · Sie" : ""}</h3>
            <p className="hit-meta">
              {member.email} · {member.roleKey ? ROLE_LABEL[member.roleKey] : "ohne Rolle"} · {USER_STATUS_LABEL[member.status]}
            </p>
            {member.status === "INVITED" ? (
              <p className="hit-foot">Wartet auf den Einladungslink. Ohne ihn kann sich diese Person nicht anmelden.</p>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}
