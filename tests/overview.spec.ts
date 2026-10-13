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

test("guest overview presents the portfolio with public links instead of management analytics", async ({ page }) => {
  await mockWorkspace(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /A window into.*work in motion/ })).toBeVisible();
  await expect(page.locator(".guest-totals strong")).toHaveText(["3", "3", "7"]);
  await expect(page.locator(".guest-feature")).toHaveAttribute("href", "/projects/1");
  await expect(page.locator(".guest-feature-footer")).toContainText("4 tasks in this project");
  await expect(page.locator(".guest-projects h3")).toHaveText(projects.map(project => project.projectName));
  await expect(page.locator(".guest-teams small")).toHaveText(["1 project", "1 project", "1 project"]);
  for (const link of await page.locator(".guest-totals a").all()) await expect(link).toHaveAttribute("href", /^\/(departments|projects|tasks)$/);
  await expect(page.getByRole("link", { name: "Explore projects" })).toHaveAttribute("href", "/projects");
  await expect(page.getByRole("link", { name: "Find a task" })).toHaveAttribute("href", "/tasks");
  await expect(page.locator(".dashboard-grid, .dashboard-metrics")).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Management navigation" })).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("tasktrack.session"))).toBeNull();
  await page.getByRole("link", { name: "View all projects", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/projects$/);
});

test("guest spotlight prefers an in-progress project and falls back safely", async ({ page }) => {
  const mixedProjects = projects.map((project, index) => ({ ...project, status: index === 1 ? 1 : 2 }));
  await mockWorkspace(page, { departments, projects: mixedProjects, tasks });
  await page.goto("/");
  await expect(page.locator(".guest-feature")).toHaveAttribute("href", "/projects/2");
  await expect(page.locator(".guest-feature-footer")).toContainText("3 tasks in this project");
  await page.unroute("**/api/**");
  await mockWorkspace(page, { departments, projects: mixedProjects.map(project => ({ ...project, status: 2 })), tasks });
  await page.reload();
  await expect(page.locator(".guest-feature")).toHaveAttribute("href", "/projects/1");
  await page.unroute("**/api/**");
  await mockWorkspace(page, { departments: [], projects: [], tasks: [] });
  await page.reload();
  await expect(page.locator(".guest-totals strong")).toHaveText(["0", "0", "0"]);
  await expect(page.locator(".guest-feature")).toHaveCount(0);
  await expect(page.locator(".guest-discovery .empty")).toHaveCount(2);
});

test("guest portfolio fits phone, tablet, desktop and landscape with long names", async ({ page }) => {
  await mockWorkspace(page, { departments, projects: projects.map(project => ({ ...project, projectName: "AReallyLongUnbrokenProjectName".repeat(3), description: "A project description that stays readable across screen sizes." })), tasks });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const screenshots = process.env.SCREENSHOT_DIR;
  if (screenshots) mkdirSync(screenshots, { recursive: true });
  for (const [width, height] of [[375, 1000], [768, 1000], [1440, 1000], [667, 375]]) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await expect(page.locator(".guest-projects li")).toHaveCount(3);
    await expect(page.getByRole("link", { name: "Register", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    for (const element of await page.locator(".guest-feature, .guest-projects, .guest-teams").all()) {
      expect(await element.evaluate(el => el.scrollWidth <= el.clientWidth)).toBeTruthy();
    }
  }
  await page.unroute("**/api/**");
  await mockWorkspace(page);
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(page.locator(".guest-feature")).toBeVisible();
    if (screenshots) await page.screenshot({ path: `${screenshots}/guest-portfolio-${width}.png`, fullPage: true });
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator(".guest-teams li a").first().focus();
  await expect(page.locator(".guest-teams li a").first()).toBeFocused();
  await expect(page.locator(".guest-teams li a").first()).toHaveAttribute("href", "/departments/1");
  expect(errors).toEqual([]);
});

test("guest loading and API failure hide statistics and retry recovers", async ({ page }) => {
  await mockWorkspace(page);
  let release!: () => void;
  const waiting = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/projects", async route => { await waiting; await route.fulfill({ status: 503, json: { message: "Unavailable" } }); });
  await page.goto("/");
  await expect(page.getByRole("status", { name: "Loading data" })).toBeVisible();
  await expect(page.locator(".guest-feature, .guest-totals")).toHaveCount(0);
  release();
  await expect(page.locator("main [role=alert]")).toContainText("Unavailable");
  await expect(page.locator(".guest-feature, .guest-totals")).toHaveCount(0);
  await page.unroute("**/api/projects");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.locator(".guest-totals strong")).toHaveText(["3", "3", "7"]);
});
