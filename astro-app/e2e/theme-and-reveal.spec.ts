import { test, expect, type Locator, type Page } from "@playwright/test";

// No login needed. Runs against BASE_URL like the other specs.

// Samples an element's colors on every animation frame right after the
// theme toggle is clicked. A seamless switch means the very first frame
// already shows the final colors — any in-between value is the flicker
// (a `transition-colors` element fading while the page around it snaps).
async function colorFramesAfterToggle(page: Page, selector: string) {
  return page.evaluate(async (sel) => {
    const el = document.querySelector(sel);
    const toggle = document.querySelector<HTMLButtonElement>('button[aria-label^="Switch to"]');
    if (!el || !toggle) throw new Error(`missing ${!el ? sel : "theme toggle"}`);
    const read = () => {
      const s = getComputedStyle(el);
      return `${s.color} | ${s.backgroundColor} | ${s.borderTopColor}`;
    };
    toggle.click();
    const frames: string[] = [];
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => requestAnimationFrame(r));
      frames.push(read());
    }
    return frames;
  }, selector);
}

for (const { path, selector, name } of [
  { path: "/members", selector: 'input[type="search"]', name: "members search box" },
  { path: "/competitions", selector: 'input[type="search"]', name: "competitions search box" },
  { path: "/rankings", selector: "main button[aria-haspopup]", name: "rankings event selector" },
]) {
  test(`theme switch is instant for the ${name}`, async ({ page }) => {
    await page.goto(path);
    await page.locator(selector).first().waitFor();
    // Twice: dark → light and light → dark.
    for (let i = 0; i < 2; i++) {
      const frames = await colorFramesAfterToggle(page, selector);
      expect(new Set(frames).size, `colors changed between frames:\n${frames.join("\n")}`).toBe(1);
    }
  });
}

// Real wheel scrolling, in steps, like a person would.
async function wheelTo(page: Page, edge: "top" | "bottom") {
  for (let i = 0; i < 80; i++) {
    const done = await page.evaluate(
      (e) => (e === "top" ? window.scrollY <= 0 : window.scrollY + innerHeight >= document.documentElement.scrollHeight - 2),
      edge,
    );
    if (done) break;
    await page.mouse.wheel(0, edge === "top" ? -300 : 300);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(300);
}

// Wheel up until the element has come fully into view from above.
async function wheelUntilInView(page: Page, el: Locator) {
  for (let i = 0; i < 80; i++) {
    const box = await el.boundingBox();
    if (box && box.y >= 0) break;
    await page.mouse.wheel(0, -200);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(300);
}

async function revealSections(page: Page) {
  await page.goto("/");
  await page.mouse.move(400, 300);
  const sections = page.locator("main [data-reveal]");
  const count = await sections.count();
  expect(count, "landing page has reveal sections").toBeGreaterThan(2);
  return { first: sections.first(), last: sections.nth(count - 1) };
}

test("sections rise in scrolling down and settle down from above scrolling back up", async ({ page }) => {
  const { first, last } = await revealSections(page);

  await wheelTo(page, "bottom");
  await expect(last).toHaveAttribute("data-revealed", "");
  await expect(last).toHaveAttribute("data-reveal-from", "bottom");
  // The first section has left by the top edge: re-armed to come from above,
  // and only once it's fully off-screen.
  await expect(first).not.toHaveAttribute("data-revealed", "");
  await expect(first).toHaveAttribute("data-reveal-from", "top");
  const box = await first.boundingBox();
  expect(box!.y + box!.height, "re-armed only once fully above the viewport").toBeLessThanOrEqual(0);

  await wheelUntilInView(page, first);
  await expect(first).toHaveAttribute("data-revealed", "");
  await expect(first).toHaveAttribute("data-reveal-from", "top");
  await expect(first).toHaveCSS("opacity", "1");
  // And the last one, now below, is re-armed to rise again.
  await expect(last).not.toHaveAttribute("data-revealed", "");
  await expect(last).toHaveAttribute("data-reveal-from", "bottom");
});

test("a section jumped past still comes down from above when scrolled back to", async ({ page }) => {
  const { first } = await revealSections(page);
  // Jump straight to the end (End key / scrollbar drag) — `first` may never
  // have been seen crossing an edge on the way.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(300);
  await wheelUntilInView(page, first);
  await expect(first).toHaveAttribute("data-revealed", "");
  await expect(first).toHaveAttribute("data-reveal-from", "top");
  await expect(first).toHaveCSS("opacity", "1");
});
