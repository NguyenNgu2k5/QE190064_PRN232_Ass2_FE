import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

async function mockAuth(page: Page, signedIn = false) {
  const account = { accountId: 1, fullName: "Visibility QA", email: "visibility@example.com", role: 0, createdDate: "2026-10-01T00:00:00Z" };
  if (signedIn) await page.addInitScript(account => {
    localStorage.setItem("tasktrack.session", JSON.stringify({ token: "visibility-test", expiresAt: new Date(Date.now() + 86400000).toISOString(), account }));
  }, account);
  const writes: string[] = [];
  await page.route("**/api/**", route => {
    if (route.request().method() !== "GET") writes.push(route.request().method());
    return route.fulfill({ json: new URL(route.request().url()).pathname.endsWith("/auth/me") ? account : [] });
  });
  return writes;
}

test("login eye works by mouse and keyboard without submitting or changing the password", async ({ page }) => {
  const writes = await mockAuth(page);
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/login");
    const password = page.getByLabel(/^Password(?: \*)?$/);
    await page.getByLabel(/^Email(?: \*)?$/).fill("visibility@example.com");
    await password.fill("VisibilityTest123!");
    await expect(password).toHaveAttribute("type", "password");
    await expect(password).toHaveAttribute("autocomplete", "current-password");
    const eye = page.getByRole("button", { name: "Show password", exact: true });
    await expect(eye).toHaveAttribute("type", "button");
    await expect(eye).toHaveAttribute("aria-controls", "auth-password");
    const bounds = await eye.boundingBox();
    expect(bounds!.width).toBeGreaterThanOrEqual(44);
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
    await eye.click();
    await expect(password).toHaveAttribute("type", "text");
    await expect(page.getByRole("button", { name: "Hide password", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Space");
    await expect(password).toHaveAttribute("type", "password");
    await page.keyboard.press("Enter");
    await expect(password).toHaveAttribute("type", "text");
    await expect(password).toHaveValue("VisibilityTest123!");
    await page.getByRole("button", { name: "Hide password", exact: true }).click();
    await expect(page.locator("main [role=alert]")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    const directory = process.env.SCREENSHOT_DIR;
    if (directory) {
      mkdirSync(directory, { recursive: true });
      await page.locator(".field").filter({ has: password }).screenshot({ path: `${directory}/password-eye-${width}.png` });
    }
  }
  expect(writes).toEqual([]);
});

test("registration eyes are independent and preserve validation links", async ({ page }) => {
  const writes = await mockAuth(page);
  await page.goto("/register");
  const password = page.getByLabel(/^Password(?: \*)?$/);
  const confirm = page.getByLabel(/^Confirm password(?: \*)?$/);
  await password.fill("VisibilityTest123!");
  await confirm.fill("different");
  await page.getByRole("button", { name: "Show password", exact: true }).click();
  await expect(password).toHaveAttribute("type", "text");
  await expect(confirm).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Show confirm password", exact: true }).click();
  await expect(confirm).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Hide password", exact: true }).click();
  await expect(confirm).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(confirm).toHaveAttribute("aria-invalid", "true");
  await expect(confirm).toHaveAttribute("aria-describedby", "auth-confirmPassword-error");
  await page.getByRole("button", { name: "Hide confirm password", exact: true }).click();
  await expect(confirm).toHaveValue("different");
  await expect(confirm).toHaveAttribute("type", "password");
  await expect(password).toHaveAttribute("autocomplete", "new-password");
  expect(writes).toEqual([]);
});

test("profile has independent eyes for current, new and confirmed passwords", async ({ page }) => {
  const writes = await mockAuth(page, true);
  await page.goto("/profile");
  const current = page.getByLabel(/^Current password(?: \*)?$/);
  const next = page.getByLabel(/^New password(?: \*)?$/);
  const confirm = page.getByLabel(/^Confirm new password(?: \*)?$/);
  await current.fill("CurrentTest123!");
  await next.fill("NextTest123!");
  await confirm.fill("NextTest123!");
  await page.getByRole("button", { name: "Show new password", exact: true }).click();
  await expect(next).toHaveAttribute("type", "text");
  await expect(current).toHaveAttribute("type", "password");
  await expect(confirm).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Show current password", exact: true }).click();
  await page.getByRole("button", { name: "Show confirm new password", exact: true }).click();
  await expect(current).toHaveAttribute("type", "text");
  await expect(confirm).toHaveAttribute("type", "text");
  await expect(next).toHaveValue("NextTest123!");
  await expect(current).toHaveAttribute("autocomplete", "current-password");
  await expect(confirm).toHaveAttribute("autocomplete", "new-password");
  expect(writes).toEqual([]);
});
