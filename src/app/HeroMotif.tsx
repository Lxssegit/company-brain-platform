import { HERO_IMAGE } from "@/lib/brand";

/**
 * Das Bildmotiv rechts im Hero: eine große Kugel, davor senkrechte
 * Glasstreifen, die sie gebrochen zeigen.
 *
 * Gezeichnet, nicht fotografiert. Eine Bilddatei wäre an jeder Breite ein
 * Kompromiss und bei jeder Farbänderung neu zu exportieren; so ist das Motiv
 * bei jeder Auflösung scharf und kostet keinen einzigen Request.
 *
 * Zur Brechung: naheliegend wäre backdrop-filter mit einer
 * feDisplacementMap gewesen. Das funktioniert in der Praxis nicht, weil sich
 * SVG-Filter nicht verlässlich auf den Hintergrund hinter einem Element
 * anwenden lassen. Deshalb der deterministische Weg: jeder Streifen ist ein
 * Kasten mit overflow:hidden und trägt eine eigene Kopie der Kugel, horizontal
 * um wenige Pixel versetzt. Weil jede Kopie anders versetzt ist, bricht die
 * Silhouette an jeder Streifenkante, genau wie hinter Riffelglas. Das
 * funktioniert in jedem Browser und ist bis auf den Pixel steuerbar.
 *
 * Kein JavaScript. Die langsame Bewegung der Kugel ist eine CSS-Animation und
 * steht bei prefers-reduced-motion still.
 */

/**
 * Die Streifen, von links nach rechts. `w` ist die Breite, `x` die linke Kante,
 * beide in cqw, also gemessen an der Breite der Motivfläche. Container-Einheiten
 * und nicht Prozent, weil Prozent innerhalb eines Streifens gegen dessen eigene
 * Breite rechnen würden; die Kugelkopie muss aber im Koordinatensystem des
 * Motivs liegen, sonst stimmt der Versatz an keiner Kante.
 *
 * `shift` verschiebt die Kopie in diesem Streifen, in Pixeln, und erzeugt damit
 * den Bruch. Unterschiedliche Breiten, weil gleich breite Streifen als Raster
 * lesen und nicht als Glas.
 */
const STRIPS: { w: number; x: number; shift: number; soft: boolean }[] = [
  { w: 7, x: 2, shift: 14, soft: true },
  { w: 4, x: 10, shift: -9, soft: false },
  { w: 9, x: 15, shift: 18, soft: false },
  { w: 5, x: 25, shift: -13, soft: true },
  { w: 12, x: 31, shift: 10, soft: false },
  { w: 6, x: 44, shift: -16, soft: true },
  { w: 8, x: 51, shift: 7, soft: false },
];

/** Die Kugel selbst, einmal als Hintergrund und einmal je Streifen. */
function Sphere({ className }: { className?: string }) {
  return <span className={className ? `motif-sphere ${className}` : "motif-sphere"} aria-hidden="true" />;
}

export function HeroMotif() {
  if (HERO_IMAGE) {
    /* eslint-disable-next-line @next/next/no-img-element --
       Ein eigenes Motiv ersetzt hier eine gezeichnete Grafik. next/image
       brächte Layout-Logik und einen Optimierungs-Request für ein Bild, das
       immer dieselbe dekorative Fläche füllt. alt bleibt leer, weil das Motiv
       nichts trägt, was im Text nicht steht. */
    return <div className="motif"><img className="motif-image" src={HERO_IMAGE} alt="" /></div>;
  }

  return (
    <div className="motif" aria-hidden="true">
      <Sphere />
      <div className="motif-glass">
        {STRIPS.map((s) => (
          <span
            key={s.x}
            className={s.soft ? "motif-strip motif-strip-soft" : "motif-strip"}
            style={{ "--w": `${s.w}cqw`, "--x": `${s.x}cqw`, "--shift": `${s.shift}px` } as React.CSSProperties}
          >
            <Sphere className="motif-sphere-in-strip" />
          </span>
        ))}
      </div>
    </div>
  );
}
