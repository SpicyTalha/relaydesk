import { expect, test, type Page } from "@playwright/test";

async function openDemo(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: "As the agency" }).click();
  await expect(page).toHaveURL(/\/w\/kestrel-demo-[a-z0-9]+$/, { timeout: 30_000 });
  await page.getByRole("link", { name: "Northwind Coffee" }).first().click();
}

test("the client pins a note on the work, and the studio resolves it", async ({ page }) => {
  test.setTimeout(90_000);
  await openDemo(page);

  // The demo arrives with Daniel's earlier pins on the menu board, already resolved.
  await page.getByRole("link", { name: /^Spring menu board/ }).click();
  await page.locator("nav[aria-label=Versions]").getByRole("link", { name: "v1" }).click();
  await expect(page.getByRole("link", { name: /Pin 1, resolved: These are impossible to read/ })).toBeVisible();

  // As the client, on the post that's waiting for them.
  await page.getByRole("button", { name: "View as the client" }).click();
  await expect(page.getByRole("heading", { name: "Hi Daniel" })).toBeVisible({ timeout: 30_000 });
  await page.getByRole("link", { name: /Instagram launch post/ }).first().click();

  const layer = page.getByTestId("pin-layer");
  await expect(layer).toBeVisible();
  const box = (await layer.boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.35);
  await page.getByLabel("Note on this spot").fill("Can the headline sit a bit lower?");
  await page.getByRole("button", { name: "Pin note" }).click();

  const pin = page.getByRole("link", { name: "Pin 1: Can the headline sit a bit lower?" });
  await expect(pin).toBeVisible();
  // The pin lands where it was dropped (within a few pixels).
  const pinBox = (await pin.boundingBox())!;
  expect(Math.abs(pinBox.x + pinBox.width / 2 - (box.x + box.width * 0.3))).toBeLessThan(4);
  // And links to its comment in the thread.
  await pin.click();
  await expect(page).toHaveURL(/#comment-/);

  // Back as the studio: one open note, resolved with one click.
  await page.getByRole("button", { name: "View as the agency" }).click();
  await expect(page.getByRole("heading", { name: "Welcome back, Maya" })).toBeVisible({ timeout: 30_000 });
  await page.getByRole("link", { name: "Northwind Coffee" }).first().click();
  await page.getByRole("link", { name: /Instagram launch post/ }).first().click();
  await expect(page.getByText("1 open note")).toBeVisible();
  await page.getByRole("button", { name: "Resolve" }).last().click();
  await expect(page.getByRole("link", { name: "Pin 1, resolved: Can the headline sit a bit lower?" })).toBeVisible();
  await expect(page.getByText("1 open note")).toHaveCount(0);
});

test("two versions can be compared with a slider", async ({ page }) => {
  test.setTimeout(90_000);
  await openDemo(page);
  await page.getByRole("link", { name: /^Spring menu board/ }).click();
  await page.getByRole("link", { name: "Compare with v2" }).click();

  const slider = page.getByRole("slider", { name: "Compare v2 and v3" });
  await expect(slider).toBeVisible();
  await slider.focus();
  await page.keyboard.press("Home");
  await expect(slider).toHaveValue("0");
  await page.keyboard.press("End");
  await expect(slider).toHaveValue("100");

  await page.getByRole("link", { name: "Stop comparing" }).click();
  await expect(page.getByTestId("pin-layer")).toBeVisible();
});
