import { defineConfig, devices } from "@playwright/test";

// Accessibility gate. Builds the static site and serves it with `astro preview`
// (PROD build → the prod-only InstallPrompt + service worker are present), then
// runs the axe/keyboard/reflow suite in e2e/a11y.spec.ts against it.
const PORT = 4321;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run build && npm run preview",
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
