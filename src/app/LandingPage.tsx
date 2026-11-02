import Link from "next/link";
import { ArrowUpRight } from "@/components/icons";

/**
 * The public page. Night, with a horizon burning under it: orange at the core,
 * blue as it spreads, nothing above the fold but a sentence and the numbers
 * that back it.
 *
 * The palette is deliberately narrow — one background, one accent, one
 * surprise — and the surprise is rationed. Orange appears in exactly three
 * places: the core of the glow, the mark on an open request, and the hover of
 * the one button that matters. Spent anywhere else it stops meaning anything.
 *
 * Every colour here is scoped to .site in landing.css rather than declared on
 * :root. The signed-in application is light and reads the same token names; a
 * dark value on :root would have turned every panel behind the login black.
 *
 * It ships no client JavaScript. Everything that moves is a CSS load
 * animation, so the page is interactive the moment it paints and the
 * nonce-bound Content-Security-Policy has nothing to allow.
 */

type Figure = { value: string; label: string };

/** Left and right of the headline, the way a plaque carries its facts. */
const figuresLeft: Figure[] = [
  { value: "7", label: "Ebenen Kontext" },
  { value: "5", label: "Rollen, abgestuft" },
];

const figuresRight: Figure[] = [
  { value: "0", label: "Treffer ohne Recht" },
  { value: "1", label: "Quelle der Wahrheit" },
];

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

function Wordmark() {
  /* An <img> rather than an inline component on purpose: public/logo.svg is
     meant to be swapped for the real mark without touching this file.
     next/image is declined deliberately — there is nothing to optimise in a
     400-byte vector, and routing it through a loader would add a request to
     the one element that must be painted first. */
  return (
    <Link href="/" className="wordmark" aria-label="Company Brain, Startseite">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="" width={28} height={28} className="wordmark-glyph" />
      <span>Company Brain</span>
    </Link>
  );
}

/**
 * Three surfaces, drawn in DOM rather than captured as an image: sharp at any
 * density, no asset to ship, and they cannot go stale against the product.
 * Resting on the horizon so the glow reads through their edges.
 */
function HeroCards() {
  return (
    <div className="cards" aria-label="Drei Oberflächen aus Company Brain">
      <figure className="card glass">
        <figcaption className="card-head">Freigaben</figcaption>
        <ul className="rows">
          <li><span>Garantiefall über 24 Monate</span><em className="mark-open">Offene Anfrage</em></li>
          <li><span>Preisfreigabe Enterprise</span><em className="mark-ok">Freigegeben</em></li>
          <li><span>Onboarding-Checkliste</span><em className="mark-ok">Freigegeben</em></li>
        </ul>
      </figure>

      <figure className="card glass card-lift">
        <figcaption className="card-head">Entscheidungen</figcaption>
        <ul className="rows">
          <li><span>Rufbereitschaft Stufe 1</span><em className="mark-ok">Gilt</em></li>
          <li className="row-past"><span>Support nur werktags</span><em className="mark-past">Ersetzt</em></li>
        </ul>
        <p className="card-note">Was ersetzt wurde, bleibt lesbar — mit dem Beschluss, der es abgelöst hat.</p>
      </figure>

      <figure className="card glass">
        <figcaption className="card-head">Fragen</figcaption>
        <p className="card-answer">Ab 2 Stunden ruft der Service aktiv an — auch außerhalb der Geschäftszeiten.</p>
        <ol className="sources">
          <li>Rückruf bei Störungen der Stufe 1</li>
          <li>Rufbereitschaft, gültig ab 09/2026</li>
        </ol>
      </figure>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="site">
      <header className="masthead">
        <Wordmark />
        <nav className="masthead-nav">
          <a href="#register">Was darin liegt</a>
          <a href="#principles">Zusagen</a>
          <Link href="/login" className="pill">Anmelden</Link>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-inner">
            <p className="eyebrow">Betriebsgedächtnis</p>

            <div className="hero-row">
              <dl className="figures figures-left">
                {figuresLeft.map((f) => (
                  <div key={f.label}><dt>{f.value}</dt><dd>{f.label}</dd></div>
                ))}
              </dl>

              <h1>
                Antworten aus dem,<br />
                was Ihr Haus <em>wirklich weiß</em>.
              </h1>

              <dl className="figures figures-right">
                {figuresRight.map((f) => (
                  <div key={f.label}><dt>{f.value}</dt><dd>{f.label}</dd></div>
                ))}
              </dl>
            </div>

            <p className="lede">
              Wissen, Entscheidungen und Kontext hängen an dem Zweig, zu dem sie gehören.
              Jede Antwort wird nur aus dem gebaut, was die fragende Person auch sehen darf.
            </p>

            <div className="actions">
              <Link href="/login" className="btn btn-primary">Company Brain öffnen <ArrowUpRight className="link-arrow" /></Link>
              <a href="#register" className="btn btn-quiet">Was darin liegt</a>
            </div>

            <HeroCards />
          </div>
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

        <section className="principles" id="principles">
          <h2 className="principles-head">Drei Zusagen, die <em>im Code stehen</em>.</h2>
          <div className="principles-grid">
            {principles.map((p, i) => (
              <article key={p.k} className="principle glass">
                <span className="principle-n">{String(i + 1).padStart(2, "0")}</span>
                <h3>{p.k}</h3>
                <p>{p.v}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="closing">
          <h2>Geben Sie Ihrem Unternehmen<br /><em>ein Gedächtnis, das mitgeht.</em></h2>
          <Link href="/login" className="btn btn-primary btn-lg">Anmelden <ArrowUpRight className="link-arrow" /></Link>
        </section>
      </main>

      <footer className="footer">
        <span className="footer-mark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" width={22} height={22} className="wordmark-glyph" /> Company Brain
        </span>
        <span className="footer-note">Das Betriebsgedächtnis Ihres Unternehmens.</span>
      </footer>
    </div>
  );
}
