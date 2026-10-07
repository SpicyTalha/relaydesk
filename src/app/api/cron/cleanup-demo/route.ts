import { deleteExpiredSandboxes } from "@/lib/demo/sandbox";

/** Daily (vercel.ts): deletes demo sandboxes older than 24 hours. Vercel sends the CRON_SECRET. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const deleted = await deleteExpiredSandboxes(24);
  return Response.json({ deleted });
}
