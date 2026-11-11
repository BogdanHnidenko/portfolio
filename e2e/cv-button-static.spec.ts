import { test, expect, type Page } from '@playwright/test';

/** Ключ localStorage зі збереженими налаштуваннями (тема/мова). */
const STORAGE_KEY = 'portfolio-settings';
/** Теми, у яких перевіряємо кнопки. */
const THEMES = ['dark', 'light'] as const;
/** Тест-ідентифікатори кнопок CV, на які поширюється зміна. */
const BUTTONS = ['cv-header', 'cv-hero'] as const;

/**
 * Відкриває сторінку із заданою темою і збирає помилки консолі.
 * @param page - сторінка
 * @param theme - тема
 * @returns масив помилок, який наповнюється під час тесту
 */
async function open(page: Page, theme: string): Promise<string[]> {
  // Накопичувач помилок консолі та сторінки
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [
    STORAGE_KEY,
    JSON.stringify({ state: { theme, lang: 'en' }, version: 0 }),
  ]);
  await page.goto('/');
  // Чекаємо завершення скінченних вхідних анімацій (rise) предків; нескінченні не чекаємо
  await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.timeline instanceof DocumentTimeline && a.effect?.getComputedTiming().iterations !== Infinity).map((a) => a.finished.catch(() => undefined))));
  return errors;
}

for (const theme of THEMES) {
  for (const id of BUTTONS) {
    test(`AC-1 [happy] ${id} без анімацій у спокої (${theme})`, async ({ page }) => {
      // Відкриваємо сторінку й чекаємо кнопку
      const errors = await open(page, theme);
      // Локатор кнопки CV
      const btn = page.getByTestId(id);
      await expect(btn).toBeVisible();
      await page.mouse.move(0, 0);
      // Активні анімації на елементі та псевдоелементах
      const count = await btn.evaluate((el) => el.getAnimations({ subtree: false }).length +
        ['::before', '::after'].reduce((n, p) => n + document.getAnimations().filter((a) => {
          // Цільовий елемент анімації
          const t = a.effect && (a.effect as KeyframeEffect).target;
          return t === el && (a.effect as KeyframeEffect).pseudoElement === p;
        }).length, 0));
      expect(count).toBe(0);
      // Два скриншоти з інтервалом 3 с мають збігатися
      // Знімаємо лише внутрішню (непрозору) частину кнопки: тло hero за краями власне дрейфує (heroGlow) і не належить кнопці
      const box = (await btn.boundingBox())!;
      // Область знімка всередині кнопки
      const clip = { x: box.x + 8, y: box.y + 8, width: box.width - 16, height: box.height - 16 };
      // Перший знімок
      const a = await page.screenshot({ clip });
      await page.waitForTimeout(3000);
      // Другий знімок
      const b = await page.screenshot({ clip });
      expect(b.equals(a)).toBe(true);
      expect(errors).toEqual([]);
    });

    test(`AC-2 [happy] ${id} оранжевий фон (${theme})`, async ({ page }) => {
      // Відкриваємо сторінку
      const errors = await open(page, theme);
      // Локатор кнопки CV
      const btn = page.getByTestId(id);
      await expect(btn).toBeVisible();
      // Фон кнопки та розрахований колір --accent2
      const { bg, accent } = await btn.evaluate((el) => {
        // Допоміжний елемент для обчислення кольору
        const probe = document.createElement('div');
        probe.style.background = 'var(--accent2)';
        el.parentElement!.appendChild(probe);
        // Обчислений колір --accent2
        const accentColor = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return { bg: getComputedStyle(el).backgroundColor, accent: accentColor };
      });
      expect(bg).toBe(accent);
      expect(bg).not.toBe('rgba(0, 0, 0, 0)');
      expect(errors).toEqual([]);
    });
  }
}

for (const id of BUTTONS) {
  test(`AC-3 [happy] ${id} hover піднімає і повертається`, async ({ page }) => {
    // Відкриваємо сторінку
    const errors = await open(page, 'dark');
    // Локатор кнопки CV
    const btn = page.getByTestId(id);
    await btn.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    // Стан у спокої
    const read = () => btn.evaluate((el) => ({ y: el.getBoundingClientRect().top, shadow: getComputedStyle(el).boxShadow }));
    // Стан кнопки у спокої
    const rest = await read();
    // Наводимо курсор
    await btn.hover();
    await expect.poll(async () => Math.round((rest.y - (await read()).y) * 10) / 10).toBe(1);
    expect((await read()).shadow).not.toBe(rest.shadow);
    // Відводимо курсор
    await page.mouse.move(0, 0);
    await expect.poll(async () => (await read()).y).toBeCloseTo(rest.y, 1);
    expect((await read()).shadow).toBe(rest.shadow);
    expect(errors).toEqual([]);
  });

  test(`AC-4 [happy] ${id} веде на /cv.pdf з download`, async ({ page }) => {
    // Відкриваємо сторінку й читаємо атрибути
    const errors = await open(page, 'dark');
    // Локатор кнопки CV
    const btn = page.getByTestId(id);
    await expect(btn).toHaveAttribute('href', '/cv.pdf');
    await expect(btn).toHaveAttribute('download', /.*/);
    expect(errors).toEqual([]);
  });
}
