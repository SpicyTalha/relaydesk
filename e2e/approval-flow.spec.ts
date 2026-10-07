import { devices, expect, test } from "@playwright/test";
import { expectToast, makePng, signUp, uniqueEmail } from "./helpers";

const SHOTS = "e2e/.screens";

test("full approval loop: agency sends work, client requests changes on a phone, agency revises, client approves", async ({ page, browser }) => {
  test.setTimeout(120_000);
  const ownerEmail = uniqueEmail("maya");
  const clientEmail = uniqueEmail("daniel");

  // --- Agency: sign up and set up ------------------------------------------------
  await signUp(page, { name: "Maya Chen", email: ownerEmail });
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByLabel("Agency name").fill("Kestrel Studio");
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page).toHaveURL(/\/w\/kestrel-studio[a-z0-9-]*$/);
  const workspaceUrl = new URL(page.url()).pathname;
  await expect(page.getByRole("heading", { name: "Welcome, Maya" })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/01-getting-started.png` });

  await page.getByRole("main").getByRole("button", { name: "Add client" }).click();
  await page.getByLabel("Client name").fill("Northwind Coffee");
  await page.getByRole("dialog").getByRole("button", { name: "Add client" }).click();
  await expect(page).toHaveURL(/\/c\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: "Northwind Coffee" })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/02-empty-client.png` });

  // --- Agency: first version, sent for approval ----------------------------------
  await page.getByRole("button", { name: "New deliverable" }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "spring-menu-board.png",
    mimeType: "image/png",
    buffer: await makePng(page, "Spring Menu"),
  });
  await expect(page.getByLabel("Title")).toHaveValue("Spring menu board");
  await page.getByLabel("Due date").fill("2026-12-04");
  await page.screenshot({ path: `${SHOTS}/03-new-deliverable.png` });
  await page.getByRole("button", { name: "Upload and send" }).click();
  await expect(page).toHaveURL(/\/d\/[0-9a-f-]{36}$/);
  const deliverablePath = new URL(page.url()).pathname;
  await expect(page.getByText("Waiting on client").first()).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/04-deliverable-agency.png`, fullPage: true });

  // --- Agency: invite the client --------------------------------------------------
  await page.getByRole("link", { name: "Northwind Coffee" }).first().click();
  await page.getByRole("link", { name: "Invite client" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByLabel("Email", { exact: true }).fill(clientEmail);
  await page.getByRole("button", { name: "Create invite link" }).click();
  const link = await page.locator("code").filter({ hasText: "/invite/" }).innerText();
  await page.screenshot({ path: `${SHOTS}/05-invite-link.png` });
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: clientEmail })).toBeVisible();

  // --- Client, on a phone: accept the invite and request changes ------------------
  const phone = await browser.newContext({ ...devices["Pixel 7"] });
  const client = await phone.newPage();
  await client.goto(link);
  await expect(client.getByRole("heading", { name: /invited you to review and approve work for Northwind Coffee/ })).toBeVisible();
  await client.screenshot({ path: `${SHOTS}/06-client-invite.png` });
  await client.getByRole("link", { name: "Create your account" }).click();
  await expect(client.getByLabel("Work email")).toHaveValue(clientEmail);
  await client.getByLabel("Your name").fill("Daniel Okafor");
  await client.getByLabel("Password").fill("e2e-Relaydesk-2026!");
  await client.getByRole("button", { name: "Create account" }).click();
  await expect(client).toHaveURL(/\/invite\//);
  await client.getByRole("button", { name: "Accept invitation" }).click();

  await expect(client.getByRole("heading", { name: "Hi Daniel" })).toBeVisible();
  await expect(client.getByRole("heading", { name: "Waiting for you" })).toBeVisible();
  await client.screenshot({ path: `${SHOTS}/07-client-portal.png`, fullPage: true });
  await client.getByRole("link", { name: /Spring menu board/ }).click();
  await expect(client.getByRole("button", { name: "Approve" })).toBeVisible();
  await client.screenshot({ path: `${SHOTS}/08-client-deliverable.png`, fullPage: true });

  await client.getByRole("button", { name: "Request changes" }).click();
  await client.getByRole("button", { name: "Send to Kestrel Studio" }).click();
  await expect(client.getByText("Tell the team what to change.")).toBeVisible();
  await client.getByLabel("Your notes").fill("Make the prices bigger so they read from the counter.");
  await client.getByRole("button", { name: "Send to Kestrel Studio" }).click();
  await expectToast(client, "Sent your notes to Kestrel Studio.");
  await expect(client.getByText("Changes requested").first()).toBeVisible();

  // The client cannot see the agency's team page.
  await client.goto(`${workspaceUrl}/team`);
  await expect(client).not.toHaveURL(/\/team$/);

  // --- Agency: sees the feedback, uploads v2 and asks again ------------------------
  await page.goto(workspaceUrl);
  await expect(page.getByText("Make the prices bigger so they read from the counter.").first()).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/09-agency-back-to-you.png`, fullPage: true });
  await page.goto(deliverablePath);
  await page.getByRole("button", { name: "Upload v2" }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "spring-menu-board-v2.png",
    mimeType: "image/png",
    buffer: await makePng(page, "Spring Menu, bigger prices"),
  });
  await page.getByLabel("What changed?").fill("Prices are 40% bigger.");
  await page.getByRole("dialog").getByRole("button", { name: "Upload", exact: true }).click();
  await expect(page.getByText("Version 2").first()).toBeVisible();
  await expect(page.getByText("Waiting on client").first()).toBeVisible();

  // --- Client: approves v2 ----------------------------------------------------------
  await client.goto(deliverablePath);
  await expect(client.getByText("Version 2").first()).toBeVisible();
  await client.getByRole("button", { name: "Approve" }).click();
  await client.getByRole("alertdialog").getByRole("button", { name: "Approve" }).click();
  await expectToast(client, /Approved/);
  await expect(client.getByText("Approved").first()).toBeVisible();
  await client.screenshot({ path: `${SHOTS}/10-client-approved.png`, fullPage: true });

  // --- Agency: the history shows the whole story ------------------------------------
  await page.reload();
  await expect(page.getByText("Daniel Okafor approved version 2").first()).toBeVisible();
  await expect(page.getByText("Daniel Okafor requested changes on version 1").first()).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/11-agency-history.png`, fullPage: true });

  await phone.close();
});
