import { test, expect } from "@playwright/test";

test("logged-out join button reads 'Join Cubing Kerala' and explains login in a toast", async ({ page }) => {
  await page.goto("/members");
  const button = page.getByRole("button", { name: "Join Cubing Kerala", exact: true });
  await expect(button).toBeVisible();
  await expect(page.getByRole("button", { name: "Login to join" })).toHaveCount(0);
  await button.click();
  await expect(page.getByText("Login to join", { exact: true })).toBeVisible();
});
