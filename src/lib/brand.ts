/**
 * Alles, was einen Namen, einen Preis oder eine Quelle trägt, steht hier und
 * nur hier. Der Angebotsname ist ein Arbeitstitel; ihn zu wechseln soll eine
 * Zeile sein und kein Suchen-und-Ersetzen über die ganze Seite.
 */

export const COMPANY = "AILVL";

/** Arbeitstitel des Produkts. */
export const OFFER = "Anfrage-Wächter";

export const PRICE_EUR = 249;
export const TRIAL = "1 Woche";

export const CONTACT_EMAIL = "lasse.lorenzen@ailvl.de";
export const CONTACT_PHONE = "+49 173 4442008";

export const FOUNDER = "Lasse Lorenzen";

/**
 * Die Angaben aus dem Impressum. Sie stehen hier und nicht in der Seite, weil
 * Anschrift und Rufnummer auf mehreren Seiten erscheinen und eine Adresse, die
 * an zwei Stellen gepflegt wird, irgendwann an einer Stelle falsch ist.
 */
export const LEGAL = {
  name: "Lasse Lorenzen",
  street: "Beimoorweg 22F",
  postalCode: "22926",
  city: "Ahrensburg",
  country: "Deutschland",
} as const;

/**
 * Die Aufsichtsbehörde, die für den Verantwortlichen zuständig ist.
 */
export const SUPERVISORY_AUTHORITY = {
  name: "Unabhängiges Landeszentrum für Datenschutz Schleswig-Holstein",
  street: "Holstenstraße 98",
  city: "24103 Kiel",
  phone: "0431 988-1200",
  email: "mail@datenschutzzentrum.de",
} as const;

/**
 * Die Schriftfamilie, wie sie in public/fonts liegt und in globals.css per
 * @font-face angemeldet ist.
 *
 * Vorgesehen war General Sans von Fontshare. Fontshare ist aus der
 * Build-Umgebung nicht erreichbar (der Egress-Proxy antwortet auf CONNECT mit
 * 403) und es gibt kein npm-Paket dafür. Plus Jakarta Sans steht an seiner
 * Stelle: dieselbe Gattung, echte 300er für die große leichte Headline.
 * Liegen die General-Sans-Dateien vor, wandern sie nach public/fonts, die
 * @font-face-Blöcke zeigen darauf, und hier steht ein anderer Name.
 */
export const FONT_FAMILY = "Plus Jakarta Sans";

/**
 * Solange hier null steht, zeichnet HeroMotif das Bildmotiv in CSS. Liegt
 * später eine eigene Datei unter public/hero.webp, trägt man sie hier ein und
 * die Komponente zeigt sie statt der gezeichneten Kugel.
 */
export const HERO_IMAGE: string | null = null;

/**
 * Die einzigen zwei Quellen, aus denen Zahlen auf dieser Seite stammen dürfen.
 * Die Zahlen werden unverändert übernommen, nicht gerundet und nicht ergänzt.
 */
export const SOURCES = {
  aroundhome: {
    label: "Aroundhome, Partner werden",
    href: "https://www.aroundhome.de/partner-werden/heizung/",
  },
  dhz: {
    label: "Deutsche Handwerks Zeitung, Testanfragen 2026",
    href: "https://www.deutsche-handwerks-zeitung.de/?p=378421",
  },
} as const;
