import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/domain/slug";

/**
 * Written twice and disagreeing: the form previewed `mueller-gmbh` while the
 * server stored `m-ller-gmbh`. One function now, and it transliterates rather
 * than strips, because a product that speaks German should not turn half its
 * customers into hyphens.
 */
describe("slugify", () => {
  it("transliterates German rather than dropping it", () => {
    expect(slugify("Müller GmbH")).toBe("mueller-gmbh");
    expect(slugify("Bäckerei Groß & Söhne")).toBe("baeckerei-gross-soehne");
    expect(slugify("Straßenbau AG")).toBe("strassenbau-ag");
  });

  it("strips diacritics it has no letter for", () => {
    expect(slugify("Café Renée")).toBe("cafe-renee");
  });

  it("collapses and trims the separators", () => {
    expect(slugify("  Beispiel   GmbH  ")).toBe("beispiel-gmbh");
    expect(slugify("--Rand--")).toBe("rand");
    expect(slugify("A & B / C")).toBe("a-b-c");
  });

  it("stays inside the column it is written to", () => {
    expect(slugify("x".repeat(200)).length).toBe(80);
  });

  it("gives an empty string when there is nothing to slug", () => {
    expect(slugify("   ")).toBe("");
    expect(slugify("!!!")).toBe("");
  });
});
