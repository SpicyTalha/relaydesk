"use client";

import Image, { type StaticImageData } from "next/image";
import { useRef } from "react";
import { ApprovalStamp } from "@/components/brand/stamp";
import { gsap, useGSAP } from "@/components/motion/gsap";

/**
 * The page's one orchestrated moment: the client's phone, and the ink stamp landing on the work.
 * Under reduced motion (or without JS) the stamp is simply there.
 */
export function HeroVisual({ phone, overview }: { phone: StaticImageData; overview: StaticImageData }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set("[data-stamp]", { opacity: 0, scale: 2.3, rotate: 6 });
        gsap
          .timeline({ delay: 0.7 })
          .to("[data-stamp]", { opacity: 1, scale: 1, rotate: -14, duration: 0.38, ease: "power4.in" })
          .to("[data-phone]", { y: 5, duration: 0.07, ease: "power2.out", yoyo: true, repeat: 1 }, ">-0.03");
      });
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <div ref={scope} className="relative mx-auto w-full max-w-[34rem] lg:mx-0">
      {/* The studio's view, set back. */}
      <div className="absolute inset-y-10 -right-40 left-24 hidden overflow-hidden rounded-[14px] border bg-card shadow-[0_30px_60px_-30px_rgb(21_23_26/0.35)] lg:block">
        <Image src={overview} alt="" sizes="560px" className="h-full w-auto max-w-none object-cover object-left-top" priority />
      </div>
      {/* The client's view, in front. */}
      <div
        data-phone
        className="relative mx-auto w-[17.5rem] overflow-hidden rounded-[2.6rem] border-[7px] border-foreground bg-foreground shadow-[0_50px_90px_-35px_rgb(21_23_26/0.55)] sm:w-[19rem] lg:mx-0"
      >
        <Image src={phone} alt="A client reviewing an Instagram post on their phone, with Approve and Request changes buttons" sizes="304px" priority />
      </div>
      <div data-stamp className="pointer-events-none absolute top-[38%] left-[52%] size-40 sm:size-44">
        <ApprovalStamp version={1} date="Oct 14" seed={11} />
      </div>
    </div>
  );
}
