"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { BranchKind, KnowledgeType } from "@prisma/client";
import { KNOWLEDGE_TYPE_VALUES } from "@/lib/domain/enums";
import { reachConsequence, scopeForBranchKind } from "@/lib/knowledge/reach";
import { BRANCH_KIND_LABEL, KNOWLEDGE_TYPE_LABEL } from "@/lib/i18n/de";

export type TargetBranch = { id: string; name: string; kind: BranchKind };

type Saved = { title: string; status: "APPROVED" | "PENDING_REVIEW"; where: string };

const TITLE_MAX = 180;
const CONTENT_MAX = 12000;

export function CaptureForm({ branches, selfApproves }: { branches: TargetBranch[]; selfApproves: boolean }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<KnowledgeType>("FACT");
  const [shared, setShared] = useState(false);
  const [branchId, setBranchId] = useState("");
  const [sourceTitle, setSourceTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<Saved | null>(null);

  const branch = branches.find((candidate) => candidate.id === branchId) ?? null;
  const noTargets = shared && branches.length === 0;

  /* The product's whole promise is in this sentence, so it is stated before the
     decision rather than after it. */
  const consequence = useMemo(
    () => reachConsequence(shared ? { shared: true, branch, hasTargets: branches.length > 0, selfApproves } : { shared: false }),
    [shared, branch, branches.length, selfApproves],
  );

  const incomplete = title.trim().length < 3 || content.trim().length < 10 || (shared && !branchId);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    /* Scope follows the branch so the two can never describe different reaches.
       Personal entries carry no branch: the API places them in the personal
       branch itself, and naming any other one is refused. */
    const payload: Record<string, unknown> = { type, title: title.trim(), content: content.trim(), scope: shared && branch ? scopeForBranchKind(branch.kind) : "PERSONAL" };
    if (shared) payload.branchId = branchId;
    if (sourceTitle.trim()) payload.source = { type: "EMPLOYEE_INPUT", title: sourceTitle.trim() };

    let response: Response;
    try {
      response = await fetch("/api/knowledge", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    } catch {
      setBusy(false);
      setError("Die Verbindung ist abgebrochen. Nichts wurde gespeichert — bitte erneut versuchen.");
      return;
    }
    setBusy(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({})) as { error?: string };
      setError(data.error ?? "Das hat nicht funktioniert. Bitte prüfen Sie die Eingaben und versuchen Sie es erneut.");
      return;
    }
    const data = await response.json() as { knowledge: { title: string; status: Saved["status"] } };
    setSaved({ title: data.knowledge.title, status: data.knowledge.status, where: shared && branch ? `„${branch.name}“` : "Ihrem persönlichen Zweig" });
    setTitle("");
    setContent("");
    setSourceTitle("");
  }

  if (saved) {
    return (
      <section className="panel">
        <div className="state">
          <h3>{saved.status === "APPROVED" ? "Steht drin." : "Eingereicht."}</h3>
          <p>
            „{saved.title}“ liegt jetzt in {saved.where}{" — "}
            {saved.status === "APPROVED"
              ? "ab sofort auffindbar für alle, die diesen Zweig lesen dürfen."
              : "sobald jemand aus diesem Zweig zustimmt, wird es für die anderen auffindbar."}
          </p>
          <div className="review-actions">
            <button className="btn btn-primary" type="button" onClick={() => setSaved(null)}>Noch etwas festhalten</button>
            <Link className="btn btn-quiet" href="/fragen">Danach suchen</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <form className="form panel capture" onSubmit={submit}>
      {error ? <p className="form-note form-note-error" role="alert">{error}</p> : null}

      <div className="field">
        <label htmlFor="cap-title">Worum geht es?</label>
        <input id="cap-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={TITLE_MAX} placeholder="Ein Satz, der die Sache benennt" disabled={busy} required />
        <span className="field-hint">Ein Titel, unter dem jemand es später sucht — nicht „Meeting-Notiz“, sondern die Sache selbst.</span>
      </div>

      <div className="field">
        <label htmlFor="cap-content">Was genau gilt, und wann gilt es?</label>
        <textarea id="cap-content" value={content} onChange={(event) => setContent(event.target.value)} maxLength={CONTENT_MAX} rows={7} placeholder="Die Sache, der Zusammenhang, und woran man merkt, dass sie zutrifft." disabled={busy} required />
        <span className="field-hint">{content.length ? `${content.length} von ${CONTENT_MAX} Zeichen` : "Der Zusammenhang ist der Teil, den man in zwei Jahren nicht mehr rekonstruieren kann."}</span>
      </div>

      <div className="field">
        <label htmlFor="cap-type">Was für ein Wissen ist das?</label>
        <select id="cap-type" value={type} onChange={(event) => setType(event.target.value as KnowledgeType)} disabled={busy}>
          {KNOWLEDGE_TYPE_VALUES.map((value) => <option key={value} value={value}>{KNOWLEDGE_TYPE_LABEL[value]}</option>)}
        </select>
      </div>

      <fieldset className="capture-reach">
        <legend>Wer soll es sehen?</legend>
        <div className="segmented">
          <label>
            <input type="radio" name="reach" value="mine" checked={!shared} onChange={() => setShared(false)} disabled={busy} />
            <span>Nur für mich</span>
          </label>
          <label>
            <input type="radio" name="reach" value="shared" checked={shared} onChange={() => setShared(true)} disabled={busy} />
            <span>Mit anderen teilen</span>
          </label>
        </div>

        {shared && branches.length ? (
          <div className="field">
            <label htmlFor="cap-branch">In welchen Zweig?</label>
            <select id="cap-branch" value={branchId} onChange={(event) => setBranchId(event.target.value)} disabled={busy} required>
              <option value="">Bitte wählen</option>
              {branches.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>{candidate.name} · {BRANCH_KIND_LABEL[candidate.kind]}</option>
              ))}
            </select>
          </div>
        ) : null}

        <p className="capture-consequence" role="status">{consequence}</p>
      </fieldset>

      <div className="field">
        <label htmlFor="cap-source">Woher stammt es? <span className="optional">optional</span></label>
        <input id="cap-source" value={sourceTitle} onChange={(event) => setSourceTitle(event.target.value)} maxLength={180} placeholder="Vertrag, Protokoll, Gespräch …" disabled={busy} />
        <span className="field-hint">Eine Quelle macht aus einer Behauptung etwas Nachprüfbares. Ohne geht es auch.</span>
      </div>

      <div className="review-actions">
        <button className="btn btn-primary" type="submit" aria-busy={busy} disabled={busy || incomplete || noTargets}>
          <span className="btn-spin" aria-hidden="true" />
          {busy ? "Wird gespeichert…" : shared && !selfApproves ? "Zur Freigabe einreichen" : "Festhalten"}
        </button>
      </div>
    </form>
  );
}
