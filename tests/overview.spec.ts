import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import type { Department, Project, Task } from "../lib/types";

test.use({ timezoneId: "Asia/Ho_Chi_Minh" });

const departments: Department[] = [1, 2, 3].map(departmentId => ({
  departmentId, departmentName: departmentId < 3 ? "Engineering" : "Design",
  departmentDescription: "", isActive: true, projects: [],
}));
const projects: Project[] = [1, 2, 3].map(projectId => ({
  projectId, projectName: ["Design System v1", "Mobile App v2", "Unscheduled project"][projectId - 1],
  departmentId: projectId, departmentName: departments[projectId - 1].departmentName,
  status: 1, startDate: "2026-10-01", createdDate: "2026-10-01T00:00:00Z", isActive: true, tasks: [],
}));
const tasks: Task[] = [
  { taskId: 1, title: "Overdue work", projectId: 1, status: 0, dueDate: "2026-10-12" },
  { taskId: 2, title: "Due today", projectId: 1, status: 1, dueDate: "2026-10-13" },
  { taskId: 3, title: "Done yesterday", projectId: 1, status: 2, dueDate: "2026-10-10" },
  { taskId: 4, title: "Cancelled work", projectId: 1, status: 3, dueDate: "2026-10-09" },
  { taskId: 5, title: "Upcoming work", projectId: 2, status: 0, dueDate: "2026-10-14" },
  { taskId: 6, title: "No deadline", projectId: 2, status: 0, dueDate: null },
  { taskId: 7, title: "Completed work", projectId: 2, status: 2, dueDate: null },
].map(task => ({ ...task, priority: 2, projectName: projects[task.projectId - 1].projectName,
  departmentName: "Engineering", isActive: true, createdDate: "2026-10-01T00:00:00Z", tags: [] }));

async function mockWorkspace(page: Page, data = { departments, projects, tasks }) {
  await page.clock.setFixedTime(new Date("2026-10-13T00:30:00+07:00"));
  await page.route("**/api/**", route => {
    const section = new URL(route.request().url()).pathname.split("/").pop() as keyof typeof data;
    return route.fulfill({ json: data[section] ?? [] });
  });
}

test("overview uses correct totals, excludes cancelled completion and compares local due dates", async ({ page }) => {
  await mockWorkspace(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Work at a glance." })).toBeVisible();
  await expect(page.locator(".dashboard-metrics .metric strong")).toHaveText(["7", "3", "33%", "1"]);
  await expect(page.locator(".dashboard-legend strong")).toHaveText(["3", "1", "2", "1"]);
  await expect(page.locator(".dashboard-legend small")).toHaveText(["43%", "14%", "29%", "14%"]);
  await expect(page.locator('.dashboard-workload-list a[href="/departments/1"] strong')).toHaveText("4 tasks");
  await expect(page.locator('.dashboard-workload-list a[href="/departments/2"] strong')).toHaveText("3 tasks");
  await expect(page.getByRole("progressbar", { name: "Design System v1 task completion" })).toHaveAttribute("value", "33");
  await expect(page.getByRole("progressbar", { name: "Unscheduled project task completion" })).toHaveAttribute("value", "0");
  await expect(page.locator(".dashboard-project-progress > span").last()).toHaveText("No non-cancelled tasks");
  await expect(page.locator(".dashboard-deadline-list strong")).toHaveText(["Overdue work", "Due today", "Upcoming work"]);
  await expect(page.locator(".dashboard-deadline-date")).toHaveText(["2026-10-12 · Overdue", "2026-10-13 · Due today", "2026-10-14 · Upcoming"]);
  await expect(page.getByRole("link", { name: /Overdue work/ })).toHaveAttribute("href", "/tasks/1");
  await expect(page.getByRole("link", { name: "Design System v1 Engineering" })).toHaveAttribute("href", "/projects/1");
  await page.getByRole("link", { name: "View all projects", exact: true }).focus();
  await expect(page.getByRole("link", { name: "View all projects", exact: true })).toBeFocused();
});

test("empty workspace and cancelled-only projects keep counts finite and explain missing data", async ({ page }) => {
  await mockWorkspace(page, { departments: [], projects: [], tasks: [] });
  await page.goto("/");
  await expect(page.locator(".dashboard-metrics .metric strong")).toHaveText(["0", "0", "0%", "0"]);
  await expect(page.locator(".dashboard-grid .empty")).toHaveCount(4);
  await page.unroute("**/api/**");
  await mockWorkspace(page, { departments, projects, tasks: [tasks[3]] });
  await page.reload();
  await expect(page.locator(".dashboard-metrics .metric strong")).toHaveText(["1", "3", "0%", "0"]);
  await expect(page.getByRole("progressbar", { name: "Design System v1 task completion" })).toHaveAttribute("value", "0");
  await expect(page.locator(".dashboard-deadline-list")).toHaveCount(0);
  await expect(page.getByText("No open tasks with a due date. You're all caught up.")).toBeVisible();
});

test("loading and API errors do not show fabricated statistics, and retry recovers", async ({ page }) => {
  let release!: () => void;
  const waiting = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/**", async route => { await waiting; await route.fulfill({ status: 503, json: { message: "Workspace unavailable" } }); });
  await page.goto("/");
  await expect(page.getByRole("status", { name: "Loading data" })).toBeVisible();
  await expect(page.locator(".dashboard-metrics")).toHaveCount(0);
  release();
  await expect(page.locator("main").getByRole("alert")).toContainText("Workspace unavailable");
  await expect(page.locator(".dashboard-metrics")).toHaveCount(0);
  await page.unroute("**/api/**");
  await mockWorkspace(page);
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.locator(".dashboard-metrics .metric strong")).toHaveText(["7", "3", "33%", "1"]);
});

test("dashboard fits desktop, tablet, mobile and landscape with long content", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await mockWorkspace(page);
  const screenshots = process.env.SCREENSHOT_DIR;
  if (screenshots) mkdirSync(screenshots, { recursive: true });
  for (const [width, height] of [[1440, 1000], [768, 1000], [375, 1000], [667, 375]]) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await expect(page.locator(".dashboard-metrics .metric")).toHaveCount(4);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    for (const panel of await page.locator(".dashboard-grid > .panel").all()) {
      const bounds = await panel.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      expect(await panel.evaluate(el => el.scrollWidth <= el.clientWidth)).toBeTruthy();
    }
    if (screenshots) await page.screenshot({ path: `${screenshots}/overview-${width}.png`, fullPage: true });
  }
  await page.unroute("**/api/**");
  await mockWorkspace(page, {
    departments: departments.map(department => ({ ...department, departmentName: "Department".repeat(12) })),
    projects: projects.map(project => ({ ...project, projectName: "Project".repeat(30) })),
    tasks: tasks.map(task => ({ ...task, title: "Task".repeat(40), projectName: "Project".repeat(30) })),
  });
  await page.setViewportSize({ width: 375, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.locator(".dashboard-metrics .metric")).toHaveCount(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  for (const panel of await page.locator(".dashboard-grid > .panel").all()) {
    expect(await panel.evaluate(el => el.scrollWidth <= el.clientWidth)).toBeTruthy();
  }
  expect(errors).toEqual([]);
});
