"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";

type Branch = {
  id: string;
  number: string;
  label: string;
  eyebrow: string;
  copy: string;
  nodeX: string;
  nodeY: string;
  travel: string;
  accent: string;
};

const branches: Branch[] = [
  { id: "strategy", number: "01", label: "Strategy", eyebrow: "Direction", copy: "The company-wide context that keeps every decision pointed at the same horizon.", nodeX: "24%", nodeY: "25%", travel: "210px", accent: "#ffb45a" },
  { id: "people", number: "02", label: "People", eyebrow: "Human layer", copy: "Roles, expertise and the living context behind the people who move the company forward.", nodeX: "18%", nodeY: "43%", travel: "265px", accent: "#ffd18a" },
  { id: "product", number: "03", label: "Product & Tech", eyebrow: "Build system", copy: "The shared memory of what is being built, why it matters and how it works.", nodeX: "32%", nodeY: "55%", travel: "245px", accent: "#ff8c3d" },
  { id: "customers", number: "04", label: "Customers", eyebrow: "Outside signal", copy: "Customer needs and market signals become useful context instead of scattered notes.", nodeX: "76%", nodeY: "26%", travel: "225px", accent: "#ffe0a8" },
  { id: "decisions", number: "05", label: "Decisions", eyebrow: "Decision memory", copy: "The why behind important choices stays visible, connected and easy to revisit.", nodeX: "84%", nodeY: "43%", travel: "285px", accent: "#ff9c4d" },
  { id: "knowledge", number: "06", label: "Knowledge", eyebrow: "Collective memory", copy: "Verified knowledge grows into a permission-aware source of truth for the whole team.", nodeX: "68%", nodeY: "56%", travel: "250px", accent: "#ffc16d" },
  { id: "operations", number: "07", label: "Operations", eyebrow: "Daily motion", copy: "The small signals, rituals and workflows that make the organization feel alive.", nodeX: "50%", nodeY: "31%", travel: "395px", accent: "#ff7b2d" },
];

function BranchTree({ progress, activeBranch, onSelect }: { progress: number; activeBranch: string; onSelect: (id: string) => void }) {
  return (
    <div className="brain-tree-scene" style={{ "--tree-progress": progress } as CSSProperties}>
      <div className="tree-orbit orbit-one" />
      <div className="tree-orbit orbit-two" />
      <svg className="brain-tree-svg" viewBox="0 0 1000 760" role="img" aria-label="Leuchtender Company-Brain-Baum mit sieben Branches">
        <defs>
          <linearGradient id="trunkGradient" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#8c3f1d" /><stop offset=".38" stopColor="#d96928" /><stop offset=".72" stopColor="#ffc56c" /><stop offset="1" stopColor="#fff0bb" /></linearGradient>
          <linearGradient id="branchGradient" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#b84a20" /><stop offset=".55" stopColor="#ff963e" /><stop offset="1" stopColor="#ffe2a0" /></linearGradient>
          <radialGradient id="canopyGradient"><stop offset="0" stopColor="#ffecc0" stopOpacity=".9" /><stop offset=".33" stopColor="#ff9b42" stopOpacity=".38" /><stop offset="1" stopColor="#d84f1e" stopOpacity="0" /></radialGradient>
          <filter id="treeGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="15" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="softGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <ellipse cx="500" cy="405" rx="275" ry="300" fill="url(#canopyGradient)" filter="url(#treeGlow)" />
        <path className="tree-trunk-glow" d="M500 735 C472 643 516 562 492 490 C474 434 500 367 505 294 C510 222 482 153 515 82" />
        <path className="tree-trunk" d="M500 735 C472 643 516 562 492 490 C474 434 500 367 505 294 C510 222 482 153 515 82" />
        <path className="tree-root" d="M501 681 C450 704 415 725 365 746 M505 689 C553 710 600 725 652 743 M481 700 C447 738 432 753 412 758 M524 698 C558 732 580 747 606 758" />
        <path className="tree-branch-glow" d="M502 350 C451 316 403 285 330 241 C294 219 253 208 203 202 M497 447 C438 416 381 393 302 371 C250 357 201 359 145 380 M507 273 C556 238 613 209 681 185 C737 165 787 158 845 170 M501 506 C568 476 634 454 710 430 C771 411 827 405 885 421 M506 385 C553 349 607 315 680 286 C737 263 773 255 812 257" />
        <path className="tree-branch" d="M502 350 C451 316 403 285 330 241 C294 219 253 208 203 202 M497 447 C438 416 381 393 302 371 C250 357 201 359 145 380 M507 273 C556 238 613 209 681 185 C737 165 787 158 845 170 M501 506 C568 476 634 454 710 430 C771 411 827 405 885 421 M506 385 C553 349 607 315 680 286 C737 263 773 255 812 257" />
        <g className="tree-sparks" filter="url(#softGlow)"><circle cx="390" cy="212" r="4" /><circle cx="620" cy="154" r="5" /><circle cx="742" cy="346" r="3" /><circle cx="311" cy="455" r="5" /><circle cx="580" cy="560" r="4" /><circle cx="432" cy="134" r="3" /></g>
        <circle className="tree-core" cx="500" cy="375" r="26" /><circle className="tree-core-inner" cx="500" cy="375" r="8" />
      </svg>
      <div className="tree-label">COMPANY BRAIN <span>living system</span></div>
      {branches.map((branch) => <button className={`branch-node ${activeBranch === branch.id ? "is-active" : ""}`} key={branch.id} onClick={() => onSelect(branch.id)} style={{ "--node-x": branch.nodeX, "--node-y": branch.nodeY, "--node-offset": `${progress * Number.parseFloat(branch.travel)}px`, "--node-accent": branch.accent } as CSSProperties} type="button" aria-label={`Open ${branch.label} branch`}><span className="branch-node-pulse" /><span className="branch-node-label">{branch.label}</span></button>)}
      <div className="tree-scroll-note"><span className="scroll-line" /> Scroll to grow the tree</div>
    </div>
  );
}

export default function HomePage() {
  const [progress, setProgress] = useState(0);
  const [activeBranch, setActiveBranch] = useState("strategy");

  useEffect(() => {
    let frame = 0;
    const updateProgress = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const story = document.querySelector<HTMLElement>(".brain-story");
        if (!story) return;
        const range = Math.max(1, story.offsetHeight - window.innerHeight * 0.9);
        setProgress(Math.min(1, Math.max(0, (window.scrollY - story.offsetTop) / range)));
      });
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", updateProgress); window.removeEventListener("resize", updateProgress); };
  }, []);

  const selectBranch = (id: string) => { setActiveBranch(id); document.getElementById(`branch-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); };

  return (
    <main className="landing-page">
      <nav className="landing-nav"><Link className="landing-brand" href="/" aria-label="Company Brain home"><span className="brand-orb">✦</span><span>Company Brain</span></Link><div className="landing-nav-actions"><a href="#branches">Explore the branches</a><Link href="/login">Sign in <span>↗</span></Link></div></nav>
      <section className="landing-hero"><div className="hero-copy"><p className="landing-kicker"><span className="kicker-dot" /> The operating memory for your company</p><h1>Everything your company knows, <em>alive.</em></h1><p className="hero-description">Company Brain turns scattered knowledge, decisions and context into one living system your whole team can grow together.</p><div className="hero-actions"><a className="hero-button hero-button-primary" href="#branches">See how it grows <span>↓</span></a><Link className="hero-button hero-button-quiet" href="/login">Enter your brain <span>↗</span></Link></div><div className="hero-proof"><span>01</span><span className="proof-line" /><span>One connected source of truth</span></div></div><div className="hero-light hero-light-one" /><div className="hero-light hero-light-two" /></section>
      <section className="brain-story" id="branches"><div className="story-sticky"><div className="story-intro"><p className="landing-kicker">A living map of your organization</p><h2>From one root, <span>many minds.</span></h2><p>Scroll through the tree. Every branch carries a layer of company context and settles into the place where your team needs it.</p></div><BranchTree progress={progress} activeBranch={activeBranch} onSelect={selectBranch} /><div className="story-progress"><span style={{ width: `${Math.round(progress * 100)}%` }} /><small>{String(Math.round(progress * 100)).padStart(2, "0")} / 100</small></div></div></section>
      <section className="branch-library" aria-label="Company Brain branches"><div className="library-heading"><p className="landing-kicker">The company brain, in context</p><h2>Every branch has a place.<br /><span>Every place has a story.</span></h2></div><div className="branch-grid">{branches.map((branch) => <button className={`branch-card ${activeBranch === branch.id ? "is-active" : ""}`} id={`branch-${branch.id}`} key={branch.id} onClick={() => setActiveBranch(branch.id)} type="button"><span className="branch-card-number">{branch.number}</span><span className="branch-card-orb" style={{ background: branch.accent }} /><span className="branch-card-eyebrow">{branch.eyebrow}</span><strong>{branch.label}</strong><span className="branch-card-copy">{branch.copy}</span><span className="branch-card-arrow">↗</span></button>)}</div></section>
      <section className="landing-cta"><div><p className="landing-kicker">Make your knowledge compound</p><h2>Give your company<br /><em>a memory that moves.</em></h2></div><Link className="hero-button hero-button-primary" href="/login">Enter Company Brain <span>↗</span></Link></section>
      <footer className="landing-footer"><span>© 2026 Company Brain</span><span>Built for the context between the lines.</span><Link href="/login">Sign in ↗</Link></footer>
    </main>
  );
}
