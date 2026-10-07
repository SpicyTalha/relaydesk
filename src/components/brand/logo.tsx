import { cn } from "cn";

/** Relaydesk mark: a document handed forward, with a check. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-7", className)}>
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path d="M9 9.5h9.5a4.5 4.5 0 0 1 0 9H13" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
      <path d="m13 15-3.5 3.5L13 22" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="22.5" cy="22.5" r="3" fill="white" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <LogoMark />
      <span className="text-[1.05rem]">Relaydesk</span>
    </span>
  );
}
