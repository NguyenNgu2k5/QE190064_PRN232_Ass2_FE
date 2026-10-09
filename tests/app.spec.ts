import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";

const prefix = "AS2Browser" + randomUUID().replaceAll("-", "").slice(0, 8);
const apiBase = process.env.API_BASE_URL ?? "http://127.0.0.1:5102/api";
expect(["localhost", "127.0.0.1"].includes(new URL(apiBase).hostname)).toBeTruthy();
const testDatabase = new URL(process.env.TEST_DATABASE_URL!);
expect(["localhost", "127.0.0.1"].includes(testDatabase.hostname) && testDatabase.pathname.endsWith("_ass2")).toBeTruthy();
const password = "BrowserTest123!";
let ownerId: number;
let spareId: number;
async function api(path: string, method = "GET", body?: unknown, token?: string) {
  const response = await fetch(apiBase + path, { method, headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: "Bearer " + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  expect(response.ok, method + " " + path + " returned " + response.status).toBeTruthy();
  return response.status === 204 ? undefined : response.json();
}
async function login(page: Page, role: "ADMIN" | "STAFF" = "STAFF") {
  await page.goto("/login");
  await page.getByLabel(/^Email(?: \*)?$/).fill(process.env[role + "_EMAIL"]!);
  await page.getByLabel(/^Password(?: \*)?$/).fill(process.env[role + "_PASSWORD"]!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Management dashboard" })).toBeVisible();
}
function sql(query: string) {
  const database = process.env.TEST_DATABASE_URL!;
  const parsed = new URL(database);
  expect(["127.0.0.1", "localhost"].includes(parsed.hostname) && parsed.pathname.endsWith("_ass2")).toBeTruthy();
  const result = spawnSync(process.env.PSQL_EXE ?? "psql", [database, "-X", "-v", "ON_ERROR_STOP=1", "-c", query], { encoding: "utf8" });
  expect(result.status, result.stderr).toBe(0);
}
test.beforeAll(async () => {
  const owner = await api("/auth/register", "POST", { fullName: prefix + " owner", email: prefix + "owner@example.com", password });
  ownerId = owner.accountId;
  const ownerToken = (await api("/auth/login", "POST", { email: owner.email, password })).token;
  await api("/tasks", "POST", { title: prefix + " ownership", projectId: 1, priority: 0, tagIds: [] }, ownerToken);
  spareId = (await api("/auth/register", "POST", { fullName: prefix + " spare", email: prefix + "spare@example.com", password })).accountId;
});
test.afterAll(() => {
  sql('BEGIN; DELETE FROM "TaskTag" WHERE "TaskID" IN (SELECT "TaskID" FROM "Task" WHERE "Title" LIKE \'' + prefix + '%\'); DELETE FROM "Task" WHERE "Title" LIKE \'' + prefix + '%\'; DELETE FROM "Project" WHERE "ProjectName" LIKE \'' + prefix + '%\'; DELETE FROM "Department" WHERE "DepartmentName" LIKE \'' + prefix + '%\'; DELETE FROM "Tag" WHERE "TagName" LIKE \'' + prefix + '%\'; DELETE FROM "SystemAccount" WHERE LOWER("Email") LIKE \'' + prefix.toLowerCase() + '%\'; COMMIT;');
});
test("guests can browse and protected pages redirect to login", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Workspace overview" })).toBeVisible();
  await expect(page.locator(".metric")).toHaveCount(4);
  await expect(page.getByRole("link", { name: "Login", exact: true })).toBeVisible();
  for (const path of ["/admin", "/admin/tasks", "/admin/accounts"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
  }
  for (const path of ["/departments", "/departments/1", "/projects", "/projects/1", "/tasks", "/tasks/1", "/tags"]) {
    await page.goto(path);
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.locator("main [role=alert]")).toHaveCount(0);
  }
});
test("registration validates linked fields, confirms passwords, creates Staff and redirects with success", async ({ page }) => {
  await page.goto("/register");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.locator(".feedback[role=alert]")).toContainText("Check the highlighted fields");
  await expect(page.locator("#auth-fullName")).toHaveAttribute("aria-invalid", "true");
  await page.getByRole("link", { name: "Enter your full name." }).click();
  await expect(page.getByLabel(/^Full\ name(?: \*)?$/)).toBeFocused();
  await page.getByLabel(/^Full\ name(?: \*)?$/).fill(prefix + " registered");
  await page.getByLabel(/^Email(?: \*)?$/).fill(prefix + "registered@example.com");
  await page.getByLabel(/^Password(?: \*)?$/).fill(password);
  await page.getByLabel(/^Confirm\ password(?: \*)?$/).fill("different");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.locator("#auth-confirmPassword")).toHaveAttribute("aria-invalid", "true");
  await page.getByLabel(/^Confirm\ password(?: \*)?$/).fill(password);
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page).toHaveURL(/\/login\?registered=1$/);
  await expect(page.getByRole("status")).toContainText("Your account is ready");
});
test("login errors persist; Staff dashboard totals use API data and session survives refresh/logout", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/^Email(?: \*)?$/).fill(process.env.STAFF_EMAIL!);
  await page.getByLabel(/^Password(?: \*)?$/).fill("WrongPassword123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.locator(".feedback[role=alert]")).toContainText("Invalid email or password");
  await login(page);
  const counts = await Promise.all(["departments", "projects", "tasks", "tags"].map(kind => api("/" + kind)));
  await expect(page.locator(".metric")).toHaveCount(4);
  for (let index = 0; index < counts.length; index++) await expect(page.locator(".metric strong").nth(index)).toHaveText(String(counts[index].length));
  await expect(page.getByRole("navigation", { name: "Management navigation" }).getByRole("link", { name: "Accounts", exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Management dashboard" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Logout", exact: true })).toBeVisible();
  await page.goto("/admin/accounts");
  await expect(page.getByRole("heading", { name: "Admin access required" })).toBeVisible();
  await page.getByRole("button", { name: "Logout", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(await page.evaluate(() => localStorage.getItem("tasktrack.session"))).toBeNull();
});
test("Staff CRUD modals support keyboard focus, tags, Low priority and soft delete", async ({ page }) => {
  await login(page);
  await page.goto("/admin/departments");
  const create = page.getByRole("button", { name: "+ New department", exact: true });
  await create.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(create).toBeFocused();
  await create.click();
  await page.getByLabel(/^Name(?: \*)?$/).fill(prefix + " department");
  await page.getByLabel(/^Description(?: \*)?$/).fill("Browser fixture");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  const departmentRow = page.getByRole("row").filter({ hasText: prefix + " department" });
  await expect(departmentRow).toBeVisible();
  await departmentRow.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel(/^Description(?: \*)?$/).fill("Updated in a modal");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/admin/projects");
  await page.getByRole("button", { name: "+ New project", exact: true }).click();
  await page.getByLabel(/^Name(?: \*)?$/).fill(prefix + " project");
  await page.getByLabel(/^Department(?: \*)?$/).selectOption({ label: prefix + " department" });
  await page.getByLabel(/^Start\ date(?: \*)?$/).fill("2026-10-10");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByRole("row").filter({ hasText: prefix + " project" })).toBeVisible();
  await page.goto("/admin/tags");
  await page.getByRole("button", { name: "+ New tag", exact: true }).click();
  await page.getByLabel(/^Name(?: \*)?$/).fill(prefix + " tag");
  await page.getByLabel(/^Color(?: \*)?$/).fill("#2563eb");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  const tagRow = page.getByRole("row").filter({ hasText: prefix + " tag" });
  await expect(tagRow).toBeVisible();
  await tagRow.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel(/^Color(?: \*)?$/).fill("#16a34a");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.goto("/admin/tasks");
  await page.getByRole("button", { name: "+ New task", exact: true }).click();
  await page.getByLabel(/^Title(?: \*)?$/).fill(prefix + " task");
  await page.getByLabel(/^Project(?: \*)?$/).selectOption({ label: prefix + " project" });
  await page.getByLabel(/^Priority(?: \*)?$/).selectOption("0");
  await page.getByLabel(prefix + " tag", { exact: true }).check();
  await page.getByRole("button", { name: "Create", exact: true }).click();
  const row = page.getByRole("row").filter({ hasText: prefix + " task" });
  await expect(row).toContainText("Low");
  await row.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(page.getByLabel(prefix + " tag", { exact: true })).toBeChecked();
  await page.getByLabel(prefix + " tag", { exact: true }).uncheck();
  await page.getByLabel(/^Description(?: \*)?$/).fill("Changed");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await row.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Keep it", exact: true }).click();
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Yes, delete", exact: true }).click();
  await expect(row).toHaveCount(0);
  await page.goto("/admin/tags");
  await page.getByRole("row").filter({ hasText: prefix + " tag" }).getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Yes, delete", exact: true }).click();
  await expect(page.getByRole("row").filter({ hasText: prefix + " tag" })).toHaveCount(0);
});
test("Admin account modals update names/roles, delete unused accounts and retain blocked-delete errors", async ({ page }) => {
  await login(page, "ADMIN");
  await page.goto("/admin/accounts");
  const spare = page.getByRole("row").filter({ hasText: prefix + "spare@example.com" });
  await spare.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel(/^Full\ name(?: \*)?$/).fill(prefix + " renamed");
  await page.getByLabel(/^Role(?: \*)?$/).selectOption("1");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(spare).toContainText("Admin");
  await expect(spare).toContainText(prefix + " renamed");
  await spare.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Yes, delete", exact: true }).click();
  await expect(spare).toHaveCount(0);
  const owner = page.getByRole("row").filter({ hasText: prefix + "owner@example.com" });
  await owner.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Yes, delete", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("created tasks");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Keep account", exact: true }).click();
  await expect(owner).toBeVisible();
  expect(ownerId).toBeGreaterThan(0);
  expect(spareId).toBeGreaterThan(0);
});
test("invalid and expired sessions redirect once to login without an authentication loop", async ({ page }) => {
  await login(page);
  await page.evaluate(() => {
    const session = JSON.parse(localStorage.getItem("tasktrack.session")!);
    session.token = session.token.split(".").slice(0, 2).join(".") + ".invalid";
    localStorage.setItem("tasktrack.session", JSON.stringify(session));
  });
  await page.reload();
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => localStorage.getItem("tasktrack.session"))).toBeNull();
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  await login(page);
  await page.evaluate(() => {
    const session = JSON.parse(localStorage.getItem("tasktrack.session")!);
    session.expiresAt = new Date(Date.now() - 1000).toISOString();
    localStorage.setItem("tasktrack.session", JSON.stringify(session));
  });
  await page.reload();
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => localStorage.getItem("tasktrack.session"))).toBeNull();
});
test("a 401 during an authenticated write clears the session and returns to login", async ({ page }) => {
  const email = prefix + "revoked@example.com";
  const account = await api("/auth/register", "POST", { fullName: prefix + " revoked", email, password });
  const admin = await api("/auth/login", "POST", { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
  await page.goto("/login");
  await page.getByLabel(/^Email(?: \*)?$/).fill(email);
  await page.getByLabel(/^Password(?: \*)?$/).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/tags");
  await page.getByRole("button", { name: "+ New tag", exact: true }).click();
  await page.getByLabel(/^Name(?: \*)?$/).fill(prefix + " rejected");
  await api("/accounts/" + account.accountId, "PUT", { role: 1 }, admin.token);
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => localStorage.getItem("tasktrack.session"))).toBeNull();
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
});
test("public search combines priority and title filters and opens a detail", async ({ page }) => {
  await page.goto("/search");
  await page.getByLabel(/^Title(?: \*)?$/).fill(prefix + " ownership");
  await page.getByLabel(/^Priority(?: \*)?$/).selectOption("0");
  const card = page.locator(".card").filter({ hasText: prefix + " ownership" });
  await expect(card).toHaveCount(1);
  await expect(card).toContainText("Low");
  await card.click();
  await expect(page.locator("main h1")).toHaveText(prefix + " ownership");
});
test("layouts fit 375, 768 and 1440 pixels; forms and tables remain usable", async ({ page }) => {
  await login(page, "ADMIN");
  const screenshots = process.env.SCREENSHOT_DIR;
  if (screenshots) mkdirSync(screenshots, { recursive: true });
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of ["/", "/admin", "/admin/tasks", "/admin/accounts", "/login", "/register", "/search"]) {
      await page.goto(path);
      await expect(page.locator("main h1")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), width + "px " + path).toBeTruthy();
    }
    await page.goto("/admin");
    await expect(page.locator(".metric")).toHaveCount(4);
    if (screenshots) await page.screenshot({ path: screenshots + "/dashboard-" + width + ".png", fullPage: true });
    await page.goto("/admin/tasks");
    await page.getByRole("button", { name: "+ New task", exact: true }).click();
    await expect(page.getByLabel(/^Title(?: \*)?$/)).toBeVisible();
    const dialog = await page.getByRole("dialog").evaluate(el => { const rect = el.getBoundingClientRect(); return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }; });
    expect(dialog.width).toBeLessThanOrEqual(width);
    expect(Math.abs(dialog.x - (width - dialog.width) / 2)).toBeLessThanOrEqual(1);
    expect(Math.abs(dialog.y - (1000 - dialog.height) / 2)).toBeLessThanOrEqual(1);
    await page.keyboard.press("Escape");
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBeTruthy();
});
