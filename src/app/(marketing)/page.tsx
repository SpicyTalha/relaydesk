import Image from "next/image";
import Link from "next/link";
import { GithubLogoIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { ApprovalStamp } from "@/components/brand/stamp";
import { DemoButtons } from "@/components/marketing/demo-buttons";
import { HeroVisual } from "@/components/marketing/hero-visual";
import { RelayStory } from "@/components/marketing/relay-story";
import { PLANS } from "@/lib/billing/plans";
import { formatBytes } from "@/lib/format";
import overview from "../../../public/screens/agency-overview.png";
import phone from "../../../public/screens/client-approve-phone.png";
import history from "../../../public/screens/crop-history.png";
import invite from "../../../public/screens/crop-invite.png";
import v1 from "../../../public/relay/northwind-menu-board-v1.png";
import v2 from "../../../public/relay/northwind-menu-board-v2.png";
import v3 from "../../../public/relay/northwind-menu-board-v3.png";

const REPO = "https://github.com/SpicyTalha/relaydesk";

const SPECS = [
  {
    term: "Row Level Security on every table",
    detail: "Tenant isolation lives in Postgres, with explicit grants per column. 62 database tests try to read across agencies and clients, and fail.",
  },
  {
    term: "Payments that can't apply twice",
    detail: "Stripe webhooks are signature-checked, re-fetched from Stripe, and recorded in the same transaction as the plan change.",
  },
  {
    term: "Limits the browser can't skip",
    detail: "Client, seat and storage limits are enforced by the database, not by hidden buttons.",
  },
  {
    term: "The whole loop, tested",
    detail: "Playwright runs it end to end: the studio uploads, the client asks for changes on a phone, the studio revises, the client approves.",
  },
  {
    term: "Fast by default",
    detail: "Next.js 16 with Cache Components: static shells that load instantly, live data streamed in behind them.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <Link href="/" className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <Logo />
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#how-it-works" className="hover:text-foreground">How it works</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <a href="#under-the-hood" className="hover:text-foreground">Under the hood</a>
          </nav>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild className="hidden sm:inline-flex">
              <Link href="/signup">Start free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* 1. Hero: split, the stamp lands on the client's phone. */}
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-5 pt-14 pb-20 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:pb-28">
          <div className="max-w-xl">
            <h1 className="text-[2.6rem] leading-[1.02] font-bold tracking-[-0.04em] text-balance sm:text-6xl">
              Get it signed off, not lost in email.
            </h1>
            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              Share work with clients, collect approvals on any device, and keep every version with a name and a date.
            </p>
            <div className="mt-9">
              <DemoButtons />
            </div>
          </div>
          <HeroVisual phone={phone} overview={overview} />
        </section>

        {/* 2. The relay: a pinned scroll story with the demo's real artwork. */}
        <section id="how-it-works" aria-labelledby="relay-title" className="scroll-mt-16 border-t bg-card">
          <div className="mx-auto max-w-6xl px-5 pt-20 lg:pt-24">
            <h2 id="relay-title" className="max-w-2xl text-4xl font-bold tracking-[-0.035em] text-balance">
              Three versions of a menu board, and one clear yes.
            </h2>
          </div>
          <RelayStory versions={[v1, v2, v3]} />
        </section>

        {/* 3. The product, in real pieces: an asymmetric bento, every cell a real screenshot. */}
        <section aria-labelledby="product-title" className="mx-auto max-w-6xl px-5 py-24">
          <h2 id="product-title" className="max-w-2xl text-4xl font-bold tracking-[-0.035em] text-balance">
            Built for clients who never asked for new software.
          </h2>
          <div className="mt-12 grid gap-4 lg:grid-cols-6 lg:grid-rows-[auto_auto]">
            <figure className="flex flex-col overflow-hidden rounded-[14px] border bg-[oklch(0.95_0.03_350)] lg:col-span-3 lg:row-span-2 dark:bg-[oklch(0.25_0.05_350)]">
              <figcaption className="p-7 pb-0">
                <p className="text-lg font-semibold">Nothing to install</p>
                <p className="mt-1 text-muted-foreground">Clients open a link, see only their own work, and approve with one tap.</p>
              </figcaption>
              <div className="mx-auto mt-10 w-72 overflow-hidden rounded-t-[2.2rem] border-[7px] border-b-0 border-foreground bg-foreground lg:mt-auto lg:w-80">
                <Image src={phone} alt="The client's view of a deliverable waiting for approval" sizes="320px" />
              </div>
            </figure>
            <figure className="overflow-hidden rounded-[14px] border bg-card lg:col-span-3">
              <figcaption className="p-7 pb-5">
                <p className="text-lg font-semibold">A record you can point to</p>
                <p className="mt-1 text-muted-foreground">Who asked for what, on which version, and who signed it off.</p>
              </figcaption>
              <div className="mx-auto h-72 w-[85%] overflow-hidden rounded-t-[12px] border border-b-0 [mask-image:linear-gradient(to_bottom,black_70%,transparent)]">
                <Image src={history} alt="A deliverable's history: two change requests, three uploads and an approval" sizes="(min-width: 1024px) 560px, 100vw" />
              </div>
            </figure>
            <figure className="overflow-hidden rounded-[14px] border bg-foreground text-background lg:col-span-2">
              <figcaption className="p-7 pb-5">
                <p className="text-lg font-semibold">Links that can&apos;t be forwarded</p>
                <p className="mt-1 text-background/70">One person, one email, one use, seven days.</p>
              </figcaption>
              <Image src={invite} alt="An invitation link ready to copy" sizes="(min-width: 1024px) 360px, 100vw" className="mx-auto w-[88%] rounded-t-[12px]" />
            </figure>
            <figure className="overflow-hidden rounded-[14px] border bg-card lg:col-span-1">
              <figcaption className="flex h-full flex-col justify-between gap-6 p-7">
                <ApprovalStamp version={3} date="Oct 14" seed={3} className="size-24 rotate-[-10deg]" />
                <p className="text-lg font-semibold leading-snug">Signed off means signed off.</p>
              </figcaption>
            </figure>
          </div>
        </section>

        {/* 4. Pricing: one comparison table, not three identical cards. */}
        <section id="pricing" aria-labelledby="pricing-title" className="scroll-mt-16 border-t bg-card">
          <div className="mx-auto max-w-6xl px-5 py-24">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
              <div>
                <h2 id="pricing-title" className="text-4xl font-bold tracking-[-0.035em]">Pricing</h2>
                <p className="mt-4 max-w-sm text-muted-foreground">
                  Clients never pay and never count as seats. Payments in this sample run in Stripe test mode.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[30rem] text-left text-sm">
                  <caption className="sr-only">Plans compared</caption>
                  <thead>
                    <tr className="border-b">
                      <th scope="col" className="py-4 pr-4 font-normal text-muted-foreground" />
                      {PLANS.map((p) => (
                        <th key={p.id} scope="col" className="px-4 py-4 align-bottom">
                          <span className="block text-base font-semibold">{p.name}</span>
                          <span className="font-display text-3xl font-bold tracking-tight tabular">${p.price}</span>
                          <span className="text-muted-foreground"> a month</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[
                      ["Client spaces", (p: (typeof PLANS)[number]) => p.limits.clients ?? "Unlimited"],
                      ["Team seats", (p: (typeof PLANS)[number]) => p.limits.team ?? "Unlimited"],
                      ["Storage", (p: (typeof PLANS)[number]) => formatBytes(p.limits.storageBytes)],
                      ["AI revision checklists", (p: (typeof PLANS)[number]) => (p.limits.aiPerMonth ? `${p.limits.aiPerMonth} a month` : "No")],
                      ["Client users", () => "Unlimited"],
                    ].map(([label, value]) => (
                      <tr key={label as string}>
                        <th scope="row" className="py-3.5 pr-4 font-normal text-muted-foreground">{label as string}</th>
                        {PLANS.map((p) => (
                          <td key={p.id} className="px-4 py-3.5 tabular">{(value as (p: (typeof PLANS)[number]) => string | number)(p)}</td>
                        ))}
                      </tr>
                    ))}
                    <tr>
                      <td className="py-5 pr-4" />
                      {PLANS.map((p) => (
                        <td key={p.id} className="px-4 py-5">
                          <Button variant={p.id === "pro" ? "default" : "outline"} className="w-full" asChild>
                            <Link href="/signup">Start free</Link>
                          </Button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Under the hood: a dark spec sheet for the people who'd build or buy it. */}
        <section id="under-the-hood" aria-labelledby="hood-title" className="scroll-mt-16 bg-foreground text-background">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-24 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div>
              <h2 id="hood-title" className="text-4xl font-bold tracking-[-0.035em] text-balance">Built like it&apos;s going to production.</h2>
              <p className="mt-4 max-w-sm text-background/70">
                Relaydesk is a sample product, built end to end to show how a real SaaS MVP should be put together. The parts that break first got the
                most care.
              </p>
              <a
                href={REPO}
                className="mt-8 inline-flex items-center gap-2 rounded-[10px] border border-background/20 px-4 py-2.5 text-sm font-semibold outline-none hover:bg-background/10 focus-visible:ring-3 focus-visible:ring-brand/60"
              >
                <GithubLogoIcon className="size-4" aria-hidden="true" />
                Read the code and the blueprint
              </a>
            </div>
            <dl className="divide-y divide-background/12 border-y border-background/12">
              {SPECS.map((s) => (
                <div key={s.term} className="grid gap-1 py-5 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] sm:gap-6">
                  <dt className="font-semibold">{s.term}</dt>
                  <dd className="text-background/70">{s.detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* 6. Final call: both sides of the same copy. */}
        <section className="relative overflow-hidden">
          <ApprovalStamp version={3} date="Oct 14" seed={9} className="pointer-events-none absolute -right-16 -bottom-24 size-[26rem] rotate-[-14deg] opacity-[0.08]" title="" />
          <div className="relative mx-auto max-w-6xl px-5 py-28">
            <h2 className="max-w-3xl text-5xl font-bold tracking-[-0.04em] text-balance sm:text-6xl">See it from both sides.</h2>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              Open your own private copy as the agency, then switch to the client with one click. No sign-up, deleted after a day.
            </p>
            <div className="mt-9">
              <DemoButtons />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <Logo className="text-foreground" />
          <p>Sample project. The companies, people and data in the demo are fictional.</p>
        </div>
      </footer>
    </div>
  );
}
