import Image, { type StaticImageData } from "next/image";
import { cn } from "cn";

/**
 * The proofing desk: printed proofs, masking tape, clips and red-pen markup.
 * Pure markup so it renders on the server; animation lives in the client wrappers.
 * Pen paths carry data-pen so GSAP DrawSVG can draw them.
 */

export function Proof({
  src,
  alt = "",
  className,
  tape = "top",
  sizes = "480px",
  priority,
  children,
  ...props
}: {
  src: StaticImageData;
  alt?: string;
  className?: string;
  tape?: "top" | "corners" | "none";
  sizes?: string;
  priority?: boolean;
  children?: React.ReactNode;
} & React.ComponentProps<"figure">) {
  return (
    <figure className={cn("proof absolute", className)} {...props}>
      <Image src={src} alt={alt} sizes={sizes} priority={priority} className="block h-auto w-full" />
      {tape === "top" && <span aria-hidden="true" className="tape absolute -top-3 left-1/2 h-7 w-28 -translate-x-1/2 -rotate-3" />}
      {tape === "corners" && (
        <>
          <span aria-hidden="true" className="tape absolute -top-2 -left-5 h-6 w-20 -rotate-[32deg]" />
          <span aria-hidden="true" className="tape absolute -right-5 -bottom-2 h-6 w-20 -rotate-[32deg]" />
        </>
      )}
      {children}
    </figure>
  );
}

export function BinderClip({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 64" aria-hidden="true" className={cn("absolute w-12 drop-shadow-[0_3px_3px_rgb(0_0_0/0.25)]", className)}>
      <path d="M14 30 C14 6 46 6 46 30" fill="none" stroke="#9aa0aa" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M20 30 C20 14 40 14 40 30" fill="none" stroke="#c7ccd3" strokeWidth="3" strokeLinecap="round" />
      <path d="M6 30h48l-6 32H12z" fill="#15171a" />
      <path d="M10 34h40" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="2" />
    </svg>
  );
}

/** A loose marker loop that overshoots, like a real client circling something. */
export function PenCircle({ className, strokeWidth = 4 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 220 90" preserveAspectRatio="none" aria-hidden="true" className={cn("pointer-events-none absolute overflow-visible", className)}>
      <path
        data-pen
        d="M30 20 C70 4 190 2 208 32 C224 60 150 84 70 80 C14 77 2 52 18 34 C30 21 60 12 98 10"
        fill="none"
        stroke="var(--color-pen)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PenArrow({ className, flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg viewBox="0 0 140 80" aria-hidden="true" className={cn("pointer-events-none absolute overflow-visible", flip && "-scale-x-100", className)}>
      <path data-pen d="M6 70 C30 60 58 44 78 30 C94 19 110 13 128 10" fill="none" stroke="var(--color-pen)" strokeWidth="3.5" strokeLinecap="round" />
      <path data-pen d="M112 2 L129 10 L116 23" fill="none" stroke="var(--color-pen)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PenUnderline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 18" aria-hidden="true" preserveAspectRatio="none" className={cn("pointer-events-none absolute overflow-visible", className)}>
      <path data-pen d="M3 11 C46 4 88 15 130 8 C170 2 206 14 237 6" fill="none" stroke="var(--color-pen)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/** Handwritten client markup in red pen. */
export function PenNote({ children, className, ...props }: React.ComponentProps<"p">) {
  return (
    <p data-pen-note className={cn("pointer-events-none absolute font-pen leading-[0.95] text-pen", className)} {...props}>
      {children}
    </p>
  );
}

/** Two crossing strips of tape with the words a studio lives by, scrolling. */
export function TapeMarquee({ words, className }: { words: string[]; className?: string }) {
  const strip = (tone: string, rotate: string, reverse?: boolean) => (
    <div className={cn("flex overflow-hidden py-3", tone, rotate)}>
      <div
        className={cn("flex shrink-0 animate-marquee items-center gap-8 pr-8 whitespace-nowrap motion-reduce:[animation-play-state:paused]", reverse && "[animation-direction:reverse]")}
      >
        {[...words, ...words, ...words, ...words].map((w, i) => (
          <span key={i} className="flex items-center gap-8 font-display text-3xl font-extrabold tracking-[-0.03em] sm:text-5xl">
            {w}
            <span aria-hidden="true" className="text-[0.55em]">
              &#10022;
            </span>
          </span>
        ))}
      </div>
    </div>
  );
  return (
    <div aria-hidden="true" className={cn("relative overflow-hidden py-10", className)}>
      {strip("bg-process-magenta text-white", "-rotate-2 scale-105")}
      <div className="-mt-4">{strip("bg-ink text-paper", "rotate-[1.5deg] scale-105", true)}</div>
    </div>
  );
}
