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

/** Interface and reading voice, variable weight 400-900. */
export const sans = localFont({
  src: [{ path: "./fonts/schibsted-grotesk-latin-wght-normal.woff2", weight: "400 900", style: "normal" }],
  variable: "--font-sans",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Helvetica Neue", "sans-serif"],
});
