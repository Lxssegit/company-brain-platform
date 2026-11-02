/**
 * The offer, in one place.
 *
 * The name is expected to change, so nothing hard-codes it: every heading,
 * label and sentence that mentions it reads it from here. Renaming the service
 * is a one-line edit, not a search across the page.
 */
export const COMPANY = "AILVL";

/** The service. Referenced everywhere; never written out inline. */
export const OFFER = "Anfrage-Wächter";

/** What the free first step is called. It is the page's only conversion. */
export const CHECK = "Reaktionszeit-Check";

/** Who it is for, in the words the page uses when it says so out loud. */
export const AUDIENCE = "Betriebe mit 20 bis 100 Mitarbeitern";

/**
 * The two published tests the problem section cites. Kept as data so the
 * figures and their sources cannot drift apart: every number on the page that
 * comes from a study is rendered from this object, with its link attached.
 */
export const SOURCES = {
  aroundhome: {
    label: "Aroundhome-Test 2026",
    href: "https://www.deutsche-handwerks-zeitung.de/?p=378421",
  },
  matelso: {
    label: "Matelso-Test 2024",
    href: "https://www.deutsche-handwerks-zeitung.de/kundenanfragen-schneller-beantwortet-349790/",
  },
} as const;
