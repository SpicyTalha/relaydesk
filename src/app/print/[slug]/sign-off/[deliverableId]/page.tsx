import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { createHash } from "node:crypto";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { Logo } from "@/components/brand/logo";
import { ApprovalStamp } from "@/components/brand/stamp";
import { Skeleton } from "@/components/ui/skeleton";
import { getWorkspaceContext } from "@/lib/data/workspace";
import { getDeliverable } from "@/lib/data/deliverables";
import { createClient } from "@/lib/supabase/server";
import { formatBytes } from "@/lib/format";
import { currentTime } from "@/lib/now";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Sign-off sheet", robots: { index: false } };

export default function SignOffPage({ params }: PageProps<"/print/[slug]/sign-off/[deliverableId]">) {
  return (
    <div className="min-h-svh bg-paper py-8 text-ink print:bg-white print:py-0">
      <style>{`@page { size: A4; margin: 14mm; }`}</style>
      <Suspense fallback={<Skeleton className="mx-auto h-[60rem] max-w-[52rem] rounded-none" />}>
        <Sheet params={params} />
      </Suspense>
    </div>
  );
}

const longDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" }).format(new Date(iso)) + " UTC";

/**
 * A printable record of an approval: who signed off which exact file, when, and every round before it.
 * The fingerprint is the SHA-256 of the approved file, so it can be checked against any copy later.
 */
async function Sheet({ params }: { params: Promise<{ slug: string; deliverableId: string }> }) {
  const { slug, deliverableId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(deliverableId)) notFound();
  const ws = await getWorkspaceContext(slug);
  const [now, d] = await Promise.all([currentTime(), getDeliverable(ws.id, deliverableId)]);

  const approval = d.reviews.find((r) => r.decision === "approved");
  const back = `/w/${slug}/d/${d.id}`;
  if (!approval) {
    return (
      <div className="mx-auto max-w-xl space-y-4 px-5 text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-[-0.03em]">Not signed off yet</h1>
        <p className="text-muted-foreground">A sign-off sheet exists once {d.client.name} approves a version.</p>
        <Link href={back} className="font-semibold underline underline-offset-4">
          Back to {d.title}
        </Link>
      </div>
    );
  }

  const version = d.versions.find((v) => v.id === approval.versionId)!;
  // Read through the signed-in user's own access: Storage policies decide, exactly as for viewing.
  const supabase = await createClient();
  const { data: file } = await supabase.storage.from("deliverables").download(version.storagePath);
  const fingerprint = file ? createHash("sha256").update(Buffer.from(await file.arrayBuffer())).digest("hex") : null;

  // Every round in order: an upload, then the client's answer to it.
  const rounds = [...d.versions].reverse().map((v) => ({ v, review: [...d.reviews].reverse().find((r) => r.versionId === v.id) }));
  const reference = `RD-${approval.id.slice(0, 8).toUpperCase()}`;

  return (
    <>
      <div className="mx-auto mb-6 flex max-w-[52rem] items-center justify-between gap-4 px-5 print:hidden">
        <Link href={back} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/70 hover:text-ink">
          <ArrowLeftIcon className="size-4" aria-hidden="true" />
          Back to {d.title}
        </Link>
        <PrintButton />
      </div>

      <article className="relative mx-auto max-w-[52rem] bg-white px-10 py-12 shadow-[0_30px_60px_-30px_rgb(21_23_26/0.45)] print:max-w-none print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-6 border-b-2 border-ink pb-5">
          <div>
            <Logo />
            <p className="mt-1 text-sm text-ink/60">for {ws.name}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-extrabold tracking-[-0.03em]">Sign-off sheet</p>
            <p className="text-sm text-ink/60 tabular">{reference}</p>
          </div>
        </header>

        <section className="relative mt-8 pr-44">
          <p className="text-sm font-semibold text-ink/60">{d.client.name}</p>
          <h1 className="font-display text-4xl leading-tight font-extrabold tracking-[-0.04em]">{d.title}</h1>
          {d.description && <p className="mt-2 text-ink/70">{d.description}</p>}
          <ApprovalStamp
            version={version.version}
            date={new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(approval.createdAt))}
            seed={3}
            className="absolute top-0 right-0 size-40 rotate-[-12deg]"
          />
        </section>

        <dl className="mt-8 grid gap-x-8 gap-y-4 border-y py-6 text-sm sm:grid-cols-2">
          <Fact term="Approved by">{approval.reviewerName}, {d.client.name}</Fact>
          <Fact term="Approved on">{longDate(approval.createdAt)}</Fact>
          <Fact term="Version approved">
            v{version.version}, uploaded by {version.uploaderName} on {longDate(version.createdAt)}
          </Fact>
          <Fact term="File">
            {version.fileName} ({formatBytes(version.sizeBytes)})
          </Fact>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold text-ink/55">SHA-256 fingerprint of the approved file</dt>
            <dd className="mt-1 font-mono text-[13px] break-all">{fingerprint ?? "Unavailable: the file couldn't be read."}</dd>
          </div>
          {approval.note && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold text-ink/55">Their words</dt>
              <dd className="mt-1 border-l-2 border-status-approved pl-3 italic">&ldquo;{approval.note}&rdquo;</dd>
            </div>
          )}
        </dl>

        <section className="mt-8">
          <h2 className="font-display text-xl font-extrabold tracking-[-0.02em]">How it got here</h2>
          <ol className="mt-4 space-y-4">
            {rounds.map(({ v, review }) => (
              <li key={v.id} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-3 text-sm">
                <span className="font-display text-xl font-extrabold tabular">v{v.version}</span>
                <div className="space-y-1">
                  <p>
                    Uploaded by {v.uploaderName}, {longDate(v.createdAt)}.{v.note && <span className="text-ink/60"> &ldquo;{v.note}&rdquo;</span>}
                  </p>
                  {review && (
                    <p className={review.decision === "approved" ? "text-status-approved" : "text-pen"}>
                      {review.decision === "approved" ? "Approved" : "Changes requested"} by {review.reviewerName}, {longDate(review.createdAt)}.
                      {review.note && <span className="text-ink/70 italic"> &ldquo;{review.note}&rdquo;</span>}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <footer className="mt-10 border-t pt-4 text-xs leading-relaxed text-ink/55">
          Generated {longDate(new Date(now).toISOString())} from Relaydesk. To check a copy of the file is the one that was approved, compare its
          SHA-256 with the fingerprint above (for example, <span className="font-mono">shasum -a 256 {version.fileName}</span>).
          {ws.isDemo && " Sample project: the companies and people are fictional."}
        </footer>
      </article>
    </>
  );
}

function Fact({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-ink/55">{term}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}
