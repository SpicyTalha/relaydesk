import type { Database } from "@/lib/supabase/database.types";

export type DeliverableStatus = Database["public"]["Enums"]["deliverable_status"];

/** Same status, worded for who is looking: the agency waits on the client, the client sees it's their turn. */
export const STATUS_LABEL: Record<"team" | "client", Record<DeliverableStatus, string>> = {
  team: {
    draft: "Draft",
    in_review: "Waiting on client",
    changes_requested: "Changes requested",
    approved: "Approved",
  },
  client: {
    draft: "Draft",
    in_review: "Waiting for you",
    changes_requested: "Changes requested",
    approved: "Approved",
  },
};

export const STATUS_TONE: Record<DeliverableStatus, string> = {
  draft: "bg-status-draft/12 text-status-draft",
  in_review: "bg-status-review/12 text-status-review",
  changes_requested: "bg-status-changes/14 text-status-changes",
  approved: "bg-status-approved/12 text-status-approved",
};

export const STATUS_DOT: Record<DeliverableStatus, string> = {
  draft: "bg-status-draft",
  in_review: "bg-status-review",
  changes_requested: "bg-status-changes",
  approved: "bg-status-approved",
};
