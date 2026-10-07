import { cn } from "cn";

/**
 * Print-shop furniture: the cutting mat's rulers and angle guides, the client's marker,
 * a coffee ring, and the printer's marks on a press sheet. All decorative and aria-hidden.
 */

const CM = 32; // one mat square, matching the .mat background grid

/** Ruler numbers and ticks along the top and left edges of a .mat surface. */
export function MatRulers({ count = 48 }: { count?: number }) {
  const ticks = (dir: "x" | "y") =>
    dir === "x"
      ? "repeating-linear-gradient(to right, rgb(255 255 255 / 0.55) 0 1px, transparent 1px 32px)"
      : "repeating-linear-gradient(to bottom, rgb(255 255 255 / 0.55) 0 1px, transparent 1px 32px)";
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-2" style={{ backgroundImage: ticks("x") }} />
      <div className="absolute inset-y-0 left-0 w-2" style={{ backgroundImage: ticks("y") }} />
      {Array.from({ length: count }, (_, i) => (
        <span key={`x${i}`} className="absolute top-3 text-[10px] font-semibold text-white/45 tabular" style={{ left: (i + 1) * CM * 5 + 4 }}>
          {(i + 1) * 5}
        </span>
      ))}
      {Array.from({ length: count }, (_, i) => (
        <span key={`y${i}`} className="absolute left-3 text-[10px] font-semibold text-white/45 tabular" style={{ top: (i + 1) * CM * 5 + 3 }}>
          {(i + 1) * 5}
        </span>
      ))}
    </div>
  );
}

/** The 30, 45 and 60 degree guides printed in a cutting mat's corner. */
export function MatAngles({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 480 480" aria-hidden="true" className={cn("pointer-events-none absolute", className)} fill="none" stroke="rgb(255 255 255 / 0.22)">
      <path d="M0 480 L480 0" />
      <path d="M0 480 L277 0" strokeDasharray="6 6" />
      <path d="M0 480 L480 203" strokeDasharray="6 6" />
      <path d="M0 400 A80 80 0 0 1 80 480" />
      <g fill="rgb(255 255 255 / 0.45)" stroke="none" fontSize="12" fontWeight="600">
        <text x="236" y="236">45°</text>
        <text x="150" y="214">60°</text>
        <text x="250" y="352">30°</text>
      </g>
    </svg>
  );
}

/** A ring left by a Northwind cup. */
export function CoffeeRing({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" className={cn("pointer-events-none absolute", className)}>
      <defs>
        <filter id="coffee-edge" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" />
          <feDisplacementMap in="SourceGraphic" scale="9" />
        </filter>
      </defs>
      <g filter="url(#coffee-edge)" fill="none" stroke="rgb(70 40 18)">
        <circle cx="100" cy="100" r="78" strokeWidth="7" strokeOpacity="0.32" />
        <circle cx="100" cy="100" r="72" strokeWidth="2" strokeOpacity="0.2" />
        <path d="M30 120 A76 76 0 0 1 60 40" strokeWidth="11" strokeOpacity="0.18" />
      </g>
    </svg>
  );
}

/** The client's red marker, cap off. */
export function Marker({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 44" aria-hidden="true" className={cn("pointer-events-none absolute drop-shadow-[0_10px_8px_rgb(0_0_0/0.35)]", className)}>
      <defs>
        <linearGradient id="marker-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#e4e6ea" />
          <stop offset="1" stopColor="#b9bdc4" />
        </linearGradient>
        <linearGradient id="marker-red" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff5a4f" />
          <stop offset="0.55" stopColor="#e0312b" />
          <stop offset="1" stopColor="#a81d18" />
        </linearGradient>
      </defs>
      {/* Felt tip and collar. */}
      <path d="M4 22 L22 15 L22 29 Z" fill="#c4231d" />
      <rect x="22" y="12" width="20" height="20" rx="3" fill="#2a2d33" />
      {/* Barrel. */}
      <rect x="40" y="6" width="214" height="32" rx="8" fill="url(#marker-body)" />
      <rect x="96" y="6" width="58" height="32" fill="url(#marker-red)" />
      <text x="168" y="27" fontSize="11" fontWeight="800" letterSpacing="2" fill="#15171a">
        PROOF
      </text>
      {/* End plug. */}
      <rect x="250" y="8" width="20" height="28" rx="5" fill="url(#marker-red)" />
      {/* The cap, lying beside it. */}
      <g transform="translate(276 4) rotate(9)">
        <rect width="40" height="34" rx="9" fill="url(#marker-red)" />
        <rect x="6" y="-3" width="26" height="6" rx="3" fill="#a81d18" />
      </g>
    </svg>
  );
}

/** A registration target. */
export function RegMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={cn("pointer-events-none absolute size-7 text-ink", className)} fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="20" cy="20" r="11" />
      <circle cx="20" cy="20" r="5" fill="currentColor" />
      <path d="M20 0v40M0 20h40" />
    </svg>
  );
}

/** Trim marks at the four corners of the box they sit in. */
export function CropMarks({ className }: { className?: string }) {
  const mark = "absolute block bg-ink";
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute", className)}>
      {(["top-0 left-0", "top-0 right-0", "bottom-0 left-0", "bottom-0 right-0"] as const).map((pos) => {
        const top = pos.startsWith("top");
        const left = pos.endsWith("left-0");
        return (
          <span key={pos} className={cn("absolute size-0", pos)}>
            <span className={cn(mark, "h-px w-5", top ? "top-0" : "bottom-0", left ? "right-2" : "left-2")} />
            <span className={cn(mark, "h-5 w-px", left ? "left-0" : "right-0", top ? "bottom-2" : "top-2")} />
          </span>
        );
      })}
    </div>
  );
}

const BAR = [
  "#00aeef", "#ec008c", "#fff200", "#15171a",
  "#7fd6f7", "#f57fc5", "#fff87f", "#8a8b8d",
  "#ed1c24", "#00a651", "#2e3192", "#c7c8ca",
  "#00aeef", "#ec008c", "#fff200", "#15171a",
];

/** The CMYK control strip printed along a press sheet's edge. */
export function ColorBar({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none flex", className)}>
      {BAR.map((c, i) => (
        <span key={i} className="size-4 sm:size-5" style={{ background: c }} />
      ))}
    </div>
  );
}

/** A printer's loupe, magnifying the halftone rosette on the sheet. */
export function Loupe({ className }: { className?: string }) {
  const dots = (color: string, size: number, angle: number) => (
    <span
      className="absolute -inset-1/2 mix-blend-multiply"
      style={{
        backgroundImage: `radial-gradient(circle, ${color} 34%, transparent 37%)`,
        backgroundSize: `${size}px ${size}px`,
        transform: `rotate(${angle}deg)`,
      }}
    />
  );
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute size-36", className)}>
      <div className="absolute inset-0 overflow-hidden rounded-full bg-white">
        {dots("#00aeef", 15, 15)}
        {dots("#ec008c", 15, 75)}
        {dots("#fff200", 15, 0)}
        <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgb(255_255_255/0.75),transparent_45%)]" />
      </div>
      <div className="absolute inset-0 rounded-full border-[11px] border-ink shadow-[0_22px_30px_-12px_rgb(0_0_0/0.5),inset_0_0_0_2px_rgb(255_255_255/0.25)]" />
      <div className="absolute top-1/2 -right-16 h-5 w-20 -translate-y-1/2 rounded-r-full bg-ink shadow-[0_14px_20px_-10px_rgb(0_0_0/0.5)]" />
    </div>
  );
}
