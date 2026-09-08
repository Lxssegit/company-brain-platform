import Link from "next/link";

export default function HomePage() {
  return (
    <main className="foundation-shell">
      <div className="foundation-card">
        <div className="foundation-mark"><span>✦</span></div>
        <p className="foundation-kicker">COMPANY BRAIN · PHASE 6</p>
        <h1>The foundation for a trusted company memory.</h1>
        <p className="foundation-copy">Identity, tenant isolation, branch context, knowledge workflows, Decision Memory, and permission-aware retrieval are now defined behind a server boundary. The original product prototype remains available as the UI reference.</p>
        <div className="foundation-actions"><Link className="foundation-button primary" href="/login">Open sign in</Link><Link className="foundation-button secondary" href="/brain">Open server tree ↗</Link><a className="foundation-button secondary" href="http://localhost:4173/">View UI prototype ↗</a></div>
        <div className="foundation-grid"><div><span>01</span><strong>Identity</strong><small>Auth.js route and session contract</small></div><div><span>02</span><strong>Tenancy</strong><small>Organization-scoped data model</small></div><div><span>03</span><strong>Permissions</strong><small>Server-side role policy gate</small></div></div>
      </div>
    </main>
  );
}
