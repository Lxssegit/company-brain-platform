import type { Metadata } from "next";
import { OFFER } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: `${OFFER}: Als Erster auf bezahlte Anfragen antworten`,
  description:
    "Jede Portal-Anfrage in 2 Minuten beantwortet, mit Rückruftermin. Für Betriebe, " +
    "die für Anfragen bezahlen. Verarbeitung in der EU. 1 Woche kostenlos testen.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <head>
        {/* Nur die zwei Schnitte, die über der Falte stehen. Die Schrift liegt
            lokal unter public/fonts, der Rest wird nachgeladen, wenn er
            gebraucht wird. */}
        <link rel="preload" href="/fonts/plus-jakarta-sans-300.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/plus-jakarta-sans-400.woff2" as="font" type="font/woff2" crossOrigin="" />
      </head>
      <body>{children}</body>
    </html>
  );
}
