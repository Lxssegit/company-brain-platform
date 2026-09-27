import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCurrentUser } from "@/lib/auth/current-user";
import { AppBar } from "@/components/AppBar";
import { loadNetwork, type Network, type NetworkNode } from "@/lib/people/network";
import { radialLayout, type LayoutInput } from "@/lib/people/radial-layout";

export default async function NetworkPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const account = await getCurrentUser().catch(() => null);
  if (!account) redirect("/login");
  if (!account.organizationId) redirect("/organisation");
  if (account.status !== "ACTIVE") redirect("/login");

  let network: Network;
  try {
    network = await loadNetwork(account);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error("[netz] loading the network failed", error);
    return (
      <div className="app">
        <AppBar context="Netz" user={session.user.email} />
        <main className="app-main">
          <section className="panel">
            <div className="state">
              <h3>Das Netz ist nicht erreichbar</h3>
              <p>Der Speicher hat nicht geantwortet. Lokal heißt das meistens, dass PostgreSQL noch nicht läuft.</p>
              <Link className="btn btn-quiet" href="/brain">Zum Baum</Link>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const branches = network.nodes.filter((node) => node.kind === "branch").length;
  const people = network.nodes.filter((node) => node.kind === "person").length;

  return (
    <div className="app">
      <AppBar context="Netz" user={session.user.email} />
      <main className="app-main">
        <div className="app-head">
          <div>
            <h1 className="page-title">Was zusammenhängt.</h1>
            <p>
              Derselbe Bestand wie im Baum, nur nicht als Liste: Zweige, die Menschen darin und das freigegebene Wissen,
              das daran hängt. Was Sie nicht lesen dürfen, ist hier nicht ausgegraut — es ist nicht gezeichnet.
            </p>
          </div>
        </div>

        <section className="panel">
          <div className="panel-head">
            <h2>{branches === 1 ? "1 Zweig" : `${branches} Zweige`}, {people === 1 ? "1 Person" : `${people} Personen`}</h2>
            <span className="pill pill-on">Berechtigungsgefiltert</span>
          </div>
          {network.nodes.length === 0 ? (
            <div className="state">
              <h3>Für Sie ist hier nichts gezeichnet</h3>
              <p>Sie haben auf keinen Zweig Zugriff. Wer das ändern kann, steht auf Ihrem Profil unter Wissenszugriff.</p>
            </div>
          ) : (
            <NetworkFigure network={network} />
          )}
          {network.omitted > 0 ? (
            <p className="hit-meta access-aside">
              {network.omitted === 1
                ? "Ein weiterer Zweig existiert in dieser Organisation. Er wurde nicht ausgeblendet, sondern gar nicht erst geladen."
                : `${network.omitted} weitere Zweige existieren in dieser Organisation. Sie wurden nicht ausgeblendet, sondern gar nicht erst geladen.`}
            </p>
          ) : null}
        </section>
      </main>
    </div>
  );
}

const RADIUS: Record<NetworkNode["kind"], number> = { branch: 7, person: 5, knowledge: 3 };

function NetworkFigure({ network }: { network: Network }) {
  /* The layout wants a tree. Structure and authorship are different kinds of
     line: a person belongs under exactly one branch for the purpose of finding
     a place to sit, and the second membership is drawn afterwards as a line
     rather than moving them. */
  const parentOf = new Map<string, string>();
  for (const edge of network.edges) {
    if (edge.kind === "authorship") continue;
    if (!parentOf.has(edge.to)) parentOf.set(edge.to, edge.from);
  }

  const input: LayoutInput[] = network.nodes.map((node) => ({
    id: node.id,
    parentId: parentOf.get(node.id) ?? null,
    /* Leaves sit just outside their branch instead of a full ring away, so a
       deep tree does not push the outermost notes off the canvas. */
    weight: node.kind === "branch" ? 1 : 0.72,
  }));

  const { placed, extent } = radialLayout(input, { ringGap: 150 });
  const pad = 120;
  const size = (extent + pad) * 2;
  const view = `${-(extent + pad)} ${-(extent + pad)} ${size} ${size}`;

  return (
    <figure className="net">
      <svg className="net-svg" viewBox={view} role="img" aria-labelledby="net-title">
        <title id="net-title">
          Radiale Darstellung der für Sie sichtbaren Zweige, der Personen darin und des freigegebenen Wissens.
        </title>
        <g className="net-edges">
          {network.edges.map((edge, index) => {
            const a = placed.get(edge.from);
            const b = placed.get(edge.to);
            if (!a || !b) return null;
            /* Bowed toward the centre. Straight chords across a radial layout
               cut through the rings and read as connections that are not there. */
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            const path = `M ${a.x} ${a.y} Q ${mx * 0.72} ${my * 0.72} ${b.x} ${b.y}`;
            return <path key={`${edge.from}-${edge.to}-${index}`} className={`net-edge net-edge-${edge.kind}`} d={path} />;
          })}
        </g>
        <g className="net-nodes">
          {network.nodes.map((node) => {
            const point = placed.get(node.id);
            if (!point) return null;
            const label = node.kind === "knowledge" ? null : node.label;
            /* Labels on the left half read backwards if they keep the ring's
               rotation, so that half is flipped and anchored the other way. */
            const flip = Math.cos(point.angle) < 0;
            return (
              <g key={node.id} className={`net-node net-node-${node.kind}`}>
                <circle cx={point.x} cy={point.y} r={RADIUS[node.kind]} />
                {label ? (
                  <text
                    x={point.x}
                    y={point.y}
                    dx={flip ? -12 : 12}
                    dy="0.32em"
                    textAnchor={flip ? "end" : "start"}
                  >
                    {label}
                  </text>
                ) : (
                  <title>{node.label}</title>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      <figcaption className="net-legend">
        <span className="net-key net-key-branch">Zweig</span>
        <span className="net-key net-key-person">Person</span>
        <span className="net-key net-key-knowledge">Freigegebenes Wissen</span>
      </figcaption>

      {/* The picture is for the shape of things. Anything you actually need to
          open is in the list under it, where it can be tabbed to and read by a
          screen reader without parsing an SVG. */}
      <details className="net-index">
        <summary>Alles hier als Liste</summary>
        <ul className="plain-list net-index-list">
          {network.nodes
            .filter((node) => node.kind !== "knowledge")
            .map((node) => (
              <li key={node.id}>
                <Link href={node.href}>{node.label}</Link>
                {node.kind === "person" && node.subtitle ? <span className="person-line-title"> {node.subtitle}</span> : null}
              </li>
            ))}
        </ul>
      </details>
    </figure>
  );
}
