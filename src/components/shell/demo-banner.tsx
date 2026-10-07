import { FlaskConical } from "lucide-react";

/** Shown in demo sandboxes. The role switch is added with the demo seed. */
export function DemoBanner({ role }: { slug: string; role: "owner" | "member" | "client" }) {
  return (
    <div className="flex items-center justify-center gap-2 bg-primary px-4 py-1.5 text-center text-xs font-medium text-primary-foreground">
      <FlaskConical className="size-3.5 shrink-0" aria-hidden="true" />
      <span>
        Private demo copy. You&apos;re viewing it as {role === "client" ? "the client" : "the agency"}. It&apos;s deleted after 24 hours.
      </span>
    </div>
  );
}
