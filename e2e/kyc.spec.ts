import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("login as compliance and reach dashboard", async ({ page }) => {
  await expect(page.getByRole("heading", { name: /Middle Office/i })).toBeVisible();
  await page.getByLabel("Email").fill("compliance@example.com");
  await page.getByLabel("Password").fill("mock");
  await page.getByRole("button", { name: /Sign in/i }).click();
  await expect(page.getByRole("heading", { name: /Welcome/i })).toBeVisible();
});

test("compliance role can access KYC queue", async ({ page }) => {
  await page.getByLabel("Email").fill("compliance@example.com");
  await page.getByLabel("Password").fill("mock");
  await page.getByRole("button", { name: /Sign in/i }).click();
  await page.getByRole("link", { name: /KYC Review/i }).click();
  await expect(page.getByRole("heading", { name: /KYC Review Queue/i })).toBeVisible();
});

test("support role cannot access user management", async ({ page }) => {
  await page.getByLabel("Email").fill("support@example.com");
  await page.getByLabel("Password").fill("mock");
  await page.getByRole("button", { name: /Sign in/i }).click();
  await page.goto("/users");
  await expect(page.getByRole("heading", { name: /Forbidden/i })).toBeVisible();
});