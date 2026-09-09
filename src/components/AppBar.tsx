import Link from "next/link";
import { BrandMark } from "@/components/icons";
import { AppNav, type NavLink } from "@/components/AppNav";

/** The same bar on every authenticated screen, so nothing moves between them. */
export function AppBar({ context, user, canApprove }: { context?: string; user?: string | null; canApprove?: boolean }) {
  const links: NavLink[] = [
    { href: "/fragen", label: "Fragen" },
    { href: "/festhalten", label: "Festhalten" },
    ...(canApprove ? [{ href: "/freigaben", label: "Freigaben" }] : []),
    { href: "/brain", label: "Wissensbaum" },
  ];

  return (
    <header className="app-bar">
      <div className="app-bar-left">
        <Link className="app-brand" href="/dashboard"><BrandMark /><span>Company Brain</span></Link>
        {context ? <><span className="app-bar-sep" aria-hidden="true" /><span className="app-bar-context">{context}</span></> : null}
      </div>
      <AppNav links={links} user={user} />
    </header>
  );
}
