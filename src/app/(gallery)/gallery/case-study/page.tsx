import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CheckIcon } from "@phosphor-icons/react/ssr";
import { Logo } from "@/components/brand/logo";
import { ApprovalStamp } from "@/components/brand/stamp";
import overview from "../../../../../public/screens/agency-overview.png";
import phone from "../../../../../public/screens/client-approve-phone.png";
import pins from "../../../../../gallery/shots/pins.png";
import checklist from "../../../../../gallery/shots/checklist.png";
import "../print.css";

export const metadata: Metadata = { title: "Case study", robots: { index: false } };

const BUILT = [
  ["Studios, roles and invites", "Owner, teammate and client roles. One-time invite links; only a hash of each is stored."],
  ["Versioned deliverables", "Every upload is a new version in private storage, opened through short-lived signed links."],
  ["Approvals and comments", "Clients approve or request changes from any phone. Every decision is recorded with a name and date."],
  ["Pins and version compare", "Clients tap the work to pin a note. A slider wipes between versions."],
  ["Stripe billing", "Free, Pro and Studio plans. Verified webhooks, recorded once; plans update the moment checkout finishes."],
  ["AI revision checklist", "Client notes become a to-do list. Every quote is the client's own words, checked against the database."],
  ["Admin panel", "Studios, test-mode revenue, the webhook log and an audit log. Suspending a studio is enforced in the database."],
  ["Sign-off sheet", "A printable approval record with the SHA-256 fingerprint of the exact file that was approved."],
  ["Search, nudges, notifications", "Ctrl/⌘K search, ready-made reminders for late clients, and a notification bell."],
  ["A private demo for every visitor", "Each \"try it\" click gets its own seeded copy, deleted after 24 hours."],
];

const PROOF = [
  ["82", "database tests check who can read and change what, across studios, clients and plans."],
  ["14", "end-to-end tests click through the whole app, including on a phone, on every push."],
  ["96", "Lighthouse performance on mobile, with 96 accessibility and 100 best practices."],
  ["0", "secrets in the browser or the repo. Keys live only in Vercel and a git-ignored local file."],
];

/** The two-page case study for the gallery PDF. Development only (rendered to PDF). */
export default function CaseStudy() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="doc">
      <section className="sheet cover relative min-h-[297mm] overflow-hidden bg-process-yellow">
        <Logo className="w-fit origin-left scale-125" />
        <p className="mt-14 font-pen text-[24pt] text-pen">case study</p>
        <h1 className="font-display text-[46pt] leading-[0.9] font-extrabold tracking-[-0.05em]">A client approval portal, built end to end.</h1>
        <p className="mt-5 max-w-[150mm] text-[13pt] leading-snug font-medium">
          Relaydesk is a sample SaaS MVP: studios share work, clients approve it or mark it up from their phone, and every version and
          every &ldquo;yes&rdquo; is kept. It has a live demo anyone can click through.
        </p>
        <div className="relative mt-12 h-[150mm]">
          <div className="absolute top-0 left-0 w-[150mm] rotate-[-2deg] bg-white p-[2.5mm] shadow-[0_20px_40px_-18px_rgb(0_0_0/0.5)]">
            <Image src={overview} alt="" sizes="1200px" />
          </div>
          <div className="absolute top-[38mm] right-0 w-[52mm] rotate-[4deg] overflow-hidden rounded-[7mm] border-[2mm] border-ink bg-ink shadow-[0_24px_40px_-18px_rgb(0_0_0/0.55)]">
            <Image src={phone} alt="" sizes="500px" />
          </div>
          <ApprovalStamp version={3} date="Oct 14" seed={11} title="" className="absolute bottom-[8mm] left-[70mm] size-[48mm] -rotate-[14deg]" />
        </div>
        <p className="absolute right-[18mm] bottom-[14mm] left-[18mm] text-[9pt] text-ink/75">
          Sample project: the companies, people and data are fictional, and payments run in Stripe test mode.
        </p>
      </section>

      <section className="sheet break text-[10pt] leading-relaxed">
        <h2 className="font-display text-[22pt] leading-none font-extrabold tracking-[-0.04em]">The problem</h2>
        <p className="mt-3 max-w-[160mm]">
          Small studios send work to clients and then chase approval across email, chat and shared drives. Feedback gets lost, nobody is sure
          which version is final, and invoices wait on a &ldquo;looks good&rdquo; that never arrives in writing.
        </p>

        <h2 className="mt-8 font-display text-[22pt] leading-none font-extrabold tracking-[-0.04em]">What was built</h2>
        <ul className="mt-4 grid grid-cols-2 gap-x-7 gap-y-3.5">
          {BUILT.map(([title, body]) => (
            <li key={title} className="flex gap-2.5 break-inside-avoid">
              <CheckIcon weight="bold" className="mt-[1mm] size-[4mm] shrink-0 text-status-approved" aria-hidden="true" />
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-ink/75">{body}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mx-auto mt-7 grid w-[150mm] grid-cols-[1.1fr_1fr] items-start gap-5">
          <div className="bg-white p-[2mm] shadow-[0_0_0_0.3mm_rgb(21_23_26/0.1)]">
            <Image src={pins} alt="" sizes="900px" />
          </div>
          <div className="overflow-hidden rounded-[3mm] shadow-[0_0_0_0.3mm_rgb(21_23_26/0.1)]">
            <Image src={checklist} alt="" sizes="700px" />
          </div>
        </div>
      </section>

      <section className="sheet break text-[10pt] leading-relaxed">
        <h2 className="font-display text-[22pt] leading-none font-extrabold tracking-[-0.04em]">How it&apos;s built</h2>
        <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3">
          {[
            ["App", "Next.js 16 (App Router, Server Components and Server Actions), TypeScript, Tailwind, deployed on Vercel."],
            ["Data and auth", "Supabase Postgres with Row Level Security on every table, private file storage and signed links."],
            ["Payments", "Stripe Checkout and Customer Portal. Webhooks are signature-checked, re-fetched from Stripe and recorded once."],
            ["AI", "Google Gemini through the Vercel AI SDK, with a monthly quota per plan enforced in the database."],
            ["Quality", "pgTAP database tests and Playwright end-to-end tests run in GitHub Actions on every push."],
            ["Docs", "A written blueprint: users, features with a clear \"done\", data model, security plan, decisions and costs."],
          ].map(([term, detail]) => (
            <div key={term} className="break-inside-avoid">
              <p className="font-semibold">{term}</p>
              <p className="text-ink/75">{detail}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-10 font-display text-[22pt] leading-none font-extrabold tracking-[-0.04em]">Proof, not promises</h2>
        <dl className="mt-5 grid grid-cols-2 gap-4">
          {PROOF.map(([n, text]) => (
            <div key={n + text} className="flex items-baseline gap-4 rounded-[3mm] bg-paper p-4 break-inside-avoid">
              <dt className="font-display text-[30pt] leading-none font-extrabold tracking-[-0.05em] tabular">{n}</dt>
              <dd className="text-ink/80">{text}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-[9pt] text-ink/65">
          Lighthouse SEO reads low on purpose: a fictional product is kept out of search engines with a no-index tag. Every other SEO check passes.
        </p>

        <h2 className="mt-10 font-display text-[22pt] leading-none font-extrabold tracking-[-0.04em]">How the work was done</h2>
        <p className="mt-3 max-w-[165mm]">
          Built with AI coding tools (Claude Code) for speed, with every change reviewed and tested before it shipped. The scope was written first,
          each feature was finished before the next began. On client projects, the code, database and deployment live in the client&apos;s own accounts from day one.
        </p>
      </section>
    </div>
  );
}
