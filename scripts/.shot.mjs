import { chromium } from "@playwright/test";
const [, , src, out, w] = process.argv;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: Number(w ?? 1600), height: 900 } });
await p.goto("file://" + src, { waitUntil: "networkidle" }); await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: out, fullPage: true }); await b.close();
