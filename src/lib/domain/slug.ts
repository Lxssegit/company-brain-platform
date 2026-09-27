/**
 * One slug function for the server and for the preview a person types against.
 * They were written twice and disagreed: the client transliterated umlauts and
 * the server did not, so "Müller GmbH" previewed as `mueller-gmbh` and became
 * `m-ller-gmbh` — a preview that lied about the thing it previewed.
 *
 * German names get transliterated rather than stripped, because a product that
 * speaks German should not turn half its customers into hyphens.
 */
const TRANSLITERATIONS: Array<[RegExp, string]> = [
  [/ä/g, "ae"], [/ö/g, "oe"], [/ü/g, "ue"], [/ß/g, "ss"],
  [/æ/g, "ae"], [/ø/g, "oe"], [/å/g, "aa"],
];

export function slugify(value: string) {
  let slug = value.toLowerCase().trim();
  for (const [pattern, replacement] of TRANSLITERATIONS) slug = slug.replace(pattern, replacement);
  /* Everything else with a diacritic decomposes and loses it: é → e, ç → c. */
  slug = slug.normalize("NFKD").replace(/\p{Diacritic}/gu, "");
  return slug.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}
