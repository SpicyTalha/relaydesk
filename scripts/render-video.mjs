/**
 * Renders the launch video's frames from the dev-only /gallery/video stage.
 *   pnpm dev, then: node scripts/render-video.mjs <outDir> [--stills 1.5,3.4,...]
 * Every frame is a pure function of time: the page exposes window.__setT(t).
 */
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const out = process.argv[2] ?? "brag-output/work/frames";
const stillsArg = process.argv.indexOf("--stills");
const stills = stillsArg > -1 ? process.argv[stillsArg + 1].split(",").map(Number) : null;
const fps = 30;
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto("http://localhost:3000/gallery/video", { waitUntil: "networkidle" });
await page.addStyleTag({ content: "nextjs-portal{display:none!important} *,*::before,*::after{transition:none!important;animation:none!important}" });
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => typeof window.__setT === "function");
const duration = await page.evaluate(() => window.__duration);
const stage = page.locator("[data-stage]");

const times = stills ?? Array.from({ length: Math.round(duration * fps) }, (_, i) => i / fps);
for (const [i, t] of times.entries()) {
  await page.evaluate((v) => window.__setT(v), t);
  // Let every image in the new frame finish decoding before it's captured.
  await page.evaluate(() => Promise.all([...document.images].map((img) => (img.complete ? null : img.decode().catch(() => null)))));
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const name = stills ? `still-${t.toFixed(2)}.jpg` : `${String(i).padStart(5, "0")}.jpg`;
  await stage.screenshot({ path: `${out}/${name}`, type: "jpeg", quality: 93 });
}
console.log(`${times.length} frames → ${out}`);
await browser.close();
