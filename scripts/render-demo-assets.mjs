/**
 * Renders the demo deliverables (menus, posters, brochures...) from HTML in demo/assets-src
 * to PNG and PDF files in demo/assets. Everything is original artwork made for this sample.
 *
 *   node scripts/render-demo-assets.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const SRC = resolve("demo/assets-src");
const OUT = resolve("demo/assets");
mkdirSync(OUT, { recursive: true });

/** [output file, source html, variant class, size or "pdf"] */
const JOBS = [
  ["northwind-menu-board-v1.png", "menu-board.html", "v1", { width: 1600, height: 900 }],
  ["northwind-menu-board-v2.png", "menu-board.html", "v2", { width: 1600, height: 900 }],
  ["northwind-menu-board-v3.png", "menu-board.html", "v3", { width: 1600, height: 900 }],
  ["northwind-instagram-launch.png", "instagram.html", null, { width: 1080, height: 1080 }],
  ["northwind-loyalty-card.pdf", "loyalty-card.html", null, "pdf"],
  ["pinecrest-homepage-v1.png", "homepage.html", "v1", { width: 1440, height: 900 }],
  ["pinecrest-homepage-v2.png", "homepage.html", "v2", { width: 1440, height: 900 }],
  ["pinecrest-new-patient-guide.pdf", "brochure.html", null, "pdf"],
  ["pinecrest-waiting-room-poster.png", "poster.html", null, { width: 1200, height: 1600 }],
  ["juniper-logo-concepts.png", "logo-concepts.html", null, { width: 1600, height: 1000 }],
  ["juniper-class-schedule.png", "schedule.html", null, { width: 1200, height: 1600 }],
];

const VARIANT_CSS = {
  "menu-board.html": {
    v1: "body{--price:22px;--gap:22px} .price{opacity:.85}",
    v2: "body{--price:34px;--gap:18px}",
    v3: "body{--price:34px;--gap:12px;padding-top:50px} .special{display:flex}",
  },
};

const browser = await chromium.launch();
const only = process.argv[2];
for (const [out, src, variant, size] of JOBS) {
  if (only && !out.includes(only)) continue;
  const page = await browser.newPage(size === "pdf" ? undefined : { viewport: size, deviceScaleFactor: 1 });
  const html = readFileSync(join(SRC, src), "utf8").replace("{{VARIANT}}", variant ?? "");
  const tmp = join(SRC, `.render-${out}.html`);
  const extra = VARIANT_CSS[src]?.[variant] ?? "";
  writeFileSync(tmp, html.replace("</head>", `<style>${extra}</style></head>`));
  await page.goto(pathToFileURL(tmp).href, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  if (size === "pdf") {
    await page.pdf({ path: join(OUT, out), printBackground: true, preferCSSPageSize: true });
  } else {
    await page.screenshot({ path: join(OUT, out), type: "png" });
  }
  await page.close();
  console.log("rendered", out);
}
await browser.close();
