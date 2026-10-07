import "server-only";
import { createClient } from "@/lib/supabase/server";

export type CommentItem = {
  id: string;
  body: string;
  createdAt: string;
  editedAt: string | null;
  deleted: boolean;
  authorId: string;
  authorName: string;
  authorIsClient: boolean;
  versionId: string | null;
  /** Where the note is pinned on its version's image, 0..1 of width and height. */
  pin: { x: number; y: number } | null;
  resolvedAt: string | null;
};

export async function getComments(workspaceId: string, deliverableId: string): Promise<CommentItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("id, body, created_at, edited_at, deleted_at, author_id, version_id, pin_x, pin_y, resolved_at")
    .eq("workspace_id", workspaceId)
    .eq("deliverable_id", deliverableId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const ids = [...new Set(data.map((c) => c.author_id))];
  const [{ data: profiles }, { data: members }] = await Promise.all([
    ids.length ? supabase.from("profiles").select("id, full_name").in("id", ids) : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    ids.length
      ? supabase.from("memberships").select("user_id, role").eq("workspace_id", workspaceId).in("user_id", ids)
      : Promise.resolve({ data: [] as { user_id: string; role: string }[] }),
  ]);

  return data.map((c) => ({
    id: c.id,
    body: c.deleted_at ? "" : c.body,
    createdAt: c.created_at,
    editedAt: c.edited_at,
    deleted: c.deleted_at !== null,
    authorId: c.author_id,
    authorName: profiles?.find((p) => p.id === c.author_id)?.full_name || "Someone",
    authorIsClient: members?.find((m) => m.user_id === c.author_id)?.role === "client",
    versionId: c.version_id,
    pin: c.pin_x !== null && c.pin_y !== null && !c.deleted_at ? { x: Number(c.pin_x), y: Number(c.pin_y) } : null,
    resolvedAt: c.resolved_at,
  }));
}

/** Pins are numbered per version, in the order they were made: "pin 2 on v3". */
export function pinNumbers(comments: CommentItem[]): Map<string, number> {
  const counters = new Map<string, number>();
  const numbers = new Map<string, number>();
  for (const c of comments) {
    if (!c.pin || !c.versionId) continue;
    const n = (counters.get(c.versionId) ?? 0) + 1;
    counters.set(c.versionId, n);
    numbers.set(c.id, n);
  }
  return numbers;
}
