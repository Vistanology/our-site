import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";

// Existing tests exercise the site itself; the Vista entry screen gets its own test.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem("vistanology:entry:v1", "muted");
  });
});

async function openRequest(page: Page) {
  await page.getByRole("button", { name: "Pedir um software", exact: true }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

async function fillBriefing(page: Page) {
  await page.locator('label:has(input[name="kind"][value="Web"])').click();
  await expect(page.getByRole("radio", { name: "Web", exact: true })).toBeChecked();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByLabel("Problema a resolver").fill("Organizar os pedidos recebidos pela minha loja.");
  await page.getByLabel("Funcionalidades importantes").fill("Cadastrar clientes, acompanhar pedidos e emitir relatórios.");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("checkbox", { name: "Windows", exact: true }).check();
  await page.getByRole("checkbox", { name: "Web", exact: true }).check();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByLabel("Nome *", { exact: true }).fill("Pessoa de Teste");
  await page.getByLabel("E-mail *", { exact: true }).fill("teste@example.com");
  await page.getByRole("checkbox", { name: /Autorizo/ }).check();
}

test("desktop, responsive compositions and all local destinations", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Vistanology", exact: true })).toBeVisible();
  await expect(page.locator(".world-picture img")).toHaveJSProperty("complete", true);
  const missing = await page.locator('a[href^="#"]').evaluateAll((links) => links.map((link) => link.getAttribute("href")!).filter((href) => !document.querySelector(href)));
  expect(missing).toEqual([]);
  for (const width of [1920, 1440, 1280, 1024, 768, 390, 360]) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(page.getByRole("heading", { name: "Vistanology", exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`viewport-${width}.png`), fullPage: width === 390 });
  }
  expect(errors).toEqual([]);
});

test("homepage connects to the invitation page and offers a real WhatsApp channel", async ({ page }) => {
  await page.goto("/");
  const invite = page.locator('a[href*="convite-para-criar-sistema"]');
  await expect(invite.first()).toBeVisible();
  await expect(page.locator('a[href*="quem-e-o-dono"]').first()).toBeVisible();
  await expect(page.locator("[data-route-transition]")).toBeAttached();
  const whatsapp = page.locator('a[href^="https://wa.me/5513996043320"]');
  await expect(whatsapp.first()).toBeVisible();
  await expect(whatsapp.first()).toHaveAttribute("target", "_blank");
  await expect(whatsapp.first()).toHaveAttribute("rel", /noreferrer/);
  await expect(whatsapp.first()).toHaveAttribute("href", /Vistanology/);
  await invite.first().click();
  await expect(page).toHaveURL(/\/convite-para-criar-sistema\/?$/);
  await expect(page.getByRole("heading", { level: 1, name: /Você foi convidado/ })).toBeVisible();
});

test("hero eyebrow stays legible against the sky", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const chip = page.locator(".world-eyebrow");
  await expect(chip).toHaveText(/UM UNIVERSO DE POSSIBILIDADES/);
  await page.getByRole("button", { name: "Pausar animações" }).click();
  await expect(page.locator(".vistanology")).toHaveAttribute("data-motion", "off");
  const shot = (await chip.screenshot()).toString("base64");
  const ratio = await page.evaluate(async (data) => {
    const img = new Image();
    await new Promise<void>((resolve) => { img.onload = () => resolve(); img.src = `data:image/png;base64,${data}`; });
    const canvas = document.createElement("canvas");
    canvas.width = img.width; canvas.height = img.height;
    const context = canvas.getContext("2d")!;
    context.drawImage(img, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const channel = (value: number) => { value /= 255; return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4; };
    const luminances: number[] = [];
    for (let i = 0; i < pixels.length; i += 4) luminances.push(0.2126 * channel(pixels[i]) + 0.7152 * channel(pixels[i + 1]) + 0.0722 * channel(pixels[i + 2]));
    luminances.sort((a, b) => a - b);
    const quantile = (p: number) => luminances[Math.floor(luminances.length * p)];
    const background = quantile(0.35);
    const text = quantile(0.97);
    return (Math.max(text, background) + 0.05) / (Math.min(text, background) + 0.05);
  }, shot);
  expect(ratio).toBeGreaterThanOrEqual(4.5);
});

test("carved title light follows the pointer near the title", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const title = page.locator(".brand-sculpture");
  const point = page.locator(".glass-wordmark fePointLight");
  const color = page.locator('.glass-wordmark feColorMatrix[type="hueRotate"]');
  const box = (await title.boundingBox())!;
  // Proximity nudges the light: just outside the left edge.
  await page.mouse.move(box.x - 40, box.y + 40);
  await expect.poll(async () => Number(await point.getAttribute("x"))).toBeLessThan(120);
  await page.screenshot({ path: testInfo.outputPath("title-light-near-left.png") });
  // Far away the light rests in its neutral position, and no lock hint appears.
  await page.mouse.move(1380, 500);
  await expect.poll(async () => Number(await point.getAttribute("x"))).toBeCloseTo(350, 1);
  await expect(page.getByRole("status").filter({ hasText: "Luz presa ao cursor" })).toHaveCount(0);
  // Crossing the title never pins the light to the cursor.
  await page.mouse.move(box.x + 10, box.y + 40);
  await page.mouse.move(1380, 500);
  await expect.poll(async () => Number(await point.getAttribute("x"))).toBeCloseTo(350, 1);
  // Motion off freezes the light and disables the pointer response.
  await page.getByRole("button", { name: "Pausar animações" }).click();
  await expect(page.locator(".vistanology")).toHaveAttribute("data-motion", "off");
  await page.mouse.move(box.x + 10, box.y + 40);
  await expect.poll(async () => Number(await point.getAttribute("x"))).toBeCloseTo(350, 1);
  await expect.poll(async () => Number(await color.getAttribute("values"))).toBeCloseTo(-10, 1);
});

test("ocean continuation and living about window respond to movement", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const ocean = page.locator(".ocean-depth-scene");
  const landscape = page.locator(".about-landscape-image");
  const frame = page.locator(".about-window");
  const initialOcean = await ocean.getAttribute("style");
  await frame.scrollIntoViewIfNeeded();
  await expect(ocean).not.toHaveAttribute("style", initialOcean!);
  await expect.poll(() => page.locator(".ocean-depth").evaluate((element) => Math.round(element.getBoundingClientRect().top))).toBe(0);
  await expect.poll(() => page.locator(".ocean-depth-scene img").evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(frame.getByRole("heading", { name: /Parece que eu/ })).toBeVisible();
  const box = (await frame.boundingBox())!;
  await page.mouse.move(box.x + 30, box.y + 150);
  await expect.poll(() => landscape.evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).m41)).toBeGreaterThan(8);
  const firstReflection = await page.locator(".about-glass-light").getAttribute("style");
  await page.mouse.move(box.x + box.width - 30, box.y + 150);
  await expect.poll(() => landscape.evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).m41)).toBeLessThan(-8);
  await expect(page.locator(".about-glass-light")).not.toHaveAttribute("style", firstReflection!);
  await page.screenshot({ path: testInfo.outputPath("ocean-about-desktop.png") });
  for (const width of [1440, 768, 390, 360]) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
    await frame.scrollIntoViewIfNeeded();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await frame.screenshot({ path: testInfo.outputPath(`about-window-${width}.png`) });
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".vistanology")).toHaveAttribute("data-motion", "off");
  await expect.poll(() => landscape.evaluate((element) => getComputedStyle(element).transform)).toBe("none");
  await frame.hover();
  await expect.poll(() => ocean.evaluate((element) => getComputedStyle(element).transform)).toBe("none");
  await expect.poll(() => landscape.evaluate((element) => getComputedStyle(element).transform)).toBe("none");
});

test("atmospheres and catalog search", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Sob a água", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Às vezes, o começo está lá embaixo." })).toBeVisible();
  await page.getByRole("button", { name: "O jardim", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tecnologia também pode florescer." })).toBeVisible();
  await page.getByRole("searchbox", { name: "Buscar software" }).fill("planilha");
  await expect(page.getByRole("heading", { name: "Nenhum software encontrado por aqui." })).toBeVisible();
  await page.getByRole("button", { name: "Desktop", exact: true }).click();
  await expect(page.getByRole("button", { name: "Desktop", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Limpar filtros", exact: true }).click();
  await expect(page.getByRole("searchbox", { name: "Buscar software" })).toHaveValue("");
  await expect(page.getByRole("button", { name: "Todos", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("request validates steps, retains data and downloads without a false receipt", async ({ page }, testInfo) => {
  const posts: string[] = [];
  page.on("request", (request) => { if (request.method() === "POST" && !request.url().includes("_next")) posts.push(request.url()); });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Pedir um software", exact: true }).first();
  await openRequest(page);
  await expect(page.getByRole("dialog")).toContainText("Recebimento online ainda não configurado");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("Escolha um tipo de software");
  await fillBriefing(page);
  await page.getByText("Ver briefing completo", { exact: true }).click();
  await expect(page.locator("dialog details")).toContainText("Windows, Web");
  await page.screenshot({ path: testInfo.outputPath("request-review.png"), fullPage: true });
  await page.getByLabel("E-mail *", { exact: true }).fill("invalido");
  await page.getByRole("button", { name: "Baixar briefing", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("e-mail válido");
  await page.getByLabel("E-mail *", { exact: true }).fill("teste@example.com");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar briefing", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("briefing-software.json");
  const payload = JSON.parse(await fs.readFile((await download.path())!, "utf8"));
  expect(payload.kind).toBe("Web");
  expect(payload.platforms).toEqual(["Windows", "Web"]);
  expect(payload.name).toBe("Pessoa de Teste");
  await expect(page.getByRole("status").filter({ hasText: "Briefing baixado" })).toContainText("ainda não foi enviado");
  await expect(page.getByText("Pedido recebido!", { exact: true })).toHaveCount(0);
  expect(posts).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await openRequest(page);
  await expect(page.getByRole("radio", { name: "Web", exact: true })).not.toBeChecked();
  await page.mouse.click(5, 5);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.position)).toBe("");
});

test("mobile menu, modal, focus trap and reduced motion", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".vistanology")).toHaveAttribute("data-motion", "off");
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await page.locator("#mobile-navigation").getByRole("link", { name: "Softwares", exact: true }).click();
  await expect(page.locator("#mobile-navigation")).toHaveCount(0);
  await expect(page).toHaveURL(/#softwares$/);
  await page.getByRole("button", { name: "Pedir um software", exact: true }).nth(1).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await fillBriefing(page);
  await page.getByRole("button", { name: "Copiar briefing", exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Fechar pedido de software" })).toBeFocused();
  await page.screenshot({ path: testInfo.outputPath("mobile-request.png") });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("audio is opt-in, produces a signal, mutes, stops and never autoplays on reload", async ({ page }) => {
  await page.addInitScript(() => {
    const NativeAudioContext = window.AudioContext;
    const contexts: AudioContext[] = [];
    Object.assign(window, { __audioContexts: contexts });
    window.AudioContext = class extends NativeAudioContext {
      constructor(options?: AudioContextOptions) {
        super(options);
        contexts.push(this);
        const meter = this.createAnalyser();
        meter.fftSize = 2048;
        meter.connect(this.destination);
        Object.assign(this, { __meter: meter });
        const connect = AudioNode.prototype.connect;
        function meteredConnect(this: AudioNode, destination: AudioNode, output?: number, input?: number): AudioNode;
        function meteredConnect(this: AudioNode, destination: AudioParam, output?: number): void;
        function meteredConnect(this: AudioNode, destination: AudioNode | AudioParam, output = 0, input = 0): AudioNode | void {
          if (destination instanceof AudioNode) {
            const target = destination === meter.context.destination && this !== meter ? meter : destination;
            return Reflect.apply(connect, this, [target, output, input]) as AudioNode;
          }
          Reflect.apply(connect, this, [destination, output]);
        }
        AudioNode.prototype.connect = meteredConnect;
      }
    };
  });
  await page.goto("/");
  const rms = () => page.evaluate(() => {
    const context = (window as unknown as { __audioContexts: (AudioContext & { __meter: AnalyserNode })[] }).__audioContexts[0];
    const samples = new Float32Array(2048);
    context.__meter.getFloatTimeDomainData(samples);
    return Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
  });
  expect(await page.evaluate(() => (window as unknown as { __audioContexts: unknown[] }).__audioContexts.length)).toBe(0);
  await page.getByRole("button", { name: "Reproduzir Águas de amanhã" }).click();
  await expect(page.getByRole("button", { name: "Pausar Águas de amanhã" })).toBeVisible();
  await expect.poll(rms).toBeGreaterThan(0.00005);
  await page.getByRole("button", { name: "Abrir controles da paisagem sonora" }).click();
  await page.getByRole("slider", { name: "Volume", exact: true }).fill("4");
  await page.getByRole("switch", { name: "Camada musical" }).click();
  await expect(page.getByRole("switch", { name: "Camada musical" })).toHaveAttribute("aria-checked", "false");
  await page.getByRole("button", { name: "Silenciar áudio" }).click();
  await expect.poll(rms).toBeLessThan(0.00001);
  await page.getByRole("button", { name: "Parar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Reproduzir Águas de amanhã" })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __audioContexts: AudioContext[] }).__audioContexts[0].state)).toBe("closed");
  await page.reload();
  expect(await page.evaluate(() => (window as unknown as { __audioContexts: unknown[] }).__audioContexts.length)).toBe(0);
  await page.getByRole("button", { name: "Abrir controles da paisagem sonora" }).click();
  await expect(page.getByRole("slider", { name: "Volume", exact: true })).toHaveValue("4");
  await expect(page.getByRole("switch", { name: "Camada musical" })).toHaveAttribute("aria-checked", "false");
});

test("accessibility scan for page and request", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Pausar animações" }).click();
  const pageResults = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  await fs.writeFile(testInfo.outputPath("accessibility-page.json"), JSON.stringify(pageResults, null, 2));
  expect(pageResults.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) }))).toEqual([]);
  await openRequest(page);
  const dialogResults = await new AxeBuilder({ page }).include("dialog").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(dialogResults.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) }))).toEqual([]);
});

test("principles and faq sections are live, readable and honest", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.locator("#principios").scrollIntoViewIfNeeded();
  await expect(page.getByRole("heading", { name: /Princípios que não/ })).toBeInViewport();
  await expect(page.locator(".principle-card")).toHaveCount(4);
  await expect(page.getByText("Honestidade radical")).toBeVisible();
  const flow = page.locator(".materials-flow");
  await expect(flow).toBeVisible();
  const first = await flow.evaluate((node) => getComputedStyle(node).transform);
  await page.waitForTimeout(600);
  const second = await flow.evaluate((node) => getComputedStyle(node).transform);
  expect(second).not.toBe(first);
  await expect(page.locator(".materials-track").first().getByText("Roblox Luau")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("home-principles-1440.png") });

  await page.locator("#duvidas").scrollIntoViewIfNeeded();
  await expect(page.getByRole("heading", { name: /Perguntas que talvez/ })).toBeInViewport();
  const firstButton = page.getByRole("button", { name: "Preciso ter a ideia pronta para conversar?" });
  const secondButton = page.getByRole("button", { name: "Como o preço de um projeto é definido?" });
  await expect(firstButton).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("region", { name: "Preciso ter a ideia pronta para conversar?" })).toBeVisible();
  await secondButton.click();
  await expect(secondButton).toHaveAttribute("aria-expanded", "true");
  await expect(firstButton).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("region", { name: "Como o preço de um projeto é definido?" })).toContainText("complexidade");
  await secondButton.click();
  await expect(secondButton).toHaveAttribute("aria-expanded", "false");
  await page.screenshot({ path: testInfo.outputPath("home-faq-1440.png") });

  await page.getByRole("button", { name: "Pausar animações" }).click();
  await expect(page.locator(".materials-static")).toBeVisible();
  await expect(page.locator(".materials-flow")).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#principios").scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("home-principles-390.png") });
});

test("vista boot entry starts the soundtrack only after the entry click", async ({ page }, testInfo) => {
  // Clear the bypass once; later reloads must keep the real entry choice.
  await page.addInitScript(() => {
    if (!window.sessionStorage.getItem("vistanology:boot-tested")) {
      window.sessionStorage.removeItem("vistanology:entry:v1");
      window.sessionStorage.setItem("vistanology:boot-tested", "1");
    }
  });
  await page.goto("/");
  const boot = page.getByRole("dialog", { name: "Tela de entrada Vistanology" });
  await expect(boot).toBeVisible();
  await expect(boot.getByRole("progressbar", { name: "Carregando a experiência Vistanology" })).toBeVisible();
  await expect(page.getByText("Iniciando sua experiência…")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("vista-boot.png") });
  await expect(boot.getByRole("button", { name: "Entrar com som" })).toBeVisible({ timeout: 8000 });
  await expect(boot.getByRole("button", { name: "Entrar sem som" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("vista-welcome.png") });
  const welcomeAxe = await new AxeBuilder({ page }).include("dialog").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(welcomeAxe.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) }))).toEqual([]);
  expect(await page.evaluate(() => document.querySelector("audio[data-soundtrack]"))).toBeNull();
  await boot.getByRole("button", { name: "Entrar com som" }).click();
  await expect(boot).toHaveCount(0);
  const audio = page.locator("audio[data-soundtrack]");
  await expect(audio).toBeAttached();
  await expect.poll(() => audio.evaluate((element) => (element as HTMLAudioElement).paused)).toBe(false);
  await expect.poll(() => audio.evaluate((element) => (element as HTMLAudioElement).loop)).toBe(true);
  await expect(page.getByRole("button", { name: "Silenciar todo o som" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("home-after-entry.png") });
  await page.getByRole("button", { name: "Silenciar todo o som" }).click();
  await expect.poll(() => audio.evaluate((element) => (element as HTMLAudioElement).muted)).toBe(true);
  await expect(page.getByRole("button", { name: "Ativar som" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("dialog", { name: "Tela de entrada Vistanology" })).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    window.sessionStorage.removeItem("vistanology:entry:v1");
    window.sessionStorage.removeItem("vistanology:boot-tested");
  });
  await page.reload();
  await expect(boot.getByRole("button", { name: "Entrar com som" })).toBeVisible({ timeout: 8000 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("vista-welcome-390.png") });
  await boot.getByRole("button", { name: "Entrar sem som" }).click();
  await expect(boot).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Ativar som" })).toBeVisible();
  expect(await page.evaluate(() => {
    const element = document.querySelector("audio[data-soundtrack]") as HTMLAudioElement | null;
    return element === null || element.paused;
  })).toBe(true);
});

test("capability showroom previews are functional and honest", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.locator("#projetos").scrollIntoViewIfNeeded();
  await expect(page.getByText("O QUE PODEMOS CRIAR", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Não imaginamos apenas o futuro/ })).toBeVisible();
  for (const badge of ["PREVIEW CONCEITUAL · NÃO É GAMEPLAY.", "MOCKUP DE INTERFACE · DADOS FICTÍCIOS.", "PROTÓTIPO VISUAL · EXEMPLO CONCEITUAL."]) {
    await expect(page.getByText(badge, { exact: true })).toBeVisible();
  }

  // 01 — immersive worlds: particle count and reflection respond to controls.
  const bubbles = page.locator("[data-world-bubble]");
  await expect(bubbles).toHaveCount(10);
  await page.getByRole("slider", { name: "Partículas" }).fill("4");
  await expect(bubbles).toHaveCount(4);
  await expect(page.locator("[data-world-reflection]")).toHaveCount(1);
  await page.getByRole("switch", { name: "Reflexo na água" }).click();
  await expect(page.getByRole("switch", { name: "Reflexo na água" })).toHaveAttribute("aria-checked", "false");
  await expect(page.locator("[data-world-reflection]")).toHaveCount(0);
  await page.getByRole("switch", { name: "Raios de sol" }).click();
  await expect(page.locator("[data-world-rays]")).toHaveCount(0);
  await page.getByRole("button", { name: "Restaurar", exact: true }).first().click();
  await expect(bubbles).toHaveCount(10);

  // A hora do dia move o astro e acende as estrelas; os presets entram em cena com transição.
  const hourSlider = page.getByRole("slider", { name: "Hora do dia" });
  const lightSlider = page.getByRole("slider", { name: "Luz do dia" });
  const sun = page.locator("[data-world-sun]");
  const stars = page.locator("[data-world-stars]");
  await expect(sun).toHaveAttribute("opacity", /[1-9]/);
  await hourSlider.fill("22.4");
  await expect(sun).toHaveAttribute("opacity", "0");
  await expect(stars).toHaveAttribute("opacity", "0.95");
  const stageTag = page.locator('[class*="worldStage"]').first();
  await expect(stageTag.getByText("22:24", { exact: true })).toBeVisible();
  const noonPreset = page.getByRole("button", { name: "Meio-dia", exact: true });
  await expect(noonPreset).toHaveAttribute("aria-pressed", "false");
  await noonPreset.click();
  await expect(noonPreset).toHaveAttribute("aria-pressed", "true");
  await expect(stageTag.getByText("Cena livre", { exact: true })).toHaveCount(0);
  await expect(hourSlider).toHaveValue("12.6");
  await expect(lightSlider).toHaveValue("88");
  await expect(sun).toHaveAttribute("opacity", "1");
  await expect(stars).toHaveAttribute("opacity", "0");
  const grid = page.getByRole("switch", { name: "Grade da câmera" });
  await expect(page.locator("[data-world-grid]")).toHaveCount(0);
  await grid.click();
  await expect(grid).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("[data-world-grid]")).toHaveCount(1);
  await grid.click();
  await expect(page.locator("[data-world-grid]")).toHaveCount(0);
  await page.getByRole("button", { name: "Restaurar", exact: true }).first().click();
  await page.screenshot({ path: testInfo.outputPath("showroom-worlds.png") });

  // 02 — digital systems: period, navigation, search, automations and a real CSV export.
  const dashNav = page.getByRole("navigation", { name: "Navegação do painel demonstrativo" });
  await dashNav.scrollIntoViewIfNeeded();
  await expect(page.getByText("766 no período")).toBeVisible();
  await page.getByRole("button", { name: "Mês", exact: true }).click();
  await expect(page.getByRole("button", { name: "Mês", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("3107 no período")).toBeVisible();
  await dashNav.getByRole("button", { name: "Automações", exact: true }).click();
  await expect(dashNav.getByRole("button", { name: "Automações", exact: true })).toHaveAttribute("aria-current", "true");
  const autoSwitch = page.getByRole("switch", { name: "Ativar automação Resumo semanal" });
  await expect(autoSwitch).toHaveAttribute("aria-checked", "false");
  await autoSwitch.click();
  await expect(autoSwitch).toHaveAttribute("aria-checked", "true");
  await dashNav.getByRole("button", { name: "Pedidos", exact: true }).click();
  await page.getByRole("searchbox", { name: "Buscar pedido ou cliente" }).fill("Marina");
  await expect(page.locator("table tbody tr")).toHaveCount(1);
  await expect(page.locator("table tbody")).toContainText("Marina Lima");
  await page.getByRole("searchbox", { name: "Buscar pedido ou cliente" }).fill("");
  await dashNav.getByRole("button", { name: "Relatórios", exact: true }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar CSV" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("vistanology-demo-relatorio.csv");
  const csv = await fs.readFile((await download.path())!, "utf8");
  expect(csv).toContain("periodo,ponto,pedidos,receita_estimada_brl");
  await page.screenshot({ path: testInfo.outputPath("showroom-systems.png") });

  // 03 — digital experiences: palette, radius and the live specimen interaction.
  const stage = page.locator("[data-exp-stage]");
  await stage.scrollIntoViewIfNeeded();
  await page.getByRole("radio", { name: "Orbital" }).click();
  await expect(page.getByRole("radio", { name: "Orbital" })).toHaveAttribute("aria-checked", "true");
  await expect.poll(() => stage.evaluate((el) => getComputedStyle(el).getPropertyValue("--sp-accent").trim())).toBe("#b29cff");
  await page.getByRole("slider", { name: "Raio" }).fill("30");
  await expect.poll(() => page.locator("[data-spec-card]").evaluate((el) => getComputedStyle(el).borderRadius)).toBe("30px");
  await page.getByRole("button", { name: "Registrar ideia" }).click();
  await expect(page.getByText(/ideia registrada neste protótipo/)).toBeVisible();
  await page.getByRole("button", { name: "Ver detalhes" }).click();
  await expect(page.getByText("Este cartão é um protótipo visual")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("showroom-experience.png") });
  await page.getByRole("switch", { name: "Tema claro" }).click();
  await expect.poll(() => stage.evaluate((el) => getComputedStyle(el).getPropertyValue("--sp-ink").trim())).toBe("#06344f");
  await page.screenshot({ path: testInfo.outputPath("showroom-experience-light.png") });

  // Mobile: no horizontal overflow and the dashboard stays usable.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#projetos").scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await dashNav.getByRole("button", { name: "Clientes", exact: true }).click();
  await expect(page.getByText("Estúdio Aqua")).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("showroom-mobile.png"), fullPage: false });
  expect(errors).toEqual([]);

  // Reduced motion: ambient animation stops but the controls remain live.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".vistanology")).toHaveAttribute("data-motion", "off");
  await expect.poll(() => page.locator("[data-world-bubble]").first().evaluate((el) => getComputedStyle(el).transform)).toBe("none");
  await page.getByRole("slider", { name: "Partículas" }).fill("6");
  await expect(page.locator("[data-world-bubble]")).toHaveCount(6);
});
