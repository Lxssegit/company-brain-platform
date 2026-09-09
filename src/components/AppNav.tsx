"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";

export type NavLink = { href: string; label: string };

/**
 * Five destinations do not fit across a phone. Shaving labels until they do
 * costs meaning, and a row that wraps three deep is not a bar — so below the
 * breakpoint the same list becomes a disclosure. There is one list either way;
 * only its shape changes.
 */
export function AppNav({ links, user }: { links: NavLink[]; user?: string | null }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    const onDown = (event: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onDown); };
  }, [open]);

  return (
    <div className="app-nav" ref={wrap} data-open={open || undefined}>
      <button className="btn btn-quiet app-nav-toggle" type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((was) => !was)}>
        {open ? "Schließen" : "Menü"}
      </button>
      <div className="app-nav-panel" id={panelId}>
        {user ? <span className="app-user">{user}</span> : null}
        {links.map((link) => (
          <Link key={link.href} className="btn btn-ghost" href={link.href} onClick={() => setOpen(false)}>{link.label}</Link>
        ))}
        <SignOutButton />
      </div>
    </div>
  );
}
