import { test, expect, type Page } from "@playwright/test";

async function mockAccounts(page: Page, twoAdmins: boolean) {
  const own = { accountId: 1, fullName: "Own Admin", email: "own@example.com", role: 1, createdDate: "2026-10-01T00:00:00Z" };
  const accounts = [own, { ...own, accountId: 2, fullName: "Other account", email: "other@example.com", role: twoAdmins ? 1 : 0 }];
  const writes: Record<string, unknown>[] = [];
  await page.addInitScript(account => { localStorage.setItem("tasktrack.session", JSON.stringify({ token: "protection-test", expiresAt: new Date(Date.now() + 86400000).toISOString(), account })); }, own);
  await page.route("**/api/**", route => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() === "PUT") {
      const body = route.request().postDataJSON();
      writes.push(body);
      const target = accounts.find(item => item.accountId === Number(path.split("/").pop()))!;
      Object.assign(target, body);
      return route.fulfill({ json: target });
    }
    return route.fulfill({ json: path.endsWith("/auth/me") ? own : accounts });
  });
  return writes;
}

test("last Admin cannot change role or be deleted, but can save their own name", async ({ page }) => {
  const writes = await mockAccounts(page, false);
  await page.goto("/admin/accounts");
  const row = page.getByRole("row").filter({ hasText: "own@example.com" });
  await expect(row.getByRole("button", { name: "Delete", exact: true })).toBeDisabled();
  await expect(row.getByRole("button", { name: "Delete", exact: true })).toHaveAttribute("title", "At least one Admin must remain.");
  await row.getByRole("button", { name: "Edit", exact: true }).click();
  const role = page.getByRole("dialog").getByLabel("Role", { exact: true });
  await expect(role).toBeDisabled();
  await expect(role).toHaveValue("1");
  await expect(role).toHaveAccessibleDescription("You cannot change your own role.");
  await page.getByLabel(/^Full name(?: \*)?$/).fill("Renamed Admin");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(writes).toEqual([{ fullName: "Renamed Admin" }]);
  await expect(row).toContainText("Renamed Admin");
  await expect(row).toContainText("Admin");
});

test("own role stays locked with two Admins and another Admin can be demoted", async ({ page }) => {
  const writes = await mockAccounts(page, true);
  await page.goto("/admin/accounts");
  const own = page.getByRole("row").filter({ hasText: "own@example.com" });
  await own.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(page.getByLabel("Role", { exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  const other = page.getByRole("row").filter({ hasText: "other@example.com" });
  await other.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(page.getByLabel("Role", { exact: true })).toBeEnabled();
  await page.getByLabel("Role", { exact: true }).selectOption("0");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(other).toContainText("Staff");
  expect(writes).toEqual([{ fullName: "Other account", role: 0 }]);
  await expect(own.getByRole("button", { name: "Delete", exact: true })).toBeDisabled();
  await expect(other.getByRole("button", { name: "Delete", exact: true })).toBeEnabled();
});
