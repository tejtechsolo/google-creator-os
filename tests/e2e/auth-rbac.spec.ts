import { test, expect, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const ownerEmail = process.env.E2E_OWNER_EMAIL ?? "e2e-owner@example.test";
const memberEmail = process.env.E2E_MEMBER_EMAIL ?? "e2e-member@example.test";
const password = process.env.E2E_PASSWORD ?? "E2E-Password-Change-Me-123!";
const recoveryCodes = (process.env.E2E_RECOVERY_CODES ?? "E2E-RECOVERY-01,E2E-RECOVERY-02,E2E-RECOVERY-03,E2E-RECOVERY-04,E2E-RECOVERY-05,E2E-RECOVERY-06").split(",");
const outsiderWorkspaceId = process.env.E2E_OUTSIDER_WORKSPACE_ID ?? "";
const workspaceId = process.env.E2E_WORKSPACE_ID ?? "";
const memberId = process.env.E2E_MEMBER_ID ?? "";

async function loginWithRecoveryCode(page: Page, recoveryCode: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ownerEmail);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/mfa$/);
  await page.getByRole("button", { name: "Use recovery code" }).click();
  await page.getByLabel("Recovery code").fill(recoveryCode);
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("public pages render and registration submits", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading").first()).toBeVisible();

  await page.goto("/register");
  const email = `e2e-new-${Date.now()}@example.test`;
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("status")).toContainText("Account created");
});

test("MFA login completes with a one-time recovery code", async ({ page }) => {
  await loginWithRecoveryCode(page, recoveryCodes[0]);
  await expect(page.getByRole("heading").first()).toBeVisible();
});

test("workspace administration page loads members for the authenticated workspace", async ({ page }) => {
  await loginWithRecoveryCode(page, recoveryCodes[1]);
  await page.goto("/settings/workspace/members");
  await expect(page.getByRole("heading", { name: "Workspace members" })).toBeVisible();
  await expect(page.getByText(ownerEmail)).toBeVisible();
  await expect(page.getByText(memberEmail)).toBeVisible();
});

test("cross-tenant workspace access is denied in the browser session", async ({ page }) => {
  await loginWithRecoveryCode(page, recoveryCodes[2]);
  expect(outsiderWorkspaceId).not.toBe("");
  const response = await page.request.get(`/api/workspaces/members?workspaceId=${encodeURIComponent(outsiderWorkspaceId)}`);
  expect(response.status()).toBe(403);
});

test("ownership transfer requires step-up and succeeds after explicit MFA", async ({ page }) => {
  await loginWithRecoveryCode(page, recoveryCodes[3]);
  expect(workspaceId).not.toBe("");
  expect(memberId).not.toBe("");

  const denied = await page.request.post("/api/workspaces/ownership", {
    data: { workspaceId, newOwnerUserId: memberId },
  });
  expect(denied.status()).toBe(403);

  const stepUp = await page.request.post("/api/auth/mfa/step-up", {
    data: { recoveryCode: recoveryCodes[4] },
  });
  expect(stepUp.status()).toBe(200);

  const transfer = await page.request.post("/api/workspaces/ownership", {
    data: { workspaceId, newOwnerUserId: memberId },
  });
  expect(transfer.status()).toBe(200);
  await expect(transfer.json()).resolves.toMatchObject({ success: true, ownerId: memberId });
});
