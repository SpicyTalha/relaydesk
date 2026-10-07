import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import { marked } from "marked";
import { Logo } from "@/components/brand/logo";
import { ApprovalStamp } from "@/components/brand/stamp";
import "../print.css";

export const metadata: Metadata = { title: "Blueprint", robots: { index: false } };

/** The MVP Blueprint as a printable sample of the Basic package. Development only (rendered to PDF). */
export default async function BlueprintDoc() {
  if (process.env.NODE_ENV === "production") notFound();
  const md = await readFile(path.join(process.cwd(), "docs/BLUEPRINT.md"), "utf8");
  // The file is our own, written in this repo; nothing user-supplied reaches this HTML.
  const html = await marked.parse(md);
  return (
    <div className="doc">
      <section className="sheet cover relative flex min-h-[297mm] flex-col bg-process-yellow">
        <Logo className="w-fit origin-left scale-125" />
        <div className="mt-auto">
          <p className="font-pen text-[26pt] text-pen">sample deliverable</p>
          <h1 className="font-display text-[54pt] leading-[0.9] font-extrabold tracking-[-0.05em]">MVP Blueprint</h1>
          <p className="mt-5 max-w-[130mm] text-[14pt] leading-snug font-medium">
            The written plan behind Relaydesk, a client approval portal: users, features with a clear &ldquo;done&rdquo;, data model, security,
            architecture, decisions and running costs.
          </p>
          <p className="mt-8 text-[10pt] text-ink/70">
            This is what the Basic package delivers before any code is written. Relaydesk is a fictional sample product.
          </p>
        </div>
        <ApprovalStamp version={1} date="Scope" seed={4} title="" className="absolute top-[30mm] right-[18mm] size-[55mm] -rotate-[12deg]" />
      </section>
      <section className="sheet break prose-doc" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
