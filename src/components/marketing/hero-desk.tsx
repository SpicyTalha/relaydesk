"use client";

import { type StaticImageData } from "next/image";
import { useRef } from "react";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ApprovalStamp } from "@/components/brand/stamp";
import { gsap, useGSAP } from "@/components/motion/gsap";
import { BinderClip, PenArrow, PenCircle, PenNote, Proof } from "./desk";

gsap.registerPlugin(DrawSVGPlugin);

/**
 * The hero desk: proofs land, the client's red pen circles the problem, v3 lands on top
 * and the stamp slams down. Reduced motion (and no JS) shows the finished desk.
 */
export function HeroDesk({
  menuV1,
  menuV3,
  instagram,
  logos,
}: {
  menuV1: StaticImageData;
  menuV3: StaticImageData;
  instagram: StaticImageData;
  logos: StaticImageData;
}) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const q = gsap.utils.selector(scope);
        gsap.set(q("[data-drop]"), { opacity: 0, y: -90, rotate: "+=8" });
        gsap.set(q("[data-front]"), { opacity: 0, y: -140, rotate: "+=10" });
        gsap.set(q("[data-pen]"), { drawSVG: "0%" });
        gsap.set(q("[data-pen-note]"), { clipPath: "inset(0 100% 0 0)" });
        gsap.set(q("[data-stamp]"), { opacity: 0, scale: 2.3, rotate: 4 });

        gsap
          .timeline({ delay: 0.25, defaults: { ease: "power3.out" } })
          .to(q("[data-drop]"), { opacity: 1, y: 0, rotate: "-=8", duration: 0.7, stagger: 0.12 })
          .to(q("[data-step='circle'] [data-pen]"), { drawSVG: "100%", duration: 0.7, ease: "power1.inOut" }, "+=0.1")
          .to(q("[data-step='circle'] [data-pen-note]"), { clipPath: "inset(0 0% 0 0)", duration: 0.6, ease: "none" }, "-=0.2")
          .to(q("[data-front]"), { opacity: 1, y: 0, rotate: "-=10", duration: 0.65 }, "+=0.15")
          .to(q("[data-stamp]"), { opacity: 1, scale: 1, rotate: -14, duration: 0.34, ease: "power4.in" }, "+=0.1")
          .to(q("[data-desk]"), { y: 4, duration: 0.06, yoyo: true, repeat: 1, ease: "power2.out" }, ">-0.02")
          .to(q("[data-step='finally'] [data-pen]"), { drawSVG: "100%", duration: 0.45, stagger: 0.15 }, "+=0.05")
          .to(q("[data-step='finally'] [data-pen-note]"), { clipPath: "inset(0 0% 0 0)", duration: 0.45, ease: "none" }, "<");
      });
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <div ref={scope} className="relative mx-auto aspect-[1/1] w-full max-w-[38rem]">
      <div data-desk className="absolute inset-0">
        {/* Back of the pile: other work on the desk this week. */}
        <Proof data-drop src={instagram} className="top-[2%] left-[0%] w-[42%] -rotate-[9deg]" tape="corners" sizes="260px" />
        <Proof data-drop src={logos} className="top-[0%] right-[0%] w-[52%] rotate-[6deg]" tape="none" sizes="320px">
          <BinderClip className="-top-7 left-8" />
        </Proof>

        {/* Version 1, with the client's red pen on it. */}
        <div data-step="circle">
          <Proof data-drop src={menuV1} alt="Version 1 of a cafe menu board with small prices" className="top-[27%] left-[3%] w-[72%] -rotate-[5deg]" tape="top" sizes="440px" priority>
            <PenCircle className="top-[36%] right-[0%] h-[56%] w-[24%]" strokeWidth={3.5} />
          </Proof>
          <PenNote className="top-[24%] -right-[2%] w-[11rem] rotate-[7deg] text-[1.65rem] sm:text-3xl">
            bigger!!<span className="hidden sm:inline"> can&apos;t read it from the counter</span>
          </PenNote>
        </div>

        {/* Version 3 lands on top and gets signed off. */}
        <Proof data-front src={menuV3} alt="Version 3 of the menu board, approved" className="right-[-2%] bottom-[-3%] w-[68%] rotate-[3deg]" tape="corners" sizes="460px" priority />
        <div data-stamp className="pointer-events-none absolute right-[-6%] bottom-[8%] size-[32%]">
          <ApprovalStamp version={3} date="Oct 14" seed={11} />
        </div>

        <div data-step="finally">
          <PenArrow className="bottom-[-4%] left-[10%] w-[20%] rotate-[8deg]" />
          <PenNote className="bottom-[-9%] left-[-2%] -rotate-[6deg] text-3xl sm:text-4xl">v3. finally!</PenNote>
        </div>
      </div>
    </div>
  );
}
