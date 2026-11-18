import { test, expect } from "@playwright/test";
import { AUTH_STATE } from "../playwright.config";

// One-time, by hand: `npx playwright test --project=setup --headed`.
// Opens the site in a real browser window — click Login and finish the WCA
// sign-in yourself. Once the navbar shows "Logout", the session is saved to
// AUTH_STATE (gitignored) and reused by navbar-auth.spec.ts.
test("log in by hand and save the session", async ({ page }) => {
  test.setTimeout(10 * 60_000);
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Logout", exact: true })).toBeVisible({ timeout: 10 * 60_000 });
  await page.context().storageState({ path: AUTH_STATE });
});
