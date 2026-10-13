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

test("AS1 overview retains its hero, three totals and project links", async ({ page }) => {
  await mockWorkspace(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Move work forward with clarity." })).toBeVisible();
  await expect(page.locator(".metric strong")).toHaveText(["3", "3", "7"]);
  await expect(page.getByRole("heading", { name: "Projects in motion" })).toBeVisible();
  await expect(page.locator(".project-card")).toHaveCount(3);
  await expect(page.locator(".project-card").first()).toHaveAttribute("href", "/projects/1");
  await expect(page.getByRole("link", { name: /Open workspace/ })).toHaveAttribute("href", "/admin/tasks");
});

test("AS1 overview handles empty data and API failure", async ({ page }) => {
  await mockWorkspace(page, { departments: [], projects: [], tasks: [] });
  await page.goto("/");
  await expect(page.locator(".metric strong")).toHaveText(["0", "0", "0"]);
  await expect(page.getByRole("status")).toContainText("Create a project");
  await page.route("**/api/projects", route => route.fulfill({ status: 503, json: { message: "Unavailable" } }));
  await page.reload();
  await expect(page.locator("main [role=alert]")).toContainText("Unavailable");
});

test("AS1 public overview fits mobile, tablet and desktop", async ({ page }) => {
  await mockWorkspace(page);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const screenshots = process.env.SCREENSHOT_DIR;
  if (screenshots) mkdirSync(screenshots, { recursive: true });
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(page.locator(".project-card")).toHaveCount(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    if (screenshots) await page.screenshot({ path: `${screenshots}/as1-overview-${width}.png`, fullPage: true });
  }
  expect(errors).toEqual([]);
});
