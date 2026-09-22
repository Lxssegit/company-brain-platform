"use client";

import { useId, useMemo, useState } from "react";
import type { DecisionState } from "@/lib/decisions/status";

export type TargetBranch = { id: string; name: string };
export type DecisionCard = {
  id: string;
  title: string;
  description: string;
  reason: string;
  state: DecisionState;
  validFrom: string;
  validUntil: string | null;
  branches: string[];
  exceptions: string[];
  sources: string[];
  author: string;
  replacedBy: { id: string; title: string } | null;
  replaces: { id: string; title: string } | null;
};

const day = (iso: string) => new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
const today = () => new Date().toISOString().slice(0, 10);

function window_(decision: DecisionCard) {
  /* "Ohne Enddatum" under the heading "Nicht mehr gültig" is a contradiction:
     being replaced ends a rule as surely as a date does, it is just that
     nobody typed the date. */
  if (decision.state === "SUPERSEDED") {
    return decision.validUntil
      ? `Galt vom ${day(decision.validFrom)} bis ${day(decision.validUntil)}`
      : `Galt ab ${day(decision.validFrom)}, bis sie abgelöst wurde`;
  }
  if (decision.state === "EXPIRED") return `Galt vom ${day(decision.validFrom)} bis ${day(decision.validUntil!)}`;
  if (!decision.validUntil) return `Gilt seit ${day(decision.validFrom)}, ohne Enddatum`;
  return `${day(decision.validFrom)} bis ${day(decision.validUntil)}`;
}

export function DecisionBoard({ initial, branches, mayManage }: { initial: DecisionCard[]; branches: TargetBranch[]; mayManage: boolean }) {
  const [decisions, setDecisions] = useState(initial);
  const [writing, setWriting] = useState<"new" | string | null>(null);
  const [error, setError] = useState("");

  /* Three groups, and the order is the point. An expired rule that nothing
     replaced is the dangerous one: people go on following it because nothing
     ever told them it ended. It goes first. */
  const groups = useMemo(() => {
    const lapsed = decisions.filter((d) => d.state === "EXPIRED" && !d.replacedBy);
    const inForce = decisions.filter((d) => d.state === "ACTIVE" || d.state === "DRAFT");
    const past = decisions.filter((d) => !lapsed.includes(d) && !inForce.includes(d));
    return { lapsed, inForce, past };
  }, [decisions]);

  async function reload() {
    const response = await fetch("/api/decisions");
    if (!response.ok) return;
    const data = await response.json() as { decisions: Array<Record<string, unknown>> };
    setDecisions(data.decisions.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      description: String(row.description),
      reason: String(row.reason),
      state: row.effectiveStatus as DecisionState,
      validFrom: String(row.validFrom),
      validUntil: row.validUntil ? String(row.validUntil) : null,
      branches: (row.affectedBranches as Array<{ branch: { name: string } }> ?? []).map((link) => link.branch.name),
      exceptions: Array.isArray(row.exceptions) ? (row.exceptions as unknown[]).map(String) : [],
      sources: (row.sources as Array<{ source: { title: string } }> ?? []).map((link) => link.source.title),
      author: (row.createdBy as { name?: string } | null)?.name ?? "unbekannt",
      replacedBy: (row.supersededBy as Array<{ id: string; title: string }> ?? [])[0] ?? null,
      replaces: (row.supersedes as { id: string; title: string } | null) ?? null,
    })));
  }

  return (
    <>
      {error ? <p className="form-note form-note-error" role="alert" style={{ marginBottom: 16 }}>{error}</p> : null}

      {mayManage ? (
        writing === "new" ? (
          <DecisionForm
            branches={branches}
            heading="Eine Entscheidung festhalten"
            submitLabel="Entscheidung festhalten"
            endpoint="/api/decisions"
            onCancel={() => setWriting(null)}
            onDone={async () => { setWriting(null); setError(""); await reload(); }}
            onError={setError}
          />
        ) : (
          <div className="review-actions" style={{ marginBottom: 22 }}>
            <button className="btn btn-primary" type="button" onClick={() => { setWriting("new"); setError(""); }}>Eine Entscheidung festhalten</button>
          </div>
        )
      ) : null}

      {groups.lapsed.length ? (
        <>
          <h2 className="hit-group-title decision-warn-title">Abgelaufen, ohne dass etwas nachgekommen ist</h2>
          <p className="decision-warn-note">
            {groups.lapsed.length === 1 ? "Diese Regel ist" : "Diese Regeln sind"} formal ausgelaufen, und es steht nichts an {groups.lapsed.length === 1 ? "ihrer" : "ihrer"} Stelle.
            Wahrscheinlich hält sich jemand noch daran. Lösen Sie sie ab oder setzen Sie sie neu in Kraft.
          </p>
          {groups.lapsed.map((decision) => (
            <Entry key={decision.id} decision={decision} branches={branches} mayManage={mayManage} writing={writing} setWriting={setWriting} setError={setError} reload={reload} />
          ))}
        </>
      ) : null}

      <h2 className="hit-group-title">In Kraft</h2>
      {groups.inForce.length ? groups.inForce.map((decision) => (
        <Entry key={decision.id} decision={decision} branches={branches} mayManage={mayManage} writing={writing} setWriting={setWriting} setError={setError} reload={reload} />
      )) : (
        <section className="panel">
          <div className="state">
            <h3>Es gilt noch nichts Festgehaltenes</h3>
            <p>Jede Organisation hat Regeln; die meisten stehen nirgends. Die erste, die hier landet, ist meistens die, über die am häufigsten gestritten wird.</p>
          </div>
        </section>
      )}

      {groups.past.length ? (
        <>
          <h2 className="hit-group-title">Nicht mehr gültig</h2>
          {groups.past.map((decision) => (
            <Entry key={decision.id} decision={decision} branches={branches} mayManage={mayManage} writing={writing} setWriting={setWriting} setError={setError} reload={reload} />
          ))}
        </>
      ) : null}
    </>
  );
}

function Entry({ decision, branches, mayManage, writing, setWriting, setError, reload }: {
  decision: DecisionCard; branches: TargetBranch[]; mayManage: boolean;
  writing: "new" | string | null; setWriting: (value: "new" | string | null) => void;
  setError: (value: string) => void; reload: () => Promise<void>;
}) {
  const lapsed = decision.state === "EXPIRED" && !decision.replacedBy;
  return (
    <section className={`panel decision${lapsed ? " panel-warn" : ""}`}>
      <h2>{decision.title}</h2>
      <p className="hit-meta">
        {window_(decision)} · {decision.branches.length ? decision.branches.join(", ") : "ohne Zweig"} · festgehalten von {decision.author}
      </p>

      <p className="hit-content">{decision.description}</p>
      <p className="decision-reason"><span>Warum:</span> {decision.reason}</p>

      {decision.exceptions.length ? (
        <>
          <p className="decision-label">Ausnahmen</p>
          <ul className="plain-list">{decision.exceptions.map((item, index) => <li key={index}>{item}</li>)}</ul>
        </>
      ) : null}

      <p className="hit-foot">
        {decision.sources.length ? `Quelle: ${decision.sources.join(", ")}` : "Ohne hinterlegte Quelle."}
        {decision.replaces ? ` · Löst „${decision.replaces.title}“ ab.` : ""}
        {decision.replacedBy ? ` · Abgelöst durch „${decision.replacedBy.title}“.` : ""}
      </p>

      {mayManage && decision.state === "ACTIVE" ? (
        writing === decision.id ? (
          <DecisionForm
            branches={branches}
            nested
            heading={`„${decision.title}“ ablösen`}
            note="Die alte Regel steht hier schon: ändern Sie, was anders wird. Sie bleibt als Historie erhalten und wird mit der neuen verknüpft. Was hier steht, gilt ab dem gewählten Datum — die Quelle tragen Sie neu ein, weil sie sich mit der Regel ändert."
            seed={{ title: decision.title, description: decision.description, reason: decision.reason, exceptions: decision.exceptions, branchNames: decision.branches }}
            submitLabel="Ablösen"
            endpoint={`/api/decisions/${decision.id}/supersede`}
            onCancel={() => setWriting(null)}
            onDone={async () => { setWriting(null); setError(""); await reload(); }}
            onError={setError}
          />
        ) : (
          <div className="review-actions">
            <button className="btn btn-quiet" type="button" onClick={() => { setWriting(decision.id); setError(""); }}>Ablösen</button>
          </div>
        )
      ) : null}
    </section>
  );
}

export type FormSeed = { title: string; description: string; reason: string; exceptions: string[]; branchNames: string[] };

function DecisionForm({ branches, heading, note, submitLabel, endpoint, nested, seed, onCancel, onDone, onError }: {
  branches: TargetBranch[]; heading: string; note?: string; submitLabel: string; endpoint: string; nested?: boolean; seed?: FormSeed;
  onCancel: () => void; onDone: () => Promise<void>; onError: (value: string) => void;
}) {
  const [title, setTitle] = useState(seed?.title ?? "");
  const [description, setDescription] = useState(seed?.description ?? "");
  const [reason, setReason] = useState(seed?.reason ?? "");
  const [validFrom, setValidFrom] = useState(today());
  const [validUntil, setValidUntil] = useState("");
  /* Branches are matched by name because the card carries names, not ids. */
  const [picked, setPicked] = useState<string[]>(
    seed ? branches.filter((branch) => seed.branchNames.includes(branch.name)).map((branch) => branch.id) : [],
  );
  const [exceptions, setExceptions] = useState(seed?.exceptions.join("\n") ?? "");
  const [sourceTitle, setSourceTitle] = useState("");
  const [busy, setBusy] = useState(false);
  /* Field ids come from useId, not from the endpoint: a form that posts to
     /api/decisions/<uuid>/supersede would otherwise put slashes in every id. */
  const uid = useId();

  const badWindow = Boolean(validUntil) && validUntil <= validFrom;
  const incomplete = title.trim().length < 3 || description.trim().length < 10 || reason.trim().length < 3 || !picked.length || badWindow;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    onError("");
    const lines = exceptions.split("\n").map((line) => line.trim()).filter(Boolean);
    const payload: Record<string, unknown> = {
      title: title.trim(), description: description.trim(), reason: reason.trim(),
      branchIds: picked, validFrom: new Date(`${validFrom}T00:00:00`).toISOString(),
    };
    if (validUntil) payload.validUntil = new Date(`${validUntil}T23:59:59`).toISOString();
    if (lines.length) payload.exceptions = lines;
    if (sourceTitle.trim()) payload.source = { type: "DECISION", title: sourceTitle.trim() };

    let response: Response;
    try {
      response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    } catch {
      setBusy(false);
      onError("Die Verbindung ist abgebrochen. Nichts wurde festgehalten — bitte erneut versuchen.");
      return;
    }
    setBusy(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({})) as { error?: string };
      onError(data.error ?? "Das hat nicht funktioniert. Bitte prüfen Sie die Eingaben.");
      return;
    }
    await onDone();
  }

  return (
    <form className={nested ? "form decision-form" : "form panel decision-form"} onSubmit={submit}>
      <h2>{heading}</h2>
      {note ? <p className="form-note" role="status">{note}</p> : null}

      <div className="field">
        <label htmlFor={`${uid}-title`}>Welche Regel gilt?</label>
        <input id={`${uid}-title`} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={240} placeholder="Ein Satz, der die Regel benennt" disabled={busy} required />
      </div>

      <div className="field">
        <label htmlFor={`${uid}-desc`}>Was genau ist entschieden?</label>
        <textarea id={`${uid}-desc`} value={description} onChange={(event) => setDescription(event.target.value)} rows={5} maxLength={12000} disabled={busy} required />
      </div>

      <div className="field">
        <label htmlFor={`${uid}-reason`}>Warum so?</label>
        <textarea id={`${uid}-reason`} value={reason} onChange={(event) => setReason(event.target.value)} rows={3} maxLength={5000} disabled={busy} required />
        <span className="field-hint">Der Grund ist der Teil, der in zwei Jahren entscheidet, ob man die Regel ändern darf.</span>
      </div>

      <fieldset className="capture-reach">
        <legend>Von wann bis wann?</legend>
        <div className="date-pair">
          <div className="field">
            <label htmlFor={`${uid}-from`}>Gilt ab</label>
            <input id={`${uid}-from`} type="date" value={validFrom} onChange={(event) => setValidFrom(event.target.value)} disabled={busy} required />
          </div>
          <div className="field">
            <label htmlFor={`${uid}-until`}>Gilt bis <span className="optional">optional</span></label>
            <input id={`${uid}-until`} type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} aria-invalid={badWindow || undefined} disabled={busy} />
          </div>
        </div>
        <p className="capture-consequence" role="status">
          {badWindow
            ? "Das Ende liegt vor dem Anfang. So kann die Regel nie gelten."
            : validUntil
              ? "Nach diesem Tag steht die Regel oben unter „Abgelaufen“, bis jemand sie ablöst oder neu setzt."
              : "Ohne Enddatum gilt sie, bis jemand sie ausdrücklich ablöst."}
        </p>
      </fieldset>

      <fieldset className="capture-reach">
        <legend>Für welche Zweige?</legend>
        <div className="check-list">
          {branches.map((branch) => (
            <label key={branch.id}>
              <input type="checkbox" checked={picked.includes(branch.id)} disabled={busy}
                onChange={(event) => setPicked((current) => event.target.checked ? [...current, branch.id] : current.filter((id) => id !== branch.id))} />
              <span>{branch.name}</span>
            </label>
          ))}
        </div>
        {branches.length ? null : <p className="capture-consequence">Sie verwalten keinen Zweig, für den Sie entscheiden könnten.</p>}
      </fieldset>

      <div className="field">
        <label htmlFor={`${uid}-exc`}>Ausnahmen <span className="optional">optional</span></label>
        <textarea id={`${uid}-exc`} value={exceptions} onChange={(event) => setExceptions(event.target.value)} rows={3} placeholder="Eine Ausnahme pro Zeile" disabled={busy} />
        <span className="field-hint">Eine Regel ohne benannte Ausnahmen wird bei der ersten Ausnahme gebrochen statt ergänzt.</span>
      </div>

      <div className="field">
        <label htmlFor={`${uid}-src`}>Wo steht das? <span className="optional">optional</span></label>
        <input id={`${uid}-src`} value={sourceTitle} onChange={(event) => setSourceTitle(event.target.value)} maxLength={180} placeholder="Protokoll, Beschluss, Vertrag …" disabled={busy} />
      </div>

      <div className="review-actions">
        <button className="btn btn-primary" type="submit" aria-busy={busy} disabled={busy || incomplete}>
          <span className="btn-spin" aria-hidden="true" />
          {busy ? "Wird festgehalten…" : submitLabel}
        </button>
        <button className="btn btn-ghost" type="button" onClick={onCancel} disabled={busy}>Abbrechen</button>
      </div>
    </form>
  );
}
