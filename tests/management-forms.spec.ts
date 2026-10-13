import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

const account = { accountId: 1, fullName: "Alex Nguyen", email: "alex@example.com", role: 1, createdDate: "2026-10-01T00:00:00Z" };
const fixtures = {
  departments: [{ departmentId: 1, departmentName: "Engineering", departmentDescription: "Build and maintain our products.", projects: [], isActive: true }],
  projects: [{ projectId: 1, projectName: "Website redesign", description: "Refresh the customer experience.", departmentId: 1, departmentName: "Engineering", startDate: "2026-10-01", endDate: null, status: 1, tasks: [], isActive: true }],
  tasks: [{ taskId: 1, title: "Review homepage", description: "Review the new homepage design.", projectId: 1, projectName: "Website redesign", status: 1, priority: 2, dueDate: null, tags: [{ tagId: 1, tagName: "Frontend", color: "#3B82F6" }], isActive: true }],
  tags: [{ tagId: 1, tagName: "Frontend", color: "#3B82F6" }, { tagId: 2, tagName: "Review", color: "#157A53" }],
  accounts: [account],
};

async function mockWorkspace(page: Page) {
  await page.addInitScript(account => {
    localStorage.setItem("tasktrack.session", JSON.stringify({ token: "form-test", expiresAt: new Date(Date.now() + 86400000).toISOString(), account }));
  }, account);
  const writes: { method: string; body: Record<string, unknown> }[] = [];
  let rejectSave = true;
  await page.route("**/api/**", route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() !== "GET") {
      writes.push({ method: request.method(), body: request.postDataJSON() });
      return rejectSave ? route.fulfill({ status: 503, json: { message: "Could not save. Please try again." } }) : route.fulfill({ status: 204 });
    }
    if (path.endsWith("/auth/me")) return route.fulfill({ json: account });
    return route.fulfill({ json: fixtures[path.split("/").pop() as keyof typeof fixtures] ?? [] });
  });
  return { writes, allowSave: () => { rejectSave = false; } };
}

async function checkLayout(page: Page, kind: string) {
  const dialog = page.getByRole("dialog");
  for (const [width, height] of [[1440, 1000], [375, 1000], [667, 375], [320, 640]]) {
    await page.setViewportSize({ width, height });
    expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBeTruthy();
    const bounds = (await dialog.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(height);
    const actions = dialog.locator(".form-actions");
    await actions.scrollIntoViewIfNeeded();
    const buttons = await actions.getByRole("button").all();
    const cancel = (await buttons[0].boundingBox())!;
    const submit = (await buttons[1].boundingBox())!;
    expect(cancel.height).toBeGreaterThanOrEqual(44);
    expect(submit.y).toBe(cancel.y);
    expect(submit.x).toBeGreaterThanOrEqual(cancel.x + cancel.width);
    for (const control of await dialog.locator(".field input:not([type=checkbox]), .field select, .field textarea").all()) {
      if (await control.isDisabled()) continue;
      await control.focus();
      const field = (await control.boundingBox())!;
      const header = (await dialog.locator(".modal-header").boundingBox())!;
      const footer = (await actions.boundingBox())!;
      expect(field.y).toBeGreaterThanOrEqual(Math.max(bounds.y, header.y + header.height));
      expect(field.y + field.height).toBeLessThanOrEqual(Math.min(bounds.y + bounds.height, footer.y));
    }
    const directory = process.env.SCREENSHOT_DIR;
    if (directory && [1440, 375].includes(width)) {
      mkdirSync(directory, { recursive: true });
      await dialog.evaluate(el => { el.scrollTop = 0; });
      await page.screenshot({ path: `${directory}/form-${kind}-${width}.png` });
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
}

for (const kind of ["departments", "projects", "tasks", "tags"] as const) {
  test(`${kind} form fits all screens, preserves failed input and keeps create/edit working`, async ({ page }) => {
    const mock = await mockWorkspace(page);
    await page.goto(`/admin/${kind}`);
    const opener = page.getByRole("button", { name: `+ New ${kind.slice(0, -1)}`, exact: true });
    await opener.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toHaveAccessibleDescription(/\S/);
    await checkLayout(page, kind);
    await dialog.getByRole("button", { name: "Create", exact: true }).click();
    expect(mock.writes).toHaveLength(0);
    const name = dialog.getByRole("textbox", { name: kind === "tasks" ? "Title" : "Name", exact: true });
    await name.fill("Form QA");
    if (kind === "departments") await dialog.getByLabel(/^Description(?: \*)?$/).fill("Team responsibilities");
    if (kind === "projects") {
      await dialog.getByLabel(/^Department(?: \*)?$/).selectOption("1");
      await dialog.getByLabel(/^Start date(?: \*)?$/).fill("2026-10-13");
      await expect(dialog.getByLabel("End date", { exact: true })).toHaveAttribute("min", "2026-10-13");
    }
    if (kind === "tasks") {
      await dialog.getByLabel(/^Project(?: \*)?$/).selectOption("1");
      await dialog.getByLabel("Frontend", { exact: true }).check();
    }
    if (kind === "tags") await dialog.getByLabel("Color", { exact: true }).fill("#157a53");
    await dialog.getByRole("button", { name: "Create", exact: true }).click();
    await expect(dialog.getByRole("alert")).toContainText("Could not save");
    await expect(name).toHaveValue("Form QA");
    mock.allowSave();
    await dialog.getByRole("button", { name: "Create", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    expect(mock.writes).toHaveLength(2);
    expect(mock.writes[1]).toEqual(mock.writes[0]);
    if (kind === "tasks") expect(mock.writes[1].body.tagIds).toEqual([1]);
    if (kind === "tags") expect(mock.writes[1].body.color).toBe("#157a53");
    await page.getByRole("button", { name: "Edit", exact: true }).first().click();
    await expect(name).not.toHaveValue("");
    if (kind === "tasks") await expect(dialog.getByLabel("Frontend", { exact: true })).toBeChecked();
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    expect(mock.writes).toHaveLength(2);
    await opener.click();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
  });
}

test("account form keeps role guidance linked, fits small screens and preserves failed edits", async ({ page }) => {
  const mock = await mockWorkspace(page);
  await page.goto("/admin/accounts");
  const opener = page.getByRole("button", { name: "Edit", exact: true });
  await opener.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toHaveAccessibleDescription(/alex@example.com/);
  const role = dialog.getByLabel("Role", { exact: true });
  await expect(role).toHaveAccessibleDescription("You cannot change your own role.");
  await expect(role).toBeDisabled();
  await checkLayout(page, "accounts");
  await dialog.getByLabel(/^Full name(?: \*)?$/).fill("Updated name");
  await dialog.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("Could not save");
  await expect(dialog.getByLabel(/^Full name(?: \*)?$/)).toHaveValue("Updated name");
  expect(mock.writes[0]).toEqual({ method: "PUT", body: { fullName: "Updated name" } });
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
});
