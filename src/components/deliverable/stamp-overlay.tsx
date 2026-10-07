"use client";

import { LazyMotion, domAnimation, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { ApprovalStamp } from "@/components/brand/stamp";

/**
 * The approval stamp on the version that was approved. When the approval just happened it
 * lands with a short press (scale down, settle); otherwise, and under reduced motion, it is
 * simply there.
 */
export function StampOverlay({ version, date, fresh }: { version: number; date: string; fresh: boolean }) {
  const reduce = useReducedMotion();
  const animate = fresh && !reduce;
  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        initial={animate ? { scale: 1.9, opacity: 0, rotate: -2 } : false}
        animate={{ scale: 1, opacity: 1, rotate: -12 }}
        transition={{ type: "spring", stiffness: 520, damping: 24, mass: 0.8, delay: animate ? 0.15 : 0 }}
        className="pointer-events-none absolute -top-5 -right-3 z-10 size-28 drop-shadow-[0_2px_0_rgb(255_255_255/0.6)] sm:-top-7 sm:-right-5 sm:size-36"
      >
        <ApprovalStamp version={version} date={date} />
      </m.div>
    </LazyMotion>
  );
}
