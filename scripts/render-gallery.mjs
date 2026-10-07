/**
 * Renders the Fiverr gallery images from the dev-only /gallery pages (the product's own components).
 *   pnpm dev, then: node scripts/render-gallery.mjs [baseUrl]
 * Output: gallery/out/relaydesk-0N.jpg at 2× (2560×1538), Fiverr's 1280×769 ratio, and two A4 PDFs.
 */
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3000";
mkdirSync("gallery/out", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 769 }, deviceScaleFactor: 2 });
for (const n of [1, 2, 3]) {
  await page.goto(`${base}/gallery/${n}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  // Next's development badges are not part of the picture.
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await page.waitForTimeout(500);
  await page.locator("[data-frame]").screenshot({ path: `gallery/out/relaydesk-0${n}.jpg`, type: "jpeg", quality: 92 });
  console.log(`gallery/out/relaydesk-0${n}.jpg`);
}

// The two gallery PDFs: the Blueprint (a sample of the Basic package) and the case study.
const doc = await browser.newPage();
for (const [route, file] of [["blueprint", "relaydesk-mvp-blueprint.pdf"], ["case-study", "relaydesk-case-study.pdf"]]) {
  await doc.goto(`${base}/gallery/${route}`, { waitUntil: "networkidle" });
  await doc.evaluate(() => document.fonts.ready);
  await doc.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await doc.pdf({ path: `gallery/out/${file}`, format: "A4", printBackground: true, preferCSSPageSize: true });
  console.log(`gallery/out/${file}`);
}
await browser.close();
