"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

/** Signing out was reachable from nowhere in the app before this. */
export function SignOutButton() {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-ghost"
      aria-busy={pending}
      disabled={pending}
      onClick={() => { setPending(true); void signOut({ callbackUrl: "/" }); }}
    >
      <span className="btn-spin" aria-hidden="true" />
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
