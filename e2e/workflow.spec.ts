import { expect, test } from "@playwright/test";

test("search, nudge, notifications and the sign-off sheet work together", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/login");
  await page.getByRole("button", { name: "As the agency" }).click();
  await expect(page.getByRole("heading", { name: "Welcome back, Maya" })).toBeVisible({ timeout: 30_000 });

  // Ctrl+K jumps straight to a deliverable.
  await page.keyboard.press("ControlOrMeta+k");
  await page.getByPlaceholder("Search clients and work...").fill("instagram");
  await expect(page.getByRole("option", { name: /Instagram launch post/ })).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1, name: "Instagram launch post" })).toBeVisible();

  // Nudge Daniel: a ready-made reminder, posted where he'll see it.
  await page.getByRole("button", { name: "Nudge client" }).click();
  const message = page.getByRole("dialog").getByRole("textbox");
  await expect(message).toHaveValue(/^Hi Daniel, a quick nudge: Instagram launch post \(version 1\) is waiting for your review/);
  await page.getByRole("button", { name: "Post as a comment" }).click();
  await expect(page.getByText("Posted. They'll see it next time they look.")).toBeVisible();

  // Daniel's bell has it.
  await page.getByRole("button", { name: "View as the client" }).click();
  await expect(page.getByRole("heading", { name: "Hi Daniel" })).toBeVisible({ timeout: 30_000 });
  const bell = page.getByRole("button", { name: /^Notifications, \d+ new$/ });
  await expect(bell).toBeVisible();
  await bell.click();
  await page.getByRole("link", { name: /Maya commented on Instagram launch post/ }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Instagram launch post" })).toBeVisible();
  // Opening the list marked everything seen.
  await expect(page.getByRole("button", { name: "Notifications", exact: true })).toBeVisible();

  // The approved menu board has a sign-off sheet with the file's fingerprint.
  await page.goto(page.url().split("/d/")[0]);
  await page.getByRole("link", { name: /^Spring menu board/ }).filter({ visible: true }).first().click();
  await page.getByRole("link", { name: "Sign-off sheet" }).click();
  await expect(page.getByRole("heading", { name: "Spring menu board" })).toBeVisible();
  await expect(page.getByText("Approved by", { exact: true })).toBeVisible();
  await expect(page.getByText(/^[0-9a-f]{64}$/)).toBeVisible();
});
