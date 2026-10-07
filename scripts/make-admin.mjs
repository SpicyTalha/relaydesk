/**
 * Grants (or with --revoke, removes) the platform admin role. It lives in app_metadata,
 * which only the service role can write, so nobody can promote themselves from the browser.
 *   node --env-file=.env.local scripts/make-admin.mjs you@example.com [--revoke]
 */
import { createClient } from "@supabase/supabase-js";

const [email, flag] = process.argv.slice(2);
if (!email) throw new Error("Usage: node --env-file=.env.local scripts/make-admin.mjs <email> [--revoke]");
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

let user;
for (let page = 1; !user; page++) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
  if (error) throw error;
  user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (data.users.length < 200) break;
}
if (!user) throw new Error(`No account for ${email}. Sign up first.`);

const role = flag === "--revoke" ? null : "admin";
const { error } = await admin.auth.admin.updateUserById(user.id, { app_metadata: { ...user.app_metadata, platform_role: role } });
if (error) throw error;
console.log(role ? `${email} is now a platform admin. Sign out and back in, then open /admin.` : `${email} is no longer a platform admin.`);
