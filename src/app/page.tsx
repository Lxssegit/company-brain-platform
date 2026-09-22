import { LandingPage } from "@/app/LandingPage";

/**
 * A server shell around the client page, purely so this route can opt out of
 * prerendering. Route segment config is ignored in a client component, and a
 * prerendered page's HTML is written at build time — it cannot carry the
 * per-request nonce the Content-Security-Policy names, so every script on it is
 * blocked. The page fetches nothing, so the cost is a template render.
 */
export const dynamic = "force-dynamic";

export default function Home() {
  return <LandingPage />;
}
