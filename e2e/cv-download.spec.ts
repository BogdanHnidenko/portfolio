import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import { WIDTHS, eachWidth, checkLayout } from './_helpers/layout-checks';

/** Ключ localStorage зі збереженими налаштуваннями (тема/мова). */
const STORAGE_KEY = 'portfolio-settings';
/** Очікувана назва файлу при збереженні. */
const FILENAME = 'Bohdan_Hnidenko_React_Native_CV.pdf';
/** Оригінал CV, з яким порівнюємо розмір і вміст. */
const ORIGINAL = '/Users/bohdanhnidenko/Downloads/Bohdan_Hnidenko_React_Native_CV.pdf';
/** Сторінки з кнопкою CV та її тест-ідентифікатор. */
const CV_PAGES = [
  { path: '/', id: 'cv-hero' },
  { path: '/about', id: 'band-primary' },
  { path: '/contact', id: 'cv-contact' },
] as const;

/**
 * Відкриває сторінку із заданою мовою і збирає помилки консолі.
 * @param page - сторінка
 * @param url - шлях
 * @param lang - мова сайту (en/ua)
 * @returns масив помилок, який наповнюється під час тесту
 */
async function open(page: Page, url: string, lang: 'en' | 'ua'): Promise<string[]> {
  // Накопичувач помилок консолі та сторінки
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [
    STORAGE_KEY,
    JSON.stringify({ state: { theme: 'dark', lang }, version: 0 }),
  ]);
  await page.goto(url);
  // Чекаємо завершення скінченних вхідних анімацій, щоб не ловити проміжні стани
  await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.timeline instanceof DocumentTimeline && a.effect?.getComputedTiming().iterations !== Infinity).map((a) => a.finished.catch(() => undefined))));
  return errors;
}

test('AC-1 [happy] /cv.pdf віддає справжній PDF, а не index.html', async ({ request }) => {
  // Запит файлу
  const res = await request.get('/cv.pdf');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('application/pdf');
  // Перші байти тіла
  const body = await res.body();
  expect(body.subarray(0, 4).toString('latin1')).toBe('%PDF');
});

test('AC-2 [happy] вміст збігається з оригіналом байт у байт', async ({ request }) => {
  // Оригінал і відповідь сервера
  const original = fs.readFileSync(ORIGINAL);
  // Тіло відповіді сервера
  const body = await (await request.get('/cv.pdf')).body();
  expect(body.length).toBe(original.length);
  expect(body.equals(original)).toBe(true);
});

for (const lang of ['en', 'ua'] as const) {
  test(`AC-3 [happy] кнопка cv-header має href і download (${lang})`, async ({ page }) => {
    // Помилки консолі під час відкриття сторінки
    const errors = await open(page, '/', lang);
    // Кнопка CV у хедері
    const btn = page.getByTestId('cv-header');
    await expect(btn).toHaveAttribute('href', '/cv.pdf');
    await expect(btn).toHaveAttribute('download', FILENAME);
    expect(errors).toEqual([]);
  });

  for (const { path, id } of CV_PAGES) {
    test(`AC-${lang === 'en' ? 3 : 4} [happy] ${id} на ${path} має href і download (${lang})`, async ({ page }) => {
      // Помилки консолі під час відкриття сторінки
      const errors = await open(page, path, lang);
      // Кнопка CV на поточній сторінці
      const btn = page.getByTestId(id);
      await expect(btn).toHaveAttribute('href', '/cv.pdf');
      await expect(btn).toHaveAttribute('download', FILENAME);
      expect(errors).toEqual([]);
    });
  }
}

test('AC-3 [happy] клік по cv-hero завантажує файл із правильною назвою', async ({ page }) => {
  // Помилки консолі під час відкриття сторінки
  const errors = await open(page, '/', 'en');
  // Клік і очікування завантаження
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('cv-hero').click()]);
  expect(download.suggestedFilename()).toBe(FILENAME);
  expect(errors).toEqual([]);
});

test('AC-4 [happy] клік по cv-hero в UA завантажує ту саму назву', async ({ page }) => {
  await open(page, '/', 'ua');
  // Подія завантаження після кліку
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('cv-hero').click()]);
  expect(download.suggestedFilename()).toBe(FILENAME);
});

test('AC-3 [negative] band-primary на /work не має download і не веде на CV', async ({ page }) => {
  // Помилки консолі під час відкриття сторінки
  const errors = await open(page, '/work', 'en');
  // Кнопка band-primary на сторінці /work
  const btn = page.getByTestId('band-primary');
  await expect(btn).toBeVisible();
  await expect(btn).not.toHaveAttribute('download', /.*/);
  expect(await btn.getAttribute('href')).not.toBe('/cv.pdf');
  expect(errors).toEqual([]);
});

for (const { path, id } of [{ path: '/', id: 'cv-hero' }, { path: '/about', id: 'band-primary' }, { path: '/contact', id: 'cv-contact' }]) {
  test(`AC-3 [responsive] ${id} на ${path}`, async ({ page }, testInfo) => {
    await open(page, path, 'en');
    await expect(page.getByTestId(id)).toBeVisible();
    // Перевірка верстки на 3 ширинах
    await eachWidth(page, WIDTHS.smoke, async (width) => {
      // Повертаємось нагору, щоб липкий хедер не перекривав вміст після прокрутки
      await page.evaluate(() => window.scrollTo(0, 0));
      // Липкий хедер у знімку на всю сторінку накладається на заголовок — це артефакт скролу, у стані спокою перекриття немає
      await checkLayout(page, testInfo, { name: `cv-${id}-${width}`, ignore: ['[data-testid="site-header"]'] });
    });
  });
}

test('AC-3 [responsive] мобільна ширина 390 — кнопка CV у hero', async ({ page }) => {
  await open(page, '/', 'en');
  await page.setViewportSize({ width: 390, height: 800 });
  await expect(page.getByTestId('cv-hero')).toBeVisible();
});

test('AC-5 [happy] регресія: кнопка cv-header є на всіх сторінках з href /cv.pdf', async ({ page }) => {
  // Обходимо всі маршрути сайту
  for (const path of ['/', '/work', '/about', '/contact']) {
    // Помилки консолі для поточного маршруту
    const errors = await open(page, path, 'en');
    await expect(page.getByTestId('cv-header')).toHaveAttribute('href', '/cv.pdf');
    expect(errors).toEqual([]);
  }
});
