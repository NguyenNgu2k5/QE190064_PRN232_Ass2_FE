import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

const kinds = ["departments", "projects", "tasks", "tags"] as const;
const names = { departments: "departmentName", projects: "projectName", tasks: "title", tags: "tagName" };
const account = { accountId: 1, fullName: "Alex Nguyen", email: "alex@example.com", role: 1, createdDate: "2026-10-01T00:00:00Z" };

async function mockWorkspace(page: Page, signedIn = false) {
  const data: Record<string, Record<string, unknown>[]> = {};
  for (const kind of kinds) data[kind] = Array.from({ length: 21 }, (_, index) => {
    const id = index + 1;
    return {
      departmentId: id, projectId: id, taskId: id, tagId: id,
      [names[kind]]: `${kind.slice(0, -1)} ${String(id).padStart(2, "0")}`,
      departmentDescription: "A team responsible for delivering focused work.", description: "Plan, build and review the work together.",
      departmentName: kind === "departments" ? `department ${String(id).padStart(2, "0")}` : "Engineering",
      projectName: kind === "projects" ? `project ${String(id).padStart(2, "0")}` : "Website redesign",
      isActive: true, projects: [], tasks: [], tags: [], status: 1, priority: 1, startDate: "2026-10-01", dueDate: null, color: "#3B82F6",
    };
  });
  if (signedIn) await page.addInitScript(account => { localStorage.setItem("tasktrack.session", JSON.stringify({ token: "pagination-test", expiresAt: new Date(Date.now() + 86400000).toISOString(), account })); }, account);
  await page.route("**/api/**", route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname.endsWith("/auth/me")) return route.fulfill({ json: account });
    const [kind, id] = url.pathname.split("/api/")[1].split("/");
    if (request.method() === "DELETE") {
      data[kind] = data[kind].filter(item => Number(item[kind.slice(0, -1) + "Id"]) !== Number(id));
      return route.fulfill({ status: 204 });
    }
    if (request.method() === "PUT") {
      const item = data[kind].find(item => Number(item[kind.slice(0, -1) + "Id"]) === Number(id));
      Object.assign(item!, request.postDataJSON());
      return route.fulfill({ json: item });
    }
    const query = url.searchParams.get(kind === "tasks" ? "title" : "name")?.toLowerCase() ?? "";
    return route.fulfill({ json: (data[kind] ?? []).filter(item => String(item[names[kind as keyof typeof names]]).toLowerCase().includes(query)) });
  });
}

for (const kind of kinds) {
  const label = kind[0].toUpperCase() + kind.slice(1);
  test(`public ${kind} paginates six records and resets after a search`, async ({ page }) => {
    await mockWorkspace(page);
    await page.goto(`/${kind}`);
    const records = page.locator(kind === "tags" ? ".tag-directory .tag" : "main .card");
    const pagination = page.getByRole("navigation", { name: `${label} pagination` });
    await expect(records).toHaveCount(6);
    await expect(pagination.getByRole("button", { name: "Previous", exact: true })).toBeDisabled();
    const next = pagination.getByRole("button", { name: "Next", exact: true });
    await next.focus();
    await page.keyboard.press("Enter");
    await expect(records.first()).toContainText(`${kind.slice(0, -1)} 07`);
    await pagination.getByRole("button", { name: "Page 4", exact: true }).click();
    await expect(records).toHaveCount(3);
    await expect(next).toBeDisabled();
    await expect(page.locator(".pagination-summary")).toContainText("19–21");
    for (const width of [1440, 768, 375, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
      await expect(next).toBeVisible();
    }
    const input = page.getByLabel(kind === "tasks" ? "Title" : `${label.slice(0, -1)} name`, { exact: true });
    await input.fill("21");
    if (kind !== "tasks") await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(records).toHaveCount(1);
    await expect(page.locator(".pagination-summary")).toContainText("Page 1 of 1");
    await input.fill("nothing matches");
    if (kind !== "tasks") await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(records).toHaveCount(0);
    await expect(pagination).toHaveCount(0);
    await input.fill("");
    if (kind !== "tasks") await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(records).toHaveCount(6);
    await expect(pagination.getByRole("button", { name: "Page 1", exact: true })).toHaveAttribute("aria-current", "page");
    const directory = process.env.SCREENSHOT_DIR;
    if (directory && kind === "tasks") {
      mkdirSync(directory, { recursive: true });
      for (const width of [1440, 375]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.screenshot({ path: `${directory}/public-pagination-${width}.png`, fullPage: true });
      }
    }
  });

  test(`management ${kind} keeps edits on page three and clamps after deleting the last row`, async ({ page }) => {
    await mockWorkspace(page, true);
    await page.goto(`/admin/${kind}`);
    const pagination = page.getByRole("navigation", { name: `${label} pagination` });
    await expect(page.locator("tbody tr")).toHaveCount(10);
    await pagination.getByRole("button", { name: "Page 3", exact: true }).click();
    await expect(page.locator("tbody tr")).toHaveCount(1);
    await expect(page.locator("tbody tr")).toContainText(`${kind.slice(0, -1)} 21`);
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    const field = page.getByRole("dialog").getByRole("textbox", { name: kind === "tasks" ? "Title" : "Name", exact: true });
    await expect(field).toHaveValue(`${kind.slice(0, -1)} 21`);
    await field.fill("Updated last record");
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator("tbody tr")).toContainText("Updated last record");
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page.getByRole("button", { name: "Yes, delete", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator("tbody tr")).toHaveCount(10);
    await expect(page.locator(".pagination-summary")).toContainText("11–20");
    await expect(page.locator(".pagination-summary")).toContainText("Page 2 of 2");
    await expect(pagination.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
    await page.setViewportSize({ width: 375, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  });
}
