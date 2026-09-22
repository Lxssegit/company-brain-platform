"use client";

import { useState } from "react";
import type { KnowledgeScope, KnowledgeStatus, KnowledgeType } from "@prisma/client";
import { KNOWLEDGE_SCOPE_LABEL, KNOWLEDGE_STATUS_LABEL, KNOWLEDGE_TYPE_LABEL } from "@/lib/i18n/de";

export type Unit = {
  id: string;
  title: string;
  content: string;
  type: KnowledgeType;
  scope: KnowledgeScope;
  status: KnowledgeStatus;
  author: string;
  sources: string[];
  updatedAt: string;
  mayEdit: boolean;
  mayArchive: boolean;
  editReturnsToReview: boolean;
};

export function BranchKnowledge({ initial, branchName }: { initial: Unit[]; branchName: string }) {
  const [units, setUnits] = useState(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  async function archive(id: string) {
    setBusy(id);
    setError("");
    let response: Response;
    try {
      response = await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
    } catch {
      setBusy(null);
      setError("Die Verbindung ist abgebrochen. Nichts wurde archiviert.");
      return;
    }
    setBusy(null);
    if (!response.ok) {
      const data = await response.json().catch(() => ({})) as { error?: string };
      setError(data.error ?? "Das hat nicht funktioniert.");
      return;
    }
    setUnits((current) => current.filter((unit) => unit.id !== id));
    setConfirming(null);
    setNote("Archiviert. Der Eintrag ist aus dem Zweig verschwunden, die Historie bleibt erhalten.");
  }

  if (!units.length) {
    return (
      <div className="state">
        <h3>In {branchName} liegt noch nichts</h3>
        <p>Was hier landet, sieht jeder Zweig darunter mit. Bis dahin ist dieser Ast leer.</p>
      </div>
    );
  }

  return (
    <>
      {error ? <p className="form-note form-note-error" role="alert" style={{ marginBottom: 14 }}>{error}</p> : null}
      {note ? <p className="form-note form-note-ok" role="status" style={{ marginBottom: 14 }}>{note}</p> : null}

      <ul className="hit-list">
        {units.map((unit) => (
          <li className="hit" key={unit.id}>
            <h3>{unit.title}</h3>
            <p className="hit-meta">
              {KNOWLEDGE_TYPE_LABEL[unit.type]} · Sichtbarkeit {KNOWLEDGE_SCOPE_LABEL[unit.scope]} · {KNOWLEDGE_STATUS_LABEL[unit.status]} · von {unit.author}
            </p>

            {editing === unit.id ? (
              <EditForm
                unit={unit}
                busy={busy === unit.id}
                onCancel={() => setEditing(null)}
                onSave={async (title, content) => {
                  setBusy(unit.id);
                  setError("");
                  let response: Response;
                  try {
                    response = await fetch(`/api/knowledge/${unit.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, content }) });
                  } catch {
                    setBusy(null);
                    setError("Die Verbindung ist abgebrochen. Die Änderung wurde nicht gespeichert.");
                    return;
                  }
                  setBusy(null);
                  if (!response.ok) {
                    const data = await response.json().catch(() => ({})) as { error?: string };
                    setError(data.error ?? "Das hat nicht funktioniert.");
                    return;
                  }
                  const data = await response.json() as { knowledge: { title: string; content: string; status: KnowledgeStatus }; returnedToReview: boolean };
                  setUnits((current) => current.map((item) => item.id === unit.id
                    ? { ...item, title: data.knowledge.title, content: data.knowledge.content, status: data.knowledge.status, editReturnsToReview: false }
                    : item));
                  setEditing(null);
                  setNote(data.returnedToReview
                    ? "Geändert — und zurück in der Warteschlange. Bis jemand zustimmt, sehen den neuen Text nur Sie und die Verantwortlichen."
                    : "Geändert.");
                }}
              />
            ) : (
              <>
                <p className="hit-content">{unit.content}</p>
                <p className="hit-foot">
                  {unit.sources.length ? `Quelle: ${unit.sources.join(", ")}` : "Ohne hinterlegte Quelle."}
                  {" · "}zuletzt geändert am {new Date(unit.updatedAt).toLocaleDateString("de-DE")}
                </p>

                {confirming === unit.id ? (
                  <div className="form-note" role="alert">
                    <span>
                      Archivieren nimmt „{unit.title}“ aus dem Zweig. Gelesen werden kann es danach nicht mehr, gelöscht wird es nicht.
                    </span>
                  </div>
                ) : null}

                {unit.mayEdit || unit.mayArchive ? (
                  <div className="review-actions">
                    {unit.mayEdit ? (
                      <button className="btn btn-quiet" type="button" onClick={() => { setEditing(unit.id); setConfirming(null); setError(""); setNote(""); }} disabled={busy !== null}>Ändern</button>
                    ) : null}
                    {unit.mayArchive ? (
                      confirming === unit.id ? (
                        <>
                          <button className="btn btn-danger" type="button" onClick={() => archive(unit.id)} aria-busy={busy === unit.id} disabled={busy !== null}>
                            <span className="btn-spin" aria-hidden="true" />
                            {busy === unit.id ? "Wird archiviert…" : "Ja, archivieren"}
                          </button>
                          <button className="btn btn-ghost" type="button" onClick={() => setConfirming(null)} disabled={busy !== null}>Doch nicht</button>
                        </>
                      ) : (
                        <button className="btn btn-ghost" type="button" onClick={() => { setConfirming(unit.id); setError(""); setNote(""); }} disabled={busy !== null}>Archivieren</button>
                      )
                    ) : null}
                  </div>
                ) : null}
              </>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

function EditForm({ unit, busy, onCancel, onSave }: { unit: Unit; busy: boolean; onCancel: () => void; onSave: (title: string, content: string) => Promise<void> }) {
  const [title, setTitle] = useState(unit.title);
  const [content, setContent] = useState(unit.content);
  const untouched = title.trim() === unit.title && content.trim() === unit.content;

  return (
    <form className="form edit-form" onSubmit={(event) => { event.preventDefault(); void onSave(title.trim(), content.trim()); }}>
      {/* Stated before the change, not after: an edit here costs the approval. */}
      {unit.editReturnsToReview ? (
        <p className="form-note" role="status">
          Dieser Eintrag ist freigegeben. Ändern Sie ihn, geht er zurück in die Warteschlange — die Freigabe galt für den Text, der jetzt dort steht.
        </p>
      ) : null}

      <div className="field">
        <label htmlFor={`edit-title-${unit.id}`}>Titel</label>
        <input id={`edit-title-${unit.id}`} value={title} onChange={(event) => setTitle(event.target.value)} minLength={3} maxLength={180} disabled={busy} required />
      </div>

      <div className="field">
        <label htmlFor={`edit-content-${unit.id}`}>Inhalt</label>
        <textarea id={`edit-content-${unit.id}`} value={content} onChange={(event) => setContent(event.target.value)} rows={6} minLength={10} maxLength={12000} disabled={busy} required />
      </div>

      <div className="review-actions">
        <button className="btn btn-primary" type="submit" aria-busy={busy} disabled={busy || untouched || title.trim().length < 3 || content.trim().length < 10}>
          <span className="btn-spin" aria-hidden="true" />
          {busy ? "Wird gespeichert…" : untouched ? "Nichts geändert" : "Änderung speichern"}
        </button>
        <button className="btn btn-ghost" type="button" onClick={onCancel} disabled={busy}>Abbrechen</button>
      </div>
    </form>
  );
}
