import { expect, test } from "@playwright/test";
import { signUp, uniqueEmail } from "./helpers";

test("owner sees plans and usage, and upgrading opens Stripe Checkout in test mode", async ({ page }) => {
  test.setTimeout(90_000);
  test.skip(!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_"), "needs a Stripe test key");
  await signUp(page, { name: "Maya Chen", email: uniqueEmail("billing-ui") });
  await page.getByLabel("Agency name").fill("Harbor Studio");
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page).toHaveURL(/\/w\/harbor-studio[a-z0-9-]*$/);

  await page.getByRole("link", { name: "Billing" }).click();
  await expect(page.getByRole("heading", { name: "Billing" })).toBeVisible();
  await expect(page.getByText("Client spaces", { exact: true })).toBeVisible();
  await expect(page.getByText("0 of 2")).toBeVisible();
  await page.screenshot({ path: "e2e/.screens/20-billing.png", fullPage: true });

  await page.getByRole("button", { name: "Upgrade to Pro" }).click();
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30_000 });
  await expect(page.getByText(/Relaydesk Pro/).first()).toBeVisible({ timeout: 30_000 });
  // The same USD price as the pricing page, not a local-currency conversion.
  await expect(page.getByText("$29.00").first()).toBeVisible();
  await page.screenshot({ path: "e2e/.screens/21-stripe-checkout.png" });
});
