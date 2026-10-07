import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { PASSWORD, signUp, uniqueEmail } from "./helpers";

test("a platform admin suspends a studio with a reason; the studio goes read-only and it's audited", async ({ page, browser }) => {
  test.setTimeout(90_000);
  // The audit log is shared by every run against this database, so this run's reasons are unique.
  const run = Date.now().toString(36);
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });

  // A real studio, owned by someone who is not an admin.
  const ownerEmail = uniqueEmail("tova");
  await signUp(page, { name: "Tova Lindqvist", email: ownerEmail });
  await page.getByLabel("Studio name").fill("Fjord Studio");
  await page.getByRole("button", { name: "Create studio" }).click();
  await expect(page).toHaveURL(/\/w\/fjord-studio[a-z0-9-]*$/);
  const studioUrl = new URL(page.url()).pathname;

  // The admin page doesn't exist for them.
  const notAdmin = await page.goto("/admin");
  expect(notAdmin?.status()).toBe(404);

  // A platform admin: the role sits in app_metadata, which only the server can set.
  const adminEmail = uniqueEmail("ops");
  const { error } = await admin.auth.admin.createUser({
    email: adminEmail,
    password: PASSWORD,
    email_confirm: true,
    app_metadata: { platform_role: "admin" },
    user_metadata: { full_name: "Ops Admin" },
  });
  expect(error).toBeNull();

  const context = await browser.newContext();
  const ops = await context.newPage();
  await ops.goto("/login?next=/admin");
  await ops.getByLabel("Email").fill(adminEmail);
  await ops.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await ops.getByRole("button", { name: "Sign in" }).click();
  await expect(ops.getByRole("heading", { name: "Admin", exact: true })).toBeVisible();
  await expect(ops.getByText("MRR (test mode)")).toBeVisible();
  await expect(ops.getByRole("heading", { name: "Stripe webhook log" })).toBeVisible();

  const row = ops.getByRole("row").filter({ hasText: "Fjord Studio" }).first();
  await row.getByRole("button", { name: "Suspend" }).click();
  await ops.getByLabel("Reason, for the audit log").fill(`Chargeback under review ${run}`);
  await ops.getByRole("button", { name: "Suspend studio" }).click();
  await expect(row.getByText("Suspended")).toBeVisible();
  await expect(ops.getByText(`Chargeback under review ${run}`)).toBeVisible();

  // The studio sees why, and the database refuses new writes.
  await page.goto(studioUrl);
  await expect(page.getByText("This studio is suspended.")).toBeVisible();
  await page.getByRole("button", { name: "Add client" }).first().click();
  await page.getByRole("dialog").getByLabel("Client name").fill("Lighthouse Books");
  await page.getByRole("dialog").getByRole("button", { name: /Add client/ }).click();
  await expect(page.getByText("This studio is suspended, so changes are paused.")).toBeVisible();

  // Lifting it is audited too.
  await row.getByRole("button", { name: "Lift suspension" }).click();
  await ops.getByLabel("Reason, for the audit log").fill(`Resolved with the bank ${run}`);
  await ops.getByRole("button", { name: "Lift suspension" }).last().click();
  await expect(row.getByText("Active")).toBeVisible();
  await expect(ops.getByText(`Resolved with the bank ${run}`)).toBeVisible();
  await context.close();
});
