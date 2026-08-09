import { test, expect } from "@playwright/test";

test("triage an alert through to escalation", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Email").fill("compliance@example.com");
  await page.getByLabel("Password").fill("mock");
  await page.getByRole("button", { name: /Sign in/i }).click();
  await page.getByRole("link", { name: /AML.*Alerts/i }).click();
  await expect(page.getByRole("heading", { name: /AML.*KYT Alert Desk/i })).toBeVisible();
  await page.getByText("alert-2001").click();
  await expect(page.getByText(/Address & exposure/i)).toBeVisible();
  await page.getByRole("button", { name: /Claim/i }).click();
  await page.getByRole("button", { name: /Escalate/i }).click();
  await page.getByRole("button", { name: /^Confirm/i }).click();
});