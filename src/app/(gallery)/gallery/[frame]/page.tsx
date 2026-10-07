import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CheckIcon } from "@phosphor-icons/react/ssr";
import { Logo } from "@/components/brand/logo";
import { ApprovalStamp } from "@/components/brand/stamp";
import { PenNote, Proof } from "@/components/marketing/desk";
import { MatRulers } from "@/components/marketing/print";
import overview from "../../../../../public/screens/agency-overview.png";
import phone from "../../../../../public/screens/client-approve-phone.png";
import pins from "../../../../../gallery/shots/pins.png";
import checklist from "../../../../../gallery/shots/checklist.png";

/**
 * Fiverr gallery images (1280×769), built from the product's own components and real screenshots.
 * Development only: rendered to PNG by scripts/render-gallery.mjs, never served in production.
 */
export const metadata: Metadata = { title: "Gallery", robots: { index: false } };

export function generateStaticParams() {
  return [{ frame: "1" }, { frame: "2" }, { frame: "3" }];
}

export default async function GalleryFrame({ params }: PageProps<"/gallery/[frame]">) {
  if (process.env.NODE_ENV === "production") notFound();
  const { frame } = await params;
  const Frame = { "1": Cover, "2": Features, "3": Quality }[frame];
  if (!Frame) notFound();
  return (
    <div data-frame className="relative h-[769px] w-[1280px] overflow-hidden">
      <Frame />
    </div>
  );
}

function Cover() {
  return (
    <div className="relative size-full bg-process-yellow text-ink">
      <div aria-hidden="true" className="halftone absolute inset-0 text-ink/20 [mask-image:linear-gradient(to_bottom,transparent,black_45%,transparent)]" />
      <div className="absolute top-[70px] left-[72px] w-[560px]">
        <Logo className="scale-125 origin-left" />
        <h1 className="mt-10 font-display text-[88px] leading-[0.88] font-extrabold tracking-[-0.055em]">Your SaaS MVP, built properly.</h1>
        <p className="mt-7 text-[25px] leading-snug font-medium">Login, payments, admin panel and AI. Tested, deployed, and yours.</p>
        <PenNote className="relative! mt-9 -rotate-[3deg] text-[34px]">a real app you can click through</PenNote>
      </div>
      <div className="absolute top-[64px] right-[-120px] h-[640px] w-[700px]">
        <Proof src={overview} className="top-[40px] left-[40px] w-[660px] rotate-[3deg]" tape="corners" sizes="1400px" />
        <div className="absolute top-[200px] left-[-20px] w-[230px] -rotate-[5deg] overflow-hidden rounded-[2.2rem] border-[7px] border-ink bg-ink shadow-[0_40px_60px_-25px_rgb(0_0_0/0.55)]">
          <Image src={phone} alt="" sizes="500px" />
        </div>
        <div className="absolute top-[420px] left-[150px] size-[190px] -rotate-[14deg]">
          <ApprovalStamp version={3} date="Oct 14" seed={11} title="" />
        </div>
      </div>
      <p className="absolute bottom-[40px] left-[72px] text-[17px] font-semibold text-ink/75">Sample build: Relaydesk, a client approval app with a live demo.</p>
    </div>
  );
}

const FEATURES = [
  "Sign-up, roles and invite links",
  "Stripe billing with verified webhooks",
  "Admin panel and audit log",
  "AI checklist from client notes",
  "Works on any phone",
];

function Features() {
  return (
    <div className="mat relative size-full text-white">
      <MatRulers count={10} />
      <h2 className="absolute top-[58px] left-[72px] w-[1000px] font-display text-[60px] leading-[0.95] font-extrabold tracking-[-0.045em]">
        Every feature finished. Not fifteen half-done.
      </h2>
      <div className="absolute top-[262px] left-[72px] w-[470px] space-y-4">
        {FEATURES.map((f, i) => (
          <p
            key={f}
            className="flex w-fit items-center gap-3 bg-paper px-4 py-2.5 text-[22px] font-semibold text-ink shadow-[0_10px_16px_-10px_rgb(0_0_0/0.6)]"
            style={{ rotate: `${[-1.5, 1, -0.5, 1.5, -1][i]}deg` }}
          >
            <CheckIcon weight="bold" className="size-6 text-status-approved" aria-hidden="true" />
            {f}
          </p>
        ))}
      </div>
      <Proof src={pins} className="top-[222px] right-[262px] w-[370px] rotate-[2deg]" tape="top" sizes="800px" />
      <div className="absolute top-[300px] right-[44px] w-[290px] -rotate-[3deg] overflow-hidden rounded-xl shadow-[0_30px_50px_-20px_rgb(0_0_0/0.65)]">
        <Image src={checklist} alt="" sizes="600px" />
      </div>
      <PenNote className="right-[64px] bottom-[34px] rotate-[3deg] bg-process-yellow px-3 pt-2 pb-1 text-[30px] shadow-[0_10px_16px_-10px_rgb(0_0_0/0.6)]">
        client notes become a to-do list
      </PenNote>
    </div>
  );
}

const TICKET = [
  ["82 database security tests", "Every table locked down per user and per client"],
  ["14 end-to-end tests", "The whole app clicked through on every push"],
  ["Payments that can't apply twice", "Stripe events verified and recorded once"],
  ["Scope written first", "Every feature has a clear \"done\" before work starts"],
  ["Your code, your accounts", "GitHub and Vercel in your name from day one"],
];

function Quality() {
  return (
    <div className="relative size-full bg-ink text-paper">
      <div className="absolute top-[80px] left-[72px] w-[470px]">
        <h2 className="font-display text-[76px] leading-[0.9] font-extrabold tracking-[-0.05em]">Built like it&apos;s going to print.</h2>
        <p className="mt-7 text-[23px] leading-snug text-paper/80">Tests, security and short notes your next developer can actually read.</p>
      </div>
      <div className="absolute top-[70px] right-[72px] w-[600px] rotate-[1.5deg] bg-paper p-8 text-ink shadow-[0_40px_70px_-30px_rgb(0_0_0/0.8)]">
        <span aria-hidden="true" className="tape absolute -top-3 left-12 h-8 w-32 -rotate-6" />
        <div className="flex items-baseline justify-between border-b-2 border-ink pb-3">
          <p className="font-display text-[30px] font-extrabold tracking-[-0.03em]">Job ticket</p>
          <p className="text-[16px] font-semibold">every build</p>
        </div>
        <ul className="divide-y divide-ink/15">
          {TICKET.map(([term, detail]) => (
            <li key={term} className="flex gap-4 py-[15px]">
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-[4px] border-2 border-ink">
                <CheckIcon weight="bold" className="size-5 text-pen" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[21px] leading-tight font-semibold">{term}</p>
                <p className="mt-0.5 text-[16px] text-ink/70">{detail}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="absolute -right-10 -bottom-12 size-40 -rotate-[16deg]">
          <ApprovalStamp version={1} date="Oct 14" seed={13} title="" />
        </div>
      </div>
    </div>
  );
}
