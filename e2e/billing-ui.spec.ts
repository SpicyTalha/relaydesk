import { expect, test } from "@playwright/test";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { signUp, uniqueEmail } from "./helpers";

test("owner sees plans and usage, and upgrading opens Stripe Checkout in test mode", async ({ page }) => {
  test.setTimeout(90_000);
  test.skip(!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_"), "needs a Stripe test key");
  await signUp(page, { name: "Maya Chen", email: uniqueEmail("billing-ui") });
  await page.getByLabel("Studio name").fill("Harbor Studio");
  await page.getByRole("button", { name: "Create studio" }).click();
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

test("coming back from Checkout or the portal updates the plan at once, even with no webhook", async ({ page }) => {
  test.setTimeout(120_000);
  test.skip(!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_"), "needs a Stripe test key");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });

  await signUp(page, { name: "Ines Moreau", email: uniqueEmail("sync") });
  await page.getByLabel("Studio name").fill("Moreau Studio");
  await page.getByRole("button", { name: "Create studio" }).click();
  await expect(page).toHaveURL(/\/w\/moreau-studio[a-z0-9-]*$/);
  const base = new URL(page.url()).pathname;
  const slug = base.split("/")[2];

  // Starting Checkout creates the studio's Stripe customer.
  await page.goto(`${base}/billing`);
  await page.getByRole("button", { name: "Upgrade to Pro" }).click();
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30_000 });

  // Pay through the API with Stripe's test payment method (no card typed into any page).
  const { data: ws } = await admin.from("workspaces").select("id").eq("slug", slug).single();
  const { data: row } = await admin.from("subscriptions").select("stripe_customer_id").eq("workspace_id", ws!.id).single();
  const pm = await stripe.paymentMethods.attach("pm_card_visa", { customer: row!.stripe_customer_id });
  await stripe.customers.update(row!.stripe_customer_id, { invoice_settings: { default_payment_method: pm.id } });
  const [price] = (await stripe.prices.list({ lookup_keys: ["relaydesk_pro_monthly"], limit: 1 })).data;
  const sub = await stripe.subscriptions.create({ customer: row!.stripe_customer_id, items: [{ price: price.id }] });

  // Back on the success page: no webhook reaches this machine, the page asks Stripe itself.
  await page.goto(`${base}/billing?checkout=success`);
  await expect(page.getByText("Payment confirmed.")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Pro plan")).toBeVisible();
  await expect(page.getByText("0 of 15")).toBeVisible();

  // Cancelled in the portal: the return trip brings the studio back to Free.
  await stripe.subscriptions.cancel(sub.id);
  await page.goto(`${base}/billing?portal=return`);
  await expect(page).toHaveURL(new RegExp(`${base}/billing$`), { timeout: 30_000 });
  await expect(page.getByText("Free plan")).toBeVisible({ timeout: 30_000 });
});
