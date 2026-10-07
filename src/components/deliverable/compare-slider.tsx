"use client";

import { useState } from "react";
import { ArrowsHorizontalIcon } from "@phosphor-icons/react";

/**
 * Two versions of the same work, one over the other: drag the handle (or use the arrow keys)
 * to wipe between them and see exactly what changed. The older version sits on the left.
 */
export function CompareSlider({
  before,
  after,
}: {
  before: { url: string; label: string };
  after: { url: string; label: string };
}) {
  const [pos, setPos] = useState(50);
  const checker = "bg-white bg-[repeating-conic-gradient(var(--muted)_0_25%,transparent_0_50%)] bg-[length:20px_20px]";

  return (
    <div className="mat grid place-items-center overflow-hidden rounded-xl px-4 py-6 sm:px-10 sm:py-10">
      <div className="relative bg-white p-2 shadow-[0_24px_40px_-20px_rgb(0_0_0/0.6)] sm:p-2.5">
        <div className="relative select-none" data-testid="compare-slider">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={after.url} alt={after.label} className={`block max-h-[64vh] w-auto object-contain ${checker}`} draggable={false} />
          <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={before.url} alt={before.label} className={`size-full object-contain ${checker}`} draggable={false} />
          </div>

          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-pen" style={{ left: `${pos}%` }}>
            <span className="absolute top-1/2 left-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[2.5px] border-pen bg-white text-pen shadow-lg">
              <ArrowsHorizontalIcon weight="bold" className="size-5" />
            </span>
          </span>
          <Tag side="left">{before.label}</Tag>
          <Tag side="right">{after.label}</Tag>

          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={pos}
            onChange={(e) => setPos(Number(e.target.value))}
            aria-label={`Compare ${before.label} and ${after.label}`}
            aria-valuetext={`${pos}% ${before.label}`}
            className="absolute inset-0 size-full cursor-ew-resize appearance-none opacity-0"
          />
        </div>
      </div>
    </div>
  );
}

function Tag({ side, children }: { side: "left" | "right"; children: React.ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute top-3 rounded-full bg-ink/85 px-2.5 py-1 text-xs font-semibold text-white ${side === "left" ? "left-3" : "right-3"}`}
    >
      {children}
    </span>
  );
}
