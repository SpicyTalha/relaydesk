"use server";

import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { refresh } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/data/workspace";
import { dbFail } from "@/lib/db-errors";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string; upgrade?: boolean };

async function siteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  return `https://${h.get("host")}`;
}

const inviteSchema = z
  .object({
    slug: z.string().min(1),
    email: z.string().trim().toLowerCase().email("Enter a valid email address."),
    role: z.enum(["member", "client"]),
    clientId: z.string().uuid().nullable().optional(),
  })
  .refine((v) => v.role === "member" || !!v.clientId, { message: "Choose which client they belong to.", path: ["clientId"] });

/**
 * Creates an invitation and returns its link. The token exists only in this response and in
 * the link: the database stores its SHA-256, so a leaked database can't be used to join.
 */
export async function createInvitation(input: z.input<typeof inviteSchema>): Promise<Result<{ link: string; email: string }>> {
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
  const { slug, email, role, clientId } = parsed.data;

  const ws = await getWorkspaceContext(slug);
  if (!ws.isTeam) return { ok: false, error: "Only the agency team can invite people." };
  if (role === "member" && !ws.isOwner) return { ok: false, error: "Only owners can invite teammates." };

  const supabase = await createClient();

  // Friendly guard against duplicate pending invites for the same person.
  const { data: existing } = await supabase
    .from("invitations")
    .select("id")
    .eq("workspace_id", ws.id)
    .eq("email", email)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .limit(1);
  if (existing?.length) return { ok: false, error: `${email} already has a pending invite. Revoke it to send a new one.` };

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const { error } = await supabase.from("invitations").insert({
    workspace_id: ws.id,
    email,
    role,
    client_id: role === "client" ? clientId! : null,
    token_hash: tokenHash,
  });
  if (error) return dbFail(error, "We couldn't create the invitation.");

  refresh();
  return { ok: true, email, link: `${await siteOrigin()}/invite/${token}` };
}

export async function revokeInvitation(input: { slug: string; invitationId: string }): Promise<Result> {
  const parsed = z.object({ slug: z.string().min(1), invitationId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const ws = await getWorkspaceContext(parsed.data.slug);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invitations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", parsed.data.invitationId)
    .eq("workspace_id", ws.id)
    .select("id");
  if (error) return dbFail(error);
  if (!data.length) return { ok: false, error: "That invitation no longer exists." };
  refresh();
  return { ok: true };
}

export async function removeMember(input: { slug: string; membershipId: string }): Promise<Result> {
  const parsed = z.object({ slug: z.string().min(1), membershipId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const ws = await getWorkspaceContext(parsed.data.slug);
  if (!ws.isOwner) return { ok: false, error: "Only owners can remove people." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .delete()
    .eq("id", parsed.data.membershipId)
    .eq("workspace_id", ws.id)
    .select("id");
  if (error) return dbFail(error);
  if (!data.length) return { ok: false, error: "That person isn't in this studio." };
  refresh();
  return { ok: true };
}

export async function changeRole(input: { slug: string; membershipId: string; role: "owner" | "member" }): Promise<Result> {
  const parsed = z
    .object({ slug: z.string().min(1), membershipId: z.string().uuid(), role: z.enum(["owner", "member"]) })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const ws = await getWorkspaceContext(parsed.data.slug);
  if (!ws.isOwner) return { ok: false, error: "Only owners can change roles." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.membershipId)
    .eq("workspace_id", ws.id)
    .select("id");
  if (error) return dbFail(error);
  if (!data.length) return { ok: false, error: "You can't change this person's role." };
  refresh();
  return { ok: true };
}
