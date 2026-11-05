import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, CONTACT_PHONE, LEGAL } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Impressum",
};

/**
 * Die Pflichtangaben, wörtlich aus dem Impressum von ailvl.de übernommen.
 * Anschrift und Rufnummer kommen aus src/lib/brand.ts, damit sie nicht an
 * zwei Stellen gepflegt werden müssen.
 */
export default function Impressum() {
  return (
    <div className="site">
      <header className="masthead">
        <Link href="/" className="wordmark">ailvl</Link>
        <nav className="masthead-nav">
          <Link href="/">Startseite</Link>
          <Link href="/datenschutz">Datenschutz</Link>
        </nav>
      </header>

      <main>
        <section className="band">
          <div className="measure legal">
            <h1>Impressum</h1>

            <h2>Angaben gemäß § 5 DDG</h2>
            <p>
              {LEGAL.name}<br />
              {LEGAL.street}<br />
              {LEGAL.postalCode} {LEGAL.city}<br />
              {LEGAL.country}
            </p>

            <h2>Vertreten durch</h2>
            <p>{LEGAL.name}</p>

            <h2>Kontakt</h2>
            <p>
              E-Mail: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a><br />
              Telefon: <a href={`tel:${CONTACT_PHONE.replace(/\s/g, "")}`}>{CONTACT_PHONE}</a>
            </p>

            <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
            <p>
              {LEGAL.name}<br />
              {LEGAL.street}<br />
              {LEGAL.postalCode} {LEGAL.city}
            </p>

            <h2>EU-Streitschlichtung</h2>
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung bereit:{" "}
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
                ec.europa.eu/consumers/odr
              </a>. Unsere E-Mail-Adresse finden Sie oben.
            </p>

            <h2>Verbraucherstreitbeilegung</h2>
            <p>
              Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>

            <h2>Bildnachweis</h2>
            <p>
              Wortmarke und Bildmarke von ailvl. Auf dieser Seite werden keine Bilder Dritter
              verwendet. Das Motiv auf der Startseite ist in CSS gezeichnet.
            </p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <span className="footer-mark">ailvl</span>
        <nav className="footer-nav">
          <Link href="/">Startseite</Link>
          <Link href="/datenschutz">Datenschutz</Link>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </nav>
      </footer>
    </div>
  );
}
