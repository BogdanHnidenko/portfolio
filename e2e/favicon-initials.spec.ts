import { test, expect, type Page } from '@playwright/test';
import { WIDTHS, eachWidth, checkLayout } from './_helpers/layout-checks';

/** Сторінки сайту, на яких перевіряємо іконку. */
const PATHS = ['/', '/work', '/about', '/contact'];
/** Ключ localStorage зі збереженими налаштуваннями. */
const STORAGE_KEY = 'portfolio-settings';

/**
 * Підписується на помилки консолі й сторінки.
 * @param page - сторінка
 * @returns масив, що наповнюється помилками
 */
function collectErrors(page: Page): string[] {
  // Накопичувач помилок
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

for (const p of PATHS) {
  test(`AC-1 [happy] один link rel=icon на ${p}`, async ({ page }) => {
    // Збираємо помилки й відкриваємо сторінку
    const errors = collectErrors(page);
    await page.goto(p);
    // Усі іконки в head
    const icons = page.locator('head link[rel="icon"]');
    await expect(icons).toHaveCount(1);
    await expect(icons).toHaveAttribute('href', '/favicon.svg');
    await expect(icons).toHaveAttribute('type', 'image/svg+xml');
    // Іконки data:, немає
    await expect(page.locator('head link[href^="data:"]')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test('AC-2 [happy] GET /favicon.svg віддає SVG з BH', async ({ request }) => {
  // Запит іконки
  const res = await request.get('/favicon.svg');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('image/svg+xml');
  // Тіло відповіді
  const body = await res.text();
  expect(body).toMatch(/<svg[\s>]/);
  expect(body).toMatch(/>\s*BH\s*</);
});

test.describe('світла тема ОС', () => {
  test.use({ colorScheme: 'light' });
  test('AC-2 [happy] /favicon.svg у світлій темі ОС', async ({ request }) => {
    // Запит іконки
    const res = await request.get('/favicon.svg');
    expect(res.status()).toBe(200);
    expect(await res.text()).toContain('BH');
  });
});

test('AC-3 [happy] іконка рендерить BH (64 і 16 px)', async ({ page }, testInfo) => {
  // Помилки консолі та сторінки
  const errors = collectErrors(page);
  await page.goto('/favicon.svg');
  // Текстовий елемент у SVG
  await expect(page.locator('svg text')).toHaveText('BH');
  // Заокруглений квадрат із рамкою
  const rect = page.locator('svg rect');
  await expect(rect).toHaveAttribute('rx', /\d+/);
  expect(Number(await rect.getAttribute('rx'))).toBeGreaterThan(0);
  expect(Number(await rect.getAttribute('stroke-width'))).toBeGreaterThan(0);
  // Моноширинний шрифт
  expect(await page.locator('svg text').getAttribute('font-family')).toMatch(/mono/i);
  await page.screenshot({ path: testInfo.outputPath('favicon-64.png') });
  // Маленький розмір 16x16 через img
  await page.goto('/about');
  await page.evaluate(() => { document.body.innerHTML = '<img id="i" src="/favicon.svg" width="16" height="16" style="position:fixed;top:0;left:0;background:#888">'; });
  await expect.poll(() => page.locator('#i').evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
  await page.locator('#i').screenshot({ path: testInfo.outputPath('favicon-16.png') });
  expect(errors).toEqual([]);
});

for (const p of PATHS) {
  test(`AC-4 [happy] немає 404 для іконки на ${p}`, async ({ page }) => {
    // Помилки консолі та сторінки
    const errors = collectErrors(page);
    // Усі відповіді з кодом >= 400
    const bad: string[] = [];
    page.on('response', (r) => r.status() >= 400 && bad.push(`${r.status()} ${r.url()}`));
    await page.goto(p);
    await page.waitForLoadState('networkidle');
    expect(bad).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('AC-5 [happy] логотип хедера не змінився', async ({ page }) => {
  // Помилки консолі та сторінки
  const errors = collectErrors(page);
  await page.goto('/about');
  // Логотип
  const logo = page.getByTestId('logo-link');
  await expect(logo).toContainText('BH');
  await expect(logo).toHaveAttribute('href', '/');
  expect(errors).toEqual([]);
});

for (const lang of ['en', 'ua'] as const) {
  test(`AC-1 [happy] заголовок вкладки і іконка (${lang})`, async ({ page }) => {
    // Мова з localStorage
    await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [STORAGE_KEY, JSON.stringify({ state: { theme: 'dark', lang }, version: 0 })]);
    await page.goto('/');
    await expect(page).toHaveTitle(lang === 'ua' ? 'Богдан Гніденко — Full-Stack розробник' : 'Bohdan Hnidenko — Full-Stack Developer');
    await expect(page.locator('head link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg');
  });
}

test('AC-1 [responsive] головна не зламана на 3 ширинах', async ({ page }, testInfo) => {
  await page.goto('/');
  await eachWidth(page, WIDTHS.smoke, async (w) => {
    await checkLayout(page, testInfo, { name: `home-${w}` });
  });
});
