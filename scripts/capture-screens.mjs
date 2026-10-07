/**
 * Captures real screenshots of a fresh demo sandbox for the landing page and the Fiverr gallery.
 *   node scripts/capture-screens.mjs [baseUrl]
 */
import { chromium, devices } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3000";
const out = "public/screens";
const browser = await chromium.launch();

// Agency side, desktop, retina.
const desk = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await desk.newPage();
await page.goto(`${base}/login`);
await page.getByRole("button", { name: "As the agency" }).click();
await page.waitForURL(/\/w\/kestrel-demo-/, { timeout: 60_000 });
await page.getByRole("heading", { name: "Welcome back, Maya" }).waitFor();
await page.waitForLoadState("networkidle");
await page.screenshot({ path: `${out}/agency-overview.png` });

await page.getByRole("link", { name: "Northwind Coffee" }).first().click();
await page.getByRole("link", { name: /^Spring menu board/ }).click();
await page.getByText("Daniel Okafor approved version 3").waitFor();
await page.waitForLoadState("networkidle");
await page.screenshot({ path: `${out}/agency-deliverable.png` });
const slug = new URL(page.url()).pathname.split("/")[2];

// Client side, phone. Same sandbox, switched to Daniel.
await page.getByRole("button", { name: "View as the client" }).click();
await page.getByRole("heading", { name: "Hi Daniel" }).waitFor({ timeout: 60_000 });
const cookies = await desk.cookies();
const phone = await browser.newContext({ ...devices["iPhone 15 Pro"], deviceScaleFactor: 3 });
await phone.addCookies(cookies);
const mobile = await phone.newPage();
await mobile.goto(`${base}/w/${slug}`);
await mobile.getByRole("link", { name: /Instagram launch post/ }).click();
await mobile.getByRole("button", { name: "Approve" }).first().waitFor();
await mobile.waitForLoadState("networkidle");
await mobile.screenshot({ path: `${out}/client-approve-phone.png` });

await browser.close();
console.log("captured screens for", slug);
