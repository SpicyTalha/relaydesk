import { ArrowLeftRight, FlaskConical } from "lucide-react";
import { switchDemoRole } from "@/app/demo/actions";

/** Shown in demo sandboxes: what this is, and a one-click switch between the two sides. */
export function DemoBanner({ slug, role }: { slug: string; role: "owner" | "member" | "client" }) {
  const isClient = role === "client";
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-primary px-4 py-1.5 text-center text-xs font-medium text-primary-foreground">
      <span className="inline-flex items-center gap-1.5">
        <FlaskConical className="size-3.5 shrink-0" aria-hidden="true" />
        Your private demo copy, viewed as {isClient ? "Daniel at Northwind Coffee (the client)" : "Maya at Kestrel Studio (the agency)"}. Deleted after a day.
      </span>
      <form action={switchDemoRole}>
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="to" value={isClient ? "owner" : "client"} />
        <button
          type="submit"
          className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/15 px-2.5 py-0.5 underline-offset-2 outline-none hover:bg-primary-foreground/25 focus-visible:ring-2 focus-visible:ring-primary-foreground"
        >
          <ArrowLeftRight className="size-3" aria-hidden="true" />
          View as {isClient ? "the agency" : "the client"}
        </button>
      </form>
    </div>
  );
}
