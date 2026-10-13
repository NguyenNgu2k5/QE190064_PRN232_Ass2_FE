import { test, expect, type Page } from "@playwright/test";
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

test("AS1 public directories fit mobile, tablet and desktop", async ({ page }) => {
  await mockWorkspace(page);
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of ["departments", "projects", "tasks", "tags", "search"]) {
      await page.goto("/" + path);
      await expect(page.locator("main h1")).toBeVisible();
      await expect(page.locator("main .card, main .tag").first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    }
  }
});

test("task filters retain low priority and keyboard detail navigation", async ({ page }) => {
  await mockWorkspace(page);
  await page.goto("/search");
  await expect(page.locator(".card")).toHaveCount(3);
  await page.getByLabel("Title", { exact: true }).fill("Build shared");
  await page.getByLabel("Priority", { exact: true }).selectOption("0");
  await expect(page.locator(".card")).toHaveCount(1);
  await expect(page.locator(".card")).toContainText("Low");
  await page.locator(".card").focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/tasks\/1$/);
  await expect(page.locator("main h1")).toHaveText(tasks[0].title);
});

test("AS1 department and project searches submit filters and explain empty results", async ({ page }) => {
  await mockWorkspace(page);
  await page.goto("/departments");
  await page.getByLabel("Department name").fill("Engineering");
  await page.keyboard.press("Enter");
  await expect(page.locator(".card")).toHaveCount(1);
  await expect(page.locator(".card h3")).toHaveText("Engineering");
  await page.getByLabel("Department name").fill("Nothing matches");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("No departments match");
  await page.goto("/projects");
  await page.getByLabel("Project name").fill("Internal");
  await page.getByLabel("Status", { exact: true }).selectOption("1");
  await page.getByLabel("Department", { exact: true }).selectOption("2");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.locator(".card h3")).toHaveText("Internal Dashboard");
});
