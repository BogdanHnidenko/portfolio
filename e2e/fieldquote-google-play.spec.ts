import { test as base, expect, type Page } from '@playwright/test';
import { WIDTHS, eachWidth, checkLayout } from './_helpers/layout-checks';

/** Ключ localStorage зі стором налаштувань. */
const STORAGE_KEY = 'portfolio-settings';
/** Адреса Google Play зі специфікації. */
const GP = 'https://play.google.com/store/apps/details?id=com.modernapps.devstudio.fieldquote';

/** Навмисні накладання макета: нахилені телефони сцени та sticky-хедер над контентом. */
const IGNORE = ['[data-testid="site-header"]', '[data-testid="site-header"] *', '[data-testid^="app-screen-"]'];

/** Фікстура: будь-яка помилка консолі чи сторінки валить тест. */
const test = base.extend<{ errors: string[] }>({
  errors: [
    async ({ page }, use) => {
      // Накопичувач помилок
      const errors: string[] = [];
      page.on('console', (m) => {
        // Перервані запити скриншотів — очікувано
        if (/Failed to load resource/.test(m.text()) && /screen-/.test(m.location().url)) return;
        if (m.type() === 'error') errors.push(m.text());
      });
      page.on('pageerror', (e) => errors.push(e.message));
      await use(errors);
      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});

/**
 * Відкриває адресу з обраною мовою на заданій ширині.
 * @param page - сторінка
 * @param path - адреса
 * @param width - ширина вікна
 * @param lang - мова інтерфейсу
 */
async function openAt(page: Page, path: string, width: number, lang: 'en' | 'ua' = 'en'): Promise<void> {
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [STORAGE_KEY, JSON.stringify({ state: { theme: 'dark', lang }, version: 0 })]);
  await page.goto(path);
}

for (const [lang, text] of [['en', 'Get it on Google Play'], ['ua', 'Завантажити з Google Play']] as const) {
  test(`AC-1 [happy] ${lang}: google-play-link, порядок кнопок`, async ({ page }) => {
    await openAt(page, '/work', 1440, lang);
    // Нове посилання
    const gp = page.getByTestId('google-play-link');
    await expect(gp).toHaveAttribute('href', GP);
    await expect(gp).toHaveAttribute('target', '_blank');
    await expect(gp).toHaveAttribute('rel', /noopener/);
    await expect(gp).toContainText(text);
    await expect(page.getByTestId('google-play-soon')).toHaveCount(0);
    // Порядок: App Store → Google Play → сайт
    const ids = await page.getByTestId('app-actions').locator('[data-testid]').evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')));
    expect(ids).toEqual(['app-store-link', 'google-play-link', 'app-site-link']);
  });
}

test('AC-2 [happy] EN: бейдж і опис', async ({ page }) => {
  await openAt(page, '/work', 1440);
  await expect(page.getByTestId('app-live-badge')).toHaveText('On App Store & Google Play');
  await expect(page.getByTestId('apps-card')).toContainText('iOS & Android');
});

test('AC-2 [happy] UA: бейдж і опис', async ({ page }) => {
  await openAt(page, '/work', 1440, 'ua');
  await expect(page.getByTestId('app-live-badge')).toHaveText('В App Store і Google Play');
  await expect(page.getByTestId('apps-card')).toContainText('iOS та Android');
});

test('AC-3 [happy] EN: Home і About', async ({ page }) => {
  await openAt(page, '/', 1440);
  await expect(page.getByTestId('home-work-tile').nth(1)).toContainText('On App Store & Google Play');
  await page.goto('/about');
  await expect(page.getByTestId('page-about')).toContainText('FieldQuote — my own app, live on App Store & Google Play');
  await expect(page.getByTestId('page-about')).toContainText('Own product FieldQuote — live on the App Store and Google Play.');
});

test('AC-3 [happy] UA: Home і About', async ({ page }) => {
  await openAt(page, '/', 1440, 'ua');
  await expect(page.getByTestId('home-work-tile').nth(1)).toContainText('В App Store і Google Play');
  await page.goto('/about');
  await expect(page.getByTestId('page-about')).toContainText('FieldQuote — мій застосунок, уже в App Store і Google Play');
  await expect(page.getByTestId('page-about')).toContainText('Власний продукт FieldQuote — уже в App Store і Google Play.');
});

test('AC-3 [negative] немає «coming soon» / «незабаром» на жодній сторінці', async ({ page }) => {
  for (const lang of ['en', 'ua'] as const) {
    for (const path of ['/', '/work', '/about', '/contact']) {
      await openAt(page, path, 1440, lang);
      // Увесь видимий текст
      const text = await page.locator('body').innerText();
      expect(text, `${lang} ${path}`).not.toMatch(/coming soon|Google Play soon|незабаром/i);
    }
  }
});

for (const width of [320, 390, 1440]) {
  for (const lang of ['en', 'ua'] as const) {
    test(`AC-4 [responsive] /work ${width}px ${lang}: без скролу, кнопки в картці`, async ({ page }) => {
      await openAt(page, '/work', width, lang);
      // Межі картки
      const card = (await page.getByTestId('apps-card').boundingBox())!;
      for (const id of ['app-store-link', 'google-play-link', 'app-site-link']) {
        // Межі кнопки
        const b = (await page.getByTestId(id).boundingBox())!;
        expect(b.x, id).toBeGreaterThanOrEqual(card.x - 0.5);
        expect(b.x + b.width, id).toBeLessThanOrEqual(card.x + card.width + 0.5);
      }
      // Горизонтальний скрол сторінки
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(over).toBeLessThanOrEqual(0);
    });
  }
}

test('AC-4 [responsive] /work: layout-check на 3 ширинах (EN і UA)', async ({ page }, testInfo) => {
  for (const lang of ['en', 'ua'] as const) {
    await openAt(page, '/work', 1280, lang);
    await eachWidth(page, WIDTHS.smoke, async (w) => {
      await page.getByTestId('apps-card').scrollIntoViewIfNeeded();
      await checkLayout(page, testInfo, { name: `gp-work-${lang}-${w}`, ignore: IGNORE });
    });
  }
});
