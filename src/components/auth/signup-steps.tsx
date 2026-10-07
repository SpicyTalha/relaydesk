import Link from "next/link";
import { CheckIcon } from "@phosphor-icons/react/ssr";
import { cn } from "cn";
import { planById } from "@/lib/billing/plans";

export type PaidPlan = "pro" | "studio";

export const parsePaidPlan = (value: string | null | undefined): PaidPlan | null =>
  value === "pro" || value === "studio" ? value : null;

/** Field styles shared by the sign-in and sign-up forms: big enough to tap. */
export const AUTH_INPUT = "h-11 rounded-xl bg-white px-3.5 text-base md:text-[15px]";
export const AUTH_BUTTON = "h-12 w-full rounded-full text-[15px] font-semibold";

/** Where someone is in sign-up: account, then studio, then checkout when they picked a paid plan. */
export function SignupSteps({ current, paid }: { current: 1 | 2 | 3; paid: boolean }) {
  const steps = ["Account", "Studio", ...(paid ? ["Checkout"] : [])];
  return (
    <ol aria-label="Sign-up progress" className="flex flex-wrap items-center gap-x-2 gap-y-2 text-[13px] font-semibold">
      {steps.map((label, i) => {
        const n = i + 1;
        const state = n < current ? "done" : n === current ? "current" : "todo";
        return (
          <li key={label} aria-current={state === "current" ? "step" : undefined} className="flex items-center gap-2">
            <span
              className={cn(
                "grid size-6 place-items-center rounded-full text-xs tabular",
                state === "done" && "bg-ink text-paper",
                state === "current" && "bg-process-yellow text-ink ring-2 ring-ink",
                state === "todo" && "border border-ink/20 text-ink/45",
              )}
            >
              {state === "done" ? <CheckIcon weight="bold" className="size-3.5" aria-hidden="true" /> : n}
            </span>
            <span className={cn(state === "todo" && "text-ink/45")}>
              {label}
              {state === "done" && <span className="sr-only"> (done)</span>}
            </span>
            {n < steps.length && <span aria-hidden="true" className="h-px w-5 bg-ink/20" />}
          </li>
        );
      })}
    </ol>
  );
}

const SWATCH: Record<PaidPlan, string> = { pro: "bg-process-magenta", studio: "bg-ink" };

/** The paid plan someone picked on the pricing page, carried through sign-up. */
export function PlanChip({ plan, note }: { plan: PaidPlan; note: string }) {
  const p = planById(plan);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-ink/10 bg-white p-3 shadow-[0_10px_24px_-18px_rgb(21_23_26/0.5)]">
      <span aria-hidden="true" className={cn("h-11 w-9 shrink-0 rounded-[4px]", SWATCH[plan])} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">
          {p.name}, ${p.price} a month
        </p>
        <p className="text-xs text-muted-foreground">{note}</p>
      </div>
      <Link href="/#pricing" className="shrink-0 rounded-md px-1.5 py-1 text-xs font-semibold underline underline-offset-4 outline-none hover:text-ink/70 focus-visible:ring-3 focus-visible:ring-ring/50">
        Change
      </Link>
    </div>
  );
}

export function AuthHeading({ title, children, small = false }: { title: React.ReactNode; children?: React.ReactNode; small?: boolean }) {
  return (
    <div className="space-y-2.5">
      <h1
        className={cn(
          "font-display font-extrabold text-balance",
          small ? "text-[1.85rem] leading-[1.05] tracking-[-0.035em]" : "text-[2.6rem] leading-[0.95] tracking-[-0.045em]",
        )}
      >
        {title}
      </h1>
      {children && <p className="text-[15px] text-ink/65">{children}</p>}
    </div>
  );
}
