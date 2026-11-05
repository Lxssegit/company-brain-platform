import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { OFFER, PRICE_EUR, TRIAL } from "@/lib/brand";

export const alt = `${OFFER}: Als Erster auf bezahlte Anfragen antworten`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Die Teilen-Karte, gezeichnet statt von der Seite abfotografiert: ein
 * Screenshot schneidet bei 1200 mal 630 schlecht und ist veraltet, sobald sich
 * ein Abstand ändert.
 *
 * Satori, das hier rendert, kennt weder CSS-Filter noch mask-image und keine
 * Container-Einheiten. Das Motiv ist deshalb nicht dasselbe wie auf der Seite,
 * sondern dieselbe Idee auf einem Weg, den der Renderer gehen kann: die Kugel
 * aus geschichteten Radialverläufen, die Glasstreifen als halbdurchsichtige
 * Rechtecke mit je eigener Helligkeit.
 */
export default async function Image() {
  /* woff, nicht das woff2 der Seite: Satori liest ttf, otf und woff und weist
     woff2 mit „Unsupported OpenType signature wOF2" ab. Dieselben zwei
     Schnitte, nur unkomprimiert, direkt neben den Originalen. */
  const [light, medium] = await Promise.all([
    readFile(join(process.cwd(), "public/fonts/plus-jakarta-sans-300.woff")),
    readFile(join(process.cwd(), "public/fonts/plus-jakarta-sans-500.woff")),
  ]);

  /* Die Streifen: linke Kante, Breite, Helligkeit. Unterschiedlich breit, wie
     auf der Seite, damit sie nicht als Raster lesen. */
  const strips: [number, number, number][] = [
    [612, 26, 0.34], [646, 14, 0.16], [668, 34, 0.42],
    [710, 18, 0.2], [736, 46, 0.3], [790, 22, 0.14], [820, 30, 0.26],
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(180deg, #E6F3FE 0%, #DCEEFA 44%, #7FAAD2 68%, #0F305D 82%, #0F305D 100%)",
          fontFamily: "Jakarta",
          position: "relative",
        }}
      >
        {/* Die Kugel, von der hellen Spitzlichtseite nach innen. */}
        <div style={{ position: "absolute", right: -150, top: 95, width: 620, height: 620, borderRadius: 310, display: "flex", background: "linear-gradient(142deg, #CACCEC 0%, #7FAAD2 38%, #0D224E 86%)" }} />
        <div style={{ position: "absolute", right: 60, top: 150, width: 300, height: 300, borderRadius: 150, display: "flex", background: "radial-gradient(circle at 40% 36%, rgba(231,179,202,0.95) 0%, rgba(231,179,202,0) 70%)" }} />

        {/* Die Glasstreifen davor. */}
        {strips.map(([x, w, a]) => (
          <div key={x} style={{ position: "absolute", left: x, top: 0, width: w, height: 630, display: "flex", background: `rgba(255,255,255,${a})` }} />
        ))}

        <div style={{ display: "flex", color: "#020C1E", fontSize: 26, fontWeight: 600 }}>ailvl</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 620 }}>
          <div style={{ display: "flex", color: "#020C1E", fontSize: 86, fontWeight: 300, lineHeight: 1.05 }}>
            Als Erster antworten
          </div>
          <div style={{ display: "flex", color: "#020C1E", fontSize: 27, fontWeight: 400, lineHeight: 1.45 }}>
            Jede bezahlte Anfrage in 2 Minuten beantwortet, mit Rückruftermin
          </div>
        </div>

        <div style={{ display: "flex", color: "#E6F3FE", fontSize: 23, fontWeight: 500 }}>
          {TRIAL} kostenlos testen, danach {PRICE_EUR} € pro Monat
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Jakarta", data: light, style: "normal", weight: 300 },
        { name: "Jakarta", data: medium, style: "normal", weight: 500 },
      ],
    },
  );
}
