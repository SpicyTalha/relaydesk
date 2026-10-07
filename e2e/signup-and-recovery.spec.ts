import { expect, test, type Page } from "@playwright/test";
import { PASSWORD, uniqueEmail } from "./helpers";

// Supabase's local stack catches every auth email in Mailpit.
const MAILPIT = process.env.E2E_MAILPIT_URL ?? "http://127.0.0.1:54324";

async function latestEmailLink(to: string): Promise<string> {
  for (let i = 0; i < 30; i++) {
    const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`);
    const { messages } = (await res.json()) as { messages: { ID: string }[] };
    if (messages?.length) {
      const msg = (await (await fetch(`${MAILPIT}/api/v1/message/${messages[0].ID}`)).json()) as { HTML: string };
      const href = msg.HTML.match(/href="([^"]+verify[^"]+)"/)?.[1];
      if (href) return href.replaceAll("&amp;", "&");
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No email arrived for ${to}`);
}

async function fillAccount(page: Page, name: string, email: string) {
  await page.getByLabel("Your name").fill(name);
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
}

test("a plan picked on the pricing page carries through sign-up and studio setup to checkout", async ({ page }) => {
  // Smooth scrolling keeps moving the page while Playwright clicks; this test is about the flow.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator("#pricing").getByRole("link", { name: "Start with Pro" }).click();
  await expect(page).toHaveURL(/\/signup\?plan=pro$/);
  await expect(page.getByText("Pro, $29 a month")).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "Checkout" })).toBeVisible();

  // The password field can be revealed to check what was typed.
  await fillAccount(page, "Rosa Lind", uniqueEmail("rosa"));
  const password = page.getByLabel("Password", { exact: true });
  await expect(password).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(password).toHaveAttribute("type", "text");
  await expect(page.getByText("At least 8 characters")).toBeVisible();

  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/onboarding\?plan=pro$/);
  // Earlier routes stay mounted but hidden, so only the visible step counts.
  await expect(page.locator("[aria-current=step]:visible")).toContainText("Studio");

  // The preview shows clients the studio's name as it's typed.
  await page.getByLabel("Studio name").fill("Fieldnote Studio");
  await expect(page.getByText("What your clients see").locator("..")).toContainText("with Fieldnote Studio");
  await page.getByRole("button", { name: "Create studio and continue" }).click();

  await expect(page).toHaveURL(/\/w\/fieldnote-studio[a-z0-9-]*\/billing\?plan=pro$/);
  await expect(page.getByRole("heading", { name: "One step left: switch on Pro." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Check out Pro" })).toBeVisible();

  // Skipping keeps them on Free, in their new studio.
  await page.getByRole("link", { name: "Skip for now" }).click();
  await expect(page).toHaveURL(/\/w\/fieldnote-studio[a-z0-9-]*$/);
});

test("a forgotten password can be reset from the emailed link", async ({ page, browser }) => {
  test.setTimeout(60_000);
  const email = uniqueEmail("ivo");
  await page.goto("/signup");
  await fillAccount(page, "Ivo Brandt", email);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/onboarding$/);

  // A fresh browser, signed out, asks for a reset link.
  const context = await browser.newContext();
  const visitor = await context.newPage();
  await visitor.goto("/login");
  await visitor.getByRole("link", { name: "Forgot password?" }).click();
  await expect(visitor.getByRole("heading", { name: "Forgot your password?" })).toBeVisible();
  await visitor.getByLabel("Email").fill(email);
  await visitor.getByRole("button", { name: "Send reset link" }).click();
  await expect(visitor.getByText(`If there's an account for ${email}`)).toBeVisible();

  await visitor.goto(await latestEmailLink(email));
  await expect(visitor).toHaveURL(/\/reset-password$/);
  await expect(visitor.getByRole("heading", { name: "Set a new password." })).toBeVisible();
  await visitor.getByLabel("New password").fill("a-brand-new-Password-9");
  await visitor.getByRole("button", { name: "Save new password" }).click();
  await expect(visitor).toHaveURL(/\/onboarding$/);

  // The old password no longer works; the new one does.
  await context.clearCookies();
  await visitor.goto("/login");
  await visitor.getByLabel("Email").fill(email);
  await visitor.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await visitor.getByRole("button", { name: "Sign in" }).click();
  await expect(visitor.getByText("That email and password don't match.")).toBeVisible();
  await visitor.getByLabel("Password", { exact: true }).fill("a-brand-new-Password-9");
  await visitor.getByRole("button", { name: "Sign in" }).click();
  await expect(visitor).toHaveURL(/\/onboarding$/);
  await context.close();
});

test("a used or bad reset link explains itself and offers a new one", async ({ page }) => {
  await page.goto("/auth/callback?code=not-a-real-code&next=/reset-password");
  await expect(page.getByRole("heading", { name: "That link has expired." })).toBeVisible();
  await page.getByRole("link", { name: "Send a new link" }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
});

test("a signed-in owner changes their password in Settings, proving the current one first", async ({ page }) => {
  const email = uniqueEmail("noor");
  await page.goto("/signup");
  await fillAccount(page, "Noor Haddad", email);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Studio name").fill("Saltmarsh Studio");
  await page.getByRole("button", { name: "Create studio" }).click();
  await expect(page).toHaveURL(/\/w\/saltmarsh-studio[a-z0-9-]*$/);
  await page.goto(`${new URL(page.url()).pathname}/settings`);

  await page.getByLabel("Current password", { exact: true }).fill("not-my-password");
  await page.getByLabel("New password", { exact: true }).fill("another-Password-42");
  await page.getByRole("button", { name: "Change password" }).click();
  await expect(page.getByText("That's not your current password.")).toBeVisible();

  await page.getByLabel("Current password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("New password", { exact: true }).fill("another-Password-42");
  await page.getByRole("button", { name: "Change password" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Password changed." })).toBeVisible();
  await expect(page.getByLabel("Current password", { exact: true })).toHaveValue("");
});
