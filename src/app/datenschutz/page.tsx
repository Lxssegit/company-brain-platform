import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  robots: { index: false },
};

/**
 * Platzhalter. Auf diese Seite verweist die Pflicht-Checkbox im Formular, also
 * muss sie erreichbar sein, bevor das Formular live geht. Der Inhalt ist eine
 * rechtlich verbindliche Erklärung und wird nicht erfunden; die Lücken sind
 * sichtbar markiert, die Seite steht bis dahin auf noindex.
 *
 * Was die Seite tatsächlich beschreiben muss, steht unten als Liste: das sind
 * die Datenflüsse, die diese Website heute auslöst.
 */
export default function Datenschutz() {
  return (
    <div className="site">
      <header className="masthead">
        <Link href="/" className="wordmark">ailvl</Link>
      </header>
      <main>
        <section className="band">
          <div className="measure">
            <h1>Datenschutzerklärung</h1>
            <p className="placeholder">[VOLLSTÄNDIGE DATENSCHUTZERKLÄRUNG]</p>

            <h2>Was diese Website auslöst</h2>
            <p>
              Diese Übersicht ist keine Datenschutzerklärung. Sie hält fest, was erklärt werden muss.
            </p>
            <ul className="plain">
              <li>Das Formular „Testzugang anfragen&ldquo; überträgt Firma, Name, E-Mail, Telefon, die
                angegebenen Anfragewege, die Anzahl der Anfragen pro Monat und die Angabe zu
                Microsoft 365 an einen Automatisierungsdienst.</li>
              <li>Die Schriftdateien liegen auf demselben Server. Es wird keine Verbindung zu einem
                externen Schriftdienst aufgebaut.</li>
              <li>Die Seite setzt keine Cookies und bindet kein Analysewerkzeug ein.</li>
              <li>Der Kundenlogin verarbeitet Anmeldedaten und, wenn eingeschaltet, einen zweiten
                Faktor.</li>
            </ul>

            <p>Fragen dazu: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
          </div>
        </section>
      </main>
      <footer className="footer">
        <span className="footer-mark">ailvl</span>
        <nav className="footer-nav">
          <Link href="/">Startseite</Link>
          <Link href="/impressum">Impressum</Link>
        </nav>
      </footer>
    </div>
  );
}
