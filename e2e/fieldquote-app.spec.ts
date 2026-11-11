import { test as base, expect, type Page } from '@playwright/test';
import { WIDTHS, eachWidth, checkLayout } from './_helpers/layout-checks';

/** Ключ localStorage зі стором налаштувань (тема й мова). */
const STORAGE_KEY = 'portfolio-settings';
/** Адреса App Store зі специфікації. */
const APP_STORE = 'https://apps.apple.com/us/app/fieldquote-invoices-quotes/id6822302139';
/** Адреса сайту застосунку зі специфікації. */
const SITE = 'https://fieldquote.org/';
/** Позиції телефонів у сцені. */
const POSITIONS = ['left', 'center', 'right'] as const;

/**
 * Фікстура: збирає помилки консолі й pageerror, після тесту вимагає порожній список.
 */
const test = base.extend<{ errors: string[] }>({
  errors: [
    async ({ page }, use) => {
      // Накопичувач помилок
      const errors: string[] = [];
      page.on('console', (m) => {
        // Навмисно перервані скриншоти дають мережеву помилку браузера - це очікувано
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
 * Відкриває адресу на заданій ширині з обраною мовою.
 * @param page - сторінка
 * @param path - адреса
 * @param width - ширина вікна
 * @param lang - мова інтерфейсу
 */
async function openAt(page: Page, path: string, width: number, lang: 'en' | 'ua' = 'en'): Promise<void> {
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(
    ([k, v]) => {
      // Записуємо лише при першому заході
      if (!localStorage.getItem(k)) localStorage.setItem(k, v);
    },
    [STORAGE_KEY, JSON.stringify({ state: { theme: 'dark', lang }, version: 0 })],
  );
  await page.goto(path);
  await expect(page.getByTestId('app-root')).toBeVisible();
}

/**
 * Скільки пікселів сторінка виходить за ширину вікна.
 * @param page - сторінка
 * @returns scrollWidth мінус clientWidth
 */
async function hOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

/** Навмисні накладання макета: нахилені телефони сцени та sticky-хедер над прокрученим контентом. */
const IGNORE = ['[data-testid="site-header"]', '[data-testid="site-header"] *', '[data-testid^="app-screen-"]'];

// ===================== AC-1 Скриншоти =====================

for (const width of [1440, 390]) {
  test(`AC-1 [happy] скриншоти на /work при ${width}px: видимі, завантажені, без blur, з alt`, async ({ page }) => {
    await openAt(page, '/work', width);
    // Прокручуємо до картки: сам <img> нахилений, і прокрутка до нього зависає
    await page.getByTestId('apps-card').scrollIntoViewIfNeeded();
    for (const pos of POSITIONS) {
      // Скриншот телефона
      const img = page.getByTestId(`app-screen-${pos}`);
      await expect(img).toBeVisible();
      await expect(img).toHaveAttribute('src', `/app/screen-${pos}.webp`);
      await expect.poll(() => img.evaluate((e: HTMLImageElement) => e.naturalWidth)).toBeGreaterThan(0);
      expect(await img.evaluate((e) => getComputedStyle(e).filter)).not.toContain('blur');
      expect(((await img.getAttribute('alt')) ?? '').trim().length).toBeGreaterThan(0);
    }
  });
}

test('AC-1 [negative] недоступний скриншот: у цьому телефоні заглушка, інші лишаються', async ({ page }) => {
  await page.route('**/app/screen-left.webp', (r) => r.abort());
  await openAt(page, '/work', 1440);
  await expect(page.getByTestId('app-screen-left-fallback')).toBeAttached();
  await expect(page.getByTestId('app-screen-center')).toBeVisible();
  await expect(page.getByTestId('app-screen-right')).toBeVisible();
});

test('AC-1 [state] UA: alt скриншотів українською', async ({ page }) => {
  await openAt(page, '/work', 1440, 'ua');
  await expect(page.getByTestId('app-screen-left')).toHaveAttribute('alt', 'FieldQuote — екран кошторису');
  await expect(page.getByTestId('app-screen-center')).toHaveAttribute('alt', 'FieldQuote — головний екран');
  await expect(page.getByTestId('app-screen-right')).toHaveAttribute('alt', 'FieldQuote — перегляд і підпис клієнта');
});

// ===================== AC-2 Картка FieldQuote =====================

test('AC-2 [happy] картка: заголовок, бейдж, посилання, Google Play не посилання', async ({ page }) => {
  await openAt(page, '/work', 1440);
  // Картка застосунків
  const card = page.getByTestId('apps-card');
  await expect(card).toContainText('FieldQuote');
  // Бейдж статусу
  const badge = page.getByTestId('app-live-badge');
  await expect(badge).toHaveText('On the App Store');
  expect(await badge.locator('*').evaluateAll((els) => els.map((e) => getComputedStyle(e, '::before').animationName))).not.toContain('blink');
  expect(await badge.evaluate((e) => getComputedStyle(e).animationName)).toBe('none');
  // Посилання-кнопки
  const store = page.getByTestId('app-store-link');
  // Посилання на сайт
  const site = page.getByTestId('app-site-link');
  await expect(store).toHaveAttribute('href', APP_STORE);
  await expect(site).toHaveAttribute('href', SITE);
  await expect(store).toHaveText(/Download on the App Store/);
  await expect(site).toHaveText(/fieldquote\.org/);
  for (const l of [store, site]) {
    await expect(l).toHaveAttribute('target', '_blank');
    await expect(l).toHaveAttribute('rel', /noopener/);
  }
  // Google Play: звичайний span без href
  const gp = page.getByTestId('google-play-soon');
  await expect(gp).toHaveText('Google Play — coming soon');
  expect(await gp.evaluate((e) => e.tagName + (e.closest('a') ? '-in-link' : ''))).toBe('SPAN');
  await expect(card).not.toContainText(/Status:|in App Store & Google Play review/i);
});

test('AC-2 [state] UA: тексти картки', async ({ page }) => {
  await openAt(page, '/work', 1440, 'ua');
  await expect(page.getByTestId('app-live-badge')).toHaveText('В App Store');
  await expect(page.getByTestId('app-store-link')).toContainText('Завантажити в App Store');
  await expect(page.getByTestId('google-play-soon')).toHaveText('Google Play — незабаром');
  await expect(page.getByTestId('apps-card')).toContainText('Кошторис на обʼєкті — оплата ще до відʼїзду. Офлайн iOS-застосунок для контракторів-одинаків');
});

// ===================== AC-3 Тексти =====================

test('AC-3 [happy] EN: Home плитка, About Now і досвід', async ({ page }) => {
  await openAt(page, '/', 1440);
  // Друга плитка робіт
  const tile = page.getByTestId('home-work-tile').nth(1);
  await expect(tile).toContainText('FieldQuote');
  await expect(tile).toContainText('Offline-first quotes, invoices and client signatures for contractors.');
  await expect(tile).toContainText('On the App Store · Google Play soon');
  await page.goto('/about');
  await expect(page.getByTestId('page-about')).toContainText('FieldQuote — my own iOS app, live on the App Store');
  await expect(page.getByTestId('page-about')).toContainText('Own product FieldQuote — live on the App Store, Google Play coming soon.');
});

test('AC-3 [happy] UA: Home плитка, About Now і досвід', async ({ page }) => {
  await openAt(page, '/', 1440, 'ua');
  // Друга плитка робіт
  const tile = page.getByTestId('home-work-tile').nth(1);
  await expect(tile).toContainText('FieldQuote');
  await expect(tile).toContainText('Офлайн-кошториси, інвойси та підпис клієнта для контракторів.');
  await expect(tile).toContainText('В App Store · Google Play незабаром');
  await page.goto('/about');
  await expect(page.getByTestId('page-about')).toContainText('FieldQuote — мій iOS-застосунок, уже в App Store');
  await expect(page.getByTestId('page-about')).toContainText('Власний продукт FieldQuote — уже в App Store, Google Play незабаром.');
});

test('AC-3 [negative] жодна сторінка не містить старих фраз про рев\'ю', async ({ page }) => {
  for (const lang of ['en', 'ua'] as const) {
    for (const path of ['/', '/work', '/about', '/contact']) {
      await openAt(page, path, 1440, lang);
      // Увесь видимий текст сторінки
      const text = await page.locator('body').innerText();
      expect(text, `${lang} ${path}`).not.toMatch(/Google Play review|In review|на рев'ю|на рев’ю|на ревʼю/);
    }
    await page.evaluate(() => localStorage.clear());
  }
});

// ===================== AC-4 Фото автора =====================

for (const path of ['/', '/about']) {
  test(`AC-4 [happy] ${path}: photo-img з /photo.webp завантажений`, async ({ page }) => {
    await openAt(page, path, 1440);
    // Видиме зображення фото (на About аватар прихований на десктопі)
    const img = page.getByTestId(path === '/' ? 'home-photo' : 'about-photo').getByTestId('photo-img');
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute('src', /\/photo\.webp$/);
    await expect.poll(() => img.evaluate((e: HTMLImageElement) => e.naturalWidth)).toBeGreaterThan(0);
  });
}

// ===================== AC-5 Без регресій / адаптивність =====================

for (const width of [320, 390, 1440]) {
  test(`AC-5 [happy] /work при ${width}px без горизонтального скролу`, async ({ page }) => {
    await openAt(page, '/work', width);
    await expect(page.getByTestId('apps-card')).toBeVisible();
    expect(await hOverflow(page)).toBeLessThanOrEqual(0);
  });
}

test('AC-5 [responsive] /work: картка FieldQuote і сцена на 3 ширинах (EN)', async ({ page }, testInfo) => {
  await openAt(page, '/work', 1280);
  await eachWidth(page, WIDTHS.smoke, async (w) => {
    await page.getByTestId('apps-card').scrollIntoViewIfNeeded();
    await checkLayout(page, testInfo, { name: `work-fieldquote-${w}`, ignore: IGNORE });
  });
});

test('AC-5 [responsive] /work: UA (довші підписи кнопок) на 3 ширинах', async ({ page }, testInfo) => {
  await openAt(page, '/work', 1280, 'ua');
  await eachWidth(page, WIDTHS.smoke, async (w) => {
    await checkLayout(page, testInfo, { name: `work-fieldquote-ua-${w}`, ignore: IGNORE });
  });
});

test('AC-5 [responsive] /work при 320px: кнопки дій у межах картки', async ({ page }) => {
  await openAt(page, '/work', 320, 'ua');
  // Межі картки й кнопок
  const card = (await page.getByTestId('apps-card').boundingBox())!;
  for (const id of ['app-store-link', 'app-site-link', 'google-play-soon']) {
    // Межі кнопки
    const b = (await page.getByTestId(id).boundingBox())!;
    expect(b.x, id).toBeGreaterThanOrEqual(card.x - 0.5);
    expect(b.x + b.width, id).toBeLessThanOrEqual(card.x + card.width + 0.5);
  }
});
