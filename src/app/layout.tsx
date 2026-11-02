import type { Metadata } from "next";
import { display, geist, mono } from "@/app/fonts";
import { AUDIENCE, COMPANY, OFFER } from "@/lib/offer";
import "./globals.css";

export const metadata: Metadata = {
  title: `${OFFER} von ${COMPANY}: Keine Anfrage bleibt mehr liegen`,
  description:
    `Wir melden jede offene Kundenanfrage, bevor der Kunde woanders kauft. Für ${AUDIENCE}. ` +
    "Nur lesend, Verarbeitung in der EU.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de" className={`${display.variable} ${geist.variable} ${mono.variable}`}><body>{children}</body></html>;
}
