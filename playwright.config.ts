import { defineConfig } from "@playwright/test";

const baseURL = process.env.TEST_FRONTEND_URL ?? "http://127.0.0.1:3012";
if (!["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname)) throw new Error("Use an isolated local test frontend.");

export default defineConfig({
  testDir: "./tests",
  workers: 1,
  use: {
    baseURL,
    viewport: { width: 1440, height: 1000 },
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
