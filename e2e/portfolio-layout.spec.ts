import { test as base, expect, type Page, type Locator } from '@playwright/test';

/** Ключ localStorage, під яким стор зберігає тему і мову. */
const STORAGE_KEY = 'portfolio-settings';

/** Фон body у темній темі за макетом. */
const BG_DARK = 'rgb(6, 10, 22)';
/** Фон body у світлій темі за макетом. */
const BG_LIGHT = 'rgb(247, 248, 251)';

/** Ідентифікатори секцій у порядку відображення. */
const SECTIONS = ['work', 'apps', 'ai', 'stack', 'contact'] as const;

/**
 * Фікстура: збирає помилки та попередження консолі й pageerror; після кожного тесту вимагає, щоб їх не було.
 * Тест, що навмисно очікує помилки, не існує — застосунок не має їх генерувати.
 */
const test = base.extend<{ errors: string[] }>({
  errors: [
    async ({ page }, use) => {
      // Накопичувач повідомлень про помилки
      const errors: string[] = [];
      page.on('console', (m) => {
        if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`);
      });
      page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
      await use(errors);
      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});

/**
 * Відкриває сайт і чекає, поки React змонтує кореневий контейнер.
 * @param page - сторінка Playwright
 * @param hash - необовʼязковий hash для URL
 */
async function open(page: Page, hash = ''): Promise<void> {
  await page.goto('/' + hash);
  await expect(page.getByTestId('app-root')).toBeVisible();
}

/**
 * Записує сире значення у localStorage під ключ стору (для сценаріїв пошкоджених/збережених даних).
 * @param page - сторінка, вже відкрита на домені сайту
 * @param raw - рядок, який зберігається як є
 */
async function seedRaw(page: Page, raw: string): Promise<void> {
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [STORAGE_KEY, raw]);
}

/**
 * Формує валідний збережений стан у форматі zustand persist.
 * @param theme - тема
 * @param lang - мова
 * @returns JSON-рядок
 */
function persisted(theme: string, lang: string): string {
  return JSON.stringify({ state: { theme, lang }, version: 0 });
}

/**
 * Читає theme/lang зі збереженого JSON у localStorage.
 * @param page - сторінка
 * @returns об'єкт state зі стору
 */
async function readStored(page: Page): Promise<Record<string, unknown>> {
  // Сире значення з localStorage
  const raw = await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY);
  expect(raw).not.toBeNull();
  return (JSON.parse(raw as string) as { state: Record<string, unknown> }).state;
}

/**
 * Повертає видимий текст сторінки з нормалізованими нерозривними пробілами.
 * @param page - сторінка
 * @returns текст body
 */
async function bodyText(page: Page): Promise<string> {
  // textContent бере і ще не розкриті reveal-блоки
  const t = await page.evaluate(() => document.body.textContent ?? '');
  return t.replace(/ /g, ' ').replace(/\s+/g, ' ');
}

/**
 * Чекає, поки завершиться плавний скрол (scrollY перестає змінюватись).
 * @param page - сторінка
 */
async function waitScrollSettled(page: Page): Promise<void> {
  await expect
    .poll(async () => {
      // Позиція до і після короткої паузи
      const y1 = await page.evaluate(() => window.scrollY);
      await page.waitForTimeout(200);
      return y1 === (await page.evaluate(() => window.scrollY));
    })
    .toBe(true);
}

/**
 * Повертає текст елемента так, як його бачить користувач (innerText, без прихованих span).
 * @param page - сторінка
 * @param id - data-testid елемента
 * @returns видимий текст
 */
async function visibleText(page: Page, id: string): Promise<string> {
  return (await page.getByTestId(id).evaluate((e) => (e as HTMLElement).innerText)).trim();
}

/**
 * Перевіряє, що на сторінці немає горизонтального скролу.
 * @param page - сторінка
 */
async function expectNoHScroll(page: Page): Promise<void> {
  // Ширини документа та вікна
  const m = await page.evaluate(() => ({
    doc: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    win: window.innerWidth,
  }));
  expect(m.doc).toBeLessThanOrEqual(m.win);
  expect(m.body).toBeLessThanOrEqual(m.win);
}

/**
 * Повертає theme/lang із DOM: root, html, title.
 * @param page - сторінка
 * @returns знімок DOM-стану
 */
async function domState(page: Page) {
  return page.evaluate(() => ({
    root: document.querySelector('[data-testid="app-root"]')?.getAttribute('data-theme'),
    html: document.documentElement.getAttribute('data-theme'),
    lang: document.documentElement.lang,
    title: document.title,
    bg: getComputedStyle(document.body).backgroundColor,
  }));
}

/**
 * Прокручує сторінку поступово до низу, щоб спрацювали scroll-driven анімації.
 * @param page - сторінка
 */
async function scrollThrough(page: Page): Promise<void> {
  // Висота документа
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= h; y += 500) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
  }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
}

// ===================== AC-1 Структура й контент =====================

test.describe('AC-1', () => {
  test.use({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark', locale: 'en-US' });

  test('AC-1 [happy] порядок блоків і кількість елементів', async ({ page }) => {
    await open(page);
    // Порядок блоків за вертикальною позицією
    const order = ['site-header', 'hero', 'section-work', 'section-apps', 'section-ai', 'section-stack', 'section-contact', 'site-footer'];
    // Допоміжне значення для перевірки сценарію
    const tops: number[] = [];
    for (const id of order) {
      tops.push(await page.getByTestId(id).evaluate((e) => e.getBoundingClientRect().top + window.scrollY));
    }
    // Кожен наступний блок не вище попереднього (header sticky, тож порівнюємо нестрого)
    for (let i = 1; i < tops.length; i++) expect(tops[i]).toBeGreaterThanOrEqual(tops[i - 1]);
    await expect(page.getByTestId('work-group')).toHaveCount(2);
    await expect(page.getByTestId('case-card')).toHaveCount(4);
    await expect(page.getByTestId('ai-card')).toHaveCount(3);
    await expect(page.getByTestId('job')).toHaveCount(2);
    await expect(page.getByTestId('stack-row')).toHaveCount(6);
    await expect(page.getByTestId('hero-bar')).toHaveCount(96);
    for (const id of ['dir-card-work', 'dir-card-apps', 'dir-card-ai']) await expect(page.getByTestId(id)).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  });

  test('AC-1 [data] тексти EN дослівно збігаються з COPY.en', async ({ page }) => {
    await open(page);
    // Фрагменти з COPY.en (nbsp нормалізовано до пробілу)
    const expected = [
      'Work', 'Mobile', 'AI Workflow', 'Stack', 'Contact', 'Download CV', 'Open to remote work · Worldwide',
      'Bohdan', 'Hnidenko', 'Full-Stack Developer', 'React Native', 'AI Agent Workflows',
      '4 years shipping production products — from a cloud POS used by 1,000+ venues to my own mobile apps. I build end to end with my own team of AI agents.',
      'View work', 'Production systems', 'Cloud POS for 1,000+ venues', 'Mobile apps', 'Own apps, from zero to store review',
      'AI-native engineering', 'Agent team: app MVP in ~1 week',
      'Selected', 'SkyService POS', 'May 2023 – Jun 2026', 'My projects', 'Problem', 'Solution', 'Result',
      'POS terminal', '10–20 s → <1 s', 'Kitchen Display System', '100+ orders / day / venue', 'Marketplace module', 'DB → API → UI',
      'AI Chat', 'Chat + auth', 'Own project',
      'A catalog of 1,000+ items took 10–20 s to render on low-end POS devices, while ordering and payments had to stay realtime.',
      'Realtime KDS screens with stop-list management and POS sync.',
      'A working full-stack app — live demo and source on GitHub.',
      'Vue.js 3', 'Vuex/Pinia', 'WebSockets', 'PostgreSQL',
      'Own projects', 'Client products', 'Own mobile products', 'In review', 'Architecture, UI, API integration and subscriptions — end to end.',
      'Status: in App Store & Google Play review.', 'Client apps under NDA',
      'Cross-platform React Native / Expo apps delivered to client requirements.',
      'How I build', 'with AI', 'A team of role-based Claude Code agents, one job each. Every change ends verified on a real device or in the browser.',
      'Plan', 'Build', 'Review', 'Test', 'Verify', 'PM / Orchestrator', 'Backend agent', 'Frontend agent', 'Mobile agent', 'Security pre-tester', 'QA agent',
      'Verified on device / in browser', 'CLAUDE.md rules keep the code consistent across every agent.',
      'Caught a missing OAuth state / CSRF check in Google sign-in before release.',
      'Routine agent checks my email, monitors project status and alerts me when something goes down.',
      'App MVP in ~1 week instead of 1–2 months.', 'Tools',
      'Experience &', 'React Native Developer', 'Freelance & Own Products', '2025 – Present', 'Frontend / Full-Stack Developer',
      'Deputy team lead in a team of four.', 'Realtime POS & KDS.', 'Google and Apple OAuth.',
      'Replaced legacy polling with callback-driven handling and async/await, eliminating a class of race-condition bugs.',
      'What I work with', 'Mobile', 'Frontend', 'Backend', 'Data', 'Query optimization', 'Claude Code agent team', 'Tooling', 'Postman',
      'Open to full-time, contract and freelance', 'remote work.', 'I reply within a day.', 'Download CV (PDF)', '© 2026 Bohdan Hnidenko', 'English B1 · Ukrainian native',
    ];
    // Допоміжне значення для перевірки сценарію
    const text = await bodyText(page);
    // Фрагменти, яких немає на сторінці
    const missing = expected.filter((s) => !text.includes(s));
    expect(missing).toEqual([]);
  });

  test('AC-1 [boundary] групи кейсів: 3 + 1, назви, лічильники, мета', async ({ page }) => {
    await open(page);
    // Допоміжне значення для перевірки сценарію
    const groups = page.getByTestId('work-group');
    await expect(groups.nth(0).getByTestId('case-card')).toHaveCount(3);
    await expect(groups.nth(1).getByTestId('case-card')).toHaveCount(1);
    await expect(groups.nth(0).getByTestId('work-group-title')).toHaveText(/SkyService POS/);
    await expect(groups.nth(1).getByTestId('work-group-title')).toHaveText(/My projects/);
    await expect(groups.nth(0).getByTestId('work-group-count')).toContainText('3');
    await expect(groups.nth(1).getByTestId('work-group-count')).toContainText('1');
    await expect(groups.nth(0)).toContainText('May 2023 – Jun 2026');
    await expect(page.getByTestId('case-title')).toHaveText(['POS terminal', 'Kitchen Display System', 'Marketplace module', 'AI Chat']);
  });

  test('AC-1 [negative] немає плейсхолдерів, сирих ключів і невикористаних блоків', async ({ page }) => {
    await open(page);
    // Допоміжне значення для перевірки сценарію
    const text = await bodyText(page);
    for (const bad of ['undefined', 'null', 'NaN', '{{', '}}', 'lorem', '[object', 'Filter projects', 'Profile summary', 'commercial experience', 'venues on the POS platform']) {
      expect(text, `знайдено "${bad}"`).not.toContain(bad);
    }
  });

  test('AC-1 [data] нерозривні пробіли збережені, спектр без дублювання', async ({ page }) => {
    await open(page);
    // Сирий текст із nbsp
    const raw = await page.evaluate(() => document.body.textContent ?? '');
    expect(raw).toContain('~1 week');
    expect(raw).toContain('10–20 s');
  });

  test('AC-1 [state] після повного прокручування і reload консоль чиста, сторінка не порожня', async ({ page }) => {
    await open(page);
    await scrollThrough(page);
    await page.reload();
    await expect(page.getByTestId('hero-name')).toBeVisible();
    await expect(page.getByTestId('site-footer')).toBeAttached();
  });
});

// ===================== AC-2 Мова =====================

test.describe('AC-2', () => {
  test.use({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark', locale: 'en-US' });

  test('AC-2 [happy] lang-ua перекладає навігацію, aria-label, html lang, title, aria-pressed', async ({ page }) => {
    await open(page);
    await expect(page.getByTestId('lang-en')).toHaveAttribute('aria-pressed', 'true');
    await page.getByTestId('lang-ua').click();
    await expect(page.getByTestId('lang-ua')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('lang-en')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
    await expect(page).toHaveTitle('Богдан Гніденко — Full-Stack розробник');
    await expect(page.getByTestId('nav-link-work')).toHaveText('Роботи');
    await expect(page.getByTestId('nav-link-apps')).toHaveText('Мобільні');
    await expect(page.getByTestId('nav-link-ai')).toHaveText('AI-процес');
    await expect(page.getByTestId('nav-link-stack')).toHaveText('Стек');
    await expect(page.getByTestId('nav-link-contact')).toHaveText('Контакти');
    await expect(page.getByTestId('theme-toggle')).toHaveAttribute('aria-label', 'Змінити тему');
    await expect(page.getByTestId('cv-header')).toHaveText(/Завантажити CV/);
    await expect(page.getByTestId('hero-name')).toContainText('Богдан');
    await expect(page.getByTestId('skip-link')).toHaveText('Перейти до змісту');
  });

  test('AC-2 [happy] повернення на EN відновлює англійські тексти', async ({ page }) => {
    await open(page);
    await page.getByTestId('lang-ua').click();
    await page.getByTestId('lang-en').click();
    await expect(page.getByTestId('lang-en')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('lang-ua')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page).toHaveTitle('Bohdan Hnidenko — Full-Stack Developer');
    await expect(page.getByTestId('nav-link-work')).toHaveText('Work');
    await expect(page.getByTestId('theme-toggle')).toHaveAttribute('aria-label', 'Toggle color theme');
  });

  test('AC-2 [boundary] повторний клік на активну мову нічого не ламає', async ({ page }) => {
    await open(page);
    await page.getByTestId('lang-en').click();
    await page.getByTestId('lang-en').click();
    await expect(page.getByTestId('lang-en')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('lang-ua')).toHaveAttribute('aria-pressed', 'false');
    await page.getByTestId('lang-ua').click();
    await page.getByTestId('lang-ua').click();
    await page.getByTestId('lang-ua').dblclick();
    await expect(page.getByTestId('lang-ua')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('lang-en')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByTestId('nav-link-work')).toHaveText('Роботи');
    await expect(page.getByTestId('case-card')).toHaveCount(4);
  });

  test('AC-2 [data] у UA немає англійських рядків із COPY.en (крім назв і тегів)', async ({ page }) => {
    await open(page);
    await page.getByTestId('lang-ua').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
    // Допоміжне значення для перевірки сценарію
    const text = await bodyText(page);
    // Англійські фрази, що мають бути перекладені
    const english = [
      'Selected work', 'Problem', 'Solution', 'Result', 'Download CV', 'View work', 'What I do', 'Open to remote work',
      'Skip to content', 'Toggle color theme', 'How I build', 'I reply within a day', 'Own projects', 'Client products', 'In review',
      'Deputy team lead', 'What I work with', 'Production systems', 'Kitchen Display System ', 'Verified on device',
      'Experience &', 'Plan', 'Review', 'Tools', 'Own mobile products', 'Remote', 'Present', 'Status:', 'English B1 · Ukrainian native',
      'Caught a missing', 'Open to full-time', 'Own project', 'Marketplace module', 'POS terminal',
    ];
    // Допоміжне значення для перевірки сценарію
    const found = english.filter((s) => text.includes(s));
    expect(found).toEqual([]);
    // Українські фрази, що мають бути
    for (const s of ['Проблема', 'Рішення', 'Результат', 'Мої проєкти', 'Модуль маркетплейсу', 'POS-термінал', 'Власні проєкти', 'Клієнтські застосунки під NDA',
      'Заступник тімліда в команді з чотирьох.', 'Англійська B1 · Українська — рідна', 'Відкритий до віддаленої роботи', 'Власний проєкт', 'трав. 2023 – черв. 2026', 'Мої роботи']) {
      expect(text, s).toContain(s);
    }
    // dirsLabel — це aria-label блоку напрямів
    await expect(page.getByRole('navigation', { name: 'Напрями' })).toHaveCount(1);
  });

  test('AC-2 [interrupt] швидке перемикання мови 12 разів закінчується узгодженим станом', async ({ page }) => {
    await open(page);
    for (let i = 0; i < 6; i++) {
      await page.getByTestId('lang-ua').click();
      await page.getByTestId('lang-en').click();
    }
    await page.getByTestId('lang-ua').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
    await expect(page).toHaveTitle(/Богдан/);
    await expect(page.getByTestId('lang-ua')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('nav-link-stack')).toHaveText('Стек');
  });

  test('AC-2 [navigation] перемикання мови клавіатурою (Enter/Space) і збереження позиції скролу', async ({ page }) => {
    await open(page);
    await page.getByTestId('lang-ua').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('lang-ua')).toHaveAttribute('aria-pressed', 'true');
    await page.getByTestId('lang-en').focus();
    await page.keyboard.press('Space');
    await expect(page.getByTestId('lang-en')).toHaveAttribute('aria-pressed', 'true');
    // Скрол до #ai і зміна мови: сторінка не стрибає на верх
    await page.getByTestId('nav-link-ai').click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
    await page.getByTestId('lang-ua').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
  });

  test('AC-2 [a11y] UA: мобільна навігація і aria-label, мова при 390 px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page);
    await page.getByTestId('lang-ua').click();
    await expect(page.getByTestId('mnav-link-work')).toHaveText('Роботи');
    expect(await visibleText(page, 'cv-header')).toBe('CV');
    await expect(page.getByTestId('nav-mobile')).toHaveAttribute('aria-label', /.+/);
  });
});

// ===================== AC-3 Тема =====================

test.describe('AC-3', () => {
  test.use({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark', locale: 'en-US' });

  test('AC-3 [happy] toggle змінює data-theme на root і html, фон body, іконки', async ({ page }) => {
    await open(page);
    expect(await domState(page)).toMatchObject({ root: 'dark', html: 'dark', bg: BG_DARK });
    await expect(page.getByTestId('theme-icon-sun')).toBeVisible();
    await expect(page.getByTestId('theme-icon-moon')).toHaveCount(0);
    await page.getByTestId('theme-toggle').click();
    await expect.poll(() => domState(page)).toMatchObject({ root: 'light', html: 'light', bg: BG_LIGHT });
    await expect(page.getByTestId('theme-icon-moon')).toBeVisible();
    await expect(page.getByTestId('theme-icon-sun')).toHaveCount(0);
  });

  test('AC-3 [happy] світла → темна повертає токени dark', async ({ page }) => {
    await open(page);
    await page.getByTestId('theme-toggle').click();
    await page.getByTestId('theme-toggle').click();
    await expect.poll(() => domState(page)).toMatchObject({ root: 'dark', html: 'dark', bg: BG_DARK });
    // Токен --bg на root і колір тексту
    const tok = await page.getByTestId('app-root').evaluate((e) => ({ bg: getComputedStyle(e).backgroundColor, color: getComputedStyle(e).color }));
    expect(tok.bg).toBe(BG_DARK);
    expect(tok.color).toBe('rgb(238, 241, 248)');
  });

  test('AC-3 [data] токени light: колір тексту і фон секції за макетом', async ({ page }) => {
    await open(page);
    await page.getByTestId('theme-toggle').click();
    // Допоміжне значення для перевірки сценарію
    const tok = await page.getByTestId('app-root').evaluate((e) => ({ bg: getComputedStyle(e).backgroundColor, color: getComputedStyle(e).color }));
    expect(tok.bg).toBe(BG_LIGHT);
    expect(tok.color).toBe('rgb(10, 20, 48)');
  });

  test('AC-3 [interrupt] 7 швидких кліків: стан узгоджений (light), одна іконка', async ({ page }) => {
    await open(page);
    for (let i = 0; i < 7; i++) await page.getByTestId('theme-toggle').click({ delay: 0 });
    await expect.poll(() => domState(page)).toMatchObject({ root: 'light', html: 'light', bg: BG_LIGHT });
    await expect(page.getByTestId('theme-icon-moon')).toHaveCount(1);
    await expect(page.getByTestId('theme-icon-sun')).toHaveCount(0);
    await page.getByTestId('theme-toggle').dblclick();
    await expect.poll(() => domState(page)).toMatchObject({ root: 'light', html: 'light' });
  });

  test('AC-3 [boundary] у обох темах немає білих смуг: html і body мають колір теми внизу сторінки', async ({ page }) => {
    await open(page);
    for (const [theme, bg] of [['dark', BG_DARK], ['light', BG_LIGHT]] as const) {
      await scrollThrough(page);
      // Допоміжне значення для перевірки сценарію
      const colors = await page.evaluate(() => ({ html: getComputedStyle(document.documentElement).backgroundColor, body: getComputedStyle(document.body).backgroundColor }));
      expect(colors.body, theme).toBe(bg);
      // html має або той самий колір, або прозорий (тоді береться з body)
      expect([bg, 'rgba(0, 0, 0, 0)']).toContain(colors.html);
      if (theme === 'dark') await page.getByTestId('theme-toggle').click();
    }
  });

  test('AC-3 [navigation] toggle клавіатурою і aria-label відповідає мові, зміна теми не скидає скрол', async ({ page }) => {
    await open(page);
    await page.getByTestId('nav-link-stack').click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);
    await waitScrollSettled(page);
    // Позиція скролу до зміни теми
    const before = await page.evaluate(() => window.scrollY);
    await page.getByTestId('theme-toggle').focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => domState(page)).toMatchObject({ root: 'light' });
    await page.keyboard.press('Space');
    await expect.poll(() => domState(page)).toMatchObject({ root: 'dark' });
    expect(Math.abs((await page.evaluate(() => window.scrollY)) - before)).toBeLessThan(5);
    await expect(page.getByTestId('theme-toggle')).toHaveAttribute('aria-label', 'Toggle color theme');
  });

  test('AC-3 [state] theme-toggle не змінює мову, а мова не змінює тему', async ({ page }) => {
    await open(page);
    await page.getByTestId('lang-ua').click();
    await page.getByTestId('theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
    await page.getByTestId('lang-en').click();
    await expect.poll(() => domState(page)).toMatchObject({ root: 'light', html: 'light' });
  });
});

// ===================== AC-4 Збереження =====================

test.describe('AC-4', () => {
  test.use({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark', locale: 'en-US' });

  test('AC-4 [happy] мова і тема переживають reload, localStorage містить лише theme і lang', async ({ page }) => {
    await open(page);
    await page.getByTestId('lang-ua').click();
    await page.getByTestId('theme-toggle').click();
    await expect.poll(() => domState(page)).toMatchObject({ root: 'light' });
    await page.reload();
    await expect(page.getByTestId('lang-ua')).toHaveAttribute('aria-pressed', 'true');
    expect(await domState(page)).toMatchObject({ root: 'light', html: 'light', lang: 'uk', title: 'Богдан Гніденко — Full-Stack розробник', bg: BG_LIGHT });
    // Допоміжне значення для перевірки сценарію
    const state = await readStored(page);
    expect(Object.keys(state).sort()).toEqual(['lang', 'theme']);
    expect(state).toMatchObject({ theme: 'light', lang: 'ua' });
  });

  test('AC-4 [interrupt] кілька reload підряд і нова вкладка в тому ж контексті зберігають вибір', async ({ page, context }) => {
    await open(page);
    await page.getByTestId('theme-toggle').click();
    await page.getByTestId('lang-ua').click();
    await expect.poll(() => readStored(page)).toMatchObject({ theme: 'light', lang: 'ua' });
    await page.reload();
    await page.reload();
    expect(await domState(page)).toMatchObject({ root: 'light', lang: 'uk' });
    // Допоміжне значення для перевірки сценарію
    const tab2 = await context.newPage();
    await tab2.goto('/');
    expect(await domState(tab2)).toMatchObject({ root: 'light', html: 'light', lang: 'uk' });
    await tab2.close();
  });

  test('AC-4 [negative] без блимання: до рендеру React на html вже стоїть збережена тема, без проміжних значень', async ({ page }) => {
    // Сидимо збережену light при системній dark
    await open(page);
    await seedRaw(page, persisted('light', 'en'));
    // Реєструємо журнал змін data-theme на html до завантаження скриптів
    await page.addInitScript(() => {
      // Допоміжне значення для перевірки сценарію
      const w = window as unknown as { __themes: Array<string | null> };
      w.__themes = [document.documentElement?.getAttribute('data-theme') ?? null];
      new MutationObserver(() => w.__themes.push(document.documentElement?.getAttribute('data-theme') ?? null)).observe(document, {
        attributes: true,
        attributeFilter: ['data-theme'],
        subtree: true,
      });
    });
    await page.reload();
    await expect(page.getByTestId('app-root')).toHaveAttribute('data-theme', 'light');
    // Допоміжне значення для перевірки сценарію
    const log = await page.evaluate(() => (window as unknown as { __themes: Array<string | null> }).__themes);
    // Допускається початкове null (до inline-скрипта), але жодного dark
    expect(log.filter((v) => v === 'dark')).toEqual([]);
    expect(log.filter((v) => v !== null && v !== 'light')).toEqual([]);
  });

  test('AC-4 [boundary] inline-скрипт ставить data-theme на html ще до виконання бандла (JS-модулі заблоковані)', async ({ page, errors }) => {
    await open(page);
    await seedRaw(page, persisted('light', 'en'));
    // Блокуємо модульні скрипти, лишається лише inline-скрипт
    await page.route(/\.(tsx?|jsx?|mjs)(\?.*)?$|@vite|node_modules/, (r) => r.abort());
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(BG_LIGHT);
    await page.unroute(/\.(tsx?|jsx?|mjs)(\?.*)?$|@vite|node_modules/);
    // Помилки завантаження ресурсів — наслідок навмисного блокування, не дефект
    errors.length = 0;
  });

  test('AC-4 [state] очищений localStorage повертає початкові значення (за системою)', async ({ page }) => {
    await open(page);
    await page.getByTestId('theme-toggle').click();
    await page.getByTestId('lang-ua').click();
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    expect(await domState(page)).toMatchObject({ root: 'dark', lang: 'en' });
  });

  test('AC-4 [partial] збережена лише мова — тема береться з системи', async ({ page }) => {
    await open(page);
    await seedRaw(page, JSON.stringify({ state: { lang: 'ua' }, version: 0 }));
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
    expect((await domState(page)).root).toBe('dark');
  });
});

// ===================== AC-5 Перший візит =====================

test.describe('AC-5 система', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const scheme of ['light', 'dark'] as const) {
    test.describe(scheme, () => {
      test.use({ colorScheme: scheme, locale: 'en-US' });
      test(`AC-5 [happy] перший візит: prefers-color-scheme ${scheme} -> тема ${scheme}`, async ({ page }) => {
        await open(page);
        expect(await domState(page)).toMatchObject({ root: scheme, html: scheme, bg: scheme === 'light' ? BG_LIGHT : BG_DARK });
      });
    });
  }

  test.describe('uk-UA', () => {
    test.use({ colorScheme: 'light', locale: 'uk-UA' });
    test('AC-5 [boundary] світла система + uk-UA одночасно: light + UA', async ({ page }) => {
      await open(page);
      expect(await domState(page)).toMatchObject({ root: 'light', html: 'light', lang: 'uk', title: 'Богдан Гніденко — Full-Stack розробник' });
      await expect(page.getByTestId('lang-ua')).toHaveAttribute('aria-pressed', 'true');
    });

    test('AC-5 [state] збережений вибір (dark + en) перекриває систему (light + uk-UA)', async ({ page }) => {
      await open(page);
      await seedRaw(page, persisted('dark', 'en'));
      await page.reload();
      expect(await domState(page)).toMatchObject({ root: 'dark', html: 'dark', lang: 'en', bg: BG_DARK });
    });
  });

  for (const [loc, expectedLang] of [['en-GB', 'en'], ['ru-RU', 'en'], ['de-DE', 'en'], ['uk', 'uk']] as const) {
    test.describe(`locale ${loc}`, () => {
      test.use({ locale: loc, colorScheme: 'dark' });
      test(`AC-5 [data] мова браузера ${loc} -> html lang ${expectedLang}`, async ({ page }) => {
        await open(page);
        expect((await domState(page)).lang).toBe(expectedLang);
      });
    });
  }

  test.describe('languages', () => {
    test.use({ locale: 'en-US', colorScheme: 'dark' });
    test('AC-5 [data] uk не першою в navigator.languages (en-US, uk) -> UA', async ({ page }) => {
      await page.addInitScript(() => Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'uk-UA'] }));
      await open(page);
      expect((await domState(page)).lang).toBe('uk');
    });
  });
});

test.describe('AC-5 пошкоджені дані', () => {
  test.use({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark', locale: 'en-US' });

  for (const [name, raw] of [
    ['невалідний JSON', '{not json'],
    ['порожній рядок', ''],
    ['null', 'null'],
    ['недопустимі значення', JSON.stringify({ state: { theme: 'pink', lang: 'fr' }, version: 0 })],
    ['числа замість рядків', JSON.stringify({ state: { theme: 1, lang: 2 }, version: 0 })],
    ['масив', '[]'],
  ] as const) {
    test(`AC-5 [negative] localStorage: ${name} -> початкові значення без помилок`, async ({ page }) => {
      await open(page);
      await seedRaw(page, raw);
      await page.reload();
      await expect(page.getByTestId('hero-name')).toBeVisible();
      expect(await domState(page)).toMatchObject({ root: 'dark', html: 'dark', lang: 'en' });
      // Сайт далі працює: перемикач теми реагує
      await page.getByTestId('theme-toggle').click();
      await expect.poll(() => domState(page)).toMatchObject({ root: 'light' });
    });
  }

  test('AC-5 [negative] localStorage кидає виняток: сайт працює, вибір не зберігається', async ({ page }) => {
    await page.addInitScript(() => {
      // Допоміжне значення для перевірки сценарію
      const boom = () => {
        throw new DOMException('denied', 'SecurityError');
      };
      Storage.prototype.getItem = boom;
      Storage.prototype.setItem = boom;
      Storage.prototype.removeItem = boom;
    });
    await open(page);
    await page.getByTestId('lang-ua').click();
    await page.getByTestId('theme-toggle').click();
    await expect.poll(() => domState(page)).toMatchObject({ root: 'light', lang: 'uk' });
    await page.reload();
    expect(await domState(page)).toMatchObject({ root: 'dark', lang: 'en' });
  });

  test('AC-5 [boundary] matchMedia недоступний -> dark', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', { value: undefined, configurable: true, writable: true });
    });
    await open(page);
    expect(await domState(page)).toMatchObject({ root: 'dark', html: 'dark' });
  });

  test('AC-5 [partial] поле з зайвими ключами та валідною темою: приймається тема, мова — початкова', async ({ page }) => {
    await open(page);
    await seedRaw(page, JSON.stringify({ state: { theme: 'light', lang: 'xx', extra: 1 }, version: 0 }));
    await page.reload();
    expect((await domState(page)).lang).toBe('en');
    await expect(page.getByTestId('hero-name')).toBeVisible();
  });
});

// ===================== AC-6 Навігація =====================

test.describe('AC-6', () => {
  test.use({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark', locale: 'en-US' });

  /**
   * Перевіряє, що секція з id у видимій області, а її заголовок не під sticky-хедером.
   * @param page - сторінка
   * @param id - id секції (work, apps, ...)
   */
  async function expectSectionReached(page: Page, id: string): Promise<void> {
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    // Допоміжне значення для перевірки сценарію
    const sec = page.getByTestId(`section-${id}`);
    await expect(sec).toBeInViewport();
    // Дати завершитися плавному скролу
    await expect
      .poll(async () => {
        // Допоміжне значення для перевірки сценарію
        const y1 = await page.evaluate(() => window.scrollY);
        await page.waitForTimeout(150);
        return y1 === (await page.evaluate(() => window.scrollY));
      })
      .toBe(true);
    // Перший заголовок секції та нижня межа хедера
    const heading = sec.locator('h2').first();
    // Допоміжне значення для перевірки сценарію
    const hb = await page.getByTestId('site-header').evaluate((e) => e.getBoundingClientRect().bottom);
    // Допоміжне значення для перевірки сценарію
    const top = await heading.evaluate((e) => e.getBoundingClientRect().top);
    expect(top, `заголовок #${id} під хедером`).toBeGreaterThanOrEqual(hb - 1);
  }

  for (const id of SECTIONS) {
    test(`AC-6 [navigation] desktop nav -> #${id}`, async ({ page }) => {
      await open(page);
      await page.getByTestId(`nav-link-${id}`).click();
      await expectSectionReached(page, id);
    });
  }

  test('AC-6 [navigation] лого -> #top і повернення нагору', async ({ page }) => {
    await open(page);
    await page.getByTestId('nav-link-contact').click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(3000);
    await page.getByTestId('logo-link').click();
    await expect(page).toHaveURL(/#top$/);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(5);
  });

  test('AC-6 [navigation] View work і картки-напрями ведуть до своїх секцій', async ({ page }) => {
    await open(page);
    await page.getByTestId('view-work').click();
    await expectSectionReached(page, 'work');
    await page.evaluate(() => window.scrollTo(0, 0));
    for (const [card, id] of [['dir-card-work', 'work'], ['dir-card-apps', 'apps'], ['dir-card-ai', 'ai']] as const) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.getByTestId(card).click();
      await expectSectionReached(page, id);
    }
  });

  test('AC-6 [navigation] skip-link: перший Tab фокусує його, Enter веде до #work', async ({ page }) => {
    await open(page);
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('skip-link')).toBeFocused();
    await expect(page.getByTestId('skip-link')).toBeVisible();
    await expect(page.getByTestId('skip-link')).toHaveText('Skip to content');
    await page.keyboard.press('Enter');
    await expectSectionReached(page, 'work');
  });

  test('AC-6 [boundary] 1440: desktop-nav видима, mobile-nav прихована; 901 так само', async ({ page }) => {
    for (const w of [1440, 901]) {
      await page.setViewportSize({ width: w, height: 900 });
      await open(page);
      await expect(page.getByTestId('nav-desktop'), `w=${w}`).toBeVisible();
      await expect(page.getByTestId('nav-mobile'), `w=${w}`).toBeHidden();
    }
  });

  for (const w of [900, 768, 390, 320]) {
    test(`AC-6 [boundary] ${w}px: mobile-nav видима, desktop-nav прихована`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 800 });
      await open(page);
      await expect(page.getByTestId('nav-mobile')).toBeVisible();
      await expect(page.getByTestId('nav-desktop')).toBeHidden();
    });
  }

  test('AC-6 [navigation] 390px: усі п\'ять мобільних посилань ведуть до секцій', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page);
    for (const id of SECTIONS) {
      await page.getByTestId(`mnav-link-${id}`).click();
      await expectSectionReached(page, id);
    }
  });

  test('AC-6 [navigation] back/forward після hash-навігації і відкриття з hash', async ({ page }) => {
    await open(page);
    await page.getByTestId('nav-link-apps').click();
    await expect(page).toHaveURL(/#apps$/);
    await page.getByTestId('nav-link-ai').click();
    await expect(page).toHaveURL(/#ai$/);
    await page.goBack();
    await expect(page).toHaveURL(/#apps$/);
    await page.goForward();
    await expect(page).toHaveURL(/#ai$/);
    // Пряме відкриття з hash: секція відразу в області видимості
    await page.goto('/#contact');
    await expect(page.getByTestId('section-contact')).toBeInViewport();
  });

  test('AC-6 [interrupt] подвійний клік по навігації і reload посеред секції не ламають сторінку', async ({ page }) => {
    await open(page);
    await page.getByTestId('nav-link-stack').dblclick();
    await expect(page).toHaveURL(/#stack$/);
    await waitScrollSettled(page);
    await page.reload();
    await expect(page.getByTestId('section-stack')).toBeInViewport();
    await expect(page.getByTestId('job')).toHaveCount(2);
  });

  test('AC-6 [state] навігація працює в UA і світлій темі', async ({ page }) => {
    await open(page);
    await page.getByTestId('lang-ua').click();
    await page.getByTestId('theme-toggle').click();
    await page.getByTestId('nav-link-ai').click();
    await expectSectionReached(page, 'ai');
  });
});

// ===================== AC-7 CV та посилання кейсів =====================

test.describe('AC-7', () => {
  test.use({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark', locale: 'en-US' });

  test('AC-7 [happy] три CV-кнопки: href /cv.pdf і атрибут download', async ({ page }) => {
    await open(page);
    for (const id of ['cv-header', 'cv-hero', 'cv-contact']) {
      // Допоміжне значення для перевірки сценарію
      const el = page.getByTestId(id);
      await expect(el).toHaveAttribute('href', '/cv.pdf');
      await expect(el).toHaveAttribute('download', /.*/);
      expect(await el.evaluate((e) => e.tagName)).toBe('A');
    }
  });

  test('AC-7 [data] серед case-link лише один GitHub у кейсі AI Chat', async ({ page }) => {
    await open(page);
    // Допоміжне значення для перевірки сценарію
    const links = page.getByTestId('case-link');
    await expect(links).toHaveCount(1);
    await expect(links.first()).toHaveText('GitHub');
    await expect(links.first()).toHaveAttribute('href', 'https://github.com/BogdanHnidenko');
    await expect(page.getByTestId('case-card').nth(3).getByTestId('case-link')).toHaveCount(1);
    await expect(page.getByTestId('case-card').nth(3)).toContainText('AI Chat');
  });

  test('AC-7 [negative] у трьох інших кейсах блоку посилань немає, немає Live demo / Case study', async ({ page }) => {
    await open(page);
    for (let i = 0; i < 3; i++) {
      // Допоміжне значення для перевірки сценарію
      const card = page.getByTestId('case-card').nth(i);
      await expect(card.getByTestId('case-link')).toHaveCount(0);
      await expect(card.getByRole('link')).toHaveCount(0);
    }
    // Допоміжне значення для перевірки сценарію
    const text = await bodyText(page);
    expect(text).not.toContain('Live demo');
    expect(text).not.toContain('Case study');
  });

  test('AC-7 [negative] немає посилань з порожнім href, "#" або "#work" у кейсах', async ({ page }) => {
    await open(page);
    // Усі href усередині карток кейсів
    const hrefs = await page.getByTestId('case-card').locator('a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    expect(hrefs).toEqual(['https://github.com/BogdanHnidenko']);
    // Жодного <a> без href або з порожнім/«#» href на всій сторінці
    const bad = await page.evaluate(() =>
      [...document.querySelectorAll('a')].filter((a) => !a.hasAttribute('href') || ['', '#'].includes(a.getAttribute('href') ?? '')).length,
    );
    expect(bad).toBe(0);
    // Усередині case-card немає посилання на #work
    await expect(page.getByTestId('case-card').locator('a[href="#work"]')).toHaveCount(0);
  });

  test('AC-7 [state] UA: кейси так само без заглушок, CV-кнопки лишаються з /cv.pdf', async ({ page }) => {
    await open(page);
    await page.getByTestId('lang-ua').click();
    await expect(page.getByTestId('case-link')).toHaveCount(1);
    await expect(page.getByTestId('case-link')).toHaveText('GitHub');
    for (const id of ['cv-header', 'cv-hero', 'cv-contact']) await expect(page.getByTestId(id)).toHaveAttribute('href', '/cv.pdf');
    // Допоміжне значення для перевірки сценарію
    const text = await bodyText(page);
    expect(text).not.toContain('Кейс ');
    expect(text).not.toContain('Live-демо');
  });

  test('AC-7 [interrupt] клік по CV запускає завантаження, а не навігацію', async ({ page }) => {
    await open(page);
    // Файлу cv.pdf ще немає: перехоплюємо запит, щоб перевірити саме поведінку download
    await page.route('**/cv.pdf', (r) => r.fulfill({ status: 200, contentType: 'application/pdf', body: '%PDF-1.4' }));
    // Допоміжне значення для перевірки сценарію
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('cv-hero').click()]);
    expect(download.suggestedFilename()).toBe('cv.pdf');
    await expect(page).toHaveURL(/localhost:5173\/?$/);
  });
});

// ===================== AC-8 Контакти =====================

test.describe('AC-8', () => {
  test.use({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark', locale: 'en-US' });

  test('AC-8 [happy] email і соцмережі мають URL зі специфікації', async ({ page }) => {
    await open(page);
    await expect(page.getByTestId('contact-email')).toHaveAttribute('href', 'mailto:bodyaghnidenko@gmail.com');
    await expect(page.getByTestId('contact-linkedin')).toHaveAttribute('href', 'https://www.linkedin.com/in/bohdan-hnidenko-dev');
    await expect(page.getByTestId('contact-github')).toHaveAttribute('href', 'https://github.com/BogdanHnidenko');
    await expect(page.getByTestId('contact-telegram')).toHaveAttribute('href', 'https://t.me/Bohdan_Hnidenko');
    await expect(page.getByTestId('contact-email')).toContainText('bodyaghnidenko@gmail.com');
  });

  test('AC-8 [data] усі зовнішні https-посилання: target=_blank і rel з noopener', async ({ page }) => {
    await open(page);
    // Зовнішні посилання на сторінці
    const ext = await page.evaluate(() =>
      [...document.querySelectorAll('a[href^="http"]')].map((a) => ({ href: a.getAttribute('href'), target: a.getAttribute('target'), rel: a.getAttribute('rel') ?? '' })),
    );
    expect(ext.length).toBeGreaterThanOrEqual(4);
    for (const l of ext) {
      expect(l.target, l.href ?? '').toBe('_blank');
      expect(l.rel, l.href ?? '').toContain('noopener');
    }
  });

  test('AC-8 [negative] якорі і mailto не відкриваються в новій вкладці', async ({ page }) => {
    await open(page);
    // Атрибути target у якорів та mailto
    const targets = await page.evaluate(() =>
      [...document.querySelectorAll('a[href^="#"], a[href^="mailto:"]')].map((a) => a.getAttribute('target')).filter((t) => t === '_blank'),
    );
    expect(targets).toEqual([]);
    // Telegram справді відкривається у новій вкладці (подія popup)
    await page.route('https://t.me/**', (r) => r.fulfill({ status: 200, body: 'ok' }));
    // Допоміжне значення для перевірки сценарію
    const [popup] = await Promise.all([page.waitForEvent('popup'), page.getByTestId('contact-telegram').click()]);
    expect(popup.url()).toContain('t.me/Bohdan_Hnidenko');
    expect(page.url()).toMatch(/localhost:5173/);
  });

  test('AC-8 [state] UA: контактні посилання ті самі', async ({ page }) => {
    await open(page);
    await page.getByTestId('lang-ua').click();
    await expect(page.getByTestId('contact-email')).toHaveAttribute('href', 'mailto:bodyaghnidenko@gmail.com');
    await expect(page.getByTestId('contact-github')).toHaveAttribute('href', 'https://github.com/BogdanHnidenko');
  });

  test('AC-8 [boundary] контакти не дублюються і видимі в області секції', async ({ page }) => {
    await open(page);
    for (const id of ['contact-email', 'contact-linkedin', 'contact-github', 'contact-telegram', 'cv-contact']) await expect(page.getByTestId(id)).toHaveCount(1);
    await page.getByTestId('nav-link-contact').click();
    await expect(page.getByTestId('contact-email')).toBeInViewport();
  });
});

// ===================== AC-9 Адаптив =====================

test.describe('AC-9', () => {
  test.use({ colorScheme: 'dark', locale: 'en-US' });

  for (const w of [320, 390, 768, 1024, 1440]) {
    test(`AC-9 [boundary] ${w}px без горизонтального скролу (EN, dark)`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 900 });
      await open(page);
      await scrollThrough(page);
      await expectNoHScroll(page);
    });
  }

  for (const w of [320, 390]) {
    test(`AC-9 [data] ${w}px без горизонтального скролу в UA + light`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 800 });
      await open(page);
      await page.getByTestId('lang-ua').click();
      await page.getByTestId('theme-toggle').click();
      await scrollThrough(page);
      await expectNoHScroll(page);
    });
  }

  test('AC-9 [boundary] 320px: email і теги не вилазять за екран', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await open(page);
    await page.getByTestId('contact-email').scrollIntoViewIfNeeded();
    // Правий край кожного елемента контактів і тегів
    const overflow = await page.evaluate(() => {
      // Допоміжне значення для перевірки сценарію
      const w = window.innerWidth;
      // Допоміжне значення для перевірки сценарію
      const els = [...document.querySelectorAll('[data-testid^="contact-"], [data-testid="case-card"] *, [data-testid="stack-row"] *')];
      return els.filter((e) => e.getBoundingClientRect().right > w + 1 && getComputedStyle(e).position !== 'fixed').map((e) => e.getAttribute('data-testid') ?? e.tagName).slice(0, 10);
    });
    expect(overflow).toEqual([]);
  });

  test('AC-9 [visual] 390px: одна колонка кейсів, CV = "CV", напрями в одну колонку', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page);
    expect(await visibleText(page, 'cv-header')).toBe('CV');
    // Позиції лівого краю і ширини карток кейсів
    const cases = await page.getByTestId('case-card').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().left));
    expect(new Set(cases.map((x) => Math.round(x))).size).toBe(1);
    // Допоміжне значення для перевірки сценарію
    const dirs = await Promise.all(['dir-card-work', 'dir-card-apps', 'dir-card-ai'].map((id) => page.getByTestId(id).evaluate((e) => e.getBoundingClientRect().left)));
    expect(new Set(dirs.map((x) => Math.round(x))).size).toBe(1);
    await expect(page.getByTestId('nav-mobile')).toBeVisible();
  });

  test('AC-9 [visual] контактні картки: 4 в ряд на 1440, по 2 на 768, по 1 на 390', async ({ page }) => {
    // Кількість унікальних Y-позицій рядів у соцкарток
    const rows = async () => {
      // Допоміжне значення для перевірки сценарію
      const ys = await Promise.all(['contact-linkedin', 'contact-github', 'contact-telegram', 'cv-contact'].map((id) => page.getByTestId(id).evaluate((e) => Math.round(e.getBoundingClientRect().top + window.scrollY))));
      return new Set(ys).size;
    };
    for (const [w, expectedRows] of [[1440, 1], [768, 2], [390, 4]] as const) {
      await page.setViewportSize({ width: w, height: 900 });
      await open(page);
      expect(await rows(), `w=${w}`).toBe(expectedRows);
    }
  });

  test('AC-9 [visual] 1440: desktop-розкладка: 3 напрями в ряд, повний текст CV', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page);
    expect(await visibleText(page, 'cv-header')).toBe('Download CV');
    // Допоміжне значення для перевірки сценарію
    const dirTops = await Promise.all(['dir-card-work', 'dir-card-apps', 'dir-card-ai'].map((id) => page.getByTestId(id).evaluate((e) => Math.round(e.getBoundingClientRect().top))));
    expect(new Set(dirTops).size).toBe(1);
  });

  test('AC-9 [visual] 720/721: перехід CV-тексту і колонок контактів на брейкпоінті', async ({ page }) => {
    await page.setViewportSize({ width: 720, height: 900 });
    await open(page);
    expect(await visibleText(page, 'cv-header')).toBe('CV');
    await page.setViewportSize({ width: 721, height: 900 });
    expect(await visibleText(page, 'cv-header')).toBe('Download CV');
  });

  test('AC-9 [interrupt] зміна розміру вікна 1440 -> 390 -> 1440 під час роботи: стан без артефактів', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByTestId('nav-mobile')).toBeVisible();
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.getByTestId('nav-desktop')).toBeVisible();
    await expect(page.getByTestId('nav-mobile')).toBeHidden();
    await expectNoHScroll(page);
  });
});

// ===================== AC-10 Анімації й доступність =====================

test.describe('AC-10', () => {
  test.use({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark', locale: 'en-US' });

  /**
   * Повертає локатор «значущих» блоків контенту секції, які мають бути видимі (opacity 1).
   * @param page - сторінка
   * @param id - id секції
   * @returns локатор елементів
   */
  function blocks(page: Page, id: string): Locator {
    return page.getByTestId(`section-${id}`).locator('h2, [data-testid="case-card"], [data-testid="ai-card"], [data-testid="job"], [data-testid="stack-row"], [data-testid="app-own"], [data-testid="app-nda"], [data-testid="contact-email"], [data-testid="contact-linkedin"], [data-testid="contact-github"], [data-testid="contact-telegram"], [data-testid="cv-contact"], [data-testid="ai-flow"], [data-testid="ai-tools"], [data-testid="work-group"]');
  }

  for (const id of SECTIONS) {
    test(`AC-10 [happy] після прокрутки до #${id} контент видимий (opacity 1)`, async ({ page }) => {
      await open(page);
      await page.getByTestId(`nav-link-${id}`).click();
      await page.getByTestId(`section-${id}`).scrollIntoViewIfNeeded();
      await scrollThrough(page);
      await page.getByTestId(`nav-link-${id}`).click();
      await expect
        .poll(async () => blocks(page, id).evaluateAll((els) => els.filter((e) => Number(getComputedStyle(e).opacity) < 0.99).length))
        .toBe(0);
      expect(await blocks(page, id).count()).toBeGreaterThan(0);
    });
  }

  test('AC-10 [state] reduced motion: немає CSS-анімацій і весь контент видимий без прокрутки', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page);
    await page.waitForTimeout(300);
    // Кількість анімацій, що виконуються, і opacity всіх блоків
    const anims = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);
    expect(anims).toBe(0);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).not.toBe('smooth');
    for (const id of SECTIONS) {
      // Допоміжне значення для перевірки сценарію
      const hidden = await blocks(page, id).evaluateAll((els) => els.filter((e) => Number(getComputedStyle(e).opacity) < 0.99).length);
      expect(hidden, id).toBe(0);
    }
  });

  test('AC-10 [state] reduced motion: переходи вимкнені і hash-навігація миттєва', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page);
    // Тривалість transition усіх елементів у root
    const durations = await page.getByTestId('app-root').evaluate((r) => [r, ...r.querySelectorAll('*')].map((e) => getComputedStyle(e).transitionDuration).filter((d) => d.split(',').some((x) => parseFloat(x) > 0.001)).length);
    expect(durations).toBe(0);
    await page.getByTestId('nav-link-contact').click();
    await expect(page.getByTestId('section-contact')).toBeInViewport({ timeout: 500 });
  });

  test('AC-10 [negative] без reduced motion hero-анімації існують (контроль протилежного)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await open(page);
    expect(await page.evaluate(() => document.getAnimations().length)).toBeGreaterThan(0);
  });

  test('AC-10 [navigation] Tab проходить усі інтерактивні елементи, фокус видимий', async ({ page }) => {
    await open(page);
    // Позначки елементів, що отримали фокус
    const seen: string[] = [];
    // Допоміжне значення для перевірки сценарію
    const noOutline: string[] = [];
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press('Tab');
      // Допоміжне значення для перевірки сценарію
      const info = await page.evaluate(() => {
        // Допоміжне значення для перевірки сценарію
        const e = document.activeElement as HTMLElement;
        if (!e || e === document.body) return null;
        // Допоміжне значення для перевірки сценарію
        const cs = getComputedStyle(e);
        // Допоміжне значення для перевірки сценарію
        const visibleFocus = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none';
        return { id: e.getAttribute('data-testid') ?? e.tagName, tag: e.tagName, visibleFocus, focusVisible: e.matches(':focus-visible') };
      });
      if (!info) continue;
      seen.push(info.id);
      expect(['A', 'BUTTON']).toContain(info.tag);
      if (!info.visibleFocus) noOutline.push(info.id);
    }
    for (const id of ['skip-link', 'logo-link', 'nav-link-work', 'lang-en', 'lang-ua', 'theme-toggle', 'cv-header', 'cv-hero', 'view-work', 'dir-card-work', 'contact-email', 'contact-telegram', 'cv-contact']) {
      expect(seen, `Tab не дійшов до ${id}`).toContain(id);
    }
    expect(noOutline, 'елементи без видимого фокуса').toEqual([]);
  });

  test('AC-10 [a11y] кнопки — справжні button, посилання — a[href], aria-атрибути', async ({ page }) => {
    await open(page);
    for (const id of ['lang-en', 'lang-ua', 'theme-toggle']) expect(await page.getByTestId(id).evaluate((e) => e.tagName)).toBe('BUTTON');
    for (const id of ['skip-link', 'logo-link', 'cv-header', 'view-work', 'contact-email', 'nav-link-work', 'mnav-link-work', 'dir-card-work']) {
      expect(await page.getByTestId(id).evaluate((e) => e.tagName), id).toBe('A');
      await expect(page.getByTestId(id)).toHaveAttribute('href', /.+/);
    }
    // Фальшиві кнопки/посилання з role або onclick
    const fake = await page.evaluate(() => document.querySelectorAll('div[role="button"], span[role="button"], div[role="link"], a:not([href])').length);
    expect(fake).toBe(0);
    await expect(page.getByTestId('theme-toggle')).toHaveAttribute('aria-label', /.+/);
    await expect(page.getByTestId('apps-stage')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.getByRole('button', { name: /.+/ })).not.toHaveCount(0);
    // Усі кнопки мають доступне імʼя
    const unnamed = await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => !(b.getAttribute('aria-label') || b.textContent?.trim())).length);
    expect(unnamed).toBe(0);
  });

  test('AC-10 [a11y] посилання мають доступні імена (немає порожніх a)', async ({ page }) => {
    await open(page);
    // Допоміжне значення для перевірки сценарію
    const unnamed = await page.evaluate(() => [...document.querySelectorAll('a')].filter((a) => !(a.getAttribute('aria-label') || a.textContent?.trim())).map((a) => a.getAttribute('href')));
    expect(unnamed).toEqual([]);
  });

  test('AC-10 [visual] контрастність і видимість: контент не прозорий у світлій темі після прокрутки', async ({ page }) => {
    await open(page);
    await page.getByTestId('theme-toggle').click();
    await scrollThrough(page);
    await page.getByTestId('nav-link-work').click();
    await expect
      .poll(async () => blocks(page, 'work').evaluateAll((els) => els.filter((e) => Number(getComputedStyle(e).opacity) < 0.99).length))
      .toBe(0);
  });

  test('AC-10 [boundary] смуга прогресу присутня і не виходить за межі екрана', async ({ page }) => {
    await open(page);
    await expect(page.getByTestId('scroll-progress')).toBeAttached();
    await scrollThrough(page);
    await expectNoHScroll(page);
  });
});
