import { NextResponse, type NextRequest } from "next/server";

/**
 * A per-request nonce, so script-src does not need 'unsafe-inline'.
 *
 * Next emits an inline bootstrap script on every page, and the only way to
 * allow exactly that script and nothing else is a nonce that changes per
 * request. Next reads it from the Content-Security-Policy header on the
 * forwarded request and stamps it on the scripts it renders, so this file is
 * the whole mechanism.
 *
 * The header can only be built here — a value that changes per request cannot
 * come from next.config.ts — so the document routes take their headers from
 * this file, and next.config.ts keeps them for everything else (API responses,
 * static assets) that middleware does not rewrite.
 */
const isDev = process.env.NODE_ENV !== "production";

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const csp = [
    "default-src 'self'",
    /* 'strict-dynamic' lets the bootstrap load the chunks it needs without
       naming each one; browsers that honour it then ignore the host list,
       which is why 'self' stays for the ones that do not. */
    `script-src 'nonce-${nonce}' 'strict-dynamic' 'self'${isDev ? " 'unsafe-eval'" : ""}`,
    /* Styles stay inline-permitted: Next injects style elements without a
       nonce, and a stylesheet cannot exfiltrate the way a script can. */
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://lh3.googleusercontent.com",
    "font-src 'self'",
    `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; ");

  const headers = new Headers(request.headers);
  /* Next extracts the nonce from the Content-Security-Policy on the *request*,
     not from x-nonce — setting only the latter produced a correct-looking
     response header and not one nonce attribute in the HTML, which in
     production means every script blocked and a dead page. x-nonce is here for
     components that want to read it themselves. */
  headers.set("content-security-policy", csp);
  headers.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    /* Documents only. Static assets and the image optimiser are served
       verbatim and gain nothing from a nonce, while running middleware on them
       costs a hop on every file. */
    { source: "/((?!_next/static|_next/image|favicon.ico|icon.svg).*)", missing: [{ type: "header", key: "next-router-prefetch" }] },
  ],
};
