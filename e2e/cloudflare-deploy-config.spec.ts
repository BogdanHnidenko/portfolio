import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { WIDTHS, eachWidth, checkLayout } from './_helpers/layout-checks';

// Усі тести йдуть проти wrangler dev, а не проти Vite dev-сервера
test.use({ baseURL: 'http://localhost:8787' });

/** Адреса сторінок застосунку, які мають віддаватися напряму. */
const DEEP_PATHS = ['/about', '/work', '/contact', '/about/'];

/**
 * Відкриває адресу, збирає помилки консолі й перевіряє, що застосунок відрендерився.
 * @param page - сторінка
 * @param url - адреса
 * @returns масив помилок консолі
 */
async function openAndCheck(page: Page, url: string): Promise<string[]> {
  // Накопичувач помилок консолі та сторінки
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  // Відповідь на навігацію
  const res = await page.goto(url);
  expect(res?.status()).toBe(200);
  await expect(page.locator('#root > *').first()).toBeVisible();
  await expect(page.locator('h1').first()).toBeVisible();
  return errors;
}

test('AC-1 [happy] dist містить index.html, _headers, assets/', () => {
  // Коренева папка збірки
  const dist = path.resolve(__dirname, '..', 'dist');
  expect(fs.existsSync(path.join(dist, 'index.html'))).toBe(true);
  expect(fs.existsSync(path.join(dist, '_headers'))).toBe(true);
  expect(fs.statSync(path.join(dist, 'assets')).isDirectory()).toBe(true);
});

test('AC-2 [happy] GET / віддає головну', async ({ page }) => {
  // Помилки консолі під час відкриття головної
  const errors = await openAndCheck(page, '/');
  expect(new URL(page.url()).pathname).toBe('/');
  expect(errors).toEqual([]);
});

for (const p of DEEP_PATHS) {
  test(`AC-3 [happy] пряме відкриття і reload ${p}`, async ({ page }) => {
    // Помилки консолі для поточної адреси
    const errors = await openAndCheck(page, p);
    expect(new URL(page.url()).pathname.replace(/\/$/, '')).toBe(p.replace(/\/$/, ''));
    // Перезавантаження на глибокій адресі
    // Відповідь на перезавантаження сторінки
    const res = await page.reload();
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1').first()).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('AC-4 [happy] невідома адреса віддає SPA зі статусом 200', async ({ page }) => {
  // Помилки консолі для невідомої адреси
  const errors = await openAndCheck(page, '/does-not-exist');
  expect(errors).toEqual([]);
});

test('AC-5 [happy] безпекові заголовки на /', async ({ request }) => {
  // Відповідь сервера на запит головної
  const res = await request.get('/');
  expect(res.status()).toBe(200);
  expect(res.headers()['x-content-type-options']).toBe('nosniff');
  expect(res.headers()['x-frame-options']).toBe('DENY');
  expect(res.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');
});

test('AC-6 [happy] довгий кеш для /assets і nope.js не є JS', async ({ request }) => {
  // Посилання на бандли з index.html
  // HTML головної для пошуку посилань на бандли
  const html = await (await request.get('/')).text();
  // Шляхи до JS/CSS бандлів з /assets/
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
  expect(assets.length).toBeGreaterThan(0);
  for (const a of assets) {
    // Відповідь на запит бандла
    const res = await request.get(a);
    expect(res.status()).toBe(200);
    // Значення заголовка Cache-Control бандла
    const cc = res.headers()['cache-control'] ?? '';
    expect(cc).toContain('max-age=31536000');
    expect(cc).toContain('immutable');
  }
  // Неіснуючий файл не повинен віддавати JavaScript
  // Відповідь на запит неіснуючого JS-файлу
  const nope = await request.get('/assets/nope.js');
  expect(nope.headers()['content-type'] ?? '').not.toMatch(/javascript/);
});

test('AC-7 [happy] статика з public/ віддається як є', async ({ request }) => {
  // Відповідь на запит фото
  const photo = await request.get('/photo.webp');
  expect(photo.status()).toBe(200);
  expect(photo.headers()['content-type']).toContain('image/webp');
  for (const f of ['screen-center', 'screen-left', 'screen-right']) {
    // Відповідь на запит скріншота застосунку
    const res = await request.get(`/app/${f}.webp`);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('image/webp');
  }
});

test('AC-8 [happy] /_headers не віддається як файл', async ({ request }) => {
  // Відповідь на запит /_headers
  const res = await request.get('/_headers');
  expect(await res.text()).not.toContain('X-Frame-Options');
});

test('AC-2 [responsive] головна через wrangler', async ({ page }, testInfo) => {
  await openAndCheck(page, '/');
  await eachWidth(page, WIDTHS.smoke, async () => {
    await checkLayout(page, testInfo, { name: 'home-wrangler' });
  });
});
