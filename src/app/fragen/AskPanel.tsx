"use client";

import { useId, useState, type FormEvent } from "react";
import { KNOWLEDGE_SCOPE_LABEL, KNOWLEDGE_TYPE_LABEL, MATCH_METHOD_LABEL } from "@/lib/i18n/de";
import type { KnowledgeScope, KnowledgeType } from "@prisma/client";

type Source = { id: string; title: string; type: string; externalUrl: string | null; citation: string | null };
type Hit = { id: string; branchName: string; type: KnowledgeType; title: string; content: string; scope: KnowledgeScope; confidence: number | null; sources: Source[]; score: number; matchMethod: "lexical" | "vector" | "hybrid" };
type Decision = { id: string; title: string; description: string; reason: string; department: string | null; validFrom: string; validUntil: string | null; exceptions: unknown; branchNames: string[]; sources: Source[] };
type Conflict = { key: string; title: string; decisionIds: string[]; explanation: string };
type Diagnostics = { vectorSearch: "used" | "unavailable" | "not_configured"; candidateSource: "hybrid" | "lexical" | "recent" };

type SearchResult = { status: "ANSWERABLE" | "UNKNOWN" | "CONFLICT"; knowledge: Hit[]; decisions: Decision[]; conflicts: Conflict[]; diagnostics?: Diagnostics };
type ChatResult = { status: "ANSWERED" | "CONFLICT" | "UNKNOWN" | "AI_NOT_CONFIGURED"; answer: string; citations: Source[]; conflicts: Conflict[]; diagnostics?: Diagnostics };

type Mode = "search" | "ask";

const VECTOR_NOTE: Record<Diagnostics["vectorSearch"], string | null> = {
  used: null,
  not_configured: "Ohne AI-Schlüssel wird nur nach Wörtern gesucht, nicht nach Bedeutung.",
  unavailable: "Die Bedeutungssuche war nicht erreichbar. Dieses Ergebnis beruht nur auf Worttreffern.",
};

export function AskPanel({ branches, branchesUnreachable }: { branches: Array<{ id: string; name: string; kind: string }>; branchesUnreachable: boolean }) {
  const queryId = useId();
  const branchId = useId();
  const [query, setQuery] = useState("");
  const [branch, setBranch] = useState("");
  const [mode, setMode] = useState<Mode>("search");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [asked, setAsked] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [answer, setAnswer] = useState<ChatResult | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    setPending(true);
    setError("");
    setResult(null);
    setAnswer(null);
    setAsked(trimmed);

    try {
      /* Retrieval runs for both modes. In ask mode the same authorized context
         is what the model is given, so showing it is not a second query — it is
         the evidence behind the answer. */
      const params = new URLSearchParams({ q: trimmed, limit: "8" });
      if (branch) params.set("branchId", branch);
      const searchResponse = await fetch(`/api/search?${params}`);
      if (!searchResponse.ok) throw new Error(searchResponse.status === 429 ? "Zu viele Anfragen. Bitte kurz warten." : "Die Suche ist fehlgeschlagen.");
      setResult(await searchResponse.json() as SearchResult);

      if (mode === "ask") {
        const chatResponse = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: trimmed, ...(branch ? { branchId: branch } : {}) }) });
        const chat = await chatResponse.json().catch(() => null) as ChatResult | null;
        if (!chat) throw new Error("Die Antwort war nicht lesbar.");
        setAnswer(chat);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Etwas ist schiefgelaufen.");
    } finally {
      setPending(false);
    }
  }

  const vectorNote = result?.diagnostics ? VECTOR_NOTE[result.diagnostics.vectorSearch] : null;
  const nothingFound = result && result.knowledge.length === 0 && result.decisions.length === 0;

  return (
    <>
      <section className="panel ask-form-panel">
        <form className="form" onSubmit={submit}>
          <div className="field">
            <label htmlFor={queryId}>Ihre Frage</label>
            <input id={queryId} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Wie läuft ein Garantiefall?" autoComplete="off" minLength={2} required disabled={pending} />
          </div>

          <div className="ask-controls">
            <fieldset className="segmented">
              <legend className="visually-hidden">Art der Anfrage</legend>
              <label><input type="radio" name="mode" value="search" checked={mode === "search"} onChange={() => setMode("search")} disabled={pending} /><span>Wissen finden</span></label>
              <label><input type="radio" name="mode" value="ask" checked={mode === "ask"} onChange={() => setMode("ask")} disabled={pending} /><span>Antwort formulieren lassen</span></label>
            </fieldset>

            {branches.length ? (
              <div className="field ask-branch">
                <label htmlFor={branchId}>Zweig</label>
                <select id={branchId} value={branch} onChange={(event) => setBranch(event.target.value)} disabled={pending}>
                  <option value="">Alle, die ich lesen darf</option>
                  {branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
            ) : null}

            <button className="btn btn-primary" type="submit" aria-busy={pending} disabled={pending || query.trim().length < 2}>
              <span className="btn-spin" aria-hidden="true" />
              {pending ? "Wird gesucht…" : mode === "ask" ? "Fragen" : "Finden"}
            </button>
          </div>

          {branchesUnreachable ? <p className="form-note" role="status">Die Zweigliste ist gerade nicht erreichbar, deshalb fehlt der Filter. Die Suche selbst bleibt auf Ihren berechtigten Kontext beschränkt.</p> : null}
          {error ? <p className="form-note form-note-error" role="alert">{error}</p> : null}
        </form>
      </section>

      {answer ? (
        <section className="panel" aria-live="polite">
          <div className="panel-head">
            <div><h2>Antwort</h2><p>auf „{asked}“</p></div>
            <span className={`pill ${answer.status === "ANSWERED" ? "pill-on" : "pill-off"}`}>
              {answer.status === "ANSWERED" ? "Belegt" : answer.status === "CONFLICT" ? "Widerspruch" : answer.status === "UNKNOWN" ? "Keine Grundlage" : "AI nicht konfiguriert"}
            </span>
          </div>
          <p className="ask-answer">{answer.answer}</p>
          {answer.citations.length ? (
            <p className="ask-citations">Belegt durch: {answer.citations.map((source) => source.citation ? `${source.title} — ${source.citation}` : source.title).join(" · ")}</p>
          ) : null}
        </section>
      ) : null}

      {result?.conflicts.length ? (
        <section className="panel panel-warn" aria-live="polite">
          <div className="panel-head"><div><h2>Widersprüchliche Entscheidungen</h2><p>Company Brain wählt hier bewusst keine Seite aus.</p></div></div>
          <ul className="plain-list">
            {result.conflicts.map((conflict) => <li key={conflict.key}>{conflict.explanation}</li>)}
          </ul>
        </section>
      ) : null}

      {result && !nothingFound ? (
        <section className="panel">
          <div className="panel-head">
            <div><h2>{result.knowledge.length} {result.knowledge.length === 1 ? "Fundstelle" : "Fundstellen"}</h2><p>Das ist der Kontext, auf dem eine Antwort beruhen darf — nicht mehr.</p></div>
          </div>
          {vectorNote ? <p className="form-note" role="status">{vectorNote}</p> : null}
          <ul className="hit-list">
            {result.knowledge.map((hit) => (
              <li key={hit.id} className="hit">
                <h3>{hit.title}</h3>
                <p className="hit-meta">{KNOWLEDGE_TYPE_LABEL[hit.type]} · {hit.branchName} · {KNOWLEDGE_SCOPE_LABEL[hit.scope]}</p>
                <p className="hit-content">{hit.content}</p>
                <p className="hit-foot">
                  <span title={MATCH_METHOD_LABEL[hit.matchMethod]}>{MATCH_METHOD_LABEL[hit.matchMethod]}</span>
                  {hit.confidence !== null ? <> · Konfidenz {Math.round(hit.confidence * 100)} %</> : null}
                  {hit.sources.length ? <> · Quelle: {hit.sources.map((source) => source.title).join(", ")}</> : <> · ohne hinterlegte Quelle</>}
                </p>
              </li>
            ))}
          </ul>

          {result.decisions.length ? (
            <>
              <h3 className="hit-group-title">Geltende Entscheidungen</h3>
              <ul className="hit-list">
                {result.decisions.map((decision) => (
                  <li key={decision.id} className="hit">
                    <h3>{decision.title}</h3>
                    <p className="hit-meta">{decision.department ?? "unternehmensweit"} · gültig ab {new Date(decision.validFrom).toLocaleDateString("de-DE")}</p>
                    <p className="hit-content">{decision.description}</p>
                    <p className="hit-foot">Begründung: {decision.reason}</p>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
      ) : null}

      {nothingFound ? (
        <section className="panel" aria-live="polite">
          <div className="state">
            <h3>Dazu gibt es kein geprüftes Wissen</h3>
            <p>Für „{asked}“ findet sich in Ihrem berechtigten Kontext nichts Belastbares. Das kann zwei Dinge heißen: Es wurde nie erfasst — oder es liegt in einem Zweig, der Ihnen nicht freigegeben ist.</p>
            <p>Company Brain rät an dieser Stelle bewusst nicht.</p>
          </div>
        </section>
      ) : null}
    </>
  );
}
