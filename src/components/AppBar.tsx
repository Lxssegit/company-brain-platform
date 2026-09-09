import Link from "next/link";
import { BrandMark } from "@/components/icons";
import { AppNav, type NavLink } from "@/components/AppNav";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasRolePermission } from "@/lib/permissions/policy";

/**
 * The same bar on every authenticated screen, so nothing moves between them.
 *
 * It reads its own permissions rather than taking them as props. Threading a
 * flag per destination through every page is how a destination quietly goes
 * missing on one of them — which had already happened to the branch page's
 * error path.
 */
export async function AppBar({ context, user }: { context?: string; user?: string | null }) {
  const account = await getCurrentUser().catch(() => null);
  const role = account?.role?.key;

  const links: NavLink[] = [
    { href: "/fragen", label: "Fragen" },
    { href: "/festhalten", label: "Festhalten" },
    ...(hasRolePermission(role, "APPROVE") ? [{ href: "/freigaben", label: "Freigaben" }] : []),
    { href: "/brain", label: "Wissensbaum" },
    ...(hasRolePermission(role, "MANAGE_USERS") ? [{ href: "/team", label: "Team" }] : []),
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
