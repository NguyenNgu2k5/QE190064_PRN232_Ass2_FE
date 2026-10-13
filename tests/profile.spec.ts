import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

async function mockProfile(page: Page) {
  let account = { accountId: 1, fullName: "Alex Nguyen", email: "alex@example.com", role: 0, createdDate: "2026-10-01T00:00:00Z" };
  await page.addInitScript(account => {
    if (!sessionStorage.getItem("profile-test-seeded")) {
      localStorage.setItem("tasktrack.session", JSON.stringify({ token: "profile-test", expiresAt: new Date(Date.now() + 86400000).toISOString(), account }));
      sessionStorage.setItem("profile-test-seeded", "1");
    }
  }, account);
  const writes: Record<string, string>[] = [];
  await page.route("**/api/**", route => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() === "PUT") {
      const body = route.request().postDataJSON();
      writes.push(body);
      if (body.fullName) { account = { ...account, fullName: body.fullName }; return route.fulfill({ json: account }); }
      if (body.currentPassword !== "CurrentTest123!") return route.fulfill({ status: 400, json: { message: "Current password is incorrect." } });
      return route.fulfill({ status: 204 });
    }
    return route.fulfill({ json: path.endsWith("/auth/me") ? account : [] });
  });
  return writes;
}

test("profile fits all sizes, identifies read-only information and saves the name", async ({ page }) => {
  const writes = await mockProfile(page);
  await page.goto("/profile");
  await expect(page.getByLabel("Email", { exact: true })).toHaveAttribute("readonly", "");
  await expect(page.getByLabel("Email", { exact: true })).toHaveAccessibleDescription("Your sign-in email is read-only.");
  await expect(page.getByLabel("Access role: Staff", { exact: true })).toHaveText("Staff");
  await expect(page.getByLabel(/^New password(?: \*)?$/)).toHaveAccessibleDescription("Use 8–128 characters for your new password.");
  const directory = process.env.SCREENSHOT_DIR;
  if (directory) mkdirSync(directory, { recursive: true });
  for (const [width, height] of [[1440, 1000], [1100, 1000], [768, 1000], [375, 1000], [320, 640], [667, 375]]) {
    await page.setViewportSize({ width, height });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    for (const card of await page.locator(".profile-card").all()) expect(await card.evaluate(el => el.scrollWidth <= el.clientWidth)).toBeTruthy();
    if (directory && [1440, 375].includes(width)) await page.screenshot({ path: `${directory}/profile-${width}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  const name = page.getByLabel(/^Full name(?: \*)?$/);
  await name.fill(" ");
  await page.getByRole("button", { name: "Save name", exact: true }).click();
  await expect(page.locator("main [role=alert]")).toContainText("Enter a full name");
  expect(writes).toHaveLength(0);
  await name.fill("  Updated name  ");
  await page.getByRole("button", { name: "Save name", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("main [role=status]")).toContainText("Your name has been updated");
  expect(writes).toEqual([{ fullName: "Updated name" }]);
  await expect(name).toHaveValue("Updated name");
  await expect(page.locator(".as2-account-name")).toContainText("Updated name");
});

test("profile keeps password validation, failed input and sign-out after a successful change", async ({ page }) => {
  const writes = await mockProfile(page);
  await page.goto("/profile");
  const current = page.getByLabel(/^Current password(?: \*)?$/);
  const next = page.getByLabel(/^New password(?: \*)?$/);
  const confirm = page.getByLabel(/^Confirm new password(?: \*)?$/);
  await current.fill("WrongTest123!");
  await next.fill("NextTest123!");
  await confirm.fill("Mismatch123!");
  await page.getByRole("button", { name: "Change password", exact: true }).click();
  await expect(page.locator("main [role=alert]")).toContainText("confirm it exactly");
  expect(writes).toHaveLength(0);
  await confirm.fill("NextTest123!");
  await page.getByRole("button", { name: "Change password", exact: true }).click();
  await expect(page.locator("main [role=alert]")).toContainText("Current password is incorrect");
  await expect(next).toHaveValue("NextTest123!");
  await current.fill("CurrentTest123!");
  await page.getByRole("button", { name: "Change password", exact: true }).click();
  await expect(page).toHaveURL(/\/login\?passwordChanged=1$/);
  expect(await page.evaluate(() => localStorage.getItem("tasktrack.session"))).toBeNull();
  expect(writes[1]).toEqual({ currentPassword: "CurrentTest123!", newPassword: "NextTest123!" });
});
