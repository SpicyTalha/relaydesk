/**
 * Uploads demo/assets/* to the private "deliverables" bucket under demo-template/.
 * Each demo sandbox copies these files into its own paths. Safe to re-run.
 *
 *   node --env-file=.env.development.local scripts/upload-demo-assets.mjs   (local)
 *   node --env-file=.env.production.local scripts/upload-demo-assets.mjs    (production)
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.");

const supabase = createClient(url, key, { auth: { persistSession: false } });
const TYPES = { png: "image/png", pdf: "application/pdf" };

for (const file of readdirSync("demo/assets")) {
  const ext = file.split(".").pop();
  const { error } = await supabase.storage
    .from("deliverables")
    .upload(`demo-template/${file}`, readFileSync(join("demo/assets", file)), { contentType: TYPES[ext], upsert: true });
  console.log(error ? `x ${file}: ${error.message}` : `+ ${file}`);
}
