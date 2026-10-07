import { expect, type Page } from "@playwright/test";

export const PASSWORD = "e2e-Relaydesk-2026!";

export function uniqueEmail(name: string) {
  return `${name}+${Date.now()}${Math.floor(Math.random() * 1000)}@relaydesk.test`;
}

export async function signUp(page: Page, opts: { name: string; email: string; next?: string }) {
  await page.goto(opts.next ? `/signup?next=${encodeURIComponent(opts.next)}` : "/signup");
  await page.getByLabel("Your name").fill(opts.name);
  await page.getByLabel("Work email").fill(opts.email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
}

/** A small but real PNG, rendered by the browser itself, to use as an upload. */
export async function makePng(page: Page, label: string): Promise<Buffer> {
  const scratch = await page.context().newPage();
  await scratch.setViewportSize({ width: 960, height: 540 });
  await scratch.setContent(`
    <body style="margin:0;display:grid;place-items:center;height:540px;background:linear-gradient(135deg,#f6e7d6,#e7b98d);font-family:Georgia,serif">
      <div style="background:#fffaf3;padding:40px 56px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.15);text-align:center">
        <div style="font-size:44px;color:#3b2a1d">${label}</div>
        <div style="margin-top:12px;color:#7a5c44;letter-spacing:.2em">NORTHWIND COFFEE</div>
      </div>
    </body>`);
  const png = await scratch.screenshot();
  await scratch.close();
  return png;
}

export async function expectToast(page: Page, text: string | RegExp) {
  await expect(page.locator("[data-sonner-toast]").filter({ hasText: text }).first()).toBeVisible();
}
