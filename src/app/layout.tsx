import type { Metadata } from "next";
import { display, sans } from "@/app/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Company Brain",
  description: "The operating memory for your company.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${display.variable} ${sans.variable}`}><body>{children}</body></html>;
}
