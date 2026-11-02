import localFont from "next/font/local";

/**
 * Self-hosted so the page ships no third-party request and no layout shift.
 * Both families are licensed under the SIL Open Font License 1.1; the notices
 * live next to the files in ./fonts/LICENSE.txt.
 */

/** Display voice: high contrast, editorial, holds up against the ember glow. */
export const display = localFont({
  src: [
    { path: "./fonts/instrument-serif-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/instrument-serif-latin-400-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-display",
  display: "swap",
  fallback: ["ui-serif", "Georgia", "Times New Roman", "serif"],
});

/**
 * The public page only. The signed-in application keeps Schibsted Grotesk
 * below, because changing the face people read all day is a separate decision
 * from changing the face strangers meet once.
 */
export const geist = localFont({
  src: [
    { path: "./fonts/geist-sans-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/geist-sans-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/geist-sans-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-geist",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Helvetica Neue", "sans-serif"],
});

/** Figures and labels, where equal advance widths keep a column honest. */
export const mono = localFont({
  src: [{ path: "./fonts/geist-mono-latin-400-normal.woff2", weight: "400", style: "normal" }],
  variable: "--font-mono",
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
});

/** Interface and reading voice, variable weight 400-900. */
export const sans = localFont({
  src: [{ path: "./fonts/schibsted-grotesk-latin-wght-normal.woff2", weight: "400 900", style: "normal" }],
  variable: "--font-sans",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Helvetica Neue", "sans-serif"],
});
