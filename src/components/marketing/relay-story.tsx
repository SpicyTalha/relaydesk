"use client";

import { type StaticImageData } from "next/image";
import { useRef } from "react";
import { cn } from "cn";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ApprovalStamp } from "@/components/brand/stamp";
import { gsap, useGSAP } from "@/components/motion/gsap";
import { PenArrow, PenCircle, PenNote, Proof } from "./desk";
import { Marker } from "./print";

gsap.registerPlugin(DrawSVGPlugin);

const STEPS = [
  { tag: "v1", title: "v1 goes out.", body: "The studio uploads the spring menu board and asks Northwind for sign-off by Friday." },
  { tag: "!!", title: "The client grabs the red pen.", body: "From behind the counter, on a phone: the prices are too small to read." },
  { tag: "v2", title: "v2. One more note.", body: "Bigger prices. Now Daniel wants the seasonal special at the top." },
  { tag: "v3", title: "v3 is signed off.", body: "Approved, with his name and the date on it. Nobody digs through email for the yes." },
];

/**
 * A pinned, scroll-scrubbed desk: v1 lands, the pen circles the prices, v2 lands with a new note,
 * v3 lands and gets stamped. Desktop with motion only; otherwise the same proofs, stacked.
 */
export function RelayStory({ versions }: { versions: [StaticImageData, StaticImageData, StaticImageData] }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const q = gsap.utils.selector(scope);
        gsap.set(q("[data-v='1'], [data-v='2']"), { opacity: 0, y: -60, rotate: "+=6" });
        gsap.set(q("[data-pinned] [data-pen]"), { drawSVG: "0%" });
        gsap.set(q("[data-pinned] [data-pen-note]"), { clipPath: "inset(0 100% 0 0)" });
        gsap.set(q("[data-relay-stamp]"), { opacity: 0, scale: 2.2, rotate: 6 });
        gsap.set(q("[data-step]"), { opacity: 0.4 });
        gsap.set(q("[data-step] [data-fill]"), { opacity: 0 });
        gsap.set(q("[data-step='0']"), { opacity: 1 });
        gsap.set(q("[data-step='0'] [data-fill]"), { opacity: 1 });
        gsap.set(q("[data-rail]"), { scaleY: 0 });

        const step = (i: number) => (tl: gsap.core.Timeline, at: number) =>
          tl
            .to(q("[data-step]"), { opacity: 0.4, duration: 0.3 }, at)
            .to(q("[data-step] [data-fill]"), { opacity: 0, duration: 0.3 }, at)
            .to(q(`[data-step='${i}']`), { opacity: 1, duration: 0.3 }, at)
            .to(q(`[data-step='${i}'] [data-fill]`), { opacity: 1, duration: 0.3 }, at);

        const tl = gsap.timeline({
          defaults: { ease: "power2.out", duration: 1 },
          scrollTrigger: { trigger: q("[data-pinned]")[0], start: "top top", end: "+=340%", pin: true, scrub: 0.7 },
        });
        tl.to(q("[data-rail]"), { scaleY: 1, ease: "none", duration: 5.9 }, 0);
        step(1)(tl, 0.5);
        tl.to(q("[data-mark='1'] [data-pen]"), { drawSVG: "100%", ease: "power1.inOut" }, 0.5).to(
          q("[data-mark='1'] [data-pen-note]"),
          { clipPath: "inset(0 0% 0 0)", ease: "none" },
          1.1,
        );
        step(2)(tl, 2.2);
        tl.to(q("[data-v='1']"), { opacity: 1, y: 0, rotate: "-=6" }, 2.2)
          .to(q("[data-mark='2'] [data-pen]"), { drawSVG: "100%", ease: "power1.inOut", stagger: 0.2 }, 2.9)
          .to(q("[data-mark='2'] [data-pen-note]"), { clipPath: "inset(0 0% 0 0)", ease: "none" }, 3.3);
        step(3)(tl, 4.3);
        tl.to(q("[data-v='2']"), { opacity: 1, y: 0, rotate: "-=6" }, 4.3).to(
          q("[data-relay-stamp]"),
          { opacity: 1, scale: 1, rotate: -12, duration: 0.45, ease: "power4.in" },
          5.2,
        );
        tl.to({}, { duration: 0.7 });
      });
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <div ref={scope}>
      {/* Desktop: pinned. The no-JS default is the end of the story. */}
      <div data-pinned className="relative hidden min-h-svh items-center lg:flex">
        <Marker className="bottom-[7%] left-[6%] w-72 -rotate-[14deg]" />
        <div className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] items-center gap-14 px-5">
          <div className="relative pl-9">
            <span aria-hidden="true" className="absolute top-3 bottom-3 left-[5px] w-[3px] rounded-full bg-white/15">
              <span data-rail className="block size-full origin-top rounded-full bg-pen" />
            </span>
            <ol className="space-y-8">
            {STEPS.map((s, i) => (
              <li key={s.title} data-step={i} className="relative flex gap-5">
                <span aria-hidden="true" className="absolute top-3 -left-9 size-[13px] rounded-full border-[3px] border-mat bg-white" />
                <StepTag tag={s.tag} />
                <div>
                  <h3 className="font-display text-[1.7rem] leading-tight font-extrabold tracking-[-0.035em]">{s.title}</h3>
                  <p className="mt-1.5 max-w-sm text-white/70">{s.body}</p>
                </div>
              </li>
            ))}
            </ol>
          </div>
          {/* Fanned so every version keeps its red pen visible: v1 back right, v3 front left. */}
          <div className="relative mx-auto aspect-[16/12] w-full">
            <Proof src={versions[0]} className="top-[0%] right-[0%] w-[64%] rotate-[3deg]" tape="top" sizes="460px">
              <div data-mark="1">
                <PenCircle className="top-[36%] right-[0%] h-[56%] w-[24%]" strokeWidth={3.5} />
              </div>
            </Proof>
            <div data-mark="1" className="pointer-events-none absolute inset-0 z-10">
              <PenNote className="top-[54%] right-[-5%] w-44 rotate-[7deg] text-4xl bg-process-yellow px-3 pt-2 pb-1 shadow-[0_10px_16px_-10px_rgb(0_0_0/0.6)]">prices bigger pls!!</PenNote>
            </div>
            <Proof data-v="1" src={versions[1]} className="top-[24%] left-[12%] w-[64%] -rotate-[2deg]" tape="corners" sizes="460px">
              <div data-mark="2">
                <PenArrow className="top-[-10%] left-[24%] w-[20%] rotate-[50deg]" />
              </div>
            </Proof>
            <div data-mark="2" className="pointer-events-none absolute inset-0 z-10">
              <PenNote className="top-[10%] left-[-6%] -rotate-[5deg] text-4xl bg-process-yellow px-3 pt-2 pb-1 shadow-[0_10px_16px_-10px_rgb(0_0_0/0.6)]">add the special up top</PenNote>
            </div>
            <Proof data-v="2" src={versions[2]} className="top-[48%] left-[0%] w-[64%] rotate-[1.5deg]" tape="top" sizes="460px" />
            <div data-relay-stamp className="pointer-events-none absolute right-[37%] bottom-[6%] z-10 size-[26%]">
              <ApprovalStamp version={3} date="Oct 14" seed={5} />
            </div>
          </div>
        </div>
      </div>

      {/* Phones and reduced motion: the same story, stacked. */}
      <div className="mx-auto max-w-xl space-y-14 px-5 py-10 lg:hidden">
        {STEPS.map((s, i) => (
          <div key={s.title} className="space-y-5">
            <div className="flex gap-4">
              <StepTag tag={s.tag} />
              <div>
                <h3 className="font-display text-2xl font-extrabold tracking-[-0.03em]">{s.title}</h3>
                <p className="mt-1 text-white/70">{s.body}</p>
              </div>
            </div>
            <div className={cn("relative", (i === 1 || i === 2) && "pt-10")}>
              <Proof src={versions[Math.min(Math.max(i - 1, 0), 2)]} className="relative! -rotate-1" tape="top" sizes="100vw">
                {i === 1 && <PenCircle className="top-[36%] right-[0%] h-[56%] w-[24%]" strokeWidth={3.5} />}
              </Proof>
              {i === 1 && <PenNote className="top-0 right-0 rotate-6 text-3xl bg-process-yellow px-3 pt-2 pb-1 shadow-[0_10px_16px_-10px_rgb(0_0_0/0.6)]">prices bigger pls!!</PenNote>}
              {i === 2 && <PenNote className="top-0 left-4 -rotate-3 text-3xl bg-process-yellow px-3 pt-2 pb-1 shadow-[0_10px_16px_-10px_rgb(0_0_0/0.6)]">add the special up top</PenNote>}
              {i === 3 && <ApprovalStamp version={3} date="Oct 14" seed={5} className="absolute -right-3 -bottom-8 size-28 rotate-[-12deg]" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** A big outlined version tag. The filled copy on top shows when its step is active (always, without motion). */
function StepTag({ tag }: { tag: string }) {
  const pen = tag === "!!";
  return (
    <span aria-hidden="true" className={cn("relative w-16 shrink-0 text-5xl leading-[0.8] font-extrabold", pen ? "font-pen text-pen" : "font-display tracking-[-0.06em] text-process-yellow")}>
      <span className={pen ? "" : "text-outline"}>{tag}</span>
      <span data-fill className="absolute inset-0">
        {tag}
      </span>
    </span>
  );
}
