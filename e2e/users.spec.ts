import { test, expect } from "@playwright/test";

test("admin searches and locks a user", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Email").fill("admin@example.com");
  await page.getByLabel("Password").fill("mock");
  await page.getByRole("button", { name: /Sign in/i }).click();
  await page.getByRole("link", { name: /User Management/i }).click();
  await expect(page.getByRole("heading", { name: /User Management/i })).toBeVisible();
  await page.getByLabel(/Search/i).fill("alice");
  await page.getByText("user-501").click();
  await expect(page.getByText(/Profile/i)).toBeVisible();
  await page.getByRole("button", { name: /Lock/i }).click();
});