import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * The app shipped with no security headers at all. Notes on the loose parts:
 *
 * - Document requests get their Content-Security-Policy from src/middleware.ts
 *   instead of this file, because it carries a per-request nonce and a value
 *   that changes per request cannot be written here. This policy is the floor
 *   for everything middleware does not rewrite: API responses and static files.
 *   Neither is a document, so no script runs under it; script-src 'none' says
 *   so rather than repeating an allowance nothing needs.
 * - 'unsafe-eval' and the websocket connect-src exist only for the dev server's
 *   hot reload and are not present in a production build.
 * - Fonts are self-hosted, so font-src and style-src need no external origin.
 */
const csp = [
  "default-src 'self'",
  `script-src 'none'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://lh3.googleusercontent.com",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
