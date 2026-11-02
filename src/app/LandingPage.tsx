import Link from "next/link";
import { ArrowUpRight, BrandMark } from "@/components/icons";
import { AUDIENCE, CHECK, COMPANY, OFFER, SOURCES } from "@/lib/offer";

/**
 * The public page. Night, with a horizon burning under it: orange at the core,
 * blue as it spreads, nothing above the fold but a sentence and the numbers
 * that back it.
 *
 * It is read by managing directors who arrived from a personal message, have
 * little time, and have heard an AI promise before. So the page leads with a
 * published figure rather than a claim, names what the service does not do as
 * plainly as what it does, and asks for one small thing.
 *
 * The palette is deliberately narrow — one background, one accent, one
 * surprise — and the surprise is rationed. Orange appears in exactly three
 * places: the core of the glow, the mark on a request still waiting, and the
 * hover of the one button that matters. Spent anywhere else it stops meaning
 * anything.
 *
 * It ships no client JavaScript. Everything that moves is a CSS load
 * animation, so the page is interactive the moment it paints and the
 * nonce-bound Content-Security-Policy has nothing to allow. The two buttons
 * that "scroll to the form" are plain anchors for the same reason: the browser
 * already does this, smoothly, without being asked.
 */

type Figure = { value: string; label: string; note?: string; href?: string };

/* Flanking the headline, the way a plaque carries its facts. The first two are
   measured by somebody else and say so; the second two are what this service
   commits to. Mixing the four without marking which is which would borrow the
   authority of a published test for a promise, so the sourced ones carry a
   link and the others do not. */
const figuresLeft: Figure[] = [
  { value: "37 von 100", label: "Dachdeckern antworten auf Anfragen", note: SOURCES.aroundhome.label, href: SOURCES.aroundhome.href },
  { value: "85 %", label: "rufen nicht zurück, wenn niemand abnimmt", note: SOURCES.matelso.label, href: SOURCES.matelso.href },
];

const figuresRight: Figure[] = [
  { value: "8 Wochen", label: "Pilot mit Vorher-Nachher-Messung" },
  { value: "0", label: "Auswertungen über Mitarbeitende" },
];

function Wordmark() {
  return (
    <Link href="/" className="wordmark" aria-label={`${COMPANY}, Startseite`}>
      <BrandMark className="wordmark-glyph" />
      <span>ailvl</span>
    </Link>
  );
}

/**
 * Three surfaces from the service, drawn in DOM rather than captured as an
 * image: sharp at any density, no asset to ship, and they cannot go stale
 * against the product. Each is labelled as an example, because a mock-up a
 * sceptical reader mistakes for a real screenshot costs more trust than it
 * ever buys.
 */
function HeroCards() {
  return (
    <div className="cards" aria-label={`Drei Beispielansichten aus dem ${OFFER}`}>
      <section className="card-slot">
        <figure className="card glass">
          <h2 className="card-label">{OFFER} <span className="card-label-aside">Beispielansicht</span></h2>
          <ul className="rows">
            <li><span>Anfrage Wärmepumpe, offen seit 26 h</span><em className="mark-open">Offene Anfrage</em></li>
            <li><span>Angebotsanfrage Blechteile</span><em className="mark-ok">Antwort freigegeben</em></li>
            <li><span>Rückfrage Liefertermin</span><em className="mark-ok">Beantwortet in 2 h</em></li>
          </ul>
        </figure>
      </section>

      <section className="card-slot card-slot-lift">
        <figure className="card glass">
          <h2 className="card-label">Kundensignale <span className="card-label-aside">Beispielansicht</span></h2>
          <ul className="rows">
            <li><span>Fragen zu Lieferzeiten: 6 in 14 Tagen, sonst 1</span><em className="mark-open">Auffällig</em></li>
            <li><span>Speicher-Nachrüstung: 4 Anfragen in 14 Tagen</span><em className="mark-ok">Neu</em></li>
          </ul>
          <p className="card-note">Signale melden sich nur, wenn ein Thema deutlich vom Normalzustand abweicht.</p>
        </figure>
      </section>

      <section className="card-slot">
        <figure className="card glass">
          <h2 className="card-label">Wochenüberblick <span className="card-label-aside">Beispielansicht</span></h2>
          <p className="card-answer">Wochenüberblick KW 46</p>
          <ol className="sources">
            <li>Zwei Anfragen über 24 h offen — Vertrieb</li>
            <li>Lieferzeiten häufen sich — Geschäftsführung</li>
            <li>Speicher-Nachrüstung nimmt zu — Vertrieb</li>
          </ol>
          <p className="card-note">Höchstens drei Punkte. Wenn sich nichts geändert hat, kommt nichts.</p>
        </figure>
      </section>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="site">
      <header className="masthead">
        <Wordmark />
        <nav className="masthead-nav">
          <a href="#so-funktioniert-es">So funktioniert es</a>
          <a href="#zusagen">Unsere Zusagen</a>
          <a href="#ablauf">Ablauf</a>
          <a href="#faq">FAQ</a>
          <a href="#energietechnik">Energietechnik</a>
          <a href="#industrie">Industrie</a>
          <a href="#check" className="pill">Check anfragen</a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-inner">
            <p className="eyebrow">Für {AUDIENCE}</p>

            <div className="hero-row">
              <dl className="figures figures-left">
                {figuresLeft.map((f) => <FigureItem key={f.label} figure={f} />)}
              </dl>

              <h1>
                Keine Anfrage bleibt<br />
                mehr <em>liegen.</em>
              </h1>

              <dl className="figures figures-right">
                {figuresRight.map((f) => <FigureItem key={f.label} figure={f} />)}
              </dl>
            </div>

            <p className="lede">
              Wir melden jede offene Kundenanfrage, bevor der Kunde woanders kauft. Und Sie erfahren jede
              Woche, was Ihre Kunden wirklich wollen.
            </p>

            <div className="actions">
              <a href="#check" className="btn btn-primary">Kostenlosen {CHECK} anfragen <ArrowUpRight className="link-arrow" /></a>
              <a href="#so-funktioniert-es" className="btn btn-quiet">So funktioniert es</a>
            </div>

            <HeroCards />
          </div>
        </section>

        <section className="register" id="problem">
          <div className="register-head">
            <h2>Der Kunde wartet nicht,<br /><em>er kauft woanders.</em></h2>
            <p>
              Zwei unabhängige Tests haben nachgemessen, wie Betriebe auf Anfragen reagieren. Die Zahlen
              stammen nicht von uns.
            </p>
          </div>

          <ol className="register-list">
            <li className="entry">
              <span className="entry-n">01</span>
              <h3 className="entry-label">Die meisten antworten gar nicht</h3>
              <p className="entry-copy">
                Bei je 100 Testanfragen antworteten nur 37 Dachdecker, 57 Heizungsbauer und 76 Fensterbauer.
              </p>
              <p className="entry-source">
                <a href={SOURCES.aroundhome.href} target="_blank" rel="noopener noreferrer">
                  {SOURCES.aroundhome.label} <ArrowUpRight className="link-arrow" />
                </a>
              </p>
            </li>
            <li className="entry">
              <span className="entry-n">02</span>
              <h3 className="entry-label">Wer nicht durchkommt, kommt nicht wieder</h3>
              <p className="entry-copy">
                23 % der telefonischen Anfragen bei Firmen aus Bau, Maschinenbau, IT und Kfz blieben
                unbeantwortet. 85 % der Anrufer, die niemanden erreichen, rufen nicht wieder an.
              </p>
              <p className="entry-source">
                <a href={SOURCES.matelso.href} target="_blank" rel="noopener noreferrer">
                  {SOURCES.matelso.label} <ArrowUpRight className="link-arrow" />
                </a>
              </p>
            </li>
          </ol>
        </section>
      </main>

      <footer className="footer">
        <span className="footer-mark">
          <BrandMark className="wordmark-glyph" /> {COMPANY}
        </span>
        <span className="footer-note">
          {OFFER} für {AUDIENCE}.
          {" "}
          <Link className="footer-login" href="/login">Kundenlogin</Link>
        </span>
      </footer>
    </div>
  );
}

function FigureItem({ figure }: { figure: Figure }) {
  return (
    <div>
      <dt>{figure.value}</dt>
      <dd>
        {figure.label}
        {figure.note && figure.href ? (
          <a className="figure-source" href={figure.href} target="_blank" rel="noopener noreferrer">{figure.note}</a>
        ) : null}
      </dd>
    </div>
  );
}
