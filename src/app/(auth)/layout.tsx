import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ApprovalStamp } from "@/components/brand/stamp";
import menuV3 from "../../../public/relay/northwind-menu-board-v3.png";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <Link href="/" className="w-fit rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <Logo />
        </Link>
        <main className="flex flex-1 items-start justify-center pt-12 pb-10 sm:items-center sm:pt-10">
          <div className="w-full max-w-sm">{children}</div>
        </main>
        <p className="text-xs text-muted-foreground">Sample project. Fictional company and data. Payments run in Stripe test mode.</p>
      </div>
      <SignedOff />
    </div>
  );
}

/** Real work from the demo, signed off: the moment the product exists for. */
function SignedOff() {
  return (
    <aside aria-hidden="true" className="relative hidden overflow-hidden bg-foreground text-background lg:flex lg:flex-col lg:justify-center lg:px-14">
      <div className="relative">
        <div className="overflow-hidden rounded-[14px] shadow-[0_40px_80px_-30px_rgb(0_0_0/0.6)] ring-1 ring-white/10">
          <Image src={menuV3} alt="" sizes="(min-width: 1024px) 55vw, 0px" placeholder="blur" priority />
        </div>
        <ApprovalStamp version={3} date="Oct 14" className="absolute -right-6 -bottom-12 size-40 rotate-[-12deg] text-[#4cc384]" />
      </div>
      <div className="mt-16 max-w-md space-y-2">
        <p className="font-display text-2xl font-semibold tracking-tight">Spring menu board, version 3.</p>
        <p className="text-background/65">
          Two rounds of notes, one clear yes. Signed off by Daniel at Northwind Coffee, with the date on it.
        </p>
      </div>
    </aside>
  );
}
