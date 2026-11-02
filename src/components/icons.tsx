/** One icon system: drawn paths, a single 1.5 stroke, sized from the text. */

type IconProps = { className?: string };

function Icon({ children, className = "icon" }: { children: React.ReactNode; className?: string }) {
  return <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{children}</svg>;
}

export function ArrowUpRight({ className }: IconProps) {
  return <Icon className={className}><path d="M5 11 11 5M6 5h5v5" /></Icon>;
}

export function ArrowDown({ className }: IconProps) {
  return <Icon className={className}><path d="M8 3v10M4 9l4 4 4-4" /></Icon>;
}

export function ArrowLeft({ className }: IconProps) {
  return <Icon className={className}><path d="M13 8H3M7 4 3 8l4 4" /></Icon>;
}

/**
 * The one mark, for the public page and the application alike. It loads
 * public/logo.svg rather than drawing itself, so replacing that one file
 * changes the brand everywhere without touching a component.
 *
 * next/image is declined on purpose: there is nothing to optimise in a
 * 400-byte vector, and routing it through a loader would add a request to the
 * element that has to paint first on every screen.
 */
export function BrandMark({ className = "brand-mark" }: IconProps) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={className} src="/logo.svg" alt="" width={22} height={22} />;
}
