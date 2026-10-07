"use client";

import { useEffect, useRef } from "react";
import { ReactLenis, type LenisRef } from "lenis/react";
import "lenis/dist/lenis.css";
import { gsap, ScrollTrigger } from "./gsap";

/**
 * Lenis smooth scroll, driven by GSAP's ticker so ScrollTrigger scenes stay in sync.
 * Mounted only in the (marketing) layout: app routes keep native scrolling.
 * Lenis turns its own smoothing off when the OS asks for reduced motion.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const ref = useRef<LenisRef>(null);

  useEffect(() => {
    const lenis = ref.current?.lenis;
    const update = (time: number) => ref.current?.lenis?.raf(time * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    lenis?.on("scroll", ScrollTrigger.update);
    // Fonts change line heights, so measure scroll scenes again once they load.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => {
      gsap.ticker.remove(update);
      lenis?.off("scroll", ScrollTrigger.update);
    };
  }, []);

  return (
    <>
      <ReactLenis root options={{ autoRaf: false, anchors: true, lerp: 0.12 }} ref={ref} />
      {children}
    </>
  );
}
