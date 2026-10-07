"use client";

import Image, { type StaticImageData } from "next/image";
import { useRef } from "react";
import { ChatCircleIcon } from "@phosphor-icons/react";
import { cn } from "cn";
import { ApprovalStamp } from "@/components/brand/stamp";
import { gsap, useGSAP } from "@/components/motion/gsap";

type Step = { title: string; body: string };

const STEPS: Step[] = [
  { title: "Version 1 goes out", body: "The studio uploads the spring menu board and asks Northwind for sign-off, due Friday." },
  { title: "The client says what's wrong", body: "From behind the counter, on a phone: the prices are too small to read." },
  { title: "Version 2, then one more note", body: "Bigger prices. Daniel asks for the seasonal special at the top." },
  { title: "Version 3 is signed off", body: "Approved, with his name and the date on it. Nobody has to dig through email for the yes." },
];

const NOTES = [
  "The prices are hard to read from the counter. Can they be a lot bigger?",
  "Much better! Can we add the seasonal special at the top?",
];

/**
 * A pinned scroll story with the demo's real artwork: v1, a note, v2, a note, v3, the stamp.
 * Desktop with motion allowed only; phones and reduced motion get the same story, stacked.
 */
export function RelayStory({ versions }: { versions: [StaticImageData, StaticImageData, StaticImageData] }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const q = gsap.utils.selector(scope);
        gsap.set([q("[data-v='1']"), q("[data-v='2']"), q("[data-note]"), q("[data-relay-stamp]")], { autoAlpha: 0 });
        gsap.set(q("[data-step]"), { opacity: 0.3 });
        gsap.set(q("[data-step='0']"), { opacity: 1 });
        gsap.set(q("[data-relay-stamp]"), { scale: 2, rotate: 6 });

        const tl = gsap.timeline({
          defaults: { ease: "power2.out", duration: 1 },
          scrollTrigger: { trigger: q("[data-pin]")[0], start: "top top", end: "+=320%", pin: true, scrub: 0.6 },
        });
        const stepTo = (i: number, at: string) =>
          tl.to(q("[data-step]"), { opacity: 0.3, duration: 0.4 }, at).to(q(`[data-step='${i}']`), { opacity: 1, duration: 0.4 }, at);

        tl.to(q("[data-note='0']"), { autoAlpha: 1, y: 0 }, 0.6);
        stepTo(1, "0.6");
        tl.to(q("[data-v='1']"), { autoAlpha: 1 }, 1.8).to(q("[data-note='0']"), { autoAlpha: 0, y: -12 }, 1.8);
        stepTo(2, "1.8");
        tl.to(q("[data-note='1']"), { autoAlpha: 1, y: 0 }, 2.5);
        tl.to(q("[data-v='2']"), { autoAlpha: 1 }, 3.4).to(q("[data-note='1']"), { autoAlpha: 0, y: -12 }, 3.4);
        stepTo(3, "3.4");
        tl.to(q("[data-relay-stamp]"), { autoAlpha: 1, scale: 1, rotate: -12, duration: 0.5, ease: "power4.in" }, 4.1);
        tl.to({}, { duration: 0.6 });
      });
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <div ref={scope}>
      {/* Desktop: pinned. The default (no JS) state is the end of the story: v3, signed off. */}
      <div data-pin className="hidden min-h-[80svh] items-center py-16 lg:flex">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] items-center gap-16 px-5">
          <ol className="space-y-8">
            {STEPS.map((s, i) => (
              <li key={s.title} data-step={i} className="border-l-2 border-foreground/15 pl-5">
                <h3 className="text-xl font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
          <div className="relative">
            <div className="relative aspect-[16/9] overflow-hidden rounded-[14px] shadow-[0_40px_80px_-40px_rgb(21_23_26/0.6)]">
              {versions.map((v, i) => (
                <Image
                  key={i}
                  data-v={i}
                  src={v}
                  alt={i === 2 ? "Northwind Coffee spring menu board, version 3, with the seasonal special" : ""}
                  sizes="640px"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ))}
            </div>
            {NOTES.map((n, i) => (
              <Note key={n} data-note={i} className="absolute -bottom-8 left-8 max-w-sm translate-y-3">
                {n}
              </Note>
            ))}
            <div data-relay-stamp className="pointer-events-none absolute -top-10 -right-8 size-44">
              <ApprovalStamp version={3} date="Oct 14" seed={5} />
            </div>
          </div>
        </div>
      </div>

      {/* Phones and reduced motion: the same story, stacked. */}
      <div className="mx-auto max-w-xl space-y-10 px-5 py-6 lg:hidden">
        {STEPS.map((s, i) => (
          <div key={s.title} className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold">{s.title}</h3>
              <p className="mt-1 text-muted-foreground">{s.body}</p>
            </div>
            {i === 1 || i === 2 ? (
              <Note>{NOTES[i - 1]}</Note>
            ) : (
              <div className="relative">
                <Image src={versions[i === 0 ? 0 : 2]} alt="" sizes="100vw" className="rounded-[14px]" />
                {i === 3 && <ApprovalStamp version={3} date="Oct 14" seed={5} className="absolute -top-6 -right-3 size-28 rotate-[-12deg]" />}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Note({ children, className, ...props }: React.ComponentProps<"figure">) {
  return (
    <figure className={cn("flex gap-3 rounded-[14px] border bg-card p-4 shadow-[0_20px_40px_-24px_rgb(21_23_26/0.45)]", className)} {...props}>
      <ChatCircleIcon className="mt-0.5 size-5 shrink-0 text-status-changes" aria-hidden="true" />
      <div>
        <blockquote className="text-[15px] leading-snug">&ldquo;{children}&rdquo;</blockquote>
        <figcaption className="mt-1.5 text-sm text-muted-foreground">Daniel Okafor, Northwind Coffee</figcaption>
      </div>
    </figure>
  );
}
