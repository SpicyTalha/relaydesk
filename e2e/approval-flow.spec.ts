import { expect, test } from "@playwright/test";
import { makePng, signUp, uniqueEmail } from "./helpers";

const SHOTS = "e2e/.screens";

test("agency signs up, adds a client, uploads a file and asks for approval", async ({ page }) => {
  const ownerEmail = uniqueEmail("maya");

  await signUp(page, { name: "Maya Chen", email: ownerEmail });
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByLabel("Agency name").fill("Kestrel Studio");
  await page.getByRole("button", { name: "Create workspace" }).click();

  await expect(page).toHaveURL(/\/w\/kestrel-studio[a-z0-9-]*$/);
  const workspaceUrl = new URL(page.url()).pathname;
  await expect(page.getByRole("heading", { name: "Welcome, Maya" })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/01-getting-started.png` });

  // Add a client from the getting-started checklist.
  await page.getByRole("main").getByRole("button", { name: "Add client" }).click();
  await page.getByLabel("Client name").fill("Northwind Coffee");
  await page.screenshot({ path: `${SHOTS}/02-add-client.png` });
  await page.getByRole("dialog").getByRole("button", { name: "Add client" }).click();
  await expect(page).toHaveURL(/\/c\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: "Northwind Coffee" })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/03-empty-client.png` });

  // Upload the first deliverable and send it for approval in one go.
  await page.getByRole("button", { name: "New deliverable" }).click();
  const png = await makePng(page, "Spring Menu");
  await page.locator('input[type="file"]').setInputFiles({ name: "spring-menu-board.png", mimeType: "image/png", buffer: png });
  await expect(page.getByLabel("Title")).toHaveValue("Spring menu board");
  await page.getByLabel("Due date").fill("2026-12-04");
  await page.screenshot({ path: `${SHOTS}/04-new-deliverable.png` });
  await page.getByRole("button", { name: "Upload and send" }).click();

  await expect(page).toHaveURL(/\/d\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: "Spring menu board" })).toBeVisible();
  await expect(page.getByText("Waiting on client").first()).toBeVisible();
  await expect(page.getByRole("img", { name: "spring-menu-board.png" })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/05-deliverable.png`, fullPage: true });

  // The overview now shows it waiting on the client.
  await page.goto(workspaceUrl);
  await expect(page.getByRole("link", { name: /^Spring menu board Northwind Coffee Due/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Maya asked for approval on Spring menu board/ })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/06-overview.png`, fullPage: true });
});
