import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string;
  isPlatformAdmin: boolean;
};

/**
 * The signed-in user, verified with getClaims() (which checks the JWT signature).
 * getSession() is never used for authorization on the server.
 * Cached per request, so layouts and pages can both call it.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return {
    id: claims.sub,
    email: claims.email ?? "",
    // app_metadata is server-controlled. user_metadata is never used for authorization.
    isPlatformAdmin: claims.app_metadata?.platform_role === "admin",
  };
});

export async function requireUser(next?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  return user;
}

/** Only same-site relative paths are allowed as post-login destinations. */
export function safeNext(value: FormDataEntryValue | string | null | undefined, fallback = "/w"): string {
  const next = typeof value === "string" ? value : "";
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
