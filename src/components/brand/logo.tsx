import { cn } from "cn";

/**
 * The sign-off: a stamp ring with a check that passes out of it (approved, and handed back).
 * One circle and one polyline on a 32 grid, so it holds at 16 px. See docs/BRAND.md.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-7 shrink-0", className)}>
      <circle cx="16" cy="16" r="11.5" fill="none" stroke="currentColor" strokeWidth="3.2" />
      <path d="M10.5 16.5l4 4L29 6" fill="none" className="stroke-brand" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className="size-6" />
      <span className="font-display text-[1.2rem] font-bold tracking-[-0.035em]">Relaydesk</span>
    </span>
  );
}
