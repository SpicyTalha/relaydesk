import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const TEMPLATE_PREFIX = "demo-template";
/** Per network per hour. Production uses the default; local dev and CI raise it for tests. */
export const SANDBOXES_PER_IP_PER_HOUR = Number(process.env.DEMO_SANDBOXES_PER_HOUR ?? 5);

export const DEMO_PEOPLE = {
  owner: { key: "maya", name: "Maya Chen" },
  member: { key: "leo", name: "Leo Park" },
  clientA: { key: "daniel", name: "Daniel Okafor" },
  clientB: { key: "priya", name: "Priya Raman" },
} as const;

export function hashIp(ip: string): string {
  return createHash("sha256").update(`${process.env.DEMO_IP_SALT ?? "relaydesk-demo"}:${ip}`).digest("hex");
}

export async function recentSandboxCount(ipHash: string): Promise<number> {
  const since = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await createAdminClient()
    .from("demo_sandboxes")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);
  return count ?? 0;
}

/**
 * Creates a private copy of the demo agency: four demo users (no usable passwords),
 * seeded data with a realistic six-week history, and copies of the sample files.
 */
export async function createSandbox(ipHash: string) {
  const admin = createAdminClient();
  const run = randomBytes(5).toString("hex");

  const users: Record<keyof typeof DEMO_PEOPLE, { id: string; email: string }> = {} as never;
  for (const [role, person] of Object.entries(DEMO_PEOPLE) as [keyof typeof DEMO_PEOPLE, (typeof DEMO_PEOPLE)[keyof typeof DEMO_PEOPLE]][]) {
    const email = `demo-${run}-${person.key}@relaydesk-demo.dev`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      // A random password nobody knows: demo users only ever sign in with one-time server tokens.
      password: randomBytes(24).toString("base64url"),
      email_confirm: true,
      user_metadata: { full_name: person.name },
      app_metadata: { demo: true },
    });
    if (error || !data.user) {
      await cleanupUsers(Object.values(users).map((u) => u.id));
      throw error ?? new Error("Could not create demo user");
    }
    users[role] = { id: data.user.id, email };
  }

  try {
    const { data: files, error: listError } = await admin.storage.from("deliverables").list(TEMPLATE_PREFIX, { limit: 100 });
    if (listError || !files?.length) throw listError ?? new Error("Demo files are missing. Run scripts/upload-demo-assets.mjs.");
    const sizes = Object.fromEntries(files.map((f) => [f.name, (f.metadata as { size?: number } | null)?.size ?? 1]));

    const { data, error } = await admin.rpc("create_demo_workspace", {
      p_owner: users.owner.id,
      p_member: users.member.id,
      p_client_a: users.clientA.id,
      p_client_b: users.clientB.id,
      p_sizes: sizes,
      p_ip_hash: ipHash,
    });
    if (error) throw error;
    const result = data as { workspace_id: string; slug: string; northwind_client_id: string; copies: { template: string; path: string }[] };

    const { error: pinError } = await admin.rpc("seed_demo_pins", { p_workspace: result.workspace_id });
    if (pinError) throw pinError;

    // Server-side copies inside Storage: nothing is downloaded or re-uploaded.
    await Promise.all(
      result.copies.map(async (c) => {
        const { error: copyError } = await admin.storage.from("deliverables").copy(`${TEMPLATE_PREFIX}/${c.template}`, c.path);
        if (copyError) throw copyError;
      }),
    );

    return { slug: result.slug, workspaceId: result.workspace_id, ownerEmail: users.owner.email, clientEmail: users.clientA.email };
  } catch (err) {
    await cleanupUsers(Object.values(users).map((u) => u.id));
    throw err;
  }
}

async function cleanupUsers(ids: string[]) {
  const admin = createAdminClient();
  await Promise.all(ids.map((id) => admin.auth.admin.deleteUser(id)));
}

/** Deletes demo sandboxes older than `hours`: files first, then the workspace, then its users. */
export async function deleteExpiredSandboxes(hours = 24) {
  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - hours * 3_600_000).toISOString();
  const { data: expired, error } = await admin.from("demo_sandboxes").select("id, workspace_id, user_ids").lt("created_at", cutoff).limit(200);
  if (error) throw error;

  let deleted = 0;
  for (const sb of expired ?? []) {
    const { data: versions } = await admin.from("deliverable_versions").select("storage_path").eq("workspace_id", sb.workspace_id);
    const paths = (versions ?? []).map((v) => v.storage_path);
    for (let i = 0; i < paths.length; i += 100) await admin.storage.from("deliverables").remove(paths.slice(i, i + 100));
    await admin.from("workspaces").delete().eq("id", sb.workspace_id);
    await cleanupUsers(sb.user_ids);
    deleted++;
  }
  return deleted;
}
