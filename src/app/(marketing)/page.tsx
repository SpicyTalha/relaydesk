import Image from "next/image";
import Link from "next/link";
import { CheckIcon, GithubLogoIcon, MinusIcon } from "@phosphor-icons/react/ssr";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { ApprovalStamp } from "@/components/brand/stamp";
import { DemoButtons } from "@/components/marketing/demo-buttons";
import { HeroDesk } from "@/components/marketing/hero-desk";
import { RelayStory } from "@/components/marketing/relay-story";
import { BinderClip, PenArrow, PenNote, PenUnderline, Proof, TapeMarquee } from "@/components/marketing/desk";
import { CoffeeRing, ColorBar, CropMarks, Loupe, MatAngles, MatRulers, RegMark } from "@/components/marketing/print";
import { PLANS } from "@/lib/billing/plans";
import { formatBytes } from "@/lib/format";
import overview from "../../../public/screens/agency-overview.png";
import phone from "../../../public/screens/client-approve-phone.png";
import history from "../../../public/screens/crop-history.png";
import invite from "../../../public/screens/crop-invite.png";
import v1 from "../../../public/relay/northwind-menu-board-v1.png";
import v2 from "../../../public/relay/northwind-menu-board-v2.png";
import v3 from "../../../public/relay/northwind-menu-board-v3.png";
import instagram from "../../../public/relay/northwind-instagram-launch.png";
import logos from "../../../public/relay/juniper-logo-concepts.png";

const REPO = "https://github.com/SpicyTalha/relaydesk";

const CHIPS = [
  { swatch: "bg-process-yellow", code: "FREE 0 C", ink: "text-ink", tilt: "md:-rotate-[1.5deg]" },
  { swatch: "bg-process-magenta", code: "PRO 29 C", ink: "text-white", tilt: "md:-translate-y-5 md:rotate-[1deg]" },
  { swatch: "bg-ink", code: "STUDIO 79 C", ink: "text-white", tilt: "md:rotate-[2deg]" },
] as const;

const INCLUDED = [
  "Unlimited client reviewers, free",
  "Every version and comment kept",
  "Approvals signed with name and date",
  "Cancel any time from Billing",
];

const TICKET = [
  ["Row Level Security on every table", "62 database tests try to read across agencies and clients. They all fail."],
  ["Payments that can't apply twice", "Stripe webhooks are signature-checked, re-fetched, and recorded in the same transaction as the plan change."],
  ["Limits the browser can't skip", "Client, seat and storage limits live in Postgres, not behind hidden buttons."],
  ["The whole loop, tested", "Playwright runs it end to end, with the client on a phone."],
  ["Fast by default", "Next.js 16 static shells load instantly; live data streams in behind them."],
];

export default function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col overflow-x-clip bg-paper text-ink">
      <header className="absolute inset-x-0 top-0 z-40">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5">
          <Link href="/" className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ink/40">
            <Logo />
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-1.5 md:flex">
            {[
              ["How it works", "#how-it-works"],
              ["Pricing", "#pricing"],
              ["Under the hood", "#under-the-hood"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="rounded-full bg-white/55 px-4 py-2 text-sm font-semibold backdrop-blur outline-none hover:bg-white focus-visible:ring-3 focus-visible:ring-ink/40"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" asChild className="font-semibold hover:bg-white/50">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild className="hidden h-10 rounded-full px-5 sm:inline-flex">
              <Link href="/signup">Start free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO: process yellow, poster type, the proofing desk. */}
        <section className="relative overflow-hidden rounded-b-[2.5rem] bg-process-yellow pt-28 pb-24 sm:rounded-b-[3.5rem] lg:pt-32">
          <div aria-hidden="true" className="halftone pointer-events-none absolute inset-0 text-ink/20 [mask-image:linear-gradient(to_bottom,transparent,black_40%,transparent)]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="relative">
              <h1 className="font-display text-[clamp(3.3rem,7.4vw,7rem)] leading-[0.88] font-extrabold tracking-[-0.055em]">
                Get it signed off,{" "}
                <span className="relative inline-block">
                  not lost
                  <PenUnderline className="-bottom-1 left-0 h-4 w-full" />
                </span>{" "}
                in email.
              </h1>
              <p className="mt-7 max-w-md text-xl leading-snug font-medium">
                Clients review your work, approve it or mark it up from any phone. Every version and every yes, kept.
              </p>
              <div className="relative mt-9 pb-16 lg:pb-0">
                <DemoButtons />
                <PenNote className="bottom-0 left-2 -rotate-[3deg] text-[1.7rem] lg:top-[115%] lg:bottom-auto lg:left-[6.5rem]">
                  no sign-up. your own private copy.
                </PenNote>
              </div>
            </div>
            <HeroDesk menuV1={v1} menuV3={v3} instagram={instagram} logos={logos} />
          </div>
        </section>

        <TapeMarquee words={["Approved", "Changes requested", "v3", "Signed off", "Due Friday", "Back to you"]} className="-my-6" />

        {/* THE RELAY: a pinned scroll story on the studio's cutting mat. */}
        <section id="how-it-works" aria-labelledby="relay-title" className="mat relative scroll-mt-10 overflow-hidden pt-28 pb-10 text-white">
          <MatRulers />
          <MatAngles className="bottom-0 left-0 hidden w-[30rem] lg:block" />
          <CoffeeRing className="-top-10 right-[4%] size-72 rotate-12" />
          <div className="relative mx-auto grid max-w-6xl gap-6 px-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.6fr)] lg:items-end">
            <h2 id="relay-title" className="font-display text-[clamp(2.6rem,5.5vw,5rem)] leading-[0.92] font-extrabold tracking-[-0.05em]">
              Three versions. One clear yes.
            </h2>
            <p className="max-w-sm text-lg text-white/75">
              Northwind Coffee&apos;s spring menu board, from the first draft to signed off. Real files from the demo.
            </p>
          </div>
          <div className="relative">
            <RelayStory versions={[v1, v2, v3]} />
          </div>
        </section>

        {/* THE CLIENT'S SIDE: process magenta, the phone, the big green button. */}
        <section aria-labelledby="client-title" className="relative mx-3 mt-5 overflow-hidden rounded-[2.5rem] bg-process-magenta text-white sm:mx-5">
          <div aria-hidden="true" className="halftone pointer-events-none absolute inset-0 text-white/25 [mask-image:radial-gradient(70%_80%_at_80%_50%,black,transparent)]" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:py-24">
            <div>
              <h2 id="client-title" className="font-display text-[clamp(2.6rem,5vw,4.6rem)] leading-[0.92] font-extrabold tracking-[-0.05em] text-balance">
                Your client gets one link and one big green button.
              </h2>
              <p className="mt-6 max-w-md text-lg text-white/85">
                No app, no training call. They see only their own work, tap Approve or mark it up, and you hear about it straight away.
              </p>
            </div>
            <div className="relative mx-auto w-full max-w-sm">
              <div className="relative mx-auto w-72 rotate-[4deg] overflow-hidden rounded-[2.6rem] border-[8px] border-ink bg-ink shadow-[0_50px_80px_-30px_rgb(0_0_0/0.55)] sm:w-80">
                <Image src={phone} alt="A client's phone showing a deliverable with Approve and Request changes buttons" sizes="320px" />
              </div>
              <p aria-hidden="true" className="pointer-events-none absolute -top-12 left-2 -rotate-[8deg] font-pen text-3xl leading-none text-process-yellow lg:top-[12%] lg:-left-[30%]">
                no login drama
              </p>
              <p aria-hidden="true" className="pointer-events-none absolute right-2 -bottom-14 rotate-[6deg] font-pen text-3xl leading-none text-process-yellow lg:-right-[22%] lg:bottom-[2%]">
                one tap. done.
              </p>
            </div>
          </div>
        </section>

        {/* ON THE DESK: the rest of the product, as pinned-up prints. */}
        <section aria-labelledby="desk-title" className="mx-auto max-w-7xl px-5 pt-28 pb-24">
          <h2 id="desk-title" className="max-w-3xl font-display text-[clamp(2.6rem,5vw,4.6rem)] leading-[0.92] font-extrabold tracking-[-0.05em]">
            Everything else is already on the desk.
          </h2>
          <div className="relative mt-16 grid gap-20 md:grid-cols-12 md:gap-x-8 md:gap-y-24">
            <div className="relative md:col-span-7 md:mt-10">
              <Proof
                src={overview}
                alt="The studio's overview: what's waiting on clients, what came back, and recent activity"
                className="relative! -rotate-[1.5deg]"
                tape="corners"
                sizes="(min-width: 768px) 700px, 100vw"
              />
              <PenNote className="-bottom-12 left-6 -rotate-3 text-3xl">your whole week, one screen</PenNote>
            </div>
            <div className="relative md:col-span-5">
              <Proof src={history} alt="A deliverable's history with change requests and the approval" className="relative! rotate-[3deg]" tape="top" sizes="(min-width: 768px) 460px, 100vw">
                <BinderClip className="-top-8 right-10" />
              </Proof>
              <PenNote className="right-0 -bottom-12 rotate-[4deg] text-3xl">who said what, and when</PenNote>
            </div>
            <div className="relative md:col-span-5 md:col-start-3">
              <Proof src={invite} alt="A one-time invitation link ready to copy" className="relative! -rotate-[2.5deg]" tape="top" sizes="(min-width: 768px) 460px, 100vw" />
              <PenNote className="right-0 -bottom-12 -rotate-[3deg] text-3xl md:-right-56 md:bottom-8">works once, for one email.</PenNote>
            </div>
          </div>
        </section>

        {/* PRICING: swatch chips on a press sheet, printer's marks in the margins. */}
        <section id="pricing" aria-labelledby="pricing-title" className="scroll-mt-10 px-3 py-24 sm:px-5">
          <div className="relative mx-auto max-w-6xl bg-white px-6 pt-20 pb-20 shadow-[0_2px_0_rgb(0_0_0/0.03),0_40px_80px_-40px_rgb(21_23_26/0.45)] sm:px-16">
            <ColorBar className="absolute top-6 left-6 sm:left-16" />
            <Loupe className="-top-16 right-28 hidden scale-90 lg:block" />
            <RegMark className="top-1/2 left-4 hidden -translate-y-1/2 sm:block" />
            <RegMark className="top-1/2 right-4 hidden -translate-y-1/2 sm:block" />
            <CropMarks className="inset-x-12 top-14 bottom-12 hidden sm:block" />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-end">
              <h2 id="pricing-title" className="font-display text-[clamp(2.6rem,5vw,4.6rem)] leading-[0.92] font-extrabold tracking-[-0.05em]">
                Pick a swatch.
              </h2>
              <p className="max-w-md text-lg text-ink/70">
                Pay for your studio, never for your clients. They review for free and never count as seats.
              </p>
            </div>

            <div className="mt-24 grid gap-16 md:grid-cols-3 md:gap-6 lg:gap-10">
              {PLANS.map((p, i) => {
                const chip = CHIPS[i];
                const paid = p.price > 0;
                return (
                  <div key={p.id} className={cn("relative flex flex-col", chip.tilt)}>
                    {p.id === "pro" && (
                      <>
                        <PenArrow className="-top-12 -right-5 z-10 hidden w-24 rotate-[140deg] md:block" />
                        <PenNote className="-top-[4.5rem] -right-2 z-10 rotate-[4deg] text-[1.7rem] md:-right-16">start here with 3+ clients</PenNote>
                      </>
                    )}
                    <div className="flex flex-1 flex-col overflow-hidden rounded-[6px] bg-white shadow-[0_0_0_1px_rgb(21_23_26/0.08),0_24px_44px_-26px_rgb(21_23_26/0.55)] transition-transform duration-300 hover:-translate-y-1.5">
                      <div className={cn("flex h-48 flex-col justify-between p-5", chip.swatch, chip.ink)}>
                        <div className="flex items-start justify-between">
                          <span className="font-display text-sm font-extrabold tracking-[0.04em]">RELAYDESK</span>
                          <span aria-hidden="true" className="size-3.5 rounded-full bg-paper shadow-[inset_0_1px_2px_rgb(0_0_0/0.35)]" />
                        </div>
                        <p className="flex items-baseline gap-1.5">
                          <span className="font-display text-7xl leading-none font-extrabold tracking-[-0.05em] tabular">${p.price}</span>
                          <span className="text-sm font-semibold opacity-80">/ month</span>
                        </p>
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <p className="font-display text-xl font-extrabold tracking-[-0.01em]">{chip.code}</p>
                        <p className="mt-1 text-sm text-ink/65">{p.tagline}</p>
                        <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                          {[
                            `${p.limits.clients ?? "Unlimited"} client spaces`,
                            `${p.limits.team ?? "Unlimited"} team seats`,
                            `${formatBytes(p.limits.storageBytes)} of files`,
                            p.limits.aiPerMonth ? `${p.limits.aiPerMonth} AI revision checklists a month` : null,
                          ].map((f) =>
                            f ? (
                              <li key={f} className="flex gap-2.5">
                                <CheckIcon weight="bold" className="mt-0.5 size-4 shrink-0 text-process-magenta" aria-hidden="true" />
                                {f}
                              </li>
                            ) : (
                              <li key="no-ai" className="flex gap-2.5 text-ink/45">
                                <MinusIcon weight="bold" className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                No AI checklists
                              </li>
                            ),
                          )}
                        </ul>
                        <Button className="mt-6 h-11 rounded-full text-[15px]" variant={p.id === "pro" ? "default" : "outline"} asChild>
                          <Link href={paid ? `/signup?plan=${p.id}` : "/signup"}>{paid ? `Start with ${p.name}` : "Start free"}</Link>
                        </Button>
                        <p className="mt-2.5 text-center text-xs text-ink/55">{paid ? "Set up your studio, then check out." : "No card needed."}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-16 border-t-2 border-ink pt-6">
              <p className="font-display text-lg font-extrabold tracking-[-0.02em]">Every plan comes with</p>
              <ul className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                {INCLUDED.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <CheckIcon weight="bold" className="mt-0.5 size-4 shrink-0 text-pen" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <p aria-hidden="true" className="absolute right-6 bottom-4 left-6 flex justify-between gap-4 text-[11px] font-semibold tracking-[0.06em] text-ink/40 uppercase sm:right-16 sm:left-16">
              <span>relaydesk-pricing.pdf</span>
              <span className="hidden sm:inline">Press proof, sheet 1 of 1</span>
              <span>C M Y K</span>
            </p>
          </div>
        </section>

        {/* UNDER THE HOOD: a print-shop job ticket. */}
        <section id="under-the-hood" aria-labelledby="hood-title" className="scroll-mt-10 bg-ink py-24 text-paper">
          <div className="mx-auto grid max-w-6xl gap-14 px-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <div>
              <h2 id="hood-title" className="font-display text-[clamp(2.6rem,5vw,4.6rem)] leading-[0.92] font-extrabold tracking-[-0.05em] text-balance">
                Built like it&apos;s going to print.
              </h2>
              <p className="mt-6 max-w-sm text-lg text-paper/70">Relaydesk is a sample product, built end to end to show how a real SaaS MVP should be put together.</p>
              <a
                href={REPO}
                className="mt-9 inline-flex items-center gap-2 rounded-full bg-process-yellow px-5 py-3 font-semibold text-ink outline-none hover:brightness-95 focus-visible:ring-3 focus-visible:ring-process-yellow/50"
              >
                <GithubLogoIcon className="size-5" aria-hidden="true" />
                Read the code and the blueprint
              </a>
            </div>
            <div className="relative rotate-[1deg] rounded-[6px] bg-paper p-7 text-ink shadow-[0_40px_70px_-30px_rgb(0_0_0/0.7)]">
              <span aria-hidden="true" className="tape absolute -top-3 left-10 h-7 w-28 -rotate-6" />
              <div className="flex items-baseline justify-between gap-4 border-b-2 border-ink pb-3">
                <p className="font-display text-2xl font-extrabold tracking-[-0.03em]">Job ticket</p>
                <p className="text-sm font-semibold">Relaydesk, production run</p>
              </div>
              <ul className="divide-y divide-ink/15">
                {TICKET.map(([term, detail]) => (
                  <li key={term} className="flex gap-4 py-4">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-[4px] border-2 border-ink">
                      <CheckIcon weight="bold" className="size-4 text-pen" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="font-semibold">{term}</p>
                      <p className="text-sm text-ink/70">{detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <ApprovalStamp version={3} date="Oct 14" seed={13} className="absolute -right-8 -bottom-10 size-32 rotate-[-16deg]" />
            </div>
          </div>
        </section>

        {/* FINAL CALL: process cyan. */}
        <section className="relative overflow-hidden bg-process-cyan">
          <div aria-hidden="true" className="halftone pointer-events-none absolute inset-0 text-ink/15" />
          <ApprovalStamp version={3} date="Oct 14" seed={9} title="" className="pointer-events-none absolute -right-20 -bottom-28 size-[30rem] rotate-[-14deg] opacity-30" />
          <div className="relative mx-auto max-w-7xl px-5 py-28">
            <h2 className="max-w-4xl font-display text-[clamp(3rem,7vw,6.5rem)] leading-[0.88] font-extrabold tracking-[-0.055em]">See it from both sides.</h2>
            <p className="mt-6 max-w-lg text-xl font-medium">Open your own copy as the agency, then switch to the client with one click. Deleted after a day.</p>
            <div className="mt-9">
              <DemoButtons />
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-ink text-paper">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-10 text-sm sm:flex-row sm:items-center sm:justify-between">
          <Logo className="text-paper" />
          <p className="text-paper/60">Sample project. The companies, people and data in the demo are fictional.</p>
        </div>
      </footer>
    </div>
  );
}
