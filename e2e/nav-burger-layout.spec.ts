import { test as base, expect, type Page } from '@playwright/test';
import { eachWidth, checkLayout } from './_helpers/layout-checks';

// Ключ localStorage зі стором налаштувань
const STORAGE_KEY = 'portfolio-settings';

// Сторінки сайту для перевірки горизонтального скролу
const PATHS = ['/', '/work', '/about', '/contact'];

// Мінімальний валідний вертикальний PNG 8x10, яким підміняємо /photo.webp
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAKCAIAAAAGpYjXAAAAEUlEQVR4nGM4UWGDFTEMdwkAK+B2wUa5V18AAAAASUVORK5CYII=',
  'base64',
);

/**
 * Тест із фікстурою: збирає помилки консолі й pageerror та вимагає, щоб їх не було.
 */
const test = base.extend<{ errors: string[] }>({
  errors: [
    async ({ page }, use) => {
      // Накопичувач повідомлень консолі
      const errors: string[] = [];
      page.on('console', (m) => {
        // Відсутній /photo.webp - очікувана мережева помилка, не помилка застосунку
        if (/Failed to load resource/.test(m.text()) && /photo\.webp/.test(m.location().url)) return;
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
 * Відкриває адресу на заданій ширині з англійською мовою й темною темою.
 * @param page - сторінка
 * @param path - адреса
 * @param width - ширина вікна
 * @param lang - мова інтерфейсу
 */
async function openAt(page: Page, path: string, width: number, lang: 'en' | 'ua' = 'en'): Promise<void> {
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(
    ([k, v]) => {
      // Записуємо лише при першому заході, щоб перезавантаження не затирало зміни
      if (!localStorage.getItem(k)) localStorage.setItem(k, v);
    },
    [STORAGE_KEY, JSON.stringify({ state: { theme: 'dark', lang }, version: 0 })],
  );
  await page.goto(path);
  await expect(page.getByTestId('app-root')).toBeVisible();
}

/**
 * Підмінює /photo.webp вертикальним зображенням.
 * @param page - сторінка
 */
async function mockPhoto(page: Page): Promise<void> {
  await page.route('**/photo.webp', (r) => r.fulfill({ status: 200, contentType: 'image/png', body: PNG }));
}

/**
 * Скільки пікселів сторінка виходить за ширину вікна.
 * @param page - сторінка
 * @returns scrollWidth мінус clientWidth кореня
 */
async function hOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

/**
 * Межі елемента за testid.
 * @param page - сторінка
 * @param id - data-testid
 * @param n - індекс, якщо елементів кілька
 * @returns boundingBox елемента
 */
async function box(page: Page, id: string, n = 0) {
  return (await page.getByTestId(id).nth(n).boundingBox())!;
}

test.describe('AC-1 пункт «Головна»', () => {
  test('AC-1 [happy] Home перший у меню, веде на /, активний лише на /', async ({ page }) => {
    await openAt(page, '/', 1440);
    // Перший пункт десктопного меню
    const first = page.getByTestId('nav-desktop').locator('a').first();
    await expect(first).toHaveAttribute('data-testid', 'nav-link-home');
    await expect(first).toHaveText('Home');
    await expect(first).toHaveAttribute('href', '/');
    await expect(first).toHaveAttribute('aria-current', 'page');
    await page.getByTestId('nav-link-work').click();
    await expect(page).toHaveURL(/\/work$/);
    await expect(page.getByTestId('nav-link-home')).not.toHaveAttribute('aria-current', 'page');
    await expect(page.getByTestId('nav-link-work')).toHaveAttribute('aria-current', 'page');
  });

  test('AC-1 [happy] UA: текст «Головна»', async ({ page }) => {
    await openAt(page, '/', 1440, 'ua');
    await expect(page.getByTestId('nav-link-home')).toHaveText('Головна');
  });
});

test.describe('AC-2 бургер', () => {
  for (const w of [390, 900]) {
    test(`AC-2 [responsive] на ${w} є бургер, немає nav-desktop і перемикачів у хедері`, async ({ page }) => {
      await openAt(page, '/', w);
      await expect(page.getByTestId('menu-toggle')).toBeVisible();
      await expect(page.getByTestId('nav-desktop')).toBeHidden();
      await expect(page.getByTestId('lang-en')).toBeHidden();
      await expect(page.getByTestId('theme-toggle')).toBeHidden();
      // Розмір кнопки 44x44
      const b = await box(page, 'menu-toggle');
      expect(Math.round(b.width)).toBe(44);
      expect(Math.round(b.height)).toBe(44);
    });
  }

  for (const w of [901, 1440]) {
    test(`AC-2 [responsive] на ${w} бургера немає`, async ({ page }) => {
      await openAt(page, '/', w);
      await expect(page.getByTestId('menu-toggle')).toBeHidden();
      await expect(page.getByTestId('nav-desktop')).toBeVisible();
    });
  }

  test('AC-2 [happy] відкриття, перехід на /about закриває панель, фокус', async ({ page }) => {
    await openAt(page, '/', 390);
    // Кнопка-бургер
    const toggle = page.getByTestId('menu-toggle');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toHaveAttribute('aria-label', 'Open menu');
    await toggle.click();
    await expect(page.getByTestId('mobile-menu')).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(toggle).toHaveAttribute('aria-label', 'Close menu');
    await page.getByTestId('mmenu-link-about').click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByTestId('mobile-menu')).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('AC-2 [happy] Esc, клік поза панеллю і повторний клік на бургер закривають; фокус на бургері', async ({ page }) => {
    await openAt(page, '/', 390);
    // Кнопка-бургер і панель
    const toggle = page.getByTestId('menu-toggle');
    // Панель меню
    const menu = page.getByTestId('mobile-menu');
    await toggle.click();
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(toggle).toBeFocused();
    await toggle.click();
    await expect(menu).toBeVisible();
    // Клік у нижню частину екрана, поза панеллю
    await page.mouse.click(195, 880);
    await expect(menu).toBeHidden();
    await toggle.click();
    await toggle.click();
    await expect(menu).toBeHidden();
  });

  test('AC-2 [happy] мова й тема в панелі: панель лишається відкритою', async ({ page }) => {
    await openAt(page, '/', 390);
    await page.getByTestId('menu-toggle').click();
    await page.getByTestId('menu-lang-ua').click();
    await expect(page.getByTestId('mobile-menu')).toBeVisible();
    await expect(page.getByTestId('mmenu-link-home')).toHaveText('Головна');
    await expect(page.getByTestId('menu-toggle')).toHaveAttribute('aria-label', 'Закрити меню');
    await expect(page.getByTestId('menu-lang-ua')).toHaveAttribute('aria-pressed', 'true');
    await page.getByTestId('menu-theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.getByTestId('mobile-menu')).toBeVisible();
  });

  test('AC-2 [interrupt] відкрита панель + розширення вікна до 1440 закриває її', async ({ page }) => {
    await openAt(page, '/', 390);
    await page.getByTestId('menu-toggle').click();
    await expect(page.getByTestId('mobile-menu')).toBeVisible();
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.getByTestId('mobile-menu')).toBeHidden();
    await expect(page.getByTestId('nav-desktop')).toBeVisible();
    // Повернення на вузьку ширину не відкриває панель сама
    await page.setViewportSize({ width: 390, height: 900 });
    await expect(page.getByTestId('mobile-menu')).toBeHidden();
  });

  test('AC-2 [state] відкрита панель блокує прокрутку сторінки', async ({ page }) => {
    await openAt(page, '/', 390);
    await page.getByTestId('menu-toggle').click();
    await page.mouse.wheel(0, 600);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('AC-2 [responsive] бургер і панель на 320/390/768/900', async ({ page }, testInfo) => {
    await openAt(page, '/', 320);
    await eachWidth(page, [320, 390, 768, 900], async (w) => {
      await page.getByTestId('menu-toggle').click();
      await expect(page.getByTestId('mobile-menu')).toBeVisible();
      // Панель - накладка поверх сторінки за задумом, тому її вміст з перевірки накладання виключаємо
      await checkLayout(page, testInfo, { name: `burger-open-${w}`, ignore: ['[data-testid="mobile-menu"]', '[data-testid="mobile-menu"] *'] });
      await page.keyboard.press('Escape');
    });
  });
});

test.describe('AC-3 рівна сітка Home', () => {
  for (const w of [1024, 800]) {
    test(`AC-3 [responsive] Home на ${w}: ряди без порожнеч`, async ({ page }, testInfo) => {
      await openAt(page, '/', w);
      // Межі intro
      const intro = await box(page, 'home-intro');
      // Межі фото
      const photo = await box(page, 'home-photo');
      expect(Math.abs(intro.y - photo.y)).toBeLessThan(3);
      // Intro і фото разом заповнюють ряд
      expect(photo.x).toBeGreaterThanOrEqual(intro.x + intro.width - 2);
      // Межі плитки Stack
      const stack = await box(page, 'home-stack-tile');
      // Межі плитки контактів
      const links = await box(page, 'home-links');
      expect(Math.abs(stack.y - links.y)).toBeLessThan(3);
      // Межі CTA
      const cta = await box(page, 'home-cta');
      expect(cta.y).toBeGreaterThanOrEqual(Math.max(stack.y + stack.height, links.y + links.height) - 2);
      // Ширина CTA збігається з шириною ряду Stack + Contact
      expect(cta.width).toBeGreaterThanOrEqual(stack.width + links.width - 2);
      // Межі AI-плитки
      const ai = await box(page, 'home-ai-tile');
      expect(ai.width).toBeGreaterThanOrEqual(cta.width - 2);
      // Плитки робіт в одному ряду
      const t0 = await box(page, 'home-work-tile', 0);
      // Межі третьої плитки робіт
      const t2 = await box(page, 'home-work-tile', 2);
      expect(Math.abs(t0.y - t2.y)).toBeLessThan(3);
      await checkLayout(page, testInfo, { name: `home-${w}` });
    });
  }

  test('AC-3 [responsive] Home на 390: усі плитки на всю ширину', async ({ page }) => {
    await openAt(page, '/', 390);
    // Ширина колонки визначається за CTA
    const full = (await box(page, 'home-cta')).width;
    for (const id of ['home-intro', 'home-photo', 'home-ai-tile', 'home-stack-tile', 'home-links']) {
      expect(Math.abs((await box(page, id)).width - full), id).toBeLessThan(3);
    }
    for (let i = 0; i < 3; i++) expect(Math.abs((await box(page, 'home-work-tile', i)).width - full)).toBeLessThan(3);
  });

  for (const w of [320, 390, 800, 1024, 1440]) {
    test(`AC-3 [responsive] без горизонтального скролу на ${w} на всіх сторінках`, async ({ page }) => {
      await openAt(page, '/', w);
      for (const p of PATHS) {
        await page.goto(p);
        await expect(page.getByTestId('app-root')).toBeVisible();
        expect(await hOverflow(page), `${p} @${w}`).toBeLessThanOrEqual(0);
      }
    });
  }
});

test.describe('AC-4 фото', () => {
  for (const w of [1440, 800]) {
    test(`AC-4 [happy] Home на ${w}: cover, позиція 20%, плитка вища за ширину`, async ({ page }) => {
      await mockPhoto(page);
      await openAt(page, '/', w);
      // Зображення фото
      const img = page.getByTestId('photo-img').first();
      await expect(img).toBeVisible();
      expect(await img.evaluate((e) => getComputedStyle(e).objectFit)).toBe('cover');
      // Вертикальна позиція обрізу, у відсотках
      const pos = await img.evaluate((e) => getComputedStyle(e).objectPosition);
      expect(pos.split(' ')[1]).toMatch(/^20%$|^\d+(\.\d+)?px$/);
      // Межі рамки фото
      const b = await box(page, 'home-photo');
      expect(b.height).toBeGreaterThan(b.width);
    });
  }

  test('AC-4 [happy] Home на 390: рамка 4:5', async ({ page }) => {
    await mockPhoto(page);
    await openAt(page, '/', 390);
    // Межі рамки фото
    const b = await box(page, 'home-photo');
    expect(Math.abs(b.height - (b.width * 5) / 4)).toBeLessThanOrEqual(2);
  });

  test('AC-4 [happy] без фото видно заглушку і бейдж', async ({ page }) => {
    await page.route('**/photo.webp', (r) => r.fulfill({ status: 404, body: 'nope' }));
    await openAt(page, '/', 1440);
    await expect(page.getByTestId('photo-placeholder').first()).toBeVisible();
    await expect(page.getByTestId('photo-badge')).toBeVisible();
  });
});


test.describe('AC-5 без регресій', () => {
  test('AC-5 [happy] «пігулок» немає на 390, старі testid прибрано, CV-кнопка в хедері на місці', async ({ page }) => {
    await openAt(page, '/', 390);
    await expect(page.getByTestId('nav-mobile')).toHaveCount(0);
    await expect(page.locator('[data-testid^="mnav-link-"]')).toHaveCount(0);
    await expect(page.getByTestId('cv-header')).toBeVisible();
    // Видимий текст кнопки (прихований варіант «Download CV» не рахується)
    expect((await page.getByTestId('cv-header').innerText()).trim()).toBe('CV');
  });
});
