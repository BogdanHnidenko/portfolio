import { test as base, expect, type Page } from '@playwright/test';
import { eachWidth, checkLayout } from './_helpers/layout-checks';

// Ключ localStorage зі стором налаштувань
const STORAGE_KEY = 'portfolio-settings';

// Ширини для перевірки схеми AI-агентів (AC-2)
const FLOW_WIDTHS = [320, 390, 720, 768, 900, 1024, 1280, 1440, 1920];

// Допуск вирівнювання по центру, px
const CENTER_TOLERANCE = 4;

// Кількість кроків схеми
const STEPS_COUNT = 5;

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
 * Відкриває /about на заданій ширині з обраною мовою й темною темою.
 * @param page - сторінка
 * @param width - ширина вікна
 * @param lang - мова інтерфейсу
 */
async function openAbout(page: Page, width: number, lang: 'en' | 'ua' = 'en'): Promise<void> {
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(
    ([k, v]) => localStorage.setItem(k, v),
    [STORAGE_KEY, JSON.stringify({ state: { theme: 'dark', lang }, version: 0 })],
  );
  await page.goto('/about');
  await expect(page.getByTestId('about-head')).toBeVisible();
}

/**
 * Перевіряє, що 5 кроків схеми лежать у межах ai-flow без скролу.
 * @param page - сторінка
 * @param width - поточна ширина (для повідомлень)
 */
async function expectStepsInside(page: Page, width: number): Promise<void> {
  // Контейнер схеми й прокрутка кроків
  const flow = page.getByTestId('ai-flow');
  await flow.scrollIntoViewIfNeeded();
  // Рамка контейнера схеми
  const box = (await flow.boundingBox())!;
  // Локатор усіх кроків схеми
  const steps = page.getByTestId('ai-flow-step');
  await expect(steps).toHaveCount(STEPS_COUNT);
  for (let i = 0; i < STEPS_COUNT; i++) {
    // Рамка окремого кроку
    const b = (await steps.nth(i).boundingBox())!;
    expect(b.x, `w${width} step${i} left`).toBeGreaterThanOrEqual(box.x - 0.5);
    expect(b.x + b.width, `w${width} step${i} right`).toBeLessThanOrEqual(box.x + box.width + 0.5);
    await expect(steps.nth(i)).toBeVisible();
  }
  // Горизонтальний скрол у контейнері кроків
  const noScroll = await page
    .getByTestId('ai-flow-steps')
    .evaluate((el) => el.scrollWidth <= el.clientWidth + 1);
  expect(noScroll, `w${width} steps scroll`).toBe(true);
}

for (const lang of ['en', 'ua'] as const) {
  test(`AC-1 [happy] фото по центру відносно тексту (${lang})`, async ({ page }) => {
    for (const width of [1024, 1440]) {
      await openAbout(page, width, lang);
      // Відхилення центрів: чекаємо, поки завершиться анімація появи
      const measure = async (): Promise<number> => {
        // Рамка текстової колонки шапки
        const text = (await page.getByTestId('about-head').locator(':scope > *').first().boundingBox())!;
        // Рамка фото
        const photo = (await page.getByTestId('about-photo').boundingBox())!;
        // Умова AC: порівнюємо лише коли текст вищий за фото
        if (text.height <= photo.height) return 0;
        return Math.abs(text.y + text.height / 2 - (photo.y + photo.height / 2));
      };
      await expect.poll(measure, { message: `w${width}` }).toBeLessThanOrEqual(CENTER_TOLERANCE);
      // Рамка фото
      const photo = (await page.getByTestId('about-photo').boundingBox())!;
      // Пропорції 3:4
      expect(photo.width / photo.height).toBeCloseTo(0.75, 1);
    }
  });

  test(`AC-2 [happy] схема без обрізання на всіх ширинах (${lang})`, async ({ page }) => {
    await openAbout(page, 1440, lang);
    for (const width of FLOW_WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await expectStepsInside(page, width);
    }
  });
}

test('AC-3 [happy] режими схеми: ряд на 1920/1440, стовпчик на 390', async ({ page }) => {
  for (const width of [1920, 1440]) {
    await openAbout(page, width);
    // Центри кроків по вертикалі (без групи Build, яка вища)
    const steps = page.getByTestId('ai-flow-step');
    // Вертикальні центри кроків
    const centers: number[] = [];
    for (let i = 0; i < STEPS_COUNT; i++) {
      // Рамка окремого кроку
      const b = (await steps.nth(i).boundingBox())!;
      centers.push(b.y + b.height / 2);
    }
    expect(Math.max(...centers) - Math.min(...centers), `w${width} row`).toBeLessThanOrEqual(12);
  }
  await openAbout(page, 390);
  // Кроки один під одним: кожен нижче попереднього
  const steps = page.getByTestId('ai-flow-step');
  for (let i = 1; i < STEPS_COUNT; i++) {
    // Рамка попереднього кроку
    const prev = (await steps.nth(i - 1).boundingBox())!;
    // Рамка поточного кроку
    const cur = (await steps.nth(i).boundingBox())!;
    expect(cur.y, `step${i} below`).toBeGreaterThanOrEqual(prev.y + prev.height - 1);
  }
});

test('AC-4 [happy] немає горизонтального скролу /about', async ({ page }) => {
  for (const width of [320, 390, 1440]) {
    await openAbout(page, width);
    // Чи сторінка ширша за вікно
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(overflow, `w${width}`).toBe(false);
  }
});

test('AC-2 [responsive] About: шапка й схема', async ({ page }, testInfo) => {
  await openAbout(page, 1280);
  await eachWidth(page, [375, 768, 1280], async (width) => {
    await checkLayout(page, testInfo, { name: `about-${width}` });
  });
});

test('AC-3 [responsive] About UA: схема', async ({ page }, testInfo) => {
  await openAbout(page, 1280, 'ua');
  await eachWidth(page, [375, 768, 1280], async (width) => {
    await checkLayout(page, testInfo, { name: `about-ua-${width}` });
  });
});
