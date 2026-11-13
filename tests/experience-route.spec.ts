import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";

test.beforeEach(async ({ page }) => {
  // The Vista boot screen belongs to the homepage only; /experience must open directly.
  await page.addInitScript(() => {
    window.sessionStorage.setItem("vistanology:skip-boot:v1", "1");
  });
});

test("experience route opens with its own identity and honest demo spaces", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/experience/");
  await expect(page).toHaveTitle(/Vistanology Experience/);
  await expect(page.getByRole("heading", { level: 1, name: /Ideias que merecem ser/ })).toBeVisible();
  await expect(page.locator(".world-eyebrow")).toContainText("VISTANOLOGY EXPERIENCE");

  // Every demo space declares itself as under development; no fake functionality.
  await expect(page.locator('[class*="demoStatus"]')).toHaveCount(3);
  await expect(page.getByText("Em desenvolvimento")).toHaveCount(6); // 3 demos + 3 universos conceituais
  await expect(page.getByText("Prévia de interface · dados fictícios", { exact: false })).toBeVisible();
  const demoButtons = page.locator("#experimente button");
  await expect(demoButtons).toHaveCount(0);

  const missing = await page.locator('main a[href^="#"]').evaluateAll((links) =>
    links.map((link) => link.getAttribute("href")!).filter((href) => !document.querySelector(href)),
  );
  expect(missing).toEqual([]);

  await page.locator('a[href*="convite-para-criar-sistema"]').first().click();
  await expect(page).toHaveURL(/\/convite-para-criar-sistema\/?$/);
  expect(errors).toEqual([]);
});

test("in-page navigation tracks the active section and reaches every destination", async ({ page }) => {
  await page.goto("/experience/");
  const nav = page.getByRole("navigation", { name: "Seções do Experience" });
  await expect(nav.getByRole("link", { name: /01 Explore/ })).toBeVisible();
  await page.locator("#experimente").scrollIntoViewIfNeeded();
  await expect(nav.getByRole("link", { name: /02 Experimente/ })).toHaveAttribute("aria-current", "location");
  await nav.getByRole("link", { name: /04 Construa/ }).click();
  await expect(page).toHaveURL(/#construa$/);
  await expect(page.getByRole("heading", { name: /E se construíssemos/ })).toBeInViewport();
  await page.getByRole("link", { name: "Começar um projeto" }).click();
  await expect(page).toHaveURL(/\/convite-para-criar-sistema\/?$/);
});

test("responsive sweep keeps the experience overflow-free", async ({ page }, testInfo) => {
  await page.goto("/experience/");
  for (const width of [1920, 1440, 1280, 1024, 768, 390, 360]) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(page.getByRole("heading", { level: 1, name: /Ideias que merecem ser/ })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`experience-${width}.png`), fullPage: width === 1440 || width === 390 });
  }
});

test("reduced motion and the motion toggle freeze the experience", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/experience/");
  await expect(page.locator(".vistanology")).toHaveAttribute("data-motion", "off");
  await expect.poll(() => page.locator('[class*="mockBar"]').first().evaluate((el) => getComputedStyle(el).transform)).toBe("none");
  await page.locator('[class*="risingBubble"]').first().evaluate((el) => getComputedStyle(el).animationName).then((name) => expect(name).toBe("none"));
  await page.locator('[class*="auroraCyan"]').evaluate((el) => getComputedStyle(el).animationName).then((name) => expect(name).toBe("none"));

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(page.locator(".vistanology")).toHaveAttribute("data-motion", "on");
  await page.getByRole("button", { name: "Pausar animações" }).click();
  await expect(page.locator(".vistanology")).toHaveAttribute("data-motion", "off");
  await expect.poll(() => page.locator('[class*="mockBar"]').first().evaluate((el) => getComputedStyle(el).transform)).toBe("none");
});

test("accessibility scan of the experience page", async ({ page }, testInfo) => {
  await page.goto("/experience/");
  await page.getByRole("button", { name: "Pausar animações" }).click();
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  await fs.writeFile(testInfo.outputPath("experience-axe.json"), JSON.stringify(results, null, 2));
  expect(results.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) }))).toEqual([]);
});
