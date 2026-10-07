import type { PostgrestError } from "@supabase/supabase-js";

export type FriendlyError = { message: string; upgrade?: boolean };

/**
 * Turns database errors into something a person can act on.
 * Our own triggers and RPCs raise P0001 with a message written for users, so those pass through.
 */
export function friendlyDbError(error: PostgrestError | null, fallback = "Something went wrong. Try again."): FriendlyError {
  if (!error) return { message: fallback };
  if (error.code === "P0001") return { message: error.message, upgrade: error.hint?.startsWith("plan_limit:") };
  if (error.code === "P0002") return { message: "We couldn't find that. It may have been deleted." };
  if (error.code === "42501") return { message: "You don't have access to do that." };
  if (error.code === "23505") return { message: "That already exists." };
  return { message: fallback };
}

/** The failure half of a Server Action result, built from a database error. */
export function dbFail(error: PostgrestError | null, fallback?: string): { ok: false; error: string; upgrade?: boolean } {
  const f = friendlyDbError(error, fallback);
  return { ok: false, error: f.message, upgrade: f.upgrade };
}
