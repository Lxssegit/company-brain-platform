import Link from "next/link";
import { BrandMark } from "@/components/icons";

/**
 * Next prerenders this one and route segment config cannot change that, so its
 * scripts carry no nonce and do not run. It is therefore built to need none:
 * server-rendered text and a plain link, nothing that waits for hydration.
 */
export default function NotFound() {
  return (
    <div className="app">
      <header className="app-bar">
        <div className="app-bar-left">
          <Link className="app-brand" href="/"><BrandMark /><span>Company Brain</span></Link>
        </div>
      </header>
      <main className="app-main app-main-narrow">
        <div className="app-head">
          <div>
            <h1 className="page-title">Hier ist nichts.</h1>
            <p>Diese Adresse führt zu keiner Seite. Entweder hat sich ein Zeichen verirrt, oder das, was hier lag, gibt es nicht mehr.</p>
            <p style={{ marginTop: 18 }}><Link className="btn btn-quiet" href="/dashboard">Zur Übersicht</Link></p>
          </div>
        </div>
      </main>
    </div>
  );
}
