import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, LEGAL, OFFER, SUPERVISORY_AUTHORITY } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
};

/**
 * Aufbau, Rechtsgrundlagen und Formulierungen stammen aus der
 * Datenschutzerklärung von ailvl.de. Der Inhalt ist aber nicht kopiert,
 * sondern auf das abgeglichen, was DIESE Seite tatsächlich tut.
 *
 * Die Unterschiede, und warum ein Kopieren falsch gewesen wäre:
 *
 * - Das Formular erhebt andere Felder und gibt sie an einen anderen
 *   Auftragsverarbeiter weiter, nicht an Supabase.
 * - Reichweitenmessung mit Umami gibt es hier nicht.
 * - Den Chat gibt es hier noch nicht.
 * - Auf der öffentlichen Seite liegt nichts im Speicher des Browsers, weil
 *   sie keinen eigenen Client-Code ausführt.
 * - Dafür gibt es einen Kundenlogin, den die alte Erklärung nicht kennt.
 *
 * Was nicht feststeht, steht als sichtbarer Platzhalter da und wird nicht
 * erfunden. Eine Erklärung, die eine Verarbeitung verschweigt, ist schlechter
 * als gar keine.
 */

const STAND = "5. November 2026";

export default function Datenschutz() {
  return (
    <div className="site">
      <header className="masthead">
        <Link href="/" className="wordmark">ailvl</Link>
        <nav className="masthead-nav">
          <Link href="/">Startseite</Link>
          <Link href="/impressum">Impressum</Link>
        </nav>
      </header>

      <main>
        <section className="band">
          <div className="measure legal">
            <h1>Datenschutzerklärung</h1>
            <p>
              Diese Erklärung beschreibt, welche personenbezogenen Daten beim Besuch dieser Website
              verarbeitet werden, zu welchem Zweck, auf welcher Rechtsgrundlage und wie lange.
            </p>

            <h2>1. Verantwortlicher</h2>
            <p>Verantwortlich für die Datenverarbeitung auf dieser Website ist:</p>
            <p>
              {LEGAL.name}<br />
              {LEGAL.street}<br />
              {LEGAL.postalCode} {LEGAL.city}<br />
              {LEGAL.country}<br />
              E-Mail: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </p>
            <p>
              Ein Datenschutzbeauftragter ist nicht bestellt, weil die Voraussetzungen des § 38 BDSG
              nicht vorliegen.
            </p>

            <h2>2. Hosting</h2>
            <p>
              Diese Website wird bei der Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA
              gehostet. Beim Aufruf einer Seite verarbeitet Vercel technische Verbindungsdaten,
              darunter die gekürzte oder vollständige IP-Adresse, Datum und Uhrzeit der Anfrage, die
              aufgerufene Adresse, den übertragenen Datenumfang, den Referrer und Angaben zu Browser
              und Betriebssystem.
            </p>
            <p>
              Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse liegt im
              technisch fehlerfreien Betrieb und in der Sicherheit der Website. Die Übermittlung in
              die USA ist auf Standardvertragsklauseln und die Zertifizierung nach dem EU-US Data
              Privacy Framework gestützt. Mit Vercel besteht ein Vertrag zur Auftragsverarbeitung
              nach Art. 28 DSGVO.
            </p>

            <h2>3. Server-Logdateien</h2>
            <p>
              Die oben genannten Verbindungsdaten werden in Logdateien gespeichert. Eine
              Zusammenführung mit anderen Datenquellen findet nicht statt. Die Daten werden nach
              spätestens 30 Tagen gelöscht, sofern sie nicht zur Aufklärung eines konkreten
              Missbrauchsverdachts benötigt werden.
            </p>

            <h2>4. Formular für den Testzugang</h2>
            <p>
              Über das Formular auf dieser Website erheben wir: Firmenname, Ihren Namen, Ihre
              E-Mail-Adresse, die von Ihnen angegebenen Wege, über die Sie Anfragen erhalten, die
              ungefähre Zahl Ihrer Anfragen pro Monat und die Angabe, ob Sie Microsoft 365 nutzen.
              Freiwillig zusätzlich: Ihre Telefonnummer. Gespeichert wird außerdem der Zeitpunkt
              Ihrer Einsendung.
            </p>
            <p>
              Zweck ist die Bearbeitung Ihrer Anfrage und die Vorbereitung eines möglichen
              Vertragsverhältnisses. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO für Anfragen,
              die auf einen Vertrag gerichtet sind, und Art. 6 Abs. 1 lit. a DSGVO für Ihre
              ausdrückliche Einwilligung in die Speicherung. Sie können die Einwilligung jederzeit
              mit Wirkung für die Zukunft widerrufen, formlos per E-Mail an die oben genannte
              Adresse.
            </p>
            <p>
              Ihre Angaben werden gelöscht, sobald sie für den Zweck nicht mehr erforderlich sind,
              spätestens 24 Monate nach dem letzten Kontakt. Gesetzliche Aufbewahrungspflichten,
              insbesondere aus dem Handels- und Steuerrecht, bleiben davon unberührt.
            </p>

            <h3>Wohin die Formulardaten gehen</h3>
            <p>
              Die Angaben werden auf dem Server geprüft und anschließend an unseren
              Automatisierungsdienst übermittelt, der die Anfrage an unser Postfach weiterreicht.
              Die Übermittlung findet ausschließlich vom Server aus statt, ein Zugriff aus dem
              Browser ist technisch ausgeschlossen.
            </p>
            <p className="placeholder">
              [ANBIETER DER AUTOMATISIERUNG: NAME, ANSCHRIFT, SERVERSTANDORT UND HINWEIS AUF DEN
              VERTRAG ZUR AUFTRAGSVERARBEITUNG NACH ART. 28 DSGVO]
            </p>

            <h3>Schutz vor automatisierten Einsendungen</h3>
            <p>
              Das Formular enthält ein für Menschen unsichtbares Zusatzfeld und eine Begrenzung der
              Einsendungen pro Anschluss. Dafür wird Ihre IP-Adresse kurzzeitig im Arbeitsspeicher
              des Servers gehalten und nicht gespeichert. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f
              DSGVO, unser berechtigtes Interesse liegt in der Abwehr von Spam.
            </p>

            <h2>5. Keine Reichweitenmessung, kein Chat</h2>
            <p>
              Diese Website bindet kein Analysewerkzeug und kein Chat-System ein. Es wird kein Skript
              eines Drittanbieters geladen, auch nicht nach einer Einwilligung, weil es keine solche
              Einbindung gibt. Ein Einwilligungsbanner gibt es aus demselben Grund nicht.
            </p>
            <p>
              Sobald sich das ändert, wird diese Erklärung vorher angepasst und die Einwilligung
              abgefragt.
            </p>

            <h2>6. Speicherung auf Ihrem Gerät</h2>
            <p>
              Auf den öffentlichen Seiten wird nichts auf Ihrem Gerät abgelegt: keine Cookies, keine
              Einträge im lokalen Speicher. Diese Seiten führen keinen eigenen Code in Ihrem Browser
              aus. Im Kundenlogin ist das anders, siehe den nächsten Abschnitt.
            </p>

            <h2>7. Kundenlogin</h2>
            <p>
              Der {OFFER} hat einen eigenen Zugang für Kundinnen und Kunden. Wer sich dort anmeldet,
              übermittelt E-Mail-Adresse und Passwort, bei aktivierter Zwei-Faktor-Anmeldung
              zusätzlich einen Einmalcode.
            </p>
            <p>
              Passwörter werden ausschließlich als scrypt-Hash gespeichert, im Klartext liegen sie
              nirgends. Nach erfolgreicher Anmeldung wird ein Sitzungs-Cookie gesetzt, das Sie
              angemeldet hält; ohne dieses Cookie funktioniert der Zugang nicht. Rechtsgrundlage ist
              Art. 6 Abs. 1 lit. b DSGVO, die Verarbeitung ist zur Erfüllung des Nutzungsvertrages
              erforderlich. Das Cookie ist nach § 25 Abs. 2 Nr. 2 TDDDG technisch erforderlich und
              braucht deshalb keine Einwilligung.
            </p>
            <p>
              Anmeldeversuche werden begrenzt, um Angriffe auf Passwörter und Einmalcodes
              abzuwehren. Rechtsgrundlage dafür ist Art. 6 Abs. 1 lit. f DSGVO.
            </p>

            <h2>8. Schriften</h2>
            <p>
              Die verwendeten Schriften werden von unserem eigenen Server ausgeliefert. Es besteht
              keine Verbindung zu Google Fonts oder einem anderen externen Dienst, Ihre IP-Adresse
              wird dabei an niemanden übermittelt.
            </p>

            <h2>9. Ihre Rechte</h2>
            <p>Sie haben jederzeit das Recht auf:</p>
            <ul className="plain">
              <li>Auskunft über die zu Ihrer Person gespeicherten Daten (Art. 15 DSGVO)</li>
              <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
              <li>Löschung (Art. 17 DSGVO)</li>
              <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
              <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen (Art. 21 DSGVO)</li>
              <li>Widerruf einer erteilten Einwilligung mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO)</li>
            </ul>
            <p>
              Für alle diese Anliegen genügt eine formlose Nachricht an{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>

            <h2>10. Beschwerderecht bei der Aufsichtsbehörde</h2>
            <p>
              Sie haben das Recht, sich bei einer Datenschutzaufsichtsbehörde über die Verarbeitung
              Ihrer personenbezogenen Daten zu beschweren (Art. 77 DSGVO). Zuständig ist die Behörde
              Ihres gewöhnlichen Aufenthaltsorts, Ihres Arbeitsplatzes oder des Orts des
              mutmaßlichen Verstoßes. Für uns zuständig ist:
            </p>
            <p>
              {SUPERVISORY_AUTHORITY.name}<br />
              {SUPERVISORY_AUTHORITY.street}<br />
              {SUPERVISORY_AUTHORITY.city}<br />
              Telefon: {SUPERVISORY_AUTHORITY.phone}<br />
              E-Mail:{" "}
              <a href={`mailto:${SUPERVISORY_AUTHORITY.email}`}>{SUPERVISORY_AUTHORITY.email}</a>
            </p>

            <h2>11. Keine automatisierte Entscheidungsfindung</h2>
            <p>
              Eine automatisierte Entscheidungsfindung einschließlich Profiling nach Art. 22 DSGVO
              findet nicht statt. Ihre Formularangaben werden von Menschen gelesen und bewertet.
            </p>

            <h2>12. Änderungen dieser Erklärung</h2>
            <p>
              Wir passen diese Erklärung an, sobald sich die eingesetzten Dienste oder die Rechtslage
              ändern. Wenn sich dadurch die Grundlage einer Einwilligung ändert, fragen wir sie
              erneut ab.
            </p>
            <p>Stand: {STAND}</p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <span className="footer-mark">ailvl</span>
        <nav className="footer-nav">
          <Link href="/">Startseite</Link>
          <Link href="/impressum">Impressum</Link>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </nav>
      </footer>
    </div>
  );
}
