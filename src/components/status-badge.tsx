import { cn } from "cn";
import { STATUS_DOT, STATUS_LABEL, STATUS_TONE, type DeliverableStatus } from "@/lib/status";

export function StatusBadge({
  status,
  audience,
  className,
}: {
  status: DeliverableStatus;
  audience: "team" | "client";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        STATUS_TONE[status],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", STATUS_DOT[status])} aria-hidden="true" />
      {STATUS_LABEL[audience][status]}
    </span>
  );
}
