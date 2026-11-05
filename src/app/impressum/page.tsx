import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY, CONTACT_EMAIL } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Impressum: ${COMPANY}`,
  robots: { index: false },
};

/**
 * Platzhalter. Ein Impressum ist eine rechtlich verbindliche Erklärung; hier
 * steht deshalb kein erfundener Text, sondern sichtbar markierte Lücken.
 * Die Seite ist auf noindex gestellt, solange sie leer ist.
 */
export default function Impressum() {
  return (
    <div className="site">
      <header className="masthead">
        <Link href="/" className="wordmark">ailvl</Link>
      </header>
      <main>
        <section className="band">
          <div className="measure">
            <h1>Impressum</h1>
            <p className="placeholder">[ANBIETER, VERTRETUNGSBERECHTIGTE PERSON, ANSCHRIFT]</p>
            <p className="placeholder">[UMSATZSTEUER-IDENTIFIKATIONSNUMMER]</p>
            <p className="placeholder">[REGISTERGERICHT UND REGISTERNUMMER, FALLS VORHANDEN]</p>
            <p className="placeholder">[VERANTWORTLICH FÜR DEN INHALT]</p>
            <p>Kontakt: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
          </div>
        </section>
      </main>
      <footer className="footer">
        <span className="footer-mark">ailvl</span>
        <nav className="footer-nav">
          <Link href="/">Startseite</Link>
          <Link href="/datenschutz">Datenschutz</Link>
        </nav>
      </footer>
    </div>
  );
}
