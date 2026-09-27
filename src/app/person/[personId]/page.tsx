import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCurrentUser } from "@/lib/auth/current-user";
import { AppBar } from "@/components/AppBar";
import { loadPersonProfile, type PersonProfile } from "@/lib/people/profile";
import { describeAccessReason } from "@/lib/branches/explain";
import { BRANCH_KIND_LABEL, KNOWLEDGE_STATUS_LABEL, KNOWLEDGE_TYPE_LABEL, ROLE_LABEL, USER_STATUS_LABEL } from "@/lib/i18n/de";

/* Tabs as a query parameter rather than client state. The panels are all server
   data, every one of them is worth linking to on its own, and a person's access
   is exactly the kind of thing somebody pastes into a message to ask "is this
   right?". Holding it in useState would cost that and buy nothing. */
const TABS = ["ueberblick", "zugriff", "beitraege"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABEL: Record<Tab, string> = {
  ueberblick: "Überblick",
  zugriff: "Wissenszugriff",
  beitraege: "Beiträge",
};

function asTab(value: string | string[] | undefined): Tab {
  const first = Array.isArray(value) ? value[0] : value;
  return TABS.includes(first as Tab) ? (first as Tab) : "ueberblick";
}

const dateFormat = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "long", year: "numeric" });

export default async function PersonPage({
  params,
  searchParams,
}: {
  params: Promise<{ personId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { personId } = await params;
  const tab = asTab((await searchParams).tab);

  const account = await getCurrentUser().catch(() => null);
  if (!account) redirect("/login");
  if (!account.organizationId) redirect("/organisation");
  if (account.status !== "ACTIVE") redirect("/login");

  let profile: PersonProfile | null;
  try {
    profile = await loadPersonProfile(account, personId);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    return (
      <div className="app">
        <AppBar context="Person" user={session.user.email} />
        <main className="app-main app-main-narrow">
          <section className="panel">
            <div className="state">
              <h3>Dieses Profil ist nicht erreichbar</h3>
              <p>Der Speicher hat nicht geantwortet. Lokal heißt das meistens, dass PostgreSQL noch nicht läuft.</p>
              <Link className="btn btn-quiet" href="/team">Zurück zum Team</Link>
            </div>
          </section>
        </main>
      </div>
    );
  }
  /* Someone from another organization and someone who does not exist are the
     same answer on purpose: a distinguishable 403 confirms the account. */
  if (!profile) notFound();

  const { person } = profile;
  /* A tab nobody may open must not be reachable by typing its name into the
     address bar either. */
  const active: Tab = tab === "zugriff" && !profile.maySeeAccess ? "ueberblick" : tab;
  const tabs = TABS.filter((item) => item !== "zugriff" || profile.maySeeAccess);

  return (
    <div className="app">
      <AppBar context="Person" user={session.user.email} />
      <main className="app-main app-main-narrow">
        <nav aria-label="Pfad">
          <ol className="crumbs">
            <li><Link href="/team">Team</Link></li>
            <li aria-current="page">{person.name}</li>
          </ol>
        </nav>

        <header className="person-head">
          <div className="person-identity">
            <h1 className="page-title">{person.name}</h1>
            {person.jobTitle ? <p className="person-title">{person.jobTitle}</p> : null}
            <p className="person-facts">
              <span>{person.roleKey ? ROLE_LABEL[person.roleKey] : "Ohne Rolle"}</span>
              <span aria-hidden="true">·</span>
              <span>{USER_STATUS_LABEL[person.status]}</span>
              <span aria-hidden="true">·</span>
              <a href={`mailto:${person.email}`}>{person.email}</a>
            </p>
          </div>
          {profile.isSelf ? <span className="pill pill-on">Das sind Sie</span> : null}
        </header>

        <nav className="tabs" aria-label="Abschnitte">
          {tabs.map((item) => (
            <Link
              key={item}
              className="tab"
              href={`/person/${person.id}${item === "ueberblick" ? "" : `?tab=${item}`}`}
              aria-current={item === active ? "page" : undefined}
            >
              {TAB_LABEL[item]}
            </Link>
          ))}
        </nav>

        {active === "ueberblick" ? <Overview profile={profile} /> : null}
        {active === "zugriff" ? <Access profile={profile} /> : null}
        {active === "beitraege" ? <Contributions profile={profile} /> : null}
      </main>
    </div>
  );
}

function Overview({ profile }: { profile: PersonProfile }) {
  const { person, manager, reports } = profile;
  return (
    <>
      <section className="panel">
        <div className="panel-head"><h2>Über</h2></div>
        {person.bio ? <p className="person-bio">{person.bio}</p> : <p className="person-bio person-bio-empty">Zu dieser Person ist noch nichts hinterlegt.</p>}
        <p className="hit-meta">Im Unternehmen seit {dateFormat.format(person.since)}</p>
      </section>

      <section className="panel">
        <div className="panel-head"><h2>Berichtsstruktur</h2></div>
        {!manager && reports.length === 0 ? (
          <div className="state">
            <h3>Noch keine Linien gezogen</h3>
            <p>Weder eine Führungskraft noch direkte Zuordnungen hinterlegt. Das ist kein Fehler — viele Unternehmen halten das nirgends fest, bevor sie es hier tun.</p>
          </div>
        ) : (
          <div className="reporting">
            {manager ? (
              <div className="reporting-up">
                <span className="reporting-label">Berichtet an</span>
                <PersonLine person={manager} />
              </div>
            ) : (
              <div className="reporting-up">
                <span className="reporting-label">Berichtet an</span>
                <p className="hit-meta">Niemanden — oberste Ebene.</p>
              </div>
            )}
            <div className="reporting-down">
              <span className="reporting-label">{reports.length === 1 ? "Eine direkte Zuordnung" : `${reports.length} direkte Zuordnungen`}</span>
              {reports.length === 0 ? <p className="hit-meta">Keine.</p> : (
                <ul className="plain-list">
                  {reports.map((report) => <li key={report.id}><PersonLine person={report} /></li>)}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>
    </>
  );
}

function PersonLine({ person }: { person: { id: string; name: string; jobTitle: string | null } }) {
  return (
    <Link className="person-line" href={`/person/${person.id}`}>
      <span className="person-line-name">{person.name}</span>
      {person.jobTitle ? <span className="person-line-title">{person.jobTitle}</span> : null}
    </Link>
  );
}

function Access({ profile }: { profile: PersonProfile }) {
  const readable = profile.access.filter((row) => row.visible);
  const withheld = profile.access.filter((row) => !row.visible);
  /* Everyone's personal branch is closed to everyone else — that is the design,
     not a finding. Listing each one buried the single row worth reviewing under
     eleven that say nothing, so they are counted instead. A deny still shows
     individually: somebody went out of their way to write it. */
  const blocked = withheld.filter((row) => row.kind !== "PERSONAL" || row.reason === "DENIED");
  const personalCount = withheld.length - blocked.length;

  return (
    <>
      <section className="panel">
        <div className="panel-head">
          <h2>Liest {readable.length === 1 ? "einen Zweig" : `${readable.length} Zweige`}</h2>
          <span className="pill pill-on">Serverseitig aufgelöst</span>
        </div>
        <p className="panel-lede">
          Dieselbe Regel, die vor jeder Suche greift — hier nur ausgeschrieben. Ein Zweig steht unter „Kontext“, wenn er
          nicht selbst freigegeben ist, sondern nur deshalb sichtbar, weil etwas darunter freigegeben wurde.
        </p>
        {readable.length === 0 ? (
          <div className="state"><h3>Liest nichts</h3><p>Keine Freigabe, keine Rolle, die eine ersetzt.</p></div>
        ) : (
          <ul className="access-list">
            {readable.map((row) => <AccessRow key={row.branchId} row={row} />)}
          </ul>
        )}
      </section>

      {blocked.length > 0 || personalCount > 0 ? (
        <section className="panel">
          <div className="panel-head"><h2>Bleibt verschlossen</h2></div>
          <p className="panel-lede">
            Diese Zweige existieren, aber eine Suche dieser Person erreicht sie nicht. Sie tauchen in keiner Antwort auf,
            auch nicht als Bruchstück.
          </p>
          {blocked.length > 0 ? (
            <ul className="access-list">
              {blocked.map((row) => <AccessRow key={row.branchId} row={row} />)}
            </ul>
          ) : null}
          {personalCount > 0 ? (
            <p className="hit-meta access-aside">
              Dazu {personalCount === 1 ? "ein persönlicher Zweig" : `${personalCount} persönliche Zweige`} anderer
              Personen. Die sind für alle außer ihren Eigentümern verschlossen — dafür braucht es keine Entscheidung.
            </p>
          ) : null}
        </section>
      ) : null}
    </>
  );
}

function AccessRow({ row }: { row: PersonProfile["access"][number] }) {
  const reason = row.reason === "CONTEXT" && row.viaBranchName
    ? `Als Kontext, freigegeben ist ${row.viaBranchName}`
    : row.reason === "DENIED" && row.viaBranchName
      ? `Gesperrt über ${row.viaBranchName}`
      : describeAccessReason(row.reason);

  return (
    <li className="access-row" data-reason={row.reason} style={{ ["--indent" as string]: row.depth }}>
      <span className="access-branch">
        <Link href={`/brain/${row.branchId}`}>{row.name}</Link>
        <span className="tree-kind">{BRANCH_KIND_LABEL[row.kind]}</span>
      </span>
      <span className="access-reason">{reason}</span>
    </li>
  );
}

function Contributions({ profile }: { profile: PersonProfile }) {
  const { contributions, decisions } = profile;
  return (
    <>
      <section className="panel">
        <div className="panel-head"><h2>Festgehalten</h2></div>
        {contributions.length === 0 ? (
          <div className="state"><h3>Noch nichts festgehalten</h3><p>Diese Person hat bisher keine Wissenseinheit angelegt, die noch aktiv ist.</p></div>
        ) : (
          <ul className="hit-list">
            {contributions.map((unit) => (
              <li className="hit" key={unit.id}>
                <Link className="hit-content" href={`/brain/${unit.branchId}`}>{unit.title}</Link>
                <p className="hit-meta">
                  {KNOWLEDGE_TYPE_LABEL[unit.type]} · {KNOWLEDGE_STATUS_LABEL[unit.status]} · {unit.branchName} · {dateFormat.format(unit.updatedAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <div className="panel-head"><h2>Entschieden</h2></div>
        {decisions.length === 0 ? (
          <div className="state"><h3>Keine Entscheidungen</h3><p>Diese Person hat keine Entscheidung eingetragen.</p></div>
        ) : (
          <ul className="hit-list">
            {decisions.map((item) => (
              <li className="hit" key={item.id}>
                <Link className="hit-content" href="/entscheidungen">{item.title}</Link>
                <p className="hit-meta">{item.status === "SUPERSEDED" ? "Ersetzt" : item.status === "ACTIVE" ? "Gilt" : item.status} · gültig ab {dateFormat.format(item.validFrom)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
