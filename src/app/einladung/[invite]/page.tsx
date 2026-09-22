import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { inviteIdentifier, inviteSecretMatches, parseInviteParam } from "@/lib/invitations/token";
import { ROLE_LABEL, sentenceEnd } from "@/lib/i18n/de";
import { BrandMark } from "@/components/icons";
import { AcceptForm } from "@/app/einladung/[invite]/AcceptForm";

type Standing =
  | { kind: "ok"; name: string; email: string; organization: string; role: string }
  | { kind: "invalid" }
  | { kind: "unreachable" };

async function readInvitation(param: string): Promise<Standing> {
  const parsed = parseInviteParam(param);
  if (!parsed) return { kind: "invalid" };
  try {
    const stored = await prisma.verificationToken.findFirst({ where: { identifier: inviteIdentifier(parsed.userId) } });
    if (!stored || !inviteSecretMatches(parsed.secret, stored.token) || stored.expires.getTime() <= Date.now()) return { kind: "invalid" };
    const user = await prisma.user.findUnique({
      where: { id: parsed.userId },
      select: { name: true, email: true, status: true, organization: { select: { name: true } }, role: { select: { key: true } } },
    });
    if (!user || user.status !== "INVITED" || !user.organization) return { kind: "invalid" };
    return { kind: "ok", name: user.name ?? user.email, email: user.email, organization: user.organization.name, role: user.role ? ROLE_LABEL[user.role.key] : "Mitarbeitend" };
  } catch {
    return { kind: "unreachable" };
  }
}

export default async function InvitationPage({ params }: { params: Promise<{ invite: string }> }) {
  const { invite } = await params;
  const standing = await readInvitation(invite);

  return (
    <div className="app">
      <header className="app-bar">
        <div className="app-bar-left">
          <Link className="app-brand" href="/"><BrandMark /><span>Company Brain</span></Link>
        </div>
      </header>
      <main className="app-main app-main-narrow">
        {/* On these two the message is the whole page, so it carries the page's
            voice and its only h1 — not a panel heading under nothing. */}
        {standing.kind === "unreachable" ? (
          <div className="app-head">
            <div>
              <h1 className="page-title">Die Einladung lässt sich gerade nicht prüfen.</h1>
              <p>Der Speicher hat nicht geantwortet. Versuchen Sie es in ein paar Minuten noch einmal — der Link bleibt gültig.</p>
            </div>
          </div>
        ) : standing.kind === "invalid" ? (
          <div className="app-head">
            <div>
              <h1 className="page-title">Diese Einladung gilt nicht mehr.</h1>
              <p>Einladungen laufen nach sieben Tagen ab, und jede lässt sich nur einmal einlösen. Bitten Sie die Person, die Sie eingeladen hat, um einen neuen Link.</p>
              <p style={{ marginTop: 18 }}><Link className="btn btn-quiet" href="/login">Zur Anmeldung</Link></p>
            </div>
          </div>
        ) : (
          <>
            <div className="app-head">
              <div>
                <h1 className="page-title">Willkommen bei {sentenceEnd(standing.organization)}</h1>
                <p>Sie wurden als {standing.role} eingeladen. Vergeben Sie ein Passwort, dann gehört das Konto Ihnen — und Ihr persönlicher Zweig steht schon bereit.</p>
              </div>
            </div>
            <AcceptForm invite={invite} name={standing.name} email={standing.email} />
          </>
        )}
      </main>
    </div>
  );
}
