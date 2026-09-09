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

export function BrandMark({ className = "brand-mark" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M10 18.5V8.4M10 12.2 5.4 9.1M10 13.6l4.4-3M10 8.4 6.6 5.8M10 9.6l3.6-2.6" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="3.6" r="1.9" fill="currentColor" />
    </svg>
  );
}
