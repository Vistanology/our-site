import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const ROUTE = "/convite-para-criar-sistema/";

async function fillInvitation(page: Page) {
  await page.getByLabel("Nome completo *").fill("Pessoa de Teste");
  await page.getByLabel("E-mail ou WhatsApp *").fill("teste@example.com");
  await page.getByLabel("O que você quer criar? *").selectOption("Sistema");
  await page.getByLabel("Conte sua ideia *").fill("Quero um sistema para organizar os pedidos da minha loja e conversar com clientes.");
  await page.getByRole("checkbox", { name: /Estou ciente de que o arquivo/ }).check();
}

test("invitation universe renders and fits every viewport", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(ROUTE);
  await expect(page.getByRole("heading", { level: 1, name: /Você foi convidado/ })).toBeVisible();
  await expect(page.locator("img[alt^='Símbolo holográfico']")).toHaveJSProperty("complete", true);
  const missing = await page.locator('a[href^="#"]').evaluateAll((links) => links.map((link) => link.getAttribute("href")!).filter((href) => !document.querySelector(href)));
  expect(missing).toEqual([]);
  for (const width of [1920, 1440, 1280, 1024, 768, 390, 360]) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (width === 1440) await page.screenshot({ path: testInfo.outputPath("invitation-hero-1440.png") });
    if (width === 390) await page.screenshot({ path: testInfo.outputPath("invitation-full-390.png"), fullPage: true });
    if (width === 360) await page.screenshot({ path: testInfo.outputPath("invitation-hero-360.png") });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({ path: testInfo.outputPath("invitation-full-1440.png"), fullPage: true });
  expect(errors).toEqual([]);
});

test("invitation uses the unified navbar and the price dialog works", async ({ page }, testInfo) => {
  await page.goto(ROUTE);
  const nav = page.getByRole("navigation", { name: "Navegação principal" });
  await expect(nav.getByRole("link", { name: "Início", exact: true })).toHaveAttribute("href", "/");
  await expect(nav.getByRole("link", { name: "Convite", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Dono", exact: true })).toHaveAttribute("href", /quem-e-o-dono/);
  await page.getByRole("link", { name: "Aceitar convite", exact: true }).first().click();
  await expect(page).toHaveURL(/#contato$/);
  await expect(page.getByRole("heading", { name: "Seu convite começa aqui." })).toBeInViewport();
  await page.getByRole("button", { name: /Vamos dialogar sobre o preço/ }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Vamos dialogar sobre o preço." })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("invitation-price-dialog.png") });
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: /Vamos dialogar sobre o preço/ }).click();
  await dialog.getByRole("button", { name: "Entendi" }).click();
  await expect(dialog).not.toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.getByRole("button", { name: "Abrir menu" }).click();
  const mobileNav = page.locator("#mobile-navigation");
  await expect(mobileNav).toBeVisible();
  await expect(mobileNav.getByRole("link", { name: "Dono", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Fechar menu" }).click();
  await expect(mobileNav).not.toBeVisible();
});

test("invitation form validates and never fakes a receipt", async ({ page }, testInfo) => {
  await page.goto(ROUTE);
  const form = page.locator("form");
  await form.scrollIntoViewIfNeeded();
  await expect(form.getByText("Recebimento online ainda não configurado.")).toBeVisible();
  await form.getByRole("button", { name: "Baixar meu convite", exact: true }).click();
  await expect(form.getByRole("alert").filter({ hasText: "Informe seu nome" })).toBeVisible();
  await expect(form.getByLabel("Nome completo *")).toBeFocused();
  await expect(form.getByText(/Recebimento confirmado/)).not.toBeVisible();
  await fillInvitation(page);
  await page.getByLabel("E-mail ou WhatsApp *").fill("nao-e-um-contato");
  await form.getByRole("button", { name: "Baixar meu convite", exact: true }).click();
  await expect(form.getByRole("alert").filter({ hasText: "Informe um e-mail válido" })).toBeVisible();
  await page.getByLabel("E-mail ou WhatsApp *").fill("teste@example.com");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    form.getByRole("button", { name: "Baixar meu convite", exact: true }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("meu-convite.json");
  await expect(form.getByRole("status")).toContainText("Esta ação não enviou seu convite");
  await expect(form.getByText(/Recebimento confirmado/)).not.toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("invitation-form-feedback.png") });
});

test("invitation contact console is alive, connected and honest", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(ROUTE);
  await page.evaluate(() => {
    const section = document.querySelector("#contato") as HTMLElement;
    window.scrollTo({ top: section.offsetTop - 60, behavior: "instant" });
  });
  await page.waitForTimeout(950);
  const form = page.locator("form");
  await expect(form).toHaveAttribute("data-mode", "local");
  await expect(form.getByText("Canal de convite")).toBeVisible();
  await expect(form.locator("[class*='chip']")).toHaveText("Rascunho local");
  await expect(page.locator("svg[class*='connectionBeam']")).toBeVisible();
  await expect(page.getByText("Você conta a ideia")).toBeVisible();
  await expect(page.getByText("Direção juntos")).toBeVisible();

  const headBox = await page.getByRole("heading", { name: "Seu convite começa aqui." }).boundingBox();
  const formBox = await form.boundingBox();
  expect(headBox).not.toBeNull();
  expect(formBox).not.toBeNull();
  expect(formBox!.y).toBeGreaterThan(headBox!.y + headBox!.height);
  expect(Math.abs(formBox!.x + formBox!.width / 2 - 720)).toBeLessThan(24);
  await page.screenshot({ path: testInfo.outputPath("invitation-contact-head-1440.png") });

  await page.evaluate(() => {
    const frame = document.querySelector("div[class*='consoleFrame']") as HTMLElement;
    window.scrollTo({ top: frame.getBoundingClientRect().top + window.scrollY - 92, behavior: "instant" });
  });
  await page.waitForTimeout(700);
  const frame = page.locator("div[class*='consoleFrame']");
  const sheen = page.locator("div[class*='consoleSheen']");
  const before = await sheen.getAttribute("style");
  const box = await frame.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + 60, box!.y + 60);
  await page.waitForTimeout(350);
  await page.mouse.move(box!.x + box!.width - 60, box!.y + 300);
  await expect.poll(async () => (await sheen.getAttribute("style")) !== before).toBe(true);

  const name = form.getByLabel("Nome completo *");
  const shadowBefore = await name.evaluate((node) => getComputedStyle(node).boxShadow);
  await name.focus();
  await page.waitForTimeout(280);
  const shadowAfter = await name.evaluate((node) => getComputedStyle(node).boxShadow);
  expect(shadowAfter).not.toBe(shadowBefore);
  expect(shadowAfter).toContain("22px");
  await page.screenshot({ path: testInfo.outputPath("invitation-contact-1440.png") });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    const frame = document.querySelector("div[class*='consoleFrame']") as HTMLElement;
    window.scrollTo({ top: frame.getBoundingClientRect().top + window.scrollY - 92, behavior: "instant" });
  });
  await page.waitForTimeout(700);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.locator("svg[class*='connectionBeam']")).toBeVisible();
  const mobileFormBox = await form.boundingBox();
  expect(mobileFormBox).not.toBeNull();
  expect(Math.abs(mobileFormBox!.x + mobileFormBox!.width / 2 - 195)).toBeLessThan(16);
  await expect(form.locator("[class*='chip']")).toHaveText("Rascunho local");
  await page.screenshot({ path: testInfo.outputPath("invitation-contact-390.png") });
});

test("invitation motion responds to pointer and reduced motion", async ({ page }) => {
  await page.goto(ROUTE);
  await page.waitForLoadState("networkidle");
  const root = page.locator("[data-page='convite']");
  await expect(root).toHaveAttribute("data-motion", "on");
  const light = page.locator("div[class*='heroLight']");
  const before = await light.getAttribute("style");
  await page.mouse.move(200, 400);
  await page.waitForTimeout(400);
  await page.mouse.move(1200, 300);
  await expect.poll(async () => (await light.getAttribute("style")) !== before).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(root).toHaveAttribute("data-motion", "off");
  const animation = await page.locator("[data-page='convite'] img[alt^='Símbolo holográfico']").evaluate((node) => getComputedStyle(node).animationName);
  expect(animation).toBe("none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(root).toHaveAttribute("data-motion", "on");
});

test("invitation page connects back to the universe and offers WhatsApp", async ({ page }) => {
  await page.goto(ROUTE);
  await expect(page.locator('a[href="/"]').first()).toBeVisible();
  const whatsapp = page.locator('a[href^="https://wa.me/5513996043320"]');
  await expect(whatsapp.first()).toBeVisible();
  await expect(whatsapp.first()).toHaveAttribute("target", "_blank");
  await expect(whatsapp.first()).toHaveAttribute("rel", /noopener|noreferrer/);
  await expect(page.getByRole("link", { name: "Falar no WhatsApp" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Navegação principal" }).getByRole("link", { name: "Início", exact: true })).toHaveAttribute("href", "/");
  await expect(page.locator('a[href*="quem-e-o-dono"]').first()).toBeVisible();
});

test("invitation page passes accessibility scan", async ({ page }) => {
  await page.goto(ROUTE);
  await page.waitForLoadState("networkidle");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations).toEqual([]);
});