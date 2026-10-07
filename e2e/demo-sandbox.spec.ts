import { expect, test } from "@playwright/test";

test("the demo gives a private seeded copy, viewable as the agency and as the client", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/login");
  await page.getByRole("button", { name: "As the agency" }).click();
  await expect(page).toHaveURL(/\/w\/kestrel-demo-[a-z0-9]+$/, { timeout: 30_000 });

  // Agency overview with a lived-in history.
  await expect(page.getByRole("heading", { name: "Welcome back, Maya" })).toBeVisible();
  await expect(page.getByText("Private demo copy", { exact: false }).or(page.getByText("Your private demo copy", { exact: false })).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /^Loyalty card Northwind Coffee/ })).toBeVisible();
  await expect(page.getByText("1 days overdue").or(page.getByText("Due yesterday")).or(page.getByText(/days overdue/)).first()).toBeVisible();
  await page.screenshot({ path: "e2e/.screens/30-demo-overview.png", fullPage: true });

  // Version history on the menu board.
  await page.getByRole("link", { name: "Northwind Coffee" }).first().click();
  await page.getByRole("link", { name: /^Spring menu board/ }).click();
  await expect(page.getByText("Daniel Okafor approved version 3")).toBeVisible();
  await page.screenshot({ path: "e2e/.screens/31-demo-menu-board.png", fullPage: true });

  // Switch to the client's side of the same copy.
  await page.getByRole("button", { name: "View as the client" }).click();
  await expect(page.getByRole("heading", { name: "Hi Daniel" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("link", { name: /Instagram launch post/ })).toBeVisible();
  // Drafts and other clients are invisible to the client.
  await expect(page.getByText("Waiting room poster")).toHaveCount(0);
  await expect(page.getByText("Pinecrest Dental")).toHaveCount(0);
  await page.screenshot({ path: "e2e/.screens/32-demo-client.png", fullPage: true });

  await page.getByRole("link", { name: /Instagram launch post/ }).click();
  await page.getByRole("button", { name: "Approve" }).first().click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText("Approved").first()).toBeVisible();

  // And back to the agency, which sees the approval.
  await page.getByRole("button", { name: "View as the agency" }).click();
  await expect(page.getByRole("heading", { name: "Welcome back, Maya" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("link", { name: /Daniel approved Instagram launch post/ })).toBeVisible();
});
