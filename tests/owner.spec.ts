import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const ROUTE = "/quem-e-o-dono/";

test("owner page renders, shows the real certificates and fits every viewport", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(ROUTE);
  await expect(page.getByRole("heading", { level: 1, name: /Quem é o dono/ })).toBeVisible();
  await expect(page.locator("img[alt*='urso desenvolvedor']")).toHaveJSProperty("complete", true);

  // Honest data: exactly the certificates listed in the README, credentials as text.
  await expect(page.locator("[class*='certCard']")).toHaveCount(11);
  await expect(page.getByText("e845f382-4542-4d5a-a58d-66262cfe404b")).toBeVisible();
  await expect(page.getByText(/13 certificados; 11 estavam no texto/)).toBeVisible();
  await expect(page.getByText(/número citado no README/)).toBeVisible();

  // No dead in-page anchors.
  const missing = await page.locator('a[href^="#"]').evaluateAll((links) => links.map((l) => l.getAttribute("href")!).filter((href) => href.length > 1 && !document.querySelector(href)));
  expect(missing).toEqual([]);

  for (const width of [1920, 1440, 1280, 1024, 768, 390, 360]) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (width === 1440) await page.screenshot({ path: testInfo.outputPath("owner-hero-1440.png") });
    if (width === 390) await page.screenshot({ path: testInfo.outputPath("owner-full-390.png"), fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({ path: testInfo.outputPath("owner-full-1440.png"), fullPage: true });
  expect(errors).toEqual([]);
});

test("owner page links to the real channels and the other two pages", async ({ page }) => {
  await page.goto(ROUTE);
  await expect(page.locator('a[href="https://github.com/nuwget"]').first()).toBeVisible();
  await expect(page.locator('a[href^="https://www.linkedin.com/in/"]').first()).toBeVisible();
  await expect(page.locator('a[href^="https://wa.me/5513996043320"]').first()).toBeVisible();
  // Real education repos, not placeholders.
  await expect(page.locator('a[href="https://github.com/Verroxo/GradeDSMFATEC"]')).toBeVisible();
  // Cross-page connections.
  await expect(page.locator('a[href="/"], a[href="/"]').first()).toBeVisible();
  await expect(page.locator('a[href*="convite-para-criar-sistema"]').first()).toBeVisible();
  await page.getByRole("link", { name: "Convite", exact: true }).first().click();
  await expect(page).toHaveURL(/\/convite-para-criar-sistema\/?$/);
});

test("owner page never points to an unconfirmed personal site", async ({ page }) => {
  await page.goto(ROUTE);
  await expect(page.locator('a[href*="nuwget.com"]')).toHaveCount(0);
  await expect(page.getByText(/site pessoal citado no perfil ainda não está no ar/)).toBeVisible();
});

test("owner page passes accessibility scan", async ({ page }) => {
  await page.goto(ROUTE);
  await page.waitForLoadState("networkidle");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations).toEqual([]);
});

test("route transition is present normally and removed under reduced motion", async ({ page }) => {
  await page.goto(ROUTE);
  await expect(page.locator("[data-route-transition]")).toBeAttached();
  await expect(page.locator("[data-route-transition]")).toHaveCSS("pointer-events", "none");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("[data-route-transition]")).toBeHidden();
});
