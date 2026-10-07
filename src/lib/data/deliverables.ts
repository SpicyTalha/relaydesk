import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentTime } from "@/lib/now";
import type { DeliverableStatus } from "@/lib/status";
import type { ClientAccent } from "@/lib/data/clients";

export type DeliverableRow = {
  id: string;
  title: string;
  status: DeliverableStatus;
  dueOn: string | null;
  updatedAt: string;
  approvalRequestedAt: string | null;
  decidedAt: string | null;
  client: { id: string; name: string; accent: ClientAccent };
  latestVersion: number;
  commentCount: number;
  /** The client's note when they asked for changes. */
  lastNote: string | null;
};

const ROW_SELECT =
  "id, title, status, due_on, updated_at, approval_requested_at, decided_at, client:clients!inner(id, name, accent), versions:deliverable_versions(version), comments(count), reviews(note, created_at)";

type RawRow = {
  id: string;
  title: string;
  status: DeliverableStatus;
  due_on: string | null;
  updated_at: string;
  approval_requested_at: string | null;
  decided_at: string | null;
  client: { id: string; name: string; accent: string };
  versions: { version: number }[];
  comments: { count: number }[];
  reviews: { note: string; created_at: string }[];
};

function toRow(d: RawRow): DeliverableRow {
  const lastReview = [...d.reviews].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  return {
    id: d.id,
    title: d.title,
    status: d.status,
    dueOn: d.due_on,
    updatedAt: d.updated_at,
    approvalRequestedAt: d.approval_requested_at,
    decidedAt: d.decided_at,
    client: { ...d.client, accent: d.client.accent as ClientAccent },
    latestVersion: Math.max(0, ...d.versions.map((v) => v.version)),
    commentCount: d.comments[0]?.count ?? 0,
    lastNote: lastReview?.note || null,
  };
}

export const getOpenDeliverables = cache(async (workspaceId: string): Promise<DeliverableRow[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deliverables")
    .select(ROW_SELECT)
    .eq("workspace_id", workspaceId)
    .in("status", ["in_review", "changes_requested"])
    .order("due_on", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data as unknown as RawRow[]).map(toRow);
});

export const getClientDeliverables = cache(async (workspaceId: string, clientId: string): Promise<DeliverableRow[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deliverables")
    .select(ROW_SELECT)
    .eq("workspace_id", workspaceId)
    .eq("client_id", clientId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as RawRow[]).map(toRow);
});

export async function countApprovedSince(workspaceId: string, days: number): Promise<number> {
  const supabase = await createClient();
  const since = new Date((await currentTime()) - days * 86_400_000).toISOString();
  const { count, error } = await supabase
    .from("deliverables")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("status", "approved")
    .gte("decided_at", since);
  if (error) throw error;
  return count ?? 0;
}

export type VersionDetail = {
  id: string;
  version: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  note: string;
  createdAt: string;
  uploaderName: string;
  storagePath: string;
};

export type DeliverableDetail = {
  id: string;
  title: string;
  description: string;
  status: DeliverableStatus;
  dueOn: string | null;
  approvalRequestedAt: string | null;
  decidedAt: string | null;
  createdAt: string;
  client: { id: string; name: string; accent: ClientAccent };
  versions: VersionDetail[];
  reviews: { id: string; decision: "approved" | "changes_requested"; note: string; createdAt: string; reviewerName: string; versionId: string }[];
};

export const getDeliverable = cache(async (workspaceId: string, id: string): Promise<DeliverableDetail> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deliverables")
    .select(
      "id, title, description, status, due_on, approval_requested_at, decided_at, created_at, client:clients!inner(id, name, accent), versions:deliverable_versions(id, version, file_name, mime_type, size_bytes, note, created_at, uploaded_by, storage_path), reviews(id, decision, note, created_at, reviewer_id, version_id)",
    )
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) notFound();

  const people = [...new Set([...data.versions.map((v) => v.uploaded_by), ...data.reviews.map((r) => r.reviewer_id)])];
  const { data: profiles } = people.length
    ? await supabase.from("profiles").select("id, full_name").in("id", people)
    : { data: [] };
  const name = (uid: string) => profiles?.find((p) => p.id === uid)?.full_name || "Someone";

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    status: data.status,
    dueOn: data.due_on,
    approvalRequestedAt: data.approval_requested_at,
    decidedAt: data.decided_at,
    createdAt: data.created_at,
    client: { ...data.client, accent: data.client.accent as ClientAccent },
    versions: data.versions
      .map((v) => ({
        id: v.id,
        version: v.version,
        fileName: v.file_name,
        mimeType: v.mime_type,
        sizeBytes: v.size_bytes,
        note: v.note,
        createdAt: v.created_at,
        uploaderName: name(v.uploaded_by),
        storagePath: v.storage_path,
      }))
      .sort((a, b) => b.version - a.version),
    reviews: data.reviews
      .map((r) => ({
        id: r.id,
        decision: r.decision,
        note: r.note,
        createdAt: r.created_at,
        reviewerName: name(r.reviewer_id),
        versionId: r.version_id,
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
});
