import Link from "next/link";
import { ArrowUpRight, BrandMark } from "@/components/icons";

/**
 * The public page reads as a register, not an advertisement: a document the
 * company keeps about itself. Structure is drawn with hairlines, every entry
 * carries its number, and the one accent marks rather than decorates.
 *
 * It ships no client JavaScript. Everything that moves is a CSS load
 * animation, so the page is interactive the moment it paints and the
 * nonce-bound Content-Security-Policy has nothing to allow.
 */

type Layer = { n: string; label: string; copy: string };

const layers: Layer[] = [
  { n: "01", label: "Strategie", copy: "Der unternehmensweite Kontext, der jede Entscheidung auf denselben Horizont ausrichtet." },
  { n: "02", label: "Menschen", copy: "Rollen, Fachwissen und der lebendige Kontext hinter den Menschen, die das Unternehmen tragen." },
  { n: "03", label: "Produkt & Technik", copy: "Das gemeinsame Gedächtnis dafür, was gebaut wird, warum es zählt und wie es funktioniert." },
  { n: "04", label: "Kunden", copy: "Aus Kundenbedürfnissen und Marktsignalen wird nutzbarer Kontext statt verstreuter Notizen." },
  { n: "05", label: "Entscheidungen", copy: "Das Warum hinter wichtigen Entscheidungen bleibt sichtbar, verknüpft und nachlesbar." },
  { n: "06", label: "Wissen", copy: "Geprüftes Wissen wächst zu einer berechtigungsbewussten Quelle der Wahrheit für das ganze Team." },
  { n: "07", label: "Betrieb", copy: "Die kleinen Signale, Rituale und Abläufe, die eine Organisation lebendig machen." },
];

const principles = [
  { k: "Berechtigung zuerst", v: "Gefiltert wird vor dem Suchen, nicht danach. Wer etwas nicht sehen darf, für den existiert es in keiner Antwort." },
  { k: "Belegt oder gar nicht", v: "Jede Antwort nennt, worauf sie steht. Fehlt die Grundlage, sagt das System das — statt zu raten." },
  { k: "Beschlüsse altern", v: "Entscheidungen tragen ihre Gültigkeit mit. Was abgelaufen oder ersetzt wurde, gibt sich als das zu erkennen." },
];

/** A stand-in for three real screens, drawn in DOM rather than captured as an
 *  image: it stays sharp at any density, costs no asset, and cannot go stale
 *  against the product it depicts. */
function ProductStack() {
  return (
    <div className="stack" aria-label="Drei Oberflächen aus Company Brain: Freigaben, Fragen und der Wissensbaum">
      <figure className="pane pane-back">
        <header className="pane-bar"><span className="pane-dot" /><span className="pane-title">Freigaben</span></header>
        <div className="pane-body">
          <div className="queue-row"><span className="queue-name">Garantiefall über 24 Monate</span><span className="chip chip-wait">Wartet</span></div>
          <div className="queue-row"><span className="queue-name">Preisfreigabe Enterprise</span><span className="chip chip-wait">Wartet</span></div>
          <div className="queue-row"><span className="queue-name">Onboarding-Checkliste</span><span className="chip chip-ok">Freigegeben</span></div>
        </div>
      </figure>

      <figure className="pane pane-mid">
        <header className="pane-bar"><span className="pane-dot" /><span className="pane-title">Entscheidungen</span></header>
        <div className="pane-body">
          <div className="decision">
            <div className="decision-head"><span className="chip chip-live">Gilt</span><span className="decision-date">seit 14.03.</span></div>
            <p className="decision-text">Rabatte über 15 % brauchen die Freigabe der Bereichsleitung.</p>
          </div>
          <div className="decision is-past">
            <div className="decision-head"><span className="chip chip-past">Ersetzt</span><span className="decision-date">bis 14.03.</span></div>
            <p className="decision-text">Rabatte über 20 % brauchen die Freigabe der Bereichsleitung.</p>
          </div>
        </div>
      </figure>

      <figure className="pane pane-front">
        <header className="pane-bar"><span className="pane-dot" /><span className="pane-title">Fragen</span></header>
        <div className="pane-body">
          <p className="ask">Welcher Rabatt geht ohne Rückfrage?</p>
          <div className="answer">
            <p>Bis 15 % entscheiden Sie selbst. Darüber liegt die Freigabe bei der Bereichsleitung.</p>
            <ul className="sources">
              <li><span className="src-n">1</span> Entscheidung · Preisrahmen 2026</li>
              <li><span className="src-n">2</span> Wissen · Vertrieb / Konditionen</li>
            </ul>
          </div>
        </div>
      </figure>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="site">
      <header className="masthead">
        <Link href="/" className="wordmark" aria-label="Company Brain, Startseite">
          <BrandMark className="wordmark-glyph" />
          <span>Company Brain</span>
        </Link>
        <nav className="masthead-nav">
          <a href="#register">Was darin liegt</a>
          <Link href="/login" className="link-action">Anmelden <ArrowUpRight className="link-arrow" /></Link>
        </nav>
      </header>

      <main>
        <section className="hero">
          <h1>
            Alles, was Ihr<br />Unternehmen weiß —<br />
            <em>an einem Ort, der<br />es versteht.</em>
          </h1>
          <div className="hero-side">
            <p className="lede">
              Wissen, Entscheidungen und Kontext hängen an dem Zweig, zu dem sie gehören.
              Jede Antwort wird nur aus dem gebaut, was die fragende Person auch sehen darf.
            </p>
            <div className="actions">
              <Link href="/login" className="btn">Company Brain öffnen</Link>
              <a href="#register" className="btn btn-quiet">Was darin liegt</a>
            </div>
          </div>
          <dl className="colophon">
            <div><dt>Ebenen</dt><dd>Sieben</dd></div>
            <div><dt>Sichtbarkeit</dt><dd>Rollenbasiert</dd></div>
            <div><dt>Antworten</dt><dd>Mit Quellen</dd></div>
            <div><dt>Beschlüsse</dt><dd>Mit Gültigkeit</dd></div>
          </dl>
        </section>

        <section className="showcase" aria-label="Oberflächen">
          <ProductStack />
        </section>

        <section className="register" id="register">
          <div className="register-head">
            <h2>Aus einer Wurzel,<br /><em>viele Köpfe.</em></h2>
            <p>Sieben Ebenen Unternehmenskontext. Jede an ihrem Platz, jede mit ihren eigenen Rechten.</p>
          </div>
          <ol className="register-list">
            {layers.map((layer) => (
              <li key={layer.n} className="entry">
                <span className="entry-n">{layer.n}</span>
                <h3 className="entry-label">{layer.label}</h3>
                <p className="entry-copy">{layer.copy}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="principles">
          <h2 className="principles-head">Drei Zusagen, die im Code stehen.</h2>
          <div className="principles-grid">
            {principles.map((p, i) => (
              <article key={p.k} className="principle">
                <span className="principle-n">{String(i + 1).padStart(2, "0")}</span>
                <h3>{p.k}</h3>
                <p>{p.v}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="closing">
          <h2>Geben Sie Ihrem Unternehmen<br /><em>ein Gedächtnis, das mitgeht.</em></h2>
          <Link href="/login" className="btn btn-lg">Anmelden <ArrowUpRight className="link-arrow" /></Link>
        </section>
      </main>

      <footer className="footer">
        <span className="footer-mark"><BrandMark className="wordmark-glyph" /> Company Brain</span>
        <span className="footer-note">Das Betriebsgedächtnis Ihres Unternehmens.</span>
      </footer>
    </div>
  );
}
