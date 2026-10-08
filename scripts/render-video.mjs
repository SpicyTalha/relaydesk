/**
 * Renders a video's frames from a dev-only stage page (default /gallery/video).
 *   pnpm dev, then: node scripts/render-video.mjs <outDir> [--url /gallery/gig-video] [--stills 1.5,3.4,...]
 * Every frame is a pure function of time: the page exposes window.__setT(t). If it also exposes
 * window.__face, frames before that time are transparent PNGs, to lay over a camera clip.
 */
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const out = process.argv[2] ?? "brag-output/work/frames";
const stillsArg = process.argv.indexOf("--stills");
const stills = stillsArg > -1 ? process.argv[stillsArg + 1].split(",").map(Number) : null;
const urlArg = process.argv.indexOf("--url");
const url = urlArg > -1 ? process.argv[urlArg + 1] : "/gallery/video";
const fps = 30;
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto(`http://localhost:3000${url}`, { waitUntil: "networkidle" });
await page.addStyleTag({ content: "nextjs-portal{display:none!important} *,*::before,*::after{transition:none!important;animation:none!important}" });
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => typeof window.__setT === "function");
const duration = await page.evaluate(() => window.__duration);
const face = await page.evaluate(() => window.__face ?? 0);
if (face) await page.addStyleTag({ content: "html,body{background:transparent!important}" });
const stage = page.locator("[data-stage]");

const times = stills ?? Array.from({ length: Math.round(duration * fps) }, (_, i) => i / fps);
for (const [i, t] of times.entries()) {
  await page.evaluate((v) => window.__setT(v), t);
  // Let every image in the new frame finish decoding before it's captured.
  await page.evaluate(() => Promise.all([...document.images].map((img) => (img.complete ? null : img.decode().catch(() => null)))));
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const overlay = t < face;
  const ext = overlay ? "png" : "jpg";
  const name = stills ? `still-${t.toFixed(2)}.${ext}` : `${String(i).padStart(5, "0")}.${ext}`;
  await stage.screenshot(overlay ? { path: `${out}/${name}`, type: "png", omitBackground: true } : { path: `${out}/${name}`, type: "jpeg", quality: 93 });
}
console.log(`${times.length} frames → ${out}` + (face ? ` (first ${face}s transparent)` : ""));
await browser.close();
