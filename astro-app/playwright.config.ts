import { defineConfig, devices } from "@playwright/test";

// End-to-end checks that run against a real deploy (defaults to production)
// rather than `astro dev` — the bugs these guard against live in
// src/worker.ts's caching layer, which the dev server doesn't exercise.
//   BASE_URL=http://localhost:3999 npx playwright test   # local wrangler dev
//
// Login can't be automated (WCA OAuth), so `npx playwright test --project=setup
// --headed` opens a real browser once for you to log in by hand, and saves the
// session to e2e/.auth/state.json (gitignored — it holds the auth cookie).
const BASE_URL = process.env.BASE_URL ?? "https://cubingkerala.com";
export const AUTH_STATE = "e2e/.auth/state.json";

const browsers = [
  { name: "chromium", use: devices["Desktop Chrome"] },
  { name: "webkit", use: devices["Desktop Safari"] },
  { name: "firefox", use: devices["Desktop Firefox"] },
];

export default defineConfig({
  testDir: "e2e",
  timeout: 120_000,
  // Production is rate limited per IP — keep it to one browser at a time.
  workers: 1,
  reporter: "list",
  use: { baseURL: BASE_URL, trace: "retain-on-failure" },
  projects: [
    { name: "setup", testMatch: /login\.setup\.ts/, use: devices["Desktop Chrome"] },
    ...browsers.map((b) => ({ ...b, testMatch: /.*\.spec\.ts/ })),
  ],
});
