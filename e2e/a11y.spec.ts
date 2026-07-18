// Accessibility gate — Playwright + @axe-core/playwright.
// WCAG 2.2 AA. Findings may only go down.

import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Every key route. The site is a static content site: home, category index,
// a representative category (joke feed + prose + FAQ), the info pages, and 404.
const PAGES: string[] = [
  "/",
  "/categories",
  "/jokes/fat-yo-mama-jokes",
  "/about",
  "/contact",
  "/privacy-policy",
  "/terms",
  "/404",
];

// Interactive states that meaningfully change the DOM. axe only sees what is
// rendered when it runs.
type StateCase = { name: string; path: string; setup: (page: Page) => Promise<void> };
const STATES: StateCase[] = [
  {
    name: "FAQ answer expanded",
    path: "/",
    setup: async (p) => {
      await p.locator("details.site-faq__item summary").first().click();
    },
  },
  {
    name: "PWA install bar visible",
    path: "/",
    setup: async (p) => {
      // The install bar is prod-only and starts `hidden`; reveal it so axe can
      // scan the dialog markup (name, controls) as a user would see it.
      await p.evaluate(() => {
        const bar = document.getElementById("pwa-install");
        if (bar) bar.hidden = false;
        const action = document.getElementById("pwa-install-action");
        if (action) (action as HTMLElement).hidden = false;
      });
    },
  },
];

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"];

const scan = (page: Page) => new AxeBuilder({ page }).withTags(TAGS).analyze();
const pretty = (v: unknown) => JSON.stringify(v, null, 2);

// ---- 1. Static scans: zero violations per route --------------------------
for (const path of PAGES) {
  test(`axe clean: ${path}`, async ({ page }) => {
    await page.goto(path);
    const { violations } = await scan(page);
    expect(violations, pretty(violations)).toEqual([]);
  });
}

// ---- 2. Stateful scans: zero violations with widgets open ----------------
for (const s of STATES) {
  test(`axe clean (state): ${s.name}`, async ({ page }) => {
    await page.goto(s.path);
    await s.setup(page);
    const { violations } = await scan(page);
    expect(violations, pretty(violations)).toEqual([]);
  });
}

// ---- 3. Keyboard: skip link is the first Tab stop and moves focus (2.4.1) -
test("keyboard: skip link is first Tab stop and focuses main", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const first = page.locator(":focus");
  await expect(first, "first Tab stop should be the skip link").toHaveAttribute(
    "href",
    /#(main|content|main-content)/,
  );
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

// ---- 4. Keyboard: share/copy controls are reachable with visible focus ---
test("keyboard: joke-card share controls are focusable", async ({ page }) => {
  await page.goto("/");
  const fb = page.getByRole("link", { name: /share on facebook/i }).first();
  await fb.focus();
  await expect(fb).toBeFocused();
  const outline = await fb.evaluate(
    (el) => getComputedStyle(el).outlineStyle,
  );
  // focus-visible outline is applied on real keyboard focus; assert it is not
  // forced to `none` (the previous `focus:outline-none` regression).
  expect(outline).not.toBe("none");
});

// ---- 5. Reflow: no horizontal page scroll at 320 CSS px (1.4.10) ---------
for (const path of PAGES) {
  test(`reflow 320px, no horizontal scroll: ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(path);
    const overflows = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1,
    );
    expect(overflows, "page requires horizontal scrolling at 320px").toBe(false);
  });
}

// ---- 6. Reduced motion is honored (2.3.3 / §7) ---------------------------
test("reduced motion: no long-running animations when reduce is set", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const longAnimations = await page.evaluate(
    () =>
      document.getAnimations().filter((a) => {
        const t = a.effect?.getTiming();
        return t && (t.iterations === Infinity || Number(t.duration) > 500);
      }).length,
  );
  expect(longAnimations, "animations still running under prefers-reduced-motion").toBe(0);
});
