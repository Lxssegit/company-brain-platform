import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Die Anfrage für einen Testzugang.
 *
 * Bewusst ein Route Handler hinter einem gewöhnlichen form-Element und keine
 * Fetch-Logik im Browser: so braucht die öffentliche Seite kein einziges Byte
 * Client-JavaScript, und die nonce-gebundene Content-Security-Policy bleibt
 * ohne Ausnahme. Der Preis dafür ist ein Seitenwechsel nach dem Absenden, und
 * der ist hier kein Verlust.
 *
 * Geprüft wird ausschließlich hier. Die `required`-Angaben im Formular sind
 * Bequemlichkeit für Menschen, keine Zusicherung: wer das Formular umgeht,
 * umgeht sie mit.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Eingabe = z.object({
  firma: z.string().trim().min(1).max(200),
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  telefon: z.string().trim().max(60).optional().or(z.literal("")),
  wege: z.array(z.string().max(60)).max(10),
  menge: z.enum(["unter 20", "20 bis 50", "50 bis 100", "über 100"]),
  microsoft365: z.enum(["Ja", "Nein", "Weiß nicht"]),
  datenschutz: z.literal("ja"),
});

function zurueck(request: Request, ergebnis: "ok" | "fehler") {
  /* 303 und nicht 302: nach einem POST muss der Browser die Folge-Anfrage als
     GET stellen, sonst landet ein Neuladen wieder im Handler. */
  return NextResponse.redirect(new URL(`/?testzugang=${ergebnis}#testzugang`, request.url), 303);
}

export async function POST(request: Request) {
  let daten: FormData;
  try {
    daten = await request.formData();
  } catch {
    return zurueck(request, "fehler");
  }

  /* Der Honigtopf. Ist das unsichtbare Feld gefüllt, war kein Mensch am Werk.
     Die Antwort sieht aus wie ein Erfolg, damit ein Skript nicht lernt, woran
     es gescheitert ist; gesendet wird nichts. */
  if (String(daten.get("webseite") ?? "").length > 0) {
    return zurueck(request, "ok");
  }

  const gelesen = Eingabe.safeParse({
    firma: daten.get("firma") ?? "",
    name: daten.get("name") ?? "",
    email: daten.get("email") ?? "",
    telefon: daten.get("telefon") ?? "",
    wege: daten.getAll("wege").map(String),
    menge: daten.get("menge") ?? "",
    microsoft365: daten.get("microsoft365") ?? "",
    datenschutz: daten.get("datenschutz") ?? "",
  });

  if (!gelesen.success) return zurueck(request, "fehler");

  const ziel = process.env.N8N_WEBHOOK_URL;
  if (!ziel) {
    /* Ohne Ziel ist die Anfrage verloren, und das darf nicht wie ein Erfolg
       aussehen. Wer das hier im Log sieht, hat die Variable nicht gesetzt. */
    console.error("[testzugang] N8N_WEBHOOK_URL ist nicht gesetzt, die Anfrage wurde nicht zugestellt");
    return zurueck(request, "fehler");
  }

  try {
    const antwort = await fetch(ziel, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...gelesen.data, eingegangen: new Date().toISOString() }),
      /* Ein hängender Webhook darf den Absender nicht minutenlang warten lassen. */
      signal: AbortSignal.timeout(8000),
    });
    if (!antwort.ok) {
      console.error(`[testzugang] Webhook antwortete mit ${antwort.status}`);
      return zurueck(request, "fehler");
    }
  } catch (fehler) {
    console.error("[testzugang] Webhook nicht erreichbar", fehler);
    return zurueck(request, "fehler");
  }

  return zurueck(request, "ok");
}
