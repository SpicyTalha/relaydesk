import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { Logo } from "@/components/brand/logo";
import { ApprovalStamp } from "@/components/brand/stamp";
import { PenCircle, PenNote, Proof } from "@/components/marketing/desk";
import { MatRulers, Marker } from "@/components/marketing/print";
import menuV1 from "../../../public/relay/northwind-menu-board-v1.png";
import menuV3 from "../../../public/relay/northwind-menu-board-v3.png";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-svh bg-paper text-ink lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col">
        <header className="flex items-center justify-between gap-4 rounded-b-[1.75rem] bg-process-yellow px-5 py-5 sm:px-10 lg:rounded-none lg:bg-transparent">
          <Link href="/" className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <Logo />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-ink/70 outline-none hover:bg-ink/5 hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ArrowLeftIcon className="size-4" aria-hidden="true" />
            Back to site
          </Link>
        </header>
        <main className="flex flex-1 items-start justify-center px-5 pt-10 pb-12 sm:px-10 lg:items-center lg:pt-6">
          <div className="w-full max-w-[25rem]">{children}</div>
        </main>
        <p className="px-5 pb-6 text-xs text-ink/50 sm:px-10">Sample project. Fictional companies and data. Payments run in Stripe test mode.</p>
      </div>
      <OnTheMat />
    </div>
  );
}

/** The product's whole point, on the studio's cutting mat: v1 marked up, v3 signed off. */
function OnTheMat() {
  return (
    <aside aria-hidden="true" className="mat sticky top-0 hidden h-svh overflow-hidden text-white lg:block">
      <MatRulers count={20} />
      <div className="absolute inset-x-[8%] top-[12%] bottom-[30%]">
        <Proof src={menuV1} className="top-0 left-0 w-[70%] -rotate-[5deg]" tape="top" sizes="480px" priority>
          <PenCircle className="top-[36%] right-[0%] h-[56%] w-[24%]" strokeWidth={3.5} />
        </Proof>
        <PenNote className="top-[4%] right-[2%] rotate-[6deg] bg-process-yellow px-3 pt-2 pb-1 text-3xl shadow-[0_10px_16px_-10px_rgb(0_0_0/0.6)]">
          bigger pls!!
        </PenNote>
        <Proof src={menuV3} className="right-0 bottom-0 w-[72%] rotate-[3deg]" tape="corners" sizes="500px" priority />
        <div className="absolute right-[12%] bottom-[2%] size-[28%] rotate-[-12deg]">
          <ApprovalStamp version={3} date="Oct 14" seed={7} title="" />
        </div>
      </div>
      <Marker className="bottom-[22%] left-[6%] w-56 -rotate-[20deg]" />
      <div className="absolute inset-x-[8%] bottom-[7%] max-w-md">
        <p className="font-display text-3xl leading-tight font-extrabold tracking-[-0.035em]">Spring menu board, v3.</p>
        <p className="mt-2 text-white/70">Two rounds of notes, one clear yes. Signed off by Daniel at Northwind Coffee, with the date on it.</p>
      </div>
    </aside>
  );
}
