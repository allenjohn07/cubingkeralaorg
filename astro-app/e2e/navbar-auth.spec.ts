import fs from "node:fs";
import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { AUTH_STATE } from "../playwright.config";

// Guards against the navbar showing a logged-out state (Login instead of
// Logout, admin Requests link missing) while actually logged in. Every page's
// navbar is server-rendered from the auth cookie, so this happens whenever a
// browser reuses HTML rendered for a different auth state — see the
// Cache-Control notes in src/worker.ts.
//
// Needs a saved session — run the setup project once first (see
// playwright.config.ts). The admin assertions only run if that session is an
// admin one (Requests link visible on the first logged-in load).

const NAV_PATHS = ["/competitions", "/rankings", "/members", "/learn"];
const PAGES = ["/", ...NAV_PATHS];

test.skip(!fs.existsSync(AUTH_STATE), `no saved session at ${AUTH_STATE} — run the setup project first`);

type AuthCookie = { name: string; value: string; domain: string; path: string; expires: number; httpOnly: boolean; secure: boolean; sameSite: "Strict" | "Lax" | "None" };

function savedAuthCookies(): AuthCookie[] {
  const state = JSON.parse(fs.readFileSync(AUTH_STATE, "utf8")) as { cookies: AuthCookie[] };
  return state.cookies.filter((c) => c.name === "userInfo");
}

// The saved session's cookie, re-scoped to whichever deploy BASE_URL points
// at — the session is captured on production, but the same cookie works
// against a local `wrangler dev` build of the Worker too.
function authCookiesFor(baseURL: string) {
  const { hostname, protocol } = new URL(baseURL);
  return savedAuthCookies().map((c) => ({ ...c, domain: hostname, secure: protocol === "https:" }));
}

async function expectLoggedInNavbar(page: Page, where: string, expectAdmin: boolean) {
  const nav = page.locator("nav").first();
  await expect(page.getByRole("button", { name: "Logout", exact: true }), `Logout button on ${where}`).toBeVisible();
  await expect(page.getByRole("button", { name: "Login", exact: true }), `no Login button on ${where}`).toHaveCount(0);
  if (expectAdmin) {
    await expect(nav.getByRole("link", { name: "Requests" }), `Requests link on ${where}`).toBeVisible();
  }
}

// Soft navigation via a navbar link click (ClientRouter), waiting until the
// swap has finished for that URL.
async function clickNav(page: Page, path: string) {
  await page.locator("nav").first().locator(`a[href="${path}"]`).click();
  await page.waitForURL((url) => url.pathname === path);
  await page.waitForLoadState("load");
}

async function isAdminSession(context: BrowserContext): Promise<boolean> {
  const page = await context.newPage();
  await page.goto(`/?probe=${Date.now()}`);
  const admin = (await page.locator("nav").first().getByRole("link", { name: "Requests" }).count()) > 0;
  await page.close();
  console.log(admin ? "admin session — checking Requests link too" : "non-admin session — Requests link not checked");
  return admin;
}

test("pages visited before login never show the logged-out navbar after login", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  // Browse logged out first — this is what every visitor does before logging in.
  for (const path of PAGES) {
    await page.goto(path);
    await expect(page.getByRole("button", { name: "Login", exact: true })).toBeVisible();
  }

  // Log in. Adding the cookie directly is the "worst case" login: nothing
  // clears the browser cache in between (the same as a browser that ignores
  // Clear-Site-Data from the real OAuth callback).
  await context.addCookies(authCookiesFor(baseURL!));
  const admin = await isAdminSession(context);

  await page.goto(`/?__fresh=${Date.now()}`);
  await expectLoggedInNavbar(page, "/ after login", admin);
  for (const path of NAV_PATHS) {
    await clickNav(page, path);
    await expectLoggedInNavbar(page, `${path} (soft nav)`, admin);
  }
  for (const path of PAGES) {
    await page.goto(path);
    await expectLoggedInNavbar(page, `${path} (full load)`, admin);
  }
  await context.close();
});

test("logged-in navbar stays correct across repeated soft navs, back/forward and reloads", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  await context.addCookies(authCookiesFor(baseURL!));
  const admin = await isAdminSession(context);
  const page = await context.newPage();
  await page.goto("/");
  await expectLoggedInNavbar(page, "/", admin);

  for (let round = 1; round <= 5; round++) {
    for (const path of NAV_PATHS) {
      await clickNav(page, path);
      await expectLoggedInNavbar(page, `${path} (round ${round})`, admin);
    }
  }
  for (let i = 0; i < 3; i++) {
    await page.goBack();
    await page.waitForLoadState("load");
    await expectLoggedInNavbar(page, `${page.url()} (back)`, admin);
  }
  await page.goForward();
  await page.waitForLoadState("load");
  await expectLoggedInNavbar(page, `${page.url()} (forward)`, admin);
  // Let ClientRouter's history swap fully settle first, or Firefox aborts
  // the reload (NS_BINDING_ABORTED) as a competing navigation.
  await page.waitForLoadState("networkidle");
  await page.reload();
  await expectLoggedInNavbar(page, `${page.url()} (reload)`, admin);
  await context.close();
});

test("session cookie lasts longer than a browsing session", async () => {
  const [cookie] = savedAuthCookies();
  expect(cookie, "userInfo cookie in saved session").toBeTruthy();
  const hoursLeft = (cookie.expires * 1000 - Date.now()) / 3_600_000;
  console.log(`userInfo cookie expires in ${hoursLeft.toFixed(1)}h`);
  expect(hoursLeft, "session should last at least a day").toBeGreaterThan(24);
});
