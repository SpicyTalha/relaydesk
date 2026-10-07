"use client";

import { useId } from "react";
import { cn } from "cn";

/**
 * The approval stamp, Relaydesk's signature element. Used only where work is approved.
 * An SVG turbulence filter erodes the edge so it reads as ink, not vector art.
 */
export function ApprovalStamp({
  version,
  date,
  className,
  seed = 7,
  title = "Approved",
}: {
  version?: number;
  date?: string;
  className?: string;
  seed?: number;
  title?: string;
}) {
  const id = useId().replace(/:/g, "");
  const ring = "APPROVED ✦ SIGNED OFF ✦ APPROVED ✦ SIGNED OFF ✦ ";
  const circumference = 2 * Math.PI * 71;
  return (
    <svg
      viewBox="0 0 200 200"
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}
      className={cn("text-status-approved", className)}
    >
      <defs>
        <filter id={`ink-${id}`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" seed={seed} result="noise" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.15 1.22" result="mask" />
          <feComposite in="SourceGraphic" in2="mask" operator="in" />
        </filter>
        <path id={`arc-${id}`} d="M 100,100 m -71,0 a 71,71 0 1,1 142,0 a 71,71 0 1,1 -142,0" />
      </defs>
      <g filter={`url(#ink-${id})`} fill="currentColor" stroke="currentColor">
        <circle cx="100" cy="100" r="94" fill="none" strokeWidth="5" />
        <circle cx="100" cy="100" r="57" fill="none" strokeWidth="2.5" />
        <text fontFamily="var(--font-display)" fontWeight="800" fontSize="15.5" stroke="none">
          <textPath href={`#arc-${id}`} textLength={circumference} lengthAdjust="spacing">
            {ring}
          </textPath>
        </text>
        <text x="100" y="106" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="800" fontSize="40" letterSpacing="-1" stroke="none">
          OK
        </text>
        {(version || date) && (
          <text x="100" y="130" textAnchor="middle" fontFamily="var(--font-sans)" fontWeight="700" fontSize="12.5" letterSpacing="1" stroke="none">
            {[version ? `v${version}` : null, date].filter(Boolean).join(", ")}
          </text>
        )}
      </g>
    </svg>
  );
}
