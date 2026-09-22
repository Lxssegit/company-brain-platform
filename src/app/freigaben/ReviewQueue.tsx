"use client";

import { useState } from "react";
import type { KnowledgeScope, KnowledgeType } from "@prisma/client";
import { KNOWLEDGE_SCOPE_LABEL, KNOWLEDGE_TYPE_LABEL } from "@/lib/i18n/de";

export type PendingReview = {
  id: string;
  createdAt: string;
  branchName: string;
  requestedBy: string;
  isOwnSubmission: boolean;
  unit: { title: string; content: string; type: KnowledgeType; scope: KnowledgeScope; sources: string[] };
};

type Resolution = { id: string; kind: "approved" | "rejected" };

export function ReviewQueue({ initial }: { initial: PendingReview[] }) {
  const [queue, setQueue] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState<Resolution[]>([]);

  async function resolve(id: string, kind: Resolution["kind"]) {
    setBusy(id);
    setError("");
    let response: Response;
    try {
      response = await fetch(`/api/reviews/${id}/${kind === "approved" ? "approve" : "reject"}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(kind === "rejected" && comment.trim() ? { comment: comment.trim() } : {}),
      });
    } catch {
      /* A dropped request must not leave the row stuck in its busy state. */
      setBusy(null);
      setError("Die Verbindung ist abgebrochen. Nichts wurde entschieden — bitte erneut versuchen.");
      return;
    }
    setBusy(null);
    if (!response.ok) {
      const data = await response.json().catch(() => ({})) as { error?: string };
      setError(data.error ?? "Das hat nicht funktioniert. Bitte neu laden und erneut versuchen.");
      return;
    }
    setQueue((current) => current.filter((review) => review.id !== id));
    setDone((current) => [...current, { id, kind }]);
    setRejecting(null);
    setComment("");
  }

  if (!queue.length) {
    return (
      <section className="panel">
        <div className="state">
          <h3>{done.length ? "Die Warteschlange ist leer" : "Nichts wartet auf Freigabe"}</h3>
          <p>{done.length
            ? `In dieser Sitzung bearbeitet: ${done.filter((item) => item.kind === "approved").length} freigegeben, ${done.filter((item) => item.kind === "rejected").length} abgelehnt.`
            : "In den Zweigen, die Sie verantworten, liegt gerade nichts vor. Neue Einreichungen erscheinen hier, sobald jemand Wissen über den eigenen Zweig hinaus teilt."}</p>
        </div>
      </section>
    );
  }

  return (
    <>
      {error ? <p className="form-note form-note-error" role="alert" style={{ marginBottom: 16 }}>{error}</p> : null}
      <p className="review-count" role="status">
        {queue.length === 1 ? "Eine Einreichung wartet" : `${queue.length} Einreichungen warten`}
        {done.length ? ` · in dieser Sitzung bearbeitet: ${done.length}` : ""}
      </p>
      <ul className="review-list">
        {queue.map((review) => (
          <li key={review.id}>
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>{review.unit.title}</h2>
                  <p className="hit-meta">
                    {KNOWLEDGE_TYPE_LABEL[review.unit.type]} · Ziel: {review.branchName} · Sichtbarkeit {KNOWLEDGE_SCOPE_LABEL[review.unit.scope]}
                    {" · "}eingereicht von {review.requestedBy} am {new Date(review.createdAt).toLocaleDateString("de-DE")}
                  </p>
                </div>
              </div>

              <p className="hit-content">{review.unit.content}</p>
              <p className="hit-foot">{review.unit.sources.length ? `Quelle: ${review.unit.sources.join(", ")}` : "Ohne hinterlegte Quelle — das ist kein Ausschlussgrund, aber es sollte auffallen."}</p>

              {review.isOwnSubmission ? (
                /* The API refuses this outright; saying so here avoids sending a
                   request that can only fail. */
                <p className="form-note" role="status">Das haben Sie selbst eingereicht. Freigeben muss es jemand anderes.</p>
              ) : rejecting === review.id ? (
                <form className="form review-reject" onSubmit={(event) => { event.preventDefault(); void resolve(review.id, "rejected"); }}>
                  <div className="field">
                    <label htmlFor={`comment-${review.id}`}>Begründung <span className="optional">optional</span></label>
                    <input id={`comment-${review.id}`} value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} placeholder="Woran liegt es?" disabled={busy === review.id} />
                    <span className="field-hint">Die Begründung sieht, wer das Wissen eingereicht hat.</span>
                  </div>
                  <div className="review-actions">
                    <button className="btn btn-danger" type="submit" aria-busy={busy === review.id} disabled={busy === review.id}>
                      <span className="btn-spin" aria-hidden="true" />
                      {busy === review.id ? "Wird abgelehnt…" : "Ablehnen"}
                    </button>
                    <button className="btn btn-ghost" type="button" onClick={() => { setRejecting(null); setComment(""); }} disabled={busy === review.id}>Abbrechen</button>
                  </div>
                </form>
              ) : (
                <div className="review-actions">
                  <button className="btn btn-primary" type="button" onClick={() => resolve(review.id, "approved")} aria-busy={busy === review.id} disabled={busy !== null}>
                    <span className="btn-spin" aria-hidden="true" />
                    {busy === review.id ? "Wird freigegeben…" : "Freigeben"}
                  </button>
                  <button className="btn btn-quiet" type="button" onClick={() => { setRejecting(review.id); setComment(""); }} disabled={busy !== null}>Ablehnen</button>
                </div>
              )}
            </section>
          </li>
        ))}
      </ul>
    </>
  );
}
