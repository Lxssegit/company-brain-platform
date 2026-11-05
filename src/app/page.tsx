import { LandingPage } from "@/app/LandingPage";

/**
 * A server shell around the page, purely so this route can opt out of
 * prerendering. A prerendered page's HTML is written at build time, and it
 * cannot carry the per-request nonce the Content-Security-Policy names.
 *
 * It also reads the one query parameter the page cares about: the result the
 * form's route handler redirects back with. That is the whole reason the
 * confirmation needs no client JavaScript.
 */
export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ testzugang?: string }>;
}) {
  const { testzugang } = await searchParams;
  const status = testzugang === "ok" || testzugang === "fehler" ? testzugang : undefined;
  return <LandingPage status={status} />;
}
