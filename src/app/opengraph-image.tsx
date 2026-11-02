import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { AUDIENCE, COMPANY, OFFER } from "@/lib/offer";

export const alt = `${OFFER} von ${COMPANY}: Keine Anfrage bleibt mehr liegen`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The share card, drawn with the page's own palette rather than screenshotted
 * from it: a screenshot of a page that scrolls crops badly at 1200×630, and it
 * goes stale the first time a margin moves.
 *
 * Satori, which renders this, supports neither CSS filters nor mask-image, so
 * the horizon cannot be the page's blurred ellipse. It is built instead from a
 * stack of concentric radial gradients — the same colours, in the same order,
 * with the hot core on top, reaching the same effect by a route the renderer
 * can actually take.
 */
export default async function Image() {
  /* TTF, not the woff2 the page itself loads: Satori reads ttf, otf and woff
     and rejects woff2 outright ("Unsupported OpenType signature wOF2"). These
     two are the same faces, decompressed once and kept beside the originals.
     They are read on the server at build time and never reach a browser. */
  const [display, geist] = await Promise.all([
    readFile(join(process.cwd(), "src/app/fonts/instrument-serif-400.ttf")),
    readFile(join(process.cwd(), "src/app/fonts/geist-sans-500.ttf")),
  ]);

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
          background: "#02070A",
          position: "relative",
        }}
      >
        {/* The horizon, from the widest wash inward to the core. */}
        <div style={{ position: "absolute", left: "-20%", right: "-20%", bottom: "-58%", height: "118%", background: "radial-gradient(ellipse at 50% 100%, rgba(2,151,222,0.42) 0%, rgba(2,151,222,0.14) 44%, rgba(2,7,10,0) 72%)", display: "flex" }} />
        <div style={{ position: "absolute", left: "8%", right: "8%", bottom: "-44%", height: "92%", background: "radial-gradient(ellipse at 50% 100%, rgba(2,151,222,0.92) 0%, rgba(2,151,222,0.40) 38%, rgba(2,7,10,0) 70%)", display: "flex" }} />
        <div style={{ position: "absolute", left: "33%", right: "33%", bottom: "-26%", height: "58%", background: "radial-gradient(ellipse at 50% 100%, rgba(255,230,214,0.80) 0%, rgba(252,115,77,0.96) 24%, rgba(252,115,77,0.45) 52%, rgba(2,7,10,0) 78%)", display: "flex" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 14, color: "rgba(255,255,255,0.92)", fontFamily: "Geist", fontSize: 26, letterSpacing: "-0.01em" }}>
          <svg width="30" height="30" viewBox="0 0 28 28">
            <path d="M3 19.5c3.4 0 4.1-5 7.5-5s4.1 5 7.5 5 4.1-8 7-8" fill="none" stroke="#0297DE" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="25" cy="11.5" r="2.1" fill="#0297DE" />
          </svg>
          <span>ailvl</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", color: "rgba(255,255,255,0.92)", fontFamily: "Instrument", fontSize: 92, lineHeight: 1.04, letterSpacing: "-0.02em" }}>
            Keine Anfrage bleibt mehr liegen.
          </div>
          <div style={{ display: "flex", color: "rgba(255,255,255,0.60)", fontFamily: "Geist", fontSize: 27, lineHeight: 1.45, maxWidth: 820 }}>
            Für {AUDIENCE}. Nur lesend, Verarbeitung in der EU.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Instrument", data: display, style: "normal", weight: 400 },
        { name: "Geist", data: geist, style: "normal", weight: 500 },
      ],
    },
  );
}
