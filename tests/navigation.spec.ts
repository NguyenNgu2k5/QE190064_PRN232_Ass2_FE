import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

async function mockWorkspace(page: Page, role: 0 | 1 | null) {
  const account = { accountId: 1, fullName: "Navigation QA", email: "navigation@example.com", role: role ?? 0, createdDate: "2026-10-01T00:00:00Z" };
  if (role !== null) await page.addInitScript(account => {
    localStorage.setItem("tasktrack.session", JSON.stringify({ token: "navigation-test", expiresAt: new Date(Date.now() + 86400000).toISOString(), account }));
  }, account);
  await page.route("**/api/**", route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/me")) return route.fulfill({ json: account });
    if (path.endsWith("/accounts")) return route.fulfill({ json: [account] });
    if (path.endsWith("/departments")) return route.fulfill({ json: [{ departmentId: 1, departmentName: "Engineering", departmentDescription: "Build and maintain our products.", projects: [], isActive: true }] });
    return route.fulfill({ json: [] });
  });
}

test("Admin uses one management menu and can switch to the public site and back", async ({ page }) => {
  await mockWorkspace(page, 1);
  await page.goto("/admin/departments");
  const navigation = page.getByRole("navigation", { name: "Management navigation" });
  await expect(page.getByRole("navigation", { name: "Management navigation" })).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Departments", exact: true })).toHaveCount(1);
  await expect(navigation.getByRole("link", { name: "Departments", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(navigation.getByRole("link", { name: "Accounts", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Overview", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "+ New department", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  const screenshots = process.env.SCREENSHOT_DIR;
  if (screenshots) mkdirSync(screenshots, { recursive: true });
  for (const width of [1440, 768, 375, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    const menu = page.getByRole("button", { name: "Workspace menu", exact: true });
    if (await menu.isVisible() && await menu.getAttribute("aria-expanded") === "false") await menu.click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    for (const link of await navigation.getByRole("link").all()) await expect(link).toBeVisible();
    const positions = await navigation.getByRole("link").evaluateAll(links => links.map(link => { const rect = link.getBoundingClientRect(); return { x: rect.x, y: rect.y, bottom: rect.bottom }; }));
    for (let index = 1; index < positions.length; index++) {
      expect(positions[index].x).toBe(positions[0].x);
      expect(positions[index].y).toBeGreaterThanOrEqual(positions[index - 1].bottom);
    }
    await expect(page.getByRole("link", { name: /View public site/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Logout", exact: true })).toBeVisible();
    if (screenshots) await page.screenshot({ path: `${screenshots}/management-navigation-${width}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("link", { name: /View public site/ }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Management navigation" })).toHaveCount(0);
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: /^Manage/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await navigation.getByRole("link", { name: "Departments", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/admin\/departments$/);
  await page.getByRole("link", { name: "Profile", exact: true }).click();
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue("navigation@example.com");
  await expect(page.getByRole("navigation", { name: "Management navigation" })).toBeVisible();
  await page.setViewportSize({ width: 375, height: 1000 });
  const menu = page.getByRole("button", { name: "Workspace menu", exact: true });
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await menu.focus();
  await page.keyboard.press("Enter");
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await navigation.getByRole("link", { name: "Tasks", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/tasks$/);
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(navigation).toBeHidden();
});

test("Staff sees management destinations without Accounts and is denied the direct Accounts URL", async ({ page }) => {
  await mockWorkspace(page, 0);
  await page.goto("/admin/departments");
  await expect(page.getByRole("navigation", { name: "Management navigation" }).getByRole("link")).toHaveCount(5);
  await expect(page.getByRole("link", { name: "Accounts", exact: true })).toHaveCount(0);
  await page.goto("/admin/accounts");
  await expect(page.getByRole("heading", { name: "Admin access required" })).toBeVisible();
});

test("Guest keeps the public directory and management redirects to login", async ({ page }) => {
  await mockWorkspace(page, null);
  await page.goto("/departments");
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Engineering" })).toBeVisible();
  await expect(page.locator("main").getByRole("link", { name: /^Manage/ })).toHaveCount(0);
  await page.getByRole("link", { name: "Manage", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Sign in to TaskTrack" })).toBeVisible();
});
