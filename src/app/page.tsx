import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, CheckIcon, ClockCounterClockwiseIcon, CreditCardIcon, DatabaseIcon, DeviceMobileIcon, FolderLockIcon, LinkSimpleIcon, ShieldCheckIcon, StackIcon, TestTubeIcon, WebhooksLogoIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { DemoButtons } from "@/components/marketing/demo-buttons";
import { PLANS } from "@/lib/billing/plans";
import overview from "../../public/screens/agency-overview.png";
import phone from "../../public/screens/client-approve-phone.png";
import deliverable from "../../public/screens/agency-deliverable.png";

const REPO = "https://github.com/SpicyTalha/relaydesk";

const FEATURES = [
  { icon: FolderLockIcon, title: "A private space for every client", body: "Each client sees their own work and nothing else. Not other clients, not your drafts, not your internal notes." },
  { icon: StackIcon, title: "Versions that never get lost", body: "Upload v2, v3, v4. Every earlier version stays one click away, with a note on what changed." },
  { icon: DeviceMobileIcon, title: "Approve from a phone", body: "Clients open the link, look, and tap Approve or Request changes. No app, no learning curve." },
  { icon: ClockCounterClockwiseIcon, title: "A record you can point to", body: "Who approved which version, and when. The written answer to “but you said it was fine”." },
  { icon: LinkSimpleIcon, title: "Invites that can't be forwarded", body: "One-time links tied to one email address. Forwarded or reused links simply don't work." },
  { icon: CreditCardIcon, title: "Plans and billing built in", body: "Free, Pro and Studio plans with Stripe Checkout and a self-service billing portal." },
];

const UNDER_THE_HOOD = [
  { icon: ShieldCheckIcon, title: "Row Level Security on every table", body: "Tenant isolation lives in the database. 60+ pgTAP tests try to read across agencies and clients, and fail." },
  { icon: WebhooksLogoIcon, title: "Payments that can't double-apply", body: "Stripe webhooks are signature-checked, re-fetched from Stripe, and deduplicated in the same transaction as the change." },
  { icon: DatabaseIcon, title: "Plan limits enforced in Postgres", body: "Client, seat and storage limits are checked by the database, so no browser trick can skip them." },
  { icon: TestTubeIcon, title: "Tested like a product", body: "Playwright runs the whole loop: agency uploads, client requests changes on a phone, agency revises, client approves." },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/65">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <Link href="/" className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <Logo />
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <a href="#under-the-hood" className="hover:text-foreground">Under the hood</a>
          </nav>
          <div className="flex items-center gap-2">
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
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_70%_0%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent)]" />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-5 pt-16 pb-10 sm:pt-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center">
            <div className="space-y-7">
              <p className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className="size-1.5 rounded-full bg-status-approved" />
                Client approvals for creative agencies
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.4rem] lg:leading-[1.05]">
                Get &ldquo;approved&rdquo; in writing, not lost in email.
              </h1>
              <p className="max-w-xl text-lg text-muted-foreground text-pretty">
                Relaydesk gives every client a private space to review your work and approve it or ask for changes, from any device.
                Every version and every decision is saved with a name and a date.
              </p>
              <DemoButtons />
              <p className="text-sm text-muted-foreground">
                No sign-up for the demo. You get your own private copy with sample data, deleted after a day.
              </p>
            </div>
            <div className="relative">
              <div className="overflow-hidden rounded-2xl border bg-card shadow-[0_30px_80px_-30px_rgb(0_0_0/0.35)]">
                <div className="flex items-center gap-1.5 border-b bg-muted/60 px-4 py-2.5" aria-hidden="true">
                  <span className="size-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="size-2.5 rounded-full bg-[#febc2e]" />
                  <span className="size-2.5 rounded-full bg-[#28c840]" />
                </div>
                <Image src={overview} alt="The agency overview: work waiting on clients, change requests and recent activity" priority placeholder="blur" sizes="(min-width: 1024px) 640px, 100vw" />
              </div>
              <div className="absolute -right-3 -bottom-12 hidden w-40 overflow-hidden rounded-[1.6rem] border-[6px] border-foreground/90 bg-card shadow-2xl sm:block lg:-right-8 lg:w-48">
                <Image src={phone} alt="A client approving an Instagram post on a phone" placeholder="blur" sizes="208px" />
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-5 pt-28 pb-20">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight">Everything between &ldquo;here&apos;s the draft&rdquo; and &ldquo;approved&rdquo;</h2>
            <p className="text-muted-foreground">Built for small studios that send work to clients every week and are tired of chasing replies.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border bg-card p-6">
                <f.icon className="size-5 text-primary" aria-hidden="true" />
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Product detail */}
        <section className="border-y bg-muted/40">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-semibold tracking-tight">Three rounds of feedback, one clear history</h2>
              <p className="text-muted-foreground">
                The client asked for bigger prices, then a seasonal special, then approved version 3. Anyone on the team can see exactly what was
                asked, what changed and who signed off.
              </p>
              <ul className="space-y-2 text-sm">
                {["Comments attached to the version they're about", "Change requests always come with a note", "Approval is final for that version, with a timestamp"].map((t) => (
                  <li key={t} className="flex gap-2">
                    <CheckIcon className="mt-0.5 size-4 shrink-0 text-status-approved" aria-hidden="true" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="overflow-hidden rounded-2xl border bg-card shadow-xl">
              <Image src={deliverable} alt="A deliverable with three versions and its approval history" placeholder="blur" sizes="(min-width: 1024px) 700px, 100vw" />
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight">Simple pricing</h2>
            <p className="text-muted-foreground">Clients never pay and never count toward your seats. Payments in this demo run in Stripe test mode.</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {PLANS.map((p) => (
              <div key={p.id} className={`flex flex-col rounded-2xl border bg-card p-6 ${p.id === "pro" ? "border-primary ring-1 ring-primary" : ""}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{p.name}</h3>
                  {p.id === "pro" && <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">Most popular</span>}
                </div>
                <p className="mt-3 text-4xl font-semibold tracking-tight tabular">
                  ${p.price}
                  <span className="text-sm font-normal text-muted-foreground">/month</span>
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{p.tagline}</p>
                <ul className="mt-5 flex-1 space-y-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <CheckIcon className="mt-0.5 size-4 shrink-0 text-status-approved" aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className="mt-6" variant={p.id === "pro" ? "default" : "outline"} asChild>
                  <Link href="/signup">{p.price === 0 ? "Start free" : `Start with ${p.name}`}</Link>
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* Under the hood */}
        <section id="under-the-hood" className="scroll-mt-20 border-t bg-foreground text-background">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <div className="max-w-2xl space-y-3">
              <p className="text-sm font-medium text-background/60">For founders and developers</p>
              <h2 className="text-3xl font-semibold tracking-tight">Built like it&apos;s going to production</h2>
              <p className="text-background/70">
                Relaydesk is a sample product, built end to end to show how a real SaaS MVP should be put together. The parts that usually break
                first are the parts that got the most care.
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {UNDER_THE_HOOD.map((f) => (
                <div key={f.title} className="rounded-2xl border border-background/10 bg-background/5 p-6">
                  <f.icon className="size-5 text-background/80" aria-hidden="true" />
                  <h3 className="mt-4 font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-background/65">{f.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-background/70">
              <span>Next.js 16 · TypeScript · Supabase (Postgres, Auth, Storage) · Stripe · Tailwind · Vercel</span>
              <a href={REPO} className="inline-flex items-center gap-1 font-medium text-background underline-offset-4 hover:underline">
                Read the code and the blueprint <ArrowRightIcon className="size-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-6xl px-5 py-20 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">See it from both sides</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Open your own copy as the agency, then switch to the client with one click.</p>
          <div className="mt-8 flex justify-center">
            <DemoButtons />
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <Logo className="text-foreground" />
          <p>Sample project. The companies, people and data in the demo are fictional. Payments run in Stripe test mode.</p>
        </div>
      </footer>
    </div>
  );
}
