import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import type { Department, Project, Tag, Task } from "../lib/types";

const tags: Tag[] = [{ tagId: 1, tagName: "backend", color: "#10b981" }, { tagId: 2, tagName: "design", color: "#ec4899" }];
const departments: Department[] = ["Design", "Engineering", "Operations"].map((departmentName, index) => ({
  departmentId: index + 1, departmentName, departmentDescription: "A shared team delivering focused work.",
  isActive: true, projects: [],
}));
const projects: Project[] = ["Design System", "Internal Dashboard", "Cloud Migration"].map((projectName, index) => ({
  projectId: index + 1, projectName, status: index, startDate: "2026-10-01", createdDate: "2026-10-01T00:00:00Z",
  description: index === 1 ? "A longer project description that should wrap onto several lines while preserving alignment with adjacent cards." : "A focused project for the team.",
  departmentId: index + 1, departmentName: departments[index].departmentName, isActive: true, tasks: [],
}));
const tasks: Task[] = ["Build shared components", "Implement an accessible navigation menu across the workspace", "Prepare deployment"].map((title, index) => ({
  taskId: index + 1, title, status: index, priority: index, dueDate: index === 2 ? null : "2026-10-20",
  description: index === 1 ? "Build navigation that works across screen sizes, respects keyboard focus, and keeps every destination easy to reach." : "A short description.",
  projectId: index + 1, projectName: projects[index].projectName, departmentName: departments[index].departmentName,
  isActive: true, createdDate: "2026-10-01T00:00:00Z", tags: index === 1 ? [] : tags,
}));

async function mockWorkspace(page: Page, data = { departments, projects, tasks, tags }) {
  await page.route("**/api/**", route => {
    const url = new URL(route.request().url());
    const [section, id] = url.pathname.split("/api/")[1].split("/");
    if (section === "tasks" && id === "search") {
      const query = url.searchParams;
      return route.fulfill({ json: data.tasks.filter(task =>
        task.title.toLowerCase().includes((query.get("title") ?? "").toLowerCase()) &&
        (!query.get("priority") || String(task.priority) === query.get("priority")) &&
        (!query.get("status") || String(task.status) === query.get("status")) &&
        (!query.get("projectId") || String(task.projectId) === query.get("projectId")) &&
        (!query.get("tagId") || task.tags.some(tag => String(tag.tagId) === query.get("tagId")))) });
    }
    if (section === "departments" && id === "search") return route.fulfill({ json: data.departments.filter(department => department.departmentName.toLowerCase().includes((url.searchParams.get("name") ?? "").toLowerCase())) });
    if (section === "projects" && id === "search") return route.fulfill({ json: data.projects.filter(project =>
      project.projectName.toLowerCase().includes((url.searchParams.get("name") ?? "").toLowerCase()) &&
      (!url.searchParams.get("status") || String(project.status) === url.searchParams.get("status")) &&
      (!url.searchParams.get("departmentId") || String(project.departmentId) === url.searchParams.get("departmentId"))) });
    if (section === "tasks" && id) return route.fulfill({ json: data.tasks.find(task => String(task.taskId) === id) });
    return route.fulfill({ json: data[section as keyof typeof data] ?? [] });
  });
}

test("directory cards stay aligned and all five pages fit desktop, tablet and mobile", async ({ page }) => {
  await mockWorkspace(page);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const screenshots = process.env.SCREENSHOT_DIR;
  if (screenshots) mkdirSync(screenshots, { recursive: true });
  for (const [width, height] of [[1440, 1000], [768, 1000], [375, 1000], [667, 375]]) {
    await page.setViewportSize({ width, height });
    for (const path of ["departments", "projects", "tasks", "tags", "search"]) {
      await page.goto("/" + path);
      await expect(page.locator(".directory-heading")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
      const cards = page.locator(path === "tags" ? ".tag-directory .tag" : ".directory-card");
      await expect(cards).toHaveCount(path === "tags" ? tags.length : 3);
      for (const card of await cards.all()) expect(await card.evaluate(el => el.scrollWidth <= el.clientWidth)).toBeTruthy();
      if (width === 1440 && path !== "tags") {
        for (const selector of ["h3", ":scope > p", ".card-meta"]) {
          const positions = await cards.evaluateAll((elements, selector) => elements.map(el => el.querySelector(selector)!.getBoundingClientRect().y), selector);
          expect(Math.max(...positions) - Math.min(...positions)).toBeLessThanOrEqual(1);
        }
      }
      if (screenshots && width !== 667) await page.screenshot({ path: `${screenshots}/${path}-${width}.png`, fullPage: true });
    }
  }
  expect(errors).toEqual([]);
});

test("Tasks and Search use identical cards and retain filters and keyboard detail navigation", async ({ page }) => {
  await mockWorkspace(page);
  await page.goto("/tasks");
  await expect(page.locator(".task-card")).toHaveCount(3);
  const taskCard = await page.locator(".task-card").first().innerHTML();
  await expect(page.locator(".task-card").last()).toContainText("No due date");
  await page.getByRole("link", { name: "Search tasks", exact: true }).click();
  await expect(page.locator(".task-card")).toHaveCount(3);
  expect(await page.locator(".task-card").first().innerHTML()).toBe(taskCard);
  await page.getByLabel("Title", { exact: true }).fill("Build shared");
  await page.getByLabel("Priority", { exact: true }).selectOption("0");
  await expect(page.locator(".task-card")).toHaveCount(1);
  await expect(page.locator(".directory-heading")).toContainText("1 shown");
  await expect(page.locator(".task-card")).toContainText("Low");
  await page.locator(".task-card").focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/tasks\/1$/);
  await expect(page.locator("main h1")).toHaveText(tasks[0].title);
});

test("department and project search still submit filters and explain empty results", async ({ page }) => {
  await mockWorkspace(page);
  await page.goto("/departments");
  await page.getByLabel("Department name").fill("Engineering");
  await page.keyboard.press("Enter");
  await expect(page.locator(".directory-card")).toHaveCount(1);
  await expect(page.locator(".directory-card h3")).toHaveText("Engineering");
  await page.getByLabel("Department name").fill("Nothing matches");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByText("No departments match this name.")).toBeVisible();
  await expect(page.locator(".directory-heading")).toContainText("0 shown");
  await page.goto("/projects");
  await page.getByLabel("Status", { exact: true }).selectOption("1");
  await page.getByLabel("Department", { exact: true }).selectOption("2");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.locator(".directory-card")).toHaveCount(1);
  await expect(page.locator(".directory-card h3")).toHaveText("Internal Dashboard");
});

test("long content wraps without truncation and search controls remain usable after an API error", async ({ page }) => {
  await mockWorkspace(page, { departments, projects, tasks: tasks.map(task => ({ ...task, title: "Task".repeat(60), projectName: "Project".repeat(40), tags: [{ ...tags[0], tagName: "Label".repeat(30) }] })), tags });
  await page.setViewportSize({ width: 375, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/tasks");
  await expect(page.locator(".task-card")).toHaveCount(3);
  for (const card of await page.locator(".task-card").all()) expect(await card.evaluate(el => el.scrollWidth <= el.clientWidth)).toBeTruthy();
  await expect(page.locator(".task-card h3").first()).toHaveText("Task".repeat(60));
  await page.route("**/api/tasks/search?**", route => route.fulfill({ status: 503, json: { message: "Search unavailable" } }));
  await page.goto("/search");
  await expect(page.locator("main").getByRole("alert")).toContainText("Search unavailable");
  await expect(page.getByLabel("Title", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Priority", { exact: true })).toBeVisible();
  await page.unroute("**/api/tasks/search?**");
  await page.getByLabel("Title", { exact: true }).fill("Task");
  await expect(page.locator(".task-card")).toHaveCount(3);
  await expect(page.locator("main").getByRole("alert")).toHaveCount(0);
});
