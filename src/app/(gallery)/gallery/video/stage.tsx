"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { CheckIcon } from "@phosphor-icons/react";
import { Logo } from "@/components/brand/logo";
import { ApprovalStamp } from "@/components/brand/stamp";
import { PenNote, Proof } from "@/components/marketing/desk";
import { MatRulers } from "@/components/marketing/print";
import { ChecklistCard } from "@/components/deliverable/checklist-card";
import menuV1 from "../../../../../public/relay/northwind-menu-board-v1.png";
import menuV3 from "../../../../../public/relay/northwind-menu-board-v3.png";
import phone from "../../../../../public/screens/client-approve-phone.png";

/*
 * Every frame is a pure function of t (seconds). scripts/render-video.mjs calls window.__setT(t)
 * and screenshots the stage; nothing here uses CSS transitions or timers.
 */

export const clamp = (v: number) => Math.min(1, Math.max(0, v));
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const out = (p: number) => 1 - Math.pow(1 - p, 3);
export const back = (p: number) => 1 + 2.4 * Math.pow(p - 1, 3) + 1.4 * Math.pow(p - 1, 2);
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** Something entering: fades and rises in over [a, a+d], leaves over [z-d, z]. */
export function enter(t: number, a: number, z = 99, d = 0.35, dy = 40) {
  const i = out(seg(t, a, a + d));
  const o = out(seg(t, z - d, z));
  return { opacity: i * (1 - o), transform: `translateY(${(1 - i) * dy - o * dy}px)` } as const;
}

const SCENES = [3.2, 6.4, 10.4, 14.4, 18.2, 22];
export const DURATION = 22;

export function VideoStage() {
  const [t, setT] = useState(0);
  useEffect(() => {
    (window as unknown as { __setT: (v: number) => void }).__setT = (v) => flushSync(() => setT(v));
    (window as unknown as { __duration: number }).__duration = DURATION;
  }, []);

  return (
    <div data-stage className="relative h-[1080px] w-[1920px] overflow-hidden bg-ink">
      {t < SCENES[0] + 0.01 && <Hook t={t} />}
      {t >= SCENES[0] && t < SCENES[4] + 0.01 && <Desk t={t} />}
      {t >= SCENES[4] - 0.4 && <Outro t={t} />}
      {/* Keep every image decoded from frame 0, so no frame waits on a download. */}
      <div className="pointer-events-none absolute size-px overflow-hidden opacity-0">
        <Image src={menuV1} alt="" priority />
        <Image src={menuV3} alt="" priority />
        <Image src={phone} alt="" priority />
      </div>
    </div>
  );
}

const EMAILS = [
  { text: "Re: Re: FINAL_v7_REAL_final.png", x: 1080, y: 150, r: 4 },
  { text: "any update on the menu??", x: 1240, y: 330, r: -3 },
  { text: "which version is this one?", x: 1010, y: 520, r: 2.5 },
  { text: "looks good! wait, one more thing", x: 1180, y: 720, r: -2 },
  { text: "Fwd: Fwd: approval?", x: 1060, y: 890, r: 3 },
];

function Hook({ t }: { t: number }) {
  const words = ["Still", "chasing", "approval", "over", "email?"];
  const leave = out(seg(t, 2.85, 3.2));
  return (
    <div className="absolute inset-0 bg-process-yellow">
      <div aria-hidden className="halftone absolute inset-0 text-ink/20 [mask-image:linear-gradient(to_bottom,transparent,black_40%,transparent)]" />
      <h1
        className="absolute top-[300px] left-[130px] w-[860px] font-display text-[132px] leading-[0.9] font-extrabold tracking-[-0.055em] text-ink"
        style={{ transform: `translateY(${-leave * 80}px)`, opacity: 1 - leave }}
      >
        {words.map((w, i) => {
          const p = back(seg(t, 0.1 + i * 0.12, 0.45 + i * 0.12));
          return (
            <span key={w} className="inline-block" style={{ opacity: clamp(p * 1.5), transform: `translateY(${(1 - p) * 60}px)`, marginRight: "0.22em" }}>
              {w}
            </span>
          );
        })}
      </h1>
      {EMAILS.map((e, i) => {
        const p = back(seg(t, 0.55 + i * 0.22, 0.95 + i * 0.22));
        const shake = Math.sin(t * 9 + i) * 0.8 * clamp(seg(t, 1.6, 2.8));
        return (
          <div
            key={e.text}
            className="absolute flex items-center gap-4 rounded-[14px] bg-white px-6 py-5 shadow-[0_24px_40px_-20px_rgb(0_0_0/0.45)]"
            style={{
              left: e.x,
              top: e.y,
              opacity: clamp(p * 1.4) * (1 - leave),
              transform: `translateY(${(1 - p) * -70 + leave * 120}px) rotate(${e.r + shake}deg) scale(${0.85 + 0.15 * p})`,
            }}
          >
            <span className="grid size-11 place-items-center rounded-full bg-ink/8 text-[22px]">✉</span>
            <span className="text-[30px] font-semibold text-ink">{e.text}</span>
          </div>
        );
      })}
    </div>
  );
}

function Caption({ t, a, z, children }: { t: number; a: number; z: number; children: React.ReactNode }) {
  return (
    <p
      className="absolute bottom-[120px] left-[130px] w-[640px] font-display text-[76px] leading-[0.95] font-extrabold tracking-[-0.045em] text-white"
      style={enter(t, a, z, 0.4, 50)}
    >
      {children}
    </p>
  );
}

export function Desk({ t }: { t: number }) {
  const intro = out(seg(t, 3.2, 3.6));
  // Scene 2: logo reveal.
  const logo = back(seg(t, 3.35, 3.85));
  const logoOut = out(seg(t, 6.1, 6.45));
  // Scene 3: v1 drops, cursor taps the prices, pin, circle, sticky note.
  const v1In = back(seg(t, 6.45, 6.95));
  const cursor = out(seg(t, 7.0, 7.6));
  const tap = seg(t, 7.6, 7.95);
  const pin = back(seg(t, 7.7, 8.0));
  const circle = out(seg(t, 7.85, 8.45));
  const note = out(seg(t, 8.45, 8.85));
  // Scene 4: v1 moves aside, the checklist arrives, items appear, one is ticked.
  const shift = out(seg(t, 10.4, 10.9));
  const card = back(seg(t, 10.6, 11.15));
  const items = t < 11.55 ? 1 : 2;
  const ticked = t >= 12.9;
  const cardOut = out(seg(t, 14.2, 14.5));
  // Scene 5: v3 lands, the phone taps Approve, the stamp slams.
  const v3In = back(seg(t, 14.5, 15.0));
  const phoneIn = out(seg(t, 14.6, 15.1));
  const approveTap = seg(t, 15.35, 15.65);
  const stamp = seg(t, 15.6, 15.85);
  const shake = t > 15.85 && t < 16.05 ? Math.sin((t - 15.85) * 120) * 5 * (1 - seg(t, 15.85, 16.05)) : 0;
  const leave = out(seg(t, 17.9, 18.25));

  const v1x = lerp(880, 640, shift);
  const v1scale = lerp(1, 0.86, shift);

  return (
    <div className="mat absolute inset-0" style={{ transform: `translateY(${(1 - intro) * 1080}px)` }}>
      <MatRulers count={14} />
      <div className="absolute inset-0" style={{ transform: `translateY(${shake}px)`, opacity: 1 - leave }}>
        {/* Scene 2 */}
        <div className="absolute inset-0 grid place-items-center" style={{ opacity: clamp(logo * 1.2) * (1 - logoOut) }}>
          <div className="text-center text-white" style={{ transform: `scale(${0.8 + 0.2 * logo})` }}>
            <Logo className="origin-center scale-[4.6] text-white" />
            <p className="mt-32 font-display text-[96px] leading-none font-extrabold tracking-[-0.05em]" style={enter(t, 3.8, 99, 0.4, 40)}>
              Send work. Get a clear yes.
            </p>
          </div>
        </div>

        {/* Scene 3 and 4: v1 with the client's red pen */}
        {t >= 6.4 && (
          <div
            className="absolute top-[170px] w-[860px]"
            style={{
              left: v1x,
              opacity: clamp(v1In * 1.4) * (1 - out(seg(t, 14.4, 14.7))),
              transform: `translateY(${(1 - v1In) * -260}px) rotate(${lerp(10, -3, v1In)}deg) scale(${v1scale})`,
              transformOrigin: "top left",
            }}
          >
            <div className="proof relative">
              <Image src={menuV1} alt="" className="block h-auto w-full" />
              <span aria-hidden className="tape absolute -top-3 left-1/2 h-8 w-32 -translate-x-1/2 -rotate-3" />
              <svg viewBox="0 0 220 90" preserveAspectRatio="none" className="absolute top-[34%] right-[-1%] h-[60%] w-[26%] overflow-visible">
                <path
                  d="M30 20 C70 4 190 2 208 32 C224 60 150 84 70 80 C14 77 2 52 18 34 C30 21 60 12 98 10"
                  pathLength={1}
                  fill="none"
                  stroke="var(--color-pen)"
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeDasharray="1"
                  strokeDashoffset={1 - circle}
                />
              </svg>
              <span
                className="absolute top-[50%] right-[9%] grid size-14 place-items-center rounded-full border-[3px] border-pen bg-white font-pen text-[30px] text-pen shadow-lg"
                style={{ opacity: clamp(pin * 1.5), transform: `translate(50%, -50%) scale(${pin})` }}
              >
                1
              </span>
            </div>
            <div className="absolute -top-[86px] right-[0px] rotate-[4deg]" style={{ opacity: note, transform: `scale(${0.8 + 0.2 * note})` }}>
              <PenNote className="relative! bg-process-yellow px-5 pt-3 pb-2 text-[44px] shadow-[0_14px_20px_-12px_rgb(0_0_0/0.6)]">
                bigger!! can&apos;t read it from the counter
              </PenNote>
            </div>
          </div>
        )}

        {/* The client's cursor */}
        {t >= 6.9 && t < 8.6 && (
          <div className="absolute" style={{ left: lerp(1560, 1652, cursor), top: lerp(1000, 400, cursor), opacity: 1 - seg(t, 8.3, 8.6) }}>
            <span
              className="absolute -top-10 -left-10 size-20 rounded-full border-4 border-pen"
              style={{ opacity: tap > 0 ? 1 - tap : 0, transform: `scale(${0.4 + tap * 1.2})` }}
            />
            <svg width="44" height="44" viewBox="0 0 24 24" className="drop-shadow-[0_4px_6px_rgb(0_0_0/0.4)]">
              <path d="M4 2 L20 12 L13 13.5 L10 21 Z" fill="#15171a" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {/* Scene 4: the real checklist card */}
        {t >= 10.5 && t < 14.6 && (
          <div
            className="absolute top-[150px] right-[110px] w-[560px] origin-top-right"
            style={{ opacity: clamp(card * 4) * (1 - cardOut), transform: `translateX(${(1 - card) * 420}px) rotate(${lerp(6, -2, card)}deg) scale(1.62)` }}
          >
            <ChecklistCard
              slug="video"
              deliverableId="00000000-0000-0000-0000-000000000000"
              checklist={{
                id: "video",
                versionId: "v1",
                model: "google/gemini-3.5-flash-lite",
                createdAt: "2026-10-07T00:00:00Z",
                items: [
                  { id: "a", body: "Make the prices much bigger", quote: "Can they be a lot bigger?", commentId: "c1", done: ticked },
                  { id: "b", body: "Check they read from behind the counter", quote: "The prices are hard to read from the counter.", commentId: "c2", done: false },
                ].slice(0, items),
              }}
              checklistVersion={1}
              latestVersion={1}
              openNotes={2}
              hasNewNotes={false}
              allowance={{ limit: 50, left: 49 }}
              pins={{ c1: 1 }}
              billingHref={null}
            />
          </div>
        )}

        {/* Scene 5: v3, the phone, the stamp */}
        {t >= 14.4 && (
          <>
            <div
              className="absolute top-[170px] left-[760px] w-[920px]"
              style={{ opacity: clamp(v3In * 1.4), transform: `translateY(${(1 - v3In) * -280}px) rotate(${lerp(-9, 2, v3In)}deg)` }}
            >
              <Proof src={menuV3} className="relative!" tape="corners" sizes="1000px" priority />
              <div
                className="absolute right-[30px] bottom-[-40px] size-[380px]"
                style={{ opacity: clamp(stamp * 3), transform: `scale(${lerp(2.3, 1, out(stamp))}) rotate(${lerp(4, -14, stamp)}deg)` }}
              >
                <ApprovalStamp version={3} date="Oct 14" seed={11} title="" className="text-[#4cc384]" />
              </div>
            </div>
            <div
              className="absolute top-[330px] left-[700px] w-[300px] overflow-hidden rounded-[2.6rem] border-[8px] border-ink bg-ink shadow-[0_50px_80px_-30px_rgb(0_0_0/0.65)]"
              style={{ transform: `translateY(${(1 - phoneIn) * 800}px) rotate(-5deg)` }}
            >
              <Image src={phone} alt="" className="block h-auto w-full" />
              <span
                className="absolute bottom-[34px] left-[66%] size-20 -translate-x-1/2 rounded-full border-4 border-white"
                style={{ opacity: approveTap > 0 ? 1 - approveTap : 0, transform: `translate(-50%, 0) scale(${0.4 + approveTap * 1.3})` }}
              />
            </div>
          </>
        )}

        <Caption t={t} a={6.8} z={10.3}>
          Clients pin notes right on the work.
        </Caption>
        <Caption t={t} a={10.8} z={14.3}>
          AI turns notes into a to-do list.
        </Caption>
        {t >= 14.4 && (
          <p className="absolute bottom-[120px] left-[110px] w-[560px] font-display text-[72px] leading-[0.95] font-extrabold tracking-[-0.045em] text-white" style={enter(t, 15.0, 18.1, 0.4, 50)}>
            One tap.
            <br />
            Signed off,
            <br />
            with the date.
          </p>
        )}
      </div>
    </div>
  );
}

const CHIPS = ["Login and roles", "Stripe payments", "Admin panel", "AI feature", "82 + 14 automated tests"];

function Outro({ t }: { t: number }) {
  const inn = out(seg(t, 18.0, 18.45));
  return (
    <div className="absolute inset-0 bg-process-yellow" style={{ clipPath: `circle(${inn * 140}% at 50% 110%)` }}>
      <div aria-hidden className="halftone absolute inset-0 text-ink/20 [mask-image:linear-gradient(to_bottom,transparent,black_45%,transparent)]" />
      <div className="absolute top-[90px] left-[130px]" style={enter(t, 18.4, 99, 0.4, 20)}>
        <Logo className="origin-left scale-[1.6]" />
      </div>
      <h2
        className="absolute top-[260px] left-[130px] w-[1300px] font-display text-[150px] leading-[0.88] font-extrabold tracking-[-0.055em] text-ink"
        style={enter(t, 18.5, 99, 0.45, 70)}
      >
        Your SaaS MVP, built properly.
      </h2>
      <div className="absolute top-[680px] left-[130px] flex w-[1500px] flex-wrap gap-4">
        {CHIPS.map((c, i) => (
          <span
            key={c}
            className="flex items-center gap-3 rounded-full bg-ink px-7 py-4 text-[34px] font-semibold text-paper"
            style={{ ...enter(t, 19.3 + i * 0.14, 99, 0.3, 30) }}
          >
            <CheckIcon weight="bold" className="size-8 text-process-yellow" />
            {c}
          </span>
        ))}
      </div>
      <PenNote className="right-[150px] bottom-[110px] -rotate-[4deg] text-[56px]" style={{ ...enter(t, 20.2, 99, 0.35, 20) }}>
        a real app you can click through
      </PenNote>
      <div
        className="absolute top-[110px] right-[170px] size-[300px]"
        style={{ opacity: clamp(seg(t, 20.5, 20.75) * 3), transform: `scale(${lerp(2.3, 1, out(seg(t, 20.5, 20.75)))}) rotate(${lerp(4, -12, seg(t, 20.5, 20.75))}deg)` }}
      >
        <ApprovalStamp version={1} date="Ship it" seed={5} title="" />
      </div>
    </div>
  );
}
