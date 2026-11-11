import { test as base, expect, type Page } from '@playwright/test';
import { eachWidth, checkLayout, WIDTHS } from './_helpers/layout-checks';

/**
 * Тест із фікстурою: збирає помилки консолі й pageerror та вимагає, щоб їх не було.
 */
const test = base.extend<{ errors: string[] }>({
  errors: [
    async ({ page }, use) => {
      // Накопичувач повідомлень консолі
      const errors: string[] = [];
      page.on('console', (m) => {
        // Відсутній /photo.webp - очікувана мережева помилка
        if (/Failed to load resource/.test(m.text())) return;
        if (m.type() === 'error') errors.push(m.text());
      });
      page.on('pageerror', (e) => errors.push(e.message));
      await use(errors);
      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});

// Плитки головної: testid, індекс і очікуваний href та id цільового блоку
const TILES = [
  { id: 'home-work-tile', nth: 0, href: '/work#work-sky', target: 'work-sky', page: 'page-work' },
  { id: 'home-work-tile', nth: 1, href: '/work#work-apps', target: 'work-apps', page: 'page-work' },
  { id: 'home-work-tile', nth: 2, href: '/work#work-own', target: 'work-own', page: 'page-work' },
  { id: 'home-ai-tile', nth: 0, href: '/about#ai', target: 'ai', page: 'page-about' },
  { id: 'home-stack-tile', nth: 0, href: '/about#stack', target: 'stack', page: 'page-about' },
];

/**
 * Відкриває адресу на заданій ширині.
 * @param page - сторінка
 * @param path - адреса
 * @param width - ширина вікна
 */
async function open(page: Page, path: string, width = 1440): Promise<void> {
  await page.setViewportSize({ width, height: width < 600 ? 800 : 900 });
  await page.goto(path);
}

/**
 * Перевіряє, що верх блоку видно під sticky-хедером (або блок принаймні видимий, якщо сторінка коротка).
 * @param page - сторінка
 * @param id - id цільового блоку
 */
async function expectBlockVisible(page: Page, id: string): Promise<void> {
  // Чекаємо, поки позиція стабілізується після стрибка
  await page.waitForTimeout(400);
  // Геометрія блоку, хедера та прокрутки
  const g = await page.evaluate((i) => {
    // Цільовий блок
    const el = document.getElementById(i)!;
    // Геометрія sticky-хедера
    const hdr = document.querySelector('[data-testid="site-header"]')!.getBoundingClientRect();
    // Геометрія блоку
    const r = el.getBoundingClientRect();
    // Максимальна прокрутка сторінки
    const maxScroll = document.documentElement.scrollHeight - innerHeight;
    return { top: r.top, bottom: r.bottom, hdr: hdr.bottom, vh: innerHeight, scrollY, maxScroll, opacity: getComputedStyle(el).opacity };
  }, id);
  expect(g.top).toBeGreaterThanOrEqual(g.hdr - 2);
  expect(g.top).toBeLessThan(g.vh);
  // Якщо сторінка прокручується до кінця, блок не може бути нижче — перевіряємо верхню половину
  if (g.maxScroll - g.scrollY > 5) expect(g.top).toBeLessThan(g.vh / 2);
  expect(Number(g.opacity)).toBeGreaterThan(0.9);
}

test('AC-1 [happy] href плиток і посилань головної', async ({ page }) => {
  await open(page, '/');
  // Перевіряємо href кожної плитки
  for (const t of TILES) {
    await expect(page.getByTestId(t.id).nth(t.nth)).toHaveAttribute('href', t.href);
  }
  await expect(page.getByTestId('view-work')).toHaveAttribute('href', '/work');
  await expect(page.getByTestId('home-link-contacts')).toHaveAttribute('href', '/contact');
});

for (const t of TILES) {
  test(`AC-2 [happy] клік по плитці ${t.href}`, async ({ page }) => {
    await open(page, '/');
    // Клікаємо плитку й чекаємо потрібну адресу
    await page.getByTestId(t.id).nth(t.nth).click();
    await expect(page).toHaveURL(new RegExp(t.href.replace('#', '#') + '$'));
    await expect(page.getByTestId(t.page)).toBeVisible();
    await expectBlockVisible(page, t.target);
  });
}

for (const [path, target] of [['/work#work-apps', 'work-apps'], ['/about#stack', 'stack']]) {
  test(`AC-3 [navigation] прямий захід ${path}`, async ({ page }) => {
    await open(page, path);
    await expectBlockVisible(page, target);
    // Оновлення сторінки теж показує блок
    await page.reload();
    await expectBlockVisible(page, target);
  });
}

test('AC-4 [navigation] view-work і меню ведуть на початок', async ({ page }) => {
  await open(page, '/');
  await page.getByTestId('view-work').click();
  await expect(page).toHaveURL(/\/work$/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  // Пункт меню About з прокрученої сторінки
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }));
  await page.getByTestId('nav-link-about').click();
  await expect(page).toHaveURL(/\/about$/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
});

test('AC-5 [navigation] Назад відновлює позицію', async ({ page }) => {
  await open(page, '/');
  // Прокручуємо головну до плиток робіт
  await page.evaluate(() => window.scrollTo({ top: document.querySelector('[data-testid="home-work-tile"]')!.getBoundingClientRect().top + scrollY - 150, behavior: 'instant' }));
  await page.waitForTimeout(300);
  // Позиція прокрутки головної
  const homeY = await page.evaluate(() => scrollY);
  expect(homeY).toBeGreaterThan(100);
  await page.getByTestId('home-work-tile').nth(1).click();
  await expect(page).toHaveURL(/\/work#work-apps$/);
  await expectBlockVisible(page, 'work-apps');
  // Назад
  await page.goBack();
  await expect(page.getByTestId('page-home')).toBeVisible();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(homeY - 6);
  expect(Math.abs((await page.evaluate(() => scrollY)) - homeY)).toBeLessThanOrEqual(5);
});

test('AC-6 [navigation] Вперед повертає на позицію Work', async ({ page }) => {
  await open(page, '/');
  await page.evaluate(() => window.scrollTo({ top: document.querySelector('[data-testid="home-work-tile"]')!.getBoundingClientRect().top + scrollY - 150, behavior: 'instant' }));
  await page.waitForTimeout(300);
  await page.getByTestId('home-work-tile').nth(1).click();
  await expectBlockVisible(page, 'work-apps');
  // Позиція прокрутки Work
  const workY = await page.evaluate(() => scrollY);
  await page.goBack();
  await expect(page.getByTestId('page-home')).toBeVisible();
  // Вперед
  await page.goForward();
  await expect(page.getByTestId('page-work')).toBeVisible();
  await expect.poll(async () => Math.abs((await page.evaluate(() => scrollY)) - workY)).toBeLessThanOrEqual(5);
});

test('AC-7 [navigation] About -> Contact -> Назад', async ({ page }) => {
  await open(page, '/about');
  await page.evaluate(() => window.scrollTo({ top: 700, behavior: 'instant' }));
  await page.waitForTimeout(300);
  // Поточна позиція прокрутки
  const y = await page.evaluate(() => scrollY);
  expect(y).toBeGreaterThan(300);
  // Іменований пункт меню контактів
  await page.getByTestId('nav-link-contact').click();
  await expect(page).toHaveURL(/\/contact$/);
  await page.goBack();
  await expect(page.getByTestId('page-about')).toBeVisible();
  await expect.poll(async () => Math.abs((await page.evaluate(() => scrollY)) - y)).toBeLessThanOrEqual(5);
});

test('AC-8 [responsive] мобільний: плитка, бургер, Назад', async ({ page }) => {
  await open(page, '/', 375);
  // Прокручуємо до плитки FieldQuote й переходимо
  await page.evaluate(() => window.scrollTo({ top: document.querySelector('[data-testid="home-work-tile"]')!.getBoundingClientRect().top + scrollY - 100, behavior: 'instant' }));
  await page.waitForTimeout(300);
  // Позиція прокрутки головної
  const homeY = await page.evaluate(() => scrollY);
  await page.getByTestId('home-work-tile').nth(1).click();
  await expect(page).toHaveURL(/\/work#work-apps$/);
  await expectBlockVisible(page, 'work-apps');
  await page.goBack();
  await expect(page.getByTestId('page-home')).toBeVisible();
  await expect.poll(async () => Math.abs((await page.evaluate(() => scrollY)) - homeY)).toBeLessThanOrEqual(5);
  // Бургер-меню веде на початок сторінки
  await page.getByTestId('menu-toggle').click();
  await page.getByTestId('mmenu-link-work').click();
  await expect(page).toHaveURL(/\/work$/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
});

test('AC-2 [responsive] Work за якорем на 3 ширинах', async ({ page }, testInfo) => {
  // Кожна ширина: заходимо за якорем і перевіряємо верстку
  await eachWidth(page, WIDTHS.smoke, async (w) => {
    await open(page, '/work#work-apps', w);
    await expectBlockVisible(page, 'work-apps');
    await checkLayout(page, testInfo, { name: `work-anchor-${w}`, ignore: ['[data-testid="app-screen-left"]', '[data-testid="app-screen-right"]'] });
  });
});
