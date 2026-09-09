import Link from "next/link";
import { BrandMark } from "@/components/icons";
import { SignOutButton } from "@/components/SignOutButton";

/** The same bar on every authenticated screen, so nothing moves between them. */
export function AppBar({ context, user }: { context?: string; user?: string | null }) {
  return (
    <header className="app-bar">
      <div className="app-bar-left">
        <Link className="app-brand" href="/dashboard"><BrandMark /><span>Company Brain</span></Link>
        {context ? <><span className="app-bar-sep" aria-hidden="true" /><span className="app-bar-context">{context}</span></> : null}
      </div>
      <div className="app-bar-right">
        {user ? <span className="app-user">{user}</span> : null}
        <Link className="btn btn-ghost" href="/fragen">Fragen</Link>
        <Link className="btn btn-ghost" href="/brain">Wissensbaum</Link>
        <SignOutButton />
      </div>
    </header>
  );
}
