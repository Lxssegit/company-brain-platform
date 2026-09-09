"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowDown, ArrowUpRight, BrandMark } from "@/components/icons";

/**
 * Every limb is one path, and every branch owns exactly one limb. `tip` is the
 * final point of that path in the SVG's own coordinate space, so a label is
 * anchored to real geometry instead of a guessed percentage of the container.
 * `start`/`span` are the window inside the scroll progress in which that limb
 * draws itself.
 */
type Branch = {
  id: string;
  label: string;
  copy: string;
  d: string;
  tip: [number, number];
  start: number;
  span: number;
  accent: string;
};

const TRUNK = "M500 735 C472 643 516 562 492 490 C474 434 500 367 505 294 C510 222 482 153 515 82";
const ROOTS = "M501 681 C450 704 415 725 365 746 M505 689 C553 710 600 725 652 743 M481 700 C447 738 432 753 412 758 M524 698 C558 732 580 747 606 758";

const branches: Branch[] = [
  { id: "strategy", label: "Strategie", copy: "Der unternehmensweite Kontext, der jede Entscheidung auf denselben Horizont ausrichtet.", d: "M502 350 C451 316 403 285 330 241 C294 219 253 208 203 202", tip: [203, 202], start: 0.26, span: 0.16, accent: "#ffb45a" },
  { id: "customers", label: "Kunden", copy: "Aus Kundenbedürfnissen und Marktsignalen wird nutzbarer Kontext statt verstreuter Notizen.", d: "M507 273 C556 238 613 209 681 185 C737 165 787 158 845 170", tip: [845, 170], start: 0.30, span: 0.16, accent: "#ffe0a8" },
  { id: "people", label: "Menschen", copy: "Rollen, Fachwissen und der lebendige Kontext hinter den Menschen, die das Unternehmen tragen.", d: "M497 447 C438 416 381 393 302 371 C250 357 201 359 145 380", tip: [145, 380], start: 0.36, span: 0.16, accent: "#ffd18a" },
  { id: "decisions", label: "Entscheidungen", copy: "Das Warum hinter wichtigen Entscheidungen bleibt sichtbar, verknüpft und nachlesbar.", d: "M506 385 C553 349 607 315 680 286 C737 263 773 255 812 257", tip: [812, 257], start: 0.42, span: 0.16, accent: "#ff9c4d" },
  { id: "knowledge", label: "Wissen", copy: "Geprüftes Wissen wächst zu einer berechtigungsbewussten Quelle der Wahrheit für das ganze Team.", d: "M501 506 C568 476 634 454 710 430 C771 411 827 405 885 421", tip: [885, 421], start: 0.48, span: 0.16, accent: "#ffc16d" },
  { id: "operations", label: "Betrieb", copy: "Die kleinen Signale, Rituale und Abläufe, die eine Organisation lebendig machen.", d: "M503 566 C556 549 614 543 690 550 C748 556 792 566 830 583", tip: [830, 583], start: 0.54, span: 0.16, accent: "#ff7b2d" },
  { id: "product", label: "Produkt & Technik", copy: "Das gemeinsame Gedächtnis dafür, was gebaut wird, warum es zählt und wie es funktioniert.", d: "M499 604 C444 590 390 587 322 596 C266 604 224 615 188 632", tip: [188, 632], start: 0.60, span: 0.16, accent: "#ff8c3d" },
];

const limbStyle = (branch: Branch) => ({ "--limb-start": branch.start, "--limb-span": branch.span, "--limb-accent": branch.accent }) as CSSProperties;

function HeroSeed() {
  return (
    <svg className="hero-seed" viewBox="0 0 420 420" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="seedTrunk" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#8c3f1d" /><stop offset=".45" stopColor="#d96928" /><stop offset="1" stopColor="#ffdf9d" /></linearGradient>
        <radialGradient id="seedLight"><stop offset="0" stopColor="#ffe6b8" stopOpacity=".5" /><stop offset=".35" stopColor="#ff9b42" stopOpacity=".14" /><stop offset="1" stopColor="#d84f1e" stopOpacity="0" /></radialGradient>
        <filter id="seedGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="7" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <circle cx="210" cy="222" r="168" fill="url(#seedLight)" />
      <circle className="hero-seed-ring" cx="210" cy="210" r="196" />
      <g filter="url(#seedGlow)">
        <path className="hero-seed-root" d="M210 330 C182 344 163 356 140 372 M212 334 C240 348 262 360 284 375 M204 340 C190 360 182 370 172 378" />
        <path className="hero-seed-trunk" d="M210 336 C198 288 220 254 206 214 C196 186 210 152 214 116" />
        <path className="hero-seed-limb" d="M209 244 C182 226 158 214 120 204 M211 208 C242 190 268 178 304 172" />
        <circle className="hero-seed-core" cx="208" cy="228" r="9" />
        <circle className="hero-seed-tip" cx="214" cy="116" r="6" />
      </g>
    </svg>
  );
}

export default function HomePage() {
  const storyRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const captionRef = useRef<HTMLParagraphElement>(null);

  const [nodePoints, setNodePoints] = useState<Array<{ x: number; y: number; side: "left" | "right" }>>([]);
  const [compact, setCompact] = useState(false);
  const [activeBranch, setActiveBranch] = useState("strategy");

  /* Labels stay in HTML so they keep a readable pixel size, but their position
     is read back out of the rendered SVG. That pins every label to its own
     branch tip at any aspect ratio instead of letting the two coordinate
     systems drift apart. */
  const placeNodes = useCallback(() => {
    const svg = svgRef.current;
    const scene = sceneRef.current;
    if (!svg || !scene) return;
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    const box = scene.getBoundingClientRect();
    if (!box.width) return;
    setNodePoints(branches.map((branch) => {
      const point = new DOMPoint(branch.tip[0], branch.tip[1]).matrixTransform(matrix);
      const x = point.x - box.left;
      return { x, y: point.y - box.top, side: x < box.width / 2 ? "left" : "right" };
    }));
  }, []);

  useEffect(() => {
    placeNodes();
    const observer = new ResizeObserver(placeNodes);
    const scene = sceneRef.current;
    if (scene) observer.observe(scene);
    return () => observer.disconnect();
  }, [placeNodes, compact]);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 760px)");
    const sync = () => setCompact(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  /* Scroll progress is written straight onto a custom property. Re-rendering
     seven nodes every frame would cost more than the animation itself. */
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const apply = (value: number) => {
      scene.style.setProperty("--tree-progress", value.toFixed(4));
      if (counterRef.current) counterRef.current.textContent = `${Math.round(value * 100)}%`;
      const caption = captionRef.current;
      if (caption) {
        const reached = branches.filter((branch) => value >= branch.start + branch.span * 0.8);
        const current = reached[reached.length - 1];
        caption.textContent = current ? current.label : "Schlägt Wurzeln";
        caption.style.setProperty("--limb-accent", current ? current.accent : "var(--gold)");
      }
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      apply(1);
      return;
    }

    let frame = 0;
    const measure = () => {
      frame = 0;
      const story = storyRef.current;
      if (!story) return;
      const range = Math.max(1, story.offsetHeight - window.innerHeight);
      apply(Math.min(1, Math.max(0, (window.scrollY - story.offsetTop) / range)));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(measure); };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const selectBranch = (id: string) => {
    setActiveBranch(id);
    document.getElementById(`branch-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <main className="landing-page">
      <nav className="landing-nav" aria-label="Hauptnavigation">
        <Link className="landing-brand" href="/"><BrandMark /><span>Company Brain</span></Link>
        <div className="landing-nav-actions">
          <a href="#branches">Zweige entdecken</a>
          <Link className="nav-signin" href="/login">Anmelden <ArrowUpRight /></Link>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="hero-copy">
          <h1>Alles, was Ihr Unternehmen weiß. <em>Lebendig.</em></h1>
          <p className="hero-description">Company Brain macht aus verstreutem Wissen, Entscheidungen und Kontext ein lebendiges System, das Ihr ganzes Team gemeinsam wachsen lässt. Das Betriebsgedächtnis Ihres Unternehmens.</p>
          <div className="hero-actions">
            <a className="hero-button hero-button-primary" href="#branches">Sehen, wie es wächst <ArrowDown /></a>
            <Link className="hero-button hero-button-quiet" href="/login">Zum Company Brain <ArrowUpRight /></Link>
          </div>
          <p className="hero-proof">Eine einzige verbundene Quelle der Wahrheit.</p>
        </div>
        <div className="hero-ember"><HeroSeed /></div>
      </section>

      <section className="brain-story" id="branches" ref={storyRef}>
        <div className="story-sticky">
          <div className="story-intro">
            <h2>Aus einer Wurzel, <span>viele Köpfe.</span></h2>
            <p>Scrollen Sie – der Baum wächst. Jeder Ast trägt eine Ebene Unternehmenskontext dorthin, wo Ihr Team sie braucht.</p>
          </div>

          <div className="brain-tree-scene" ref={sceneRef}>
            <svg className="brain-tree-svg" ref={svgRef} viewBox={compact ? "112 26 796 774" : "-60 -20 1140 810"} role="img" aria-label="Ein leuchtender Baum, dessen sieben Äste je eine Ebene Unternehmenskontext tragen" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="trunkGradient" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#8c3f1d" /><stop offset=".38" stopColor="#d96928" /><stop offset=".72" stopColor="#ffc56c" /><stop offset="1" stopColor="#fff0bb" /></linearGradient>
                <linearGradient id="branchGradient" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#b84a20" /><stop offset=".55" stopColor="#ff963e" /><stop offset="1" stopColor="#ffe2a0" /></linearGradient>
                <radialGradient id="canopyGradient"><stop offset="0" stopColor="#ffd9a0" stopOpacity=".34" /><stop offset=".42" stopColor="#ff8f36" stopOpacity=".10" /><stop offset="1" stopColor="#d84f1e" stopOpacity="0" /></radialGradient>
                <filter id="treeGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="15" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                <filter id="softGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              </defs>

              <ellipse className="tree-canopy" cx="500" cy="400" rx="300" ry="315" fill="url(#canopyGradient)" />

              <path className="tree-root" d={ROOTS} pathLength="1" />
              <path className="tree-trunk-glow" d={TRUNK} pathLength="1" />
              <path className="tree-trunk" d={TRUNK} pathLength="1" />

              {branches.map((branch) => (
                <g key={branch.id} className={`tree-limb ${activeBranch === branch.id ? "is-active" : ""}`} style={limbStyle(branch)}>
                  <path className="tree-branch-glow" d={branch.d} pathLength="1" />
                  <path className="tree-branch" d={branch.d} pathLength="1" />
                  <circle className="tree-limb-tip" cx={branch.tip[0]} cy={branch.tip[1]} r="6.5" />
                </g>
              ))}

              <g className="tree-sparks"><circle cx="402" cy="238" r="3.5" /><circle cx="617" cy="196" r="4.5" /><circle cx="700" cy="330" r="3" /><circle cx="348" cy="430" r="4" /><circle cx="592" cy="512" r="3.5" /><circle cx="455" cy="168" r="3" /><circle cx="268" cy="330" r="3" /><circle cx="742" cy="452" r="3.5" /></g>
              <circle className="tree-crown" cx="515" cy="82" r="9" />
              <circle className="tree-core" cx="500" cy="375" r="26" />
              <circle className="tree-core-inner" cx="500" cy="375" r="8" />
            </svg>

            {!compact && nodePoints.length === branches.length ? (
              <div className="tree-labels">
                {branches.map((branch, index) => (
                  <button
                    key={branch.id}
                    type="button"
                    className={`branch-node side-${nodePoints[index].side} ${activeBranch === branch.id ? "is-active" : ""}`}
                    style={{ ...limbStyle(branch), "--node-x": `${nodePoints[index].x}px`, "--node-y": `${nodePoints[index].y}px` } as CSSProperties}
                    onClick={() => selectBranch(branch.id)}
                  >
                    <span className="branch-node-label">{branch.label}</span>
                  </button>
                ))}
              </div>
            ) : null}
            <p className="tree-caption" ref={captionRef} aria-hidden="true">Schlägt Wurzeln</p>
          </div>

          <div className="story-progress"><span className="story-progress-track" aria-hidden="true"><i /></span><span className="story-progress-count" ref={counterRef}>0%</span></div>
        </div>
      </section>

      <section className="branch-index" aria-label="Die Zweige von Company Brain">
        <div className="index-inner">
          <h2>Jeder Zweig hat seinen Platz.<br /><span>Jeder Platz hat seine Geschichte.</span></h2>
          <ul className="index-list">
            {branches.map((branch) => (
              <li key={branch.id} id={`branch-${branch.id}`}>
                <button type="button" className={`index-row ${activeBranch === branch.id ? "is-active" : ""}`} onClick={() => setActiveBranch(branch.id)} aria-pressed={activeBranch === branch.id}>
                  <span className="index-dot" style={{ "--limb-accent": branch.accent } as CSSProperties} aria-hidden="true" />
                  <span className="index-name">{branch.label}</span>
                  <span className="index-copy">{branch.copy}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="landing-cta">
        <h2>Geben Sie Ihrem Unternehmen<br /><em>ein Gedächtnis, das mitgeht.</em></h2>
        <Link className="hero-button hero-button-primary" href="/login">Company Brain öffnen <ArrowUpRight /></Link>
      </section>

      <footer className="landing-footer">
        <span>&copy; 2026 Company Brain</span>
        <span>Gebaut für den Kontext zwischen den Zeilen.</span>
        <Link href="/login">Anmelden <ArrowUpRight /></Link>
      </footer>
    </main>
  );
}
