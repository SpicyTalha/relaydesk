"use client";

import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { CheckIcon } from "@phosphor-icons/react";
import { cn } from "cn";
import { Logo } from "@/components/brand/logo";
import { ApprovalStamp } from "@/components/brand/stamp";
import { PenNote } from "@/components/marketing/desk";
import { MatRulers } from "@/components/marketing/print";
import { Desk, back, clamp, enter, lerp, out, seg } from "../video/stage";

/*
 * The Fiverr gig video: Talha on camera, then the product, how he works, the packages and an end card.
 * Every frame is a pure function of t. The first `face` seconds are transparent apart from the name tag,
 * so scripts/assemble-gig-video.sh can lay them over the camera clip. Scene lengths come from
 * gallery/talha/timing.json, so the animation can be fitted to the recorded voice-over.
 */

export type Timing = { face: number; demo: number; ticket: number; packages: number; outro: number };

export const DEFAULT_TIMING: Timing = { face: 10, demo: 15, ticket: 12, packages: 6.5, outro: 7 };

export function GigVideoStage({ timing, photo }: { timing: Timing; photo: string | null }) {
  const [t, setT] = useState(0);
  const at = {
    demo: timing.face,
    ticket: timing.face + timing.demo,
    packages: timing.face + timing.demo + timing.ticket,
    outro: timing.face + timing.demo + timing.ticket + timing.packages,
  };
  const duration = at.outro + timing.outro;

  useEffect(() => {
    const w = window as unknown as { __setT: (v: number) => void; __duration: number; __face: number };
    w.__setT = (v) => flushSync(() => setT(v));
    w.__duration = duration;
    w.__face = timing.face;
  }, [duration, timing.face]);

  // The product demo was drawn for t = 3.2 → 18.25; stretch it to whatever the voice-over needs.
  const deskT = 3.2 + ((t - at.demo) * 15.05) / timing.demo;

  return (
    <div data-stage className={cn("relative h-[1080px] w-[1920px] overflow-hidden", t >= at.demo && "bg-ink")}>
      {t < at.demo && <NameTag t={t} face={timing.face} />}
      {t >= at.demo && t < at.ticket + 0.4 && <Desk t={Math.min(deskT, 18.0)} />}
      {t >= at.ticket && t < at.packages + 0.5 && <Ticket t={t - at.ticket} length={timing.ticket} />}
      {t >= at.packages && t < at.outro + 0.5 && <Packages t={t - at.packages} length={timing.packages} />}
      {t >= at.outro && <Outro t={t - at.outro} photo={photo} />}
    </div>
  );
}

/** Name and role, sliding in over the camera clip. */
function NameTag({ t, face }: { t: number; face: number }) {
  const a = back(seg(t, 0.7, 1.15));
  const b = back(seg(t, 0.85, 1.3));
  const gone = out(seg(t, face - 1.4, face - 0.9));
  return (
    <div className="absolute bottom-[110px] left-[110px] flex flex-col items-start gap-3" style={{ opacity: 1 - gone, transform: `translateX(${-gone * 60}px)` }}>
      <span
        className="rotate-[-2deg] bg-process-yellow px-7 pt-2 pb-3 font-display text-[84px] leading-none font-extrabold tracking-[-0.05em] text-ink shadow-[0_18px_30px_-16px_rgb(0_0_0/0.6)]"
        style={{ opacity: clamp(a * 1.5), transform: `translateX(${(1 - a) * -80}px) rotate(-2deg)` }}
      >
        Talha
      </span>
      <span
        className="rotate-[1deg] bg-ink px-6 py-3 text-[38px] font-semibold text-paper shadow-[0_18px_30px_-16px_rgb(0_0_0/0.6)]"
        style={{ opacity: clamp(b * 1.5), transform: `translateX(${(1 - b) * -80}px) rotate(1deg)` }}
      >
        SaaS MVP developer
      </span>
    </div>
  );
}

const TICKET = [
  ["Scope written first", "We agree what “done” means before I start"],
  ["AI-assisted, reviewed by me", "I read and test every change myself"],
  ["Tested on every change", "This demo runs 96 automated tests on every push"],
  ["Your code, your accounts", "Your GitHub, your hosting, your Stripe"],
];

/** How the work is done: a job ticket that gets ticked off line by line, then stamped. */
function Ticket({ t, length }: { t: number; length: number }) {
  const inn = out(seg(t, 0, 0.5));
  const leave = out(seg(t, length - 0.35, length));
  const card = back(seg(t, 0.35, 0.95));
  // Ticks land evenly across the middle of the scene, roughly as each line is spoken.
  const tickAt = (i: number) => 1.6 + (i * (length - 3.6)) / (TICKET.length - 1);
  const stamp = seg(t, length - 1.5, length - 1.25);
  return (
    <div className="absolute inset-0 bg-ink text-paper" style={{ clipPath: `inset(${(1 - inn) * 100}% 0 0 0)`, opacity: 1 - leave }}>
      <div className="absolute top-[170px] left-[130px] w-[640px]">
        <h2 className="font-display text-[118px] leading-[0.9] font-extrabold tracking-[-0.055em]" style={enter(t, 0.3, 99, 0.45, 60)}>
          Built like it&apos;s going to print.
        </h2>
        <p className="mt-10 text-[38px] leading-snug text-paper/80" style={enter(t, 0.6, 99, 0.45, 30)}>
          A clear scope, a human review, and code that&apos;s yours from day one.
        </p>
      </div>
      <div
        className="absolute top-[150px] right-[130px] w-[900px] bg-paper p-12 text-ink shadow-[0_60px_90px_-40px_rgb(0_0_0/0.85)]"
        style={{ opacity: clamp(card * 3), transform: `translateY(${(1 - card) * 500}px) rotate(${lerp(8, 1.5, card)}deg)` }}
      >
        <span aria-hidden="true" className="tape absolute -top-4 left-16 h-11 w-44 -rotate-6" />
        <div className="flex items-baseline justify-between border-b-[3px] border-ink pb-5">
          <p className="font-display text-[50px] font-extrabold tracking-[-0.03em]">Job ticket</p>
          <p className="text-[26px] font-semibold">every build</p>
        </div>
        <ul className="divide-y-2 divide-ink/15">
          {TICKET.map(([term, detail], i) => {
            const tick = out(seg(t, tickAt(i), tickAt(i) + 0.3));
            return (
              <li key={term} className="flex gap-6 py-[26px]">
                <span className="mt-1 grid size-12 shrink-0 place-items-center rounded-[6px] border-[3px] border-ink">
                  <CheckIcon weight="bold" className="size-9 text-pen" style={{ opacity: tick, transform: `scale(${lerp(1.8, 1, tick)}) rotate(${lerp(-25, 0, tick)}deg)` }} />
                </span>
                <div>
                  <p className="text-[36px] leading-tight font-semibold">{term}</p>
                  <p className="mt-1 text-[26px] text-ink/70">{detail}</p>
                </div>
              </li>
            );
          })}
        </ul>
        <div
          className="absolute -right-14 -bottom-16 size-64"
          style={{ opacity: clamp(stamp * 3), transform: `scale(${lerp(2.3, 1, out(stamp))}) rotate(${lerp(4, -16, stamp)}deg)` }}
        >
          <ApprovalStamp version={1} date="Ready" seed={13} title="" />
        </div>
      </div>
    </div>
  );
}

const PACKAGES = [
  { name: "Blueprint", days: "3 days", swatch: "bg-process-yellow text-ink", lines: ["Written scope and feature list", "Data model and cost estimate", "A fixed quote for the build"] },
  { name: "Core MVP", days: "14 days", swatch: "bg-process-magenta text-white", lines: ["Up to 3 core features", "Login and a database", "Deployed on your accounts"] },
  { name: "Launch Ready", days: "21 days", swatch: "bg-ink text-paper", lines: ["Up to 6 features", "Stripe, admin panel, one AI feature", "30 days of bug fixes"] },
];

/** The three packages, dealt onto the cutting mat like proofs. */
function Packages({ t, length }: { t: number; length: number }) {
  const inn = out(seg(t, 0, 0.45));
  const leave = out(seg(t, length - 0.35, length));
  return (
    <div className="mat absolute inset-0 text-white" style={{ transform: `translateX(${(1 - inn) * 1920}px)`, opacity: 1 - leave }}>
      <MatRulers count={14} />
      <h2 className="absolute top-[110px] left-[130px] font-display text-[110px] leading-none font-extrabold tracking-[-0.055em]" style={enter(t, 0.35, 99, 0.4, 40)}>
        Pick where to start.
      </h2>
      <div className="absolute top-[330px] left-[130px] flex gap-12">
        {PACKAGES.map((p, i) => {
          const d = back(seg(t, 0.6 + i * 0.35, 1.15 + i * 0.35));
          return (
            <div
              key={p.name}
              className="relative w-[520px] bg-paper p-10 text-ink shadow-[0_40px_60px_-28px_rgb(0_0_0/0.75)]"
              style={{ opacity: clamp(d * 3), transform: `translateY(${(1 - d) * 420}px) rotate(${[-2, 1, -1][i] + (1 - d) * 10}deg)` }}
            >
              <span aria-hidden="true" className="tape absolute -top-3 left-1/2 h-9 w-36 -translate-x-1/2 -rotate-3" />
              <div className="flex items-center justify-between">
                <span className={cn("px-4 py-1.5 font-display text-[44px] leading-tight font-extrabold tracking-[-0.03em]", p.swatch)}>{p.name}</span>
                <span className="text-[28px] font-semibold text-ink/70">{p.days}</span>
              </div>
              <ul className="mt-8 space-y-4">
                {p.lines.map((l) => (
                  <li key={l} className="flex items-start gap-3 text-[30px] leading-snug font-medium">
                    <CheckIcon weight="bold" className="mt-1.5 size-7 shrink-0 text-status-approved" />
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** End card: the promise, the person, and the one place to talk. */
function Outro({ t, photo }: { t: number; photo: string | null }) {
  const inn = out(seg(t, 0, 0.45));
  const stamp = seg(t, 2.1, 2.35);
  return (
    <div className="absolute inset-0 bg-process-yellow text-ink" style={{ clipPath: `circle(${inn * 140}% at 50% 110%)` }}>
      <div aria-hidden className="halftone absolute inset-0 text-ink/20 [mask-image:linear-gradient(to_bottom,transparent,black_45%,transparent)]" />
      <div className="absolute top-[90px] left-[130px]" style={enter(t, 0.4, 99, 0.4, 20)}>
        <Logo className="origin-left scale-[1.6]" />
      </div>
      <h2 className="absolute top-[250px] left-[130px] w-[1100px] font-display text-[150px] leading-[0.88] font-extrabold tracking-[-0.055em]" style={enter(t, 0.5, 99, 0.45, 70)}>
        Your SaaS MVP, built properly.
      </h2>
      <PenNote className="bottom-[150px] left-[140px] -rotate-[3deg] text-[76px] text-pen" style={enter(t, 1.3, 99, 0.35, 20)}>
        message me here on Fiverr
      </PenNote>
      {photo ? (
        <div className="absolute top-[170px] right-[150px] w-[470px]" style={{ ...enter(t, 0.8, 99, 0.45, 80), rotate: "4deg" }}>
          <div className="relative bg-white p-5 pb-24 shadow-[0_40px_60px_-26px_rgb(0_0_0/0.6)]">
            {/* eslint-disable-next-line @next/next/no-img-element -- dev-only render of a local data URL */}
            <img src={photo} alt="" className="aspect-[4/5] w-full object-cover" />
            <span aria-hidden="true" className="tape absolute -top-4 left-1/2 h-10 w-40 -translate-x-1/2 -rotate-3" />
            <p className="absolute bottom-5 left-0 w-full text-center font-pen text-[60px] leading-none">that&apos;s me, Talha</p>
          </div>
          <div
            className="absolute -bottom-20 -left-24 size-[250px]"
            style={{ opacity: clamp(stamp * 3), transform: `scale(${lerp(2.3, 1, out(stamp))}) rotate(${lerp(4, -14, stamp)}deg)` }}
          >
            <ApprovalStamp version={1} date="Ship it" seed={5} title="" />
          </div>
        </div>
      ) : (
        <div
          className="absolute top-[110px] right-[170px] size-[300px]"
          style={{ opacity: clamp(stamp * 3), transform: `scale(${lerp(2.3, 1, out(stamp))}) rotate(${lerp(4, -12, stamp)}deg)` }}
        >
          <ApprovalStamp version={1} date="Ship it" seed={5} title="" />
        </div>
      )}
    </div>
  );
}
