/**
 * Renders the Fiverr gallery images from the dev-only /gallery pages (the product's own components).
 *   pnpm dev, then: node scripts/render-gallery.mjs [baseUrl] [--only 5,6]
 * Output: gallery/out/relaydesk-0N.jpg at 2× (2560×1538), Fiverr's 1280×769 ratio, and two A4 PDFs.
 * Frames 5 and 6 carry Talha's photo from gallery/talha/photo.jpg (a grey stand-in until it exists).
 */
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const args = process.argv.slice(2);
const onlyAt = args.indexOf("--only");
const only = onlyAt > -1 ? args.splice(onlyAt, 2)[1].split(",").map(Number) : null;
const base = args[0] ?? "http://localhost:3000";
const FILES = {
  1: "relaydesk-01.jpg",
  2: "relaydesk-02.jpg",
  3: "relaydesk-03.jpg",
  4: "relaydesk-portfolio-cover.jpg",
  5: "relaydesk-cover-photo.jpg",
  6: "relaydesk-who-you-hire.jpg",
};
mkdirSync("gallery/out", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 769 }, deviceScaleFactor: 2 });
for (const n of only ?? [1, 2, 3, 4, 5, 6]) {
  await page.setViewportSize(n === 4 ? { width: 1024, height: 768 } : { width: 1280, height: 769 });
  await page.goto(`${base}/gallery/${n}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  // Next's development badges are not part of the picture.
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await page.waitForTimeout(500);
  const file = `gallery/out/${FILES[n]}`;
  await page.locator("[data-frame]").screenshot({ path: file, type: "jpeg", quality: 92 });
  console.log(file);
}

// The two gallery PDFs: the Blueprint (a sample of the Basic package) and the case study.
const doc = await browser.newPage();
for (const [route, file] of only ? [] : [["blueprint", "relaydesk-mvp-blueprint.pdf"], ["case-study", "relaydesk-case-study.pdf"]]) {
  await doc.goto(`${base}/gallery/${route}`, { waitUntil: "networkidle" });
  await doc.evaluate(() => document.fonts.ready);
  await doc.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await doc.pdf({ path: `gallery/out/${file}`, format: "A4", printBackground: true, preferCSSPageSize: true });
  console.log(`gallery/out/${file}`);
}
await browser.close();
