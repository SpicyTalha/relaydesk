/**
 * Captures real screenshots of a fresh demo sandbox for the landing page and the Fiverr gallery.
 *   node scripts/capture-screens.mjs [baseUrl]
 */
import { chromium, devices } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3000";
const out = "public/screens";
const browser = await chromium.launch();
// Marketing shots hide only the demo banner (the "private copy" notice). The product UI is untouched.
const HIDE_DEMO_CHROME = "[data-demo-banner]{display:none !important}";
const settle = async (p) => {
  await p.waitForLoadState("networkidle");
  await p.addStyleTag({ content: HIDE_DEMO_CHROME });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(600);
};

// Agency side, desktop, retina.
const desk = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
const page = await desk.newPage();
await page.goto(`${base}/login`);
await page.getByRole("button", { name: "As the agency" }).click();
await page.waitForURL(/\/w\/kestrel-demo-/, { timeout: 60_000 });
await page.getByRole("heading", { name: "Welcome back, Maya" }).waitFor();
await settle(page);
await page.screenshot({ path: `${out}/agency-overview.png` });
const slug = new URL(page.url()).pathname.split("/")[2];

// The approved menu board: v3 with the stamp.
await page.getByRole("link", { name: "Northwind Coffee" }).first().click();
await page.getByRole("link", { name: /^Spring menu board/ }).click();
await page.getByText("Daniel Okafor approved version 3").waitFor();
await settle(page);
await page.screenshot({ path: `${out}/agency-deliverable.png` });
await page.locator("[data-slot=card]").filter({ hasText: "History" }).screenshot({ path: `${out}/crop-history.png` });

// A real one-time invite link.
await page.goto(`${base}/w/${slug}/team?invite=client`);
const dialog = page.getByRole("dialog");
await dialog.getByLabel("Email", { exact: true }).fill("sam@juniper-yoga.example");
await dialog.getByRole("button", { name: "Create invite link" }).click();
await dialog.getByText("Invitation ready").waitFor();
await settle(page);
await dialog.screenshot({ path: `${out}/crop-invite.png` });
await page.keyboard.press("Escape");

// Plans and usage.
await page.goto(`${base}/w/${slug}/billing`);
await settle(page);
await page.locator("section[aria-labelledby=plans]").screenshot({ path: `${out}/crop-plans.png` });

// Client side, phone. Same sandbox, switched to Daniel.
await page.goto(`${base}/w/${slug}`);
await page.addStyleTag({ content: "[data-demo-banner]{display:flex !important}" });
await page.getByRole("button", { name: "View as the client" }).click();
await page.getByRole("heading", { name: "Hi Daniel" }).waitFor({ timeout: 60_000 });
const phone = await browser.newContext({ ...devices["iPhone 15 Pro"], deviceScaleFactor: 3, reducedMotion: "reduce" });
await phone.addCookies(await desk.cookies());
const mobile = await phone.newPage();
await mobile.goto(`${base}/w/${slug}`);
await mobile.getByRole("link", { name: /Instagram launch post/ }).click();
await mobile.getByRole("button", { name: "Approve" }).first().waitFor();
await settle(mobile);
await mobile.screenshot({ path: `${out}/client-approve-phone.png` });

await browser.close();
console.log("captured screens for", slug);
