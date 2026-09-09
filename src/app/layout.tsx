import type { Metadata } from "next";
import { display, sans } from "@/app/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Company Brain",
  description: "Das Betriebsgedächtnis Ihres Unternehmens.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de" className={`${display.variable} ${sans.variable}`}><body>{children}</body></html>;
}
