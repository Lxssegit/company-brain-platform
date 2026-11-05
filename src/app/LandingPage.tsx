import Link from "next/link";
import { HeroMotif } from "@/app/HeroMotif";
import { COMPANY, CONTACT_EMAIL, FOUNDER, OFFER, PRICE_EUR, SOURCES, TRIAL } from "@/lib/brand";

/**
 * Die öffentliche Seite.
 *
 * Gelesen wird sie von Geschäftsführern kleiner Betriebe, die für Anfragen
 * Geld bezahlen und wenig Zeit haben. Deshalb steht oben eine Aussage und kein
 * Versprechen, deshalb nennt die Seite den Preis, statt ihn zu verstecken, und
 * deshalb sagt sie beim Stand der Software die Wahrheit.
 *
 * Sie bringt keinen eigenen Client-Code mit: keine Client-Komponente, kein
 * Event-Handler, kein Zustand im Browser. Die Navigation sind Anker, das FAQ
 * ist ein details-Element, und das Formular ist ein normales form-Element an
 * einen Route Handler. Next laedt seine eigene Laufzeit weiterhin, aber nichts
 * davon stammt von dieser Seite, und die nonce-gebundene
 * Content-Security-Policy braucht keine Ausnahme.
 *
 * Die Gestaltungsregeln stehen in CLAUDE.md und sind verbindlich. Was hier
 * fehlt, fehlt mit Absicht: keine Pillen, keine Trennlinien, keine Rahmen,
 * keine Kursive, keine Großbuchstabenzeilen, keine Icons.
 */

const STEPS = [
  {
    title: "Antwort in 2 Minuten",
    body: "Jede Anfrage bekommt sofort eine Antwort mit Rückruftermin, rund um die Uhr. Der Kunde hat einen Termin, bevor die Konkurrenz am Montag anruft.",
  },
  {
    title: "Keine Anfrage bleibt liegen",
    body: "Jede Anfrage hat einen Zuständigen. Bleibt sie liegen, kommt eine Erinnerung und danach eine Nachricht an den Chef.",
  },
  {
    title: "Sie sehen, welches Portal sich lohnt",
    body: "Pro Portal sehen Sie Kosten, Termine und Aufträge. So erkennen Sie, wo Ihr Geld verbrennt.",
  },
];

const INCLUDED = [
  "Sofortantwort mit Rückruftermin",
  "Erinnerungen und Eskalation",
  "Antwortentwürfe in Outlook",
  "Auswertung pro Portal",
  "Wochenüberblick",
  "Persönliche Einrichtung",
];

const FAQ = [
  {
    q: "Brauchen wir neue Software?",
    a: `Nein. Der ${OFFER} arbeitet mit Ihrem Outlook, Ihrem Kontaktformular und den Mails der Portale.`,
  },
  {
    q: "Schickt die KI einfach Antworten raus?",
    a: "Nur die Sofortantwort mit dem Terminlink, und die schalten Sie selbst ein. Alles andere ist ein Entwurf, den Ihr Team freigibt.",
  },
  {
    q: "Was braucht die Einrichtung?",
    a: "Die Zustimmung Ihres Microsoft-365-Admins und rund 30 Minuten gemeinsam per Videocall.",
  },
  {
    q: "Was passiert nach der Testwoche?",
    a: "Sie entscheiden. Ohne Abo endet der Zugriff, und Ihre Daten werden gelöscht.",
  },
  {
    q: "Wo werden die Daten verarbeitet?",
    a: "Ausschließlich in EU-Rechenzentren, ohne Training mit Ihren Daten.",
  },
];

const CHANNELS = ["Aroundhome", "MyHammer", "Check24", "Google oder Werbung", "eigene Website", "Sonstiges"];
const VOLUMES = ["unter 20", "20 bis 50", "50 bis 100", "über 100"];
const M365 = ["Ja", "Nein", "Weiß nicht"];

export function LandingPage({ status }: { status?: "ok" | "fehler" | "zuviel" }) {
  return (
    <div className="site">
      <header className="masthead">
        {/* Platzhalter für public/logo.svg. Bis die Datei da ist, steht hier der Name. */}
        <Link href="/" className="wordmark">ailvl</Link>
        <nav className="masthead-nav">
          <a href="#so-funktioniert-es">So funktioniert es</a>
          <a href="#preis">Preis</a>
          <a href="#datenschutz">Datenschutz</a>
          <a href="#faq">FAQ</a>
          <a href="#testzugang" className="button">{TRIAL} kostenlos testen</a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-text">
            <h1>Als Erster<br />antworten</h1>
            <p className="hero-lede">
              Der {OFFER} beantwortet jede bezahlte Anfrage in 2 Minuten mit einem Rückruftermin.
              Auch am Wochenende und auch, wenn alle auf der Baustelle sind.
            </p>
            <a href="#testzugang" className="button button-large">{TRIAL} kostenlos testen</a>
            <p className="hero-price">Danach {PRICE_EUR} € pro Monat</p>
          </div>

          <HeroMotif />

          <p className="hero-foot">Funktioniert mit Outlook und Microsoft 365</p>
        </section>

        <section className="band band-tint">
          <div className="measure">
            <h2>Sie bezahlen die Anfrage, zwei Wettbewerber bekommen sie auch</h2>
            <p>
              Portale wie Aroundhome vermitteln jede Anfrage an bis zu drei Fachbetriebe und schreiben
              selbst: „First come, first serve&ldquo;. Bei Testanfragen 2026 antworteten von je 100 Betrieben
              nur 37 Dachdecker, 57 Heizungsbauer und 76 Fensterbauer.
            </p>
            <p className="sources">
              <a href={SOURCES.aroundhome.href} target="_blank" rel="noopener noreferrer">{SOURCES.aroundhome.label}</a>
              <a href={SOURCES.dhz.href} target="_blank" rel="noopener noreferrer">{SOURCES.dhz.label}</a>
            </p>
          </div>
        </section>

        <section className="band" id="so-funktioniert-es">
          <div className="measure">
            <h2>So funktioniert es</h2>
          </div>
          <div className="steps">
            {STEPS.map((s) => (
              <div key={s.title}>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="band band-tint">
          <div className="measure">
            <h2>Kein Termin, von dem niemand weiß</h2>
            <p>
              Termine sind erst vorgemerkt, Ihr Team bestätigt mit einem Klick. Sie legen Vorlauf,
              Zeiten und die Höchstzahl pro Tag fest.
            </p>
            <p>
              Antworten schreibt die KI als Entwurf in Outlook, gesendet wird erst nach Ihrer Freigabe.
            </p>
          </div>
        </section>

        <section className="band" id="datenschutz">
          <div className="measure">
            <h2>Ihre Daten bleiben in der EU</h2>
            <ul className="plain">
              <li>Verarbeitung ausschließlich in EU-Rechenzentren</li>
              <li>Kein Training mit Ihren Daten</li>
              <li>Auftragsverarbeitungsvertrag inklusive</li>
              <li>Nur Ihr Anfrage-Postfach wird gelesen</li>
              <li>Keine Auswertung einzelner Mitarbeiter</li>
            </ul>
          </div>
        </section>

        <section className="band band-tint" id="preis">
          <div className="measure">
            <h2>Ein Preis, ohne Kleingedrucktes</h2>
            <p className="price">
              <span className="price-figure">{PRICE_EUR} €</span>
              <span className="price-unit">pro Monat</span>
            </p>
            <p>
              {TRIAL} kostenlos testen. Die Testwoche beginnt, sobald Ihr Postfach verbunden ist.
            </p>
            <ul className="plain">
              {INCLUDED.map((i) => <li key={i}>{i}</li>)}
            </ul>
            <p className="placeholder">[LAUFZEIT UND KÜNDIGUNG]</p>
            <p className="placeholder">[MAXIMALE ANFRAGEN PRO MONAT]</p>
            <a href="#testzugang" className="button button-large">{TRIAL} kostenlos testen</a>
            <p className="price-honest">
              Der {OFFER} ist neu. Wir starten mit wenigen Betrieben und richten jeden persönlich ein.
            </p>
          </div>
        </section>

        <section className="band">
          <div className="measure about">
            <div className="about-photo">[FOTO]</div>
            <div>
              <h2>Über mich</h2>
              <p className="about-name">{FOUNDER}, Gründer von {COMPANY}</p>
              <p className="placeholder">[3 BIS 4 SÄTZE ÜBER MICH]</p>
            </div>
          </div>
        </section>

        <section className="band band-tint" id="faq">
          <div className="measure">
            <h2>Häufige Fragen</h2>
            <div className="faq">
              {FAQ.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="band band-dark" id="testzugang">
          <div className="measure">
            <h2>Testen Sie eine Woche, wer zuerst antwortet</h2>

            {status === "ok" ? (
              <p className="form-result">
                Danke. Wir melden uns innerhalb von 24 Stunden und richten Ihren Testzugang gemeinsam
                mit Ihnen ein
              </p>
            ) : (
              <form className="form" method="post" action="/api/testzugang">
                {status === "fehler" ? (
                  <p className="form-result form-result-error">
                    Das hat nicht geklappt. Bitte prüfen Sie Ihre Angaben und versuchen Sie es erneut.
                    Sie erreichen uns auch unter {CONTACT_EMAIL}
                  </p>
                ) : null}

                {status === "zuviel" ? (
                  <p className="form-result form-result-error">
                    Von Ihrem Anschluss kamen gerade mehrere Anfragen. Bitte versuchen Sie es in ein
                    paar Minuten erneut oder schreiben Sie uns direkt an {CONTACT_EMAIL}
                  </p>
                ) : null}

                <label className="field">
                  <span>Firma</span>
                  <input name="firma" required autoComplete="organization" />
                </label>

                <label className="field">
                  <span>Name</span>
                  <input name="name" required autoComplete="name" />
                </label>

                <label className="field">
                  <span>E-Mail</span>
                  <input name="email" type="email" required autoComplete="email" />
                </label>

                <label className="field">
                  <span>Telefon (optional)</span>
                  <input name="telefon" type="tel" autoComplete="tel" />
                </label>

                <fieldset className="field field-wide">
                  <legend>Über welche Wege bekommen Sie Anfragen?</legend>
                  <div className="choices">
                    {CHANNELS.map((c) => (
                      <label key={c} className="choice">
                        <input type="checkbox" name="wege" value={c} />
                        <span>{c}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <label className="field">
                  <span>Anfragen pro Monat</span>
                  <select name="menge" required defaultValue="">
                    <option value="" disabled>Bitte wählen</option>
                    {VOLUMES.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </label>

                <label className="field">
                  <span>Nutzen Sie Microsoft 365?</span>
                  <select name="microsoft365" required defaultValue="">
                    <option value="" disabled>Bitte wählen</option>
                    {M365.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </label>

                {/* Honigtopf. Menschen sehen das Feld nicht und springen es nicht an;
                    automatische Ausfüller tragen hier ein und verraten sich. Kein
                    display:none, weil genau das die bekannten Bots erkennen. */}
                <div className="trap" aria-hidden="true">
                  <label htmlFor="webseite">Bitte nicht ausfüllen</label>
                  <input id="webseite" name="webseite" type="text" tabIndex={-1} autoComplete="off" />
                </div>

                <label className="choice field-wide">
                  <input type="checkbox" name="datenschutz" value="ja" required />
                  <span>
                    Ich habe die <Link href="/datenschutz">Datenschutzerklärung</Link> gelesen und bin
                    mit der Verarbeitung meiner Angaben einverstanden
                  </span>
                </label>

                <button type="submit" className="button button-large">Testzugang anfragen</button>
              </form>
            )}
          </div>
        </section>
      </main>

      <footer className="footer">
        <span className="footer-mark">ailvl</span>
        <nav className="footer-nav">
          <Link href="/impressum">Impressum</Link>
          <Link href="/datenschutz">Datenschutz</Link>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          <Link href="/login">Kundenlogin</Link>
        </nav>
      </footer>
    </div>
  );
}
