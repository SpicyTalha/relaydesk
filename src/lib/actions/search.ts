"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/data/workspace";
import type { DeliverableStatus } from "@/lib/status";

export type SearchIndex = {
  clients: { id: string; name: string }[];
  deliverables: { id: string; title: string; client: string; status: DeliverableStatus }[];
};

/** Everything the signed-in person can jump to. RLS decides: clients only ever get their own space. */
export async function getSearchIndex(slug: string): Promise<SearchIndex> {
  const parsed = z.string().min(1).safeParse(slug);
  if (!parsed.success) return { clients: [], deliverables: [] };
  const ws = await getWorkspaceContext(parsed.data);
  const supabase = await createClient();
  const [clients, deliverables] = await Promise.all([
    ws.isTeam
      ? supabase.from("clients").select("id, name").eq("workspace_id", ws.id).is("archived_at", null).order("name")
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    supabase
      .from("deliverables")
      .select("id, title, status, client:clients!inner(name)")
      .eq("workspace_id", ws.id)
      .order("updated_at", { ascending: false })
      .limit(300),
  ]);
  return {
    clients: clients.data ?? [],
    deliverables: (deliverables.data ?? []).map((d) => ({ id: d.id, title: d.title, client: d.client.name, status: d.status })),
  };
}
