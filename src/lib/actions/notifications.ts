"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getWorkspaceContext } from "@/lib/data/workspace";
import { getActivity, type ActivityItem } from "@/lib/data/activity";
import { firstName } from "@/lib/format";

export type Notification = { id: number; action: string; text: string; href: string; at: string; context: string | null; unread: boolean };

function sentence(a: ActivityItem, isTeam: boolean) {
  const who = firstName(a.actorName);
  const what = a.deliverableTitle ?? "a deliverable";
  switch (a.action) {
    case "approval.requested":
      return isTeam ? `${who} asked for approval on ${what}` : `${who} asked for your approval on ${what}`;
    case "deliverable.approved":
      return `${who} approved ${what}`;
    case "changes.requested":
      return `${who} requested changes on ${what}`;
    case "version.uploaded":
      return `${who} uploaded version ${String(a.metadata.version ?? "")} of ${what}`;
    case "comment.created":
      return `${who} commented on ${what}`;
    case "member.joined":
      return a.metadata.role === "client" ? `${who} joined ${a.clientName ?? "a client space"}` : `${who} joined the team`;
    case "client.created":
      return `${who} added the client ${String(a.metadata.name ?? a.clientName ?? "")}`;
    case "deliverable.created":
      return `${who} created ${what}`;
    default:
      return `${who} made a change`;
  }
}

/** What others did in this studio, newest first, and which of it is new since the bell was last opened. RLS filters for clients. */
export async function getNotifications(slug: string): Promise<{ items: Notification[]; unread: number }> {
  const parsed = z.string().min(1).safeParse(slug);
  const user = await getCurrentUser();
  if (!parsed.success || !user) return { items: [], unread: 0 };
  const ws = await getWorkspaceContext(parsed.data);

  const supabase = await createClient();
  const [activity, { data: mark }] = await Promise.all([
    getActivity(ws.id, { limit: 20, excludeActor: user.id }),
    supabase.from("notification_reads").select("seen_at").eq("workspace_id", ws.id).maybeSingle(),
  ]);
  const seen = mark?.seen_at ?? null;
  const base = `/w/${parsed.data}`;
  const items = activity.map((a) => ({
    id: a.id,
    action: a.action,
    text: sentence(a, ws.isTeam),
    href: a.deliverableId ? `${base}/d/${a.deliverableId}` : a.clientId && ws.isTeam ? `${base}/c/${a.clientId}` : base,
    at: a.createdAt,
    context: ws.isTeam ? a.clientName : null,
    unread: !seen || a.createdAt > seen,
  }));
  return { items, unread: items.filter((i) => i.unread).length };
}

/** Moves the "seen up to" mark to now. Update first, insert the first time. */
export async function markNotificationsSeen(slug: string): Promise<void> {
  const parsed = z.string().min(1).safeParse(slug);
  if (!parsed.success) return;
  const ws = await getWorkspaceContext(parsed.data);
  const supabase = await createClient();
  const seenAt = new Date().toISOString();
  const { data } = await supabase.from("notification_reads").update({ seen_at: seenAt }).eq("workspace_id", ws.id).select("workspace_id");
  if (!data?.length) await supabase.from("notification_reads").insert({ workspace_id: ws.id, seen_at: seenAt });
}
