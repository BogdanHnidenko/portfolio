import { test as base, expect, type Page, type Locator } from '@playwright/test';
import { WIDTHS, eachWidth, checkLayout } from './_helpers/layout-checks';

/** Ключ localStorage, під яким стор зберігає тему і мову. */
const STORAGE_KEY = 'portfolio-settings';
/** Фон body у темній темі за токенами макета (#08090D). */
const BG_DARK = 'rgb(8, 9, 13)';
/** Фон body у світлій темі за токенами макета (#F6F6F4). */
const BG_LIGHT = 'rgb(246, 246, 244)';
/** Адреса пошти з вимог. */
const MAIL = 'mailto:bodyaghnidenko@gmail.com';
/** Зовнішні посилання за вимогами (ті самі, що й раніше). */
const EXT = {
  linkedin: 'https://www.linkedin.com/in/bohdan-hnidenko-dev',
  github: 'https://github.com/BogdanHnidenko',
  telegram: 'https://t.me/Bohdan_Hnidenko',
};

/** Сторінки сайту: адреса, testid, заголовки вкладки EN/UA. */
const PAGES = [
  { path: '/', id: 'page-home', en: 'Bohdan Hnidenko — Full-Stack Developer', ua: 'Богдан Гніденко — Full-Stack розробник' },
  { path: '/work', id: 'page-work', en: 'Work — Bohdan Hnidenko', ua: 'Роботи — Богдан Гніденко' },
  { path: '/about', id: 'page-about', en: 'About — Bohdan Hnidenko', ua: 'Про мене — Богдан Гніденко' },
  { path: '/contact', id: 'page-contact', en: 'Contact — Bohdan Hnidenko', ua: 'Контакти — Богдан Гніденко' },
] as const;

/**
 * Фікстура: збирає помилки та попередження консолі й pageerror; після кожного тесту вимагає, щоб їх не було.
 */
const test = base.extend<{ errors: string[] }>({
  errors: [
    async ({ page }, use) => {
      // Накопичувач повідомлень консолі
      const errors: string[] = [];
      page.on('console', (m) => {
        // Браузерна помилка мережі для відсутнього /photo.jpg - очікувана, не помилка застосунку
        if (/Failed to load resource/.test(m.text()) && /photo\.jpg/.test(m.location().url)) return;
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
 * Відкриває адресу; за потреби наперед записує тему й мову в localStorage (лише якщо ключа ще немає).
 * @param page - сторінка
 * @param path - адреса
 * @param s - початкові налаштування (без них localStorage лишається порожнім)
 */
async function open(page: Page, path: string, s?: { theme?: 'dark' | 'light'; lang?: 'en' | 'ua' }): Promise<void> {
  if (s) {
    await page.addInitScript(
      ([k, v]) => {
        // Записуємо лише при першому заході, щоб перезавантаження не затирало зміни користувача
        if (!localStorage.getItem(k)) localStorage.setItem(k, v);
      },
      [STORAGE_KEY, JSON.stringify({ state: { theme: s.theme ?? 'dark', lang: s.lang ?? 'en' }, version: 0 })],
    );
  }
  await page.goto(path);
  await expect(page.getByTestId('app-root')).toBeVisible();
}

/**
 * Текст сторінки з нерозривними пробілами, заміненими на звичайні (для порівняння з макетом).
 * @param page - сторінка
 * @returns видимий текст body
 */
async function bodyText(page: Page): Promise<string> {
  return (await page.locator('body').innerText()).replace(/ /g, ' ');
}

/**
 * Перевіряє, що кожен рядок присутній у тексті сторінки.
 * @param page - сторінка
 * @param strings - очікувані фрагменти
 */
async function expectTexts(page: Page, strings: string[]): Promise<void> {
  // Текст сторінки для пошуку
  const text = (await bodyText(page)).toLowerCase();
  // Рядки, яких бракує (регістр ігноруємо: мітки макета набираються капсом через CSS)
  const missing = strings.filter((s) => !text.includes(s.replace(/ /g, ' ').toLowerCase()));
  expect(missing).toEqual([]);
}

/**
 * Налаштування зі стору localStorage.
 * @param page - сторінка
 * @returns розпарсений обʼєкт або null
 */
async function stored(page: Page): Promise<{ state: Record<string, unknown> } | null> {
  return page.evaluate((k) => {
    // Сирий рядок зі сховища
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : null;
  }, STORAGE_KEY);
}

/**
 * Чекає завершення скінченних анімацій документа.
 * @param page - сторінка
 */
async function settle(page: Page): Promise<void> {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.timeline instanceof DocumentTimeline && a.effect?.getComputedTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => undefined)),
    ),
  );
}

/**
 * Скільки пікселів сторінка виходить за ширину вікна.
 * @param page - сторінка
 * @returns scrollWidth мінус clientWidth кореня
 */
async function hOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

/** Мінімальний валідний PNG 8x10, яким підміняємо /photo.jpg. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAKCAIAAAAGpYjXAAAAEUlEQVR4nGM4UWGDFTEMdwkAK+B2wUa5V18AAAAASUVORK5CYII=',
  'base64',
);

/**
 * Підмінює відповідь на /photo.jpg.
 * @param page - сторінка
 * @param mode - ok: валідна картинка; 404; abort: обрив зʼєднання; broken: 200 із сміттям
 */
async function mockPhoto(page: Page, mode: 'ok' | '404' | 'abort' | 'broken'): Promise<void> {
  await page.route('**/photo.jpg', (r) => {
    if (mode === 'ok') return r.fulfill({ status: 200, contentType: 'image/png', body: PNG });
    if (mode === '404') return r.fulfill({ status: 404, body: 'nope' });
    if (mode === 'abort') return r.abort('failed');
    return r.fulfill({ status: 200, contentType: 'image/jpeg', body: 'not an image' });
  });
}

/** На короткій сторінці Contact повна прокрутка підсовує контент під sticky-хедер: це задум макета, не накладання (хедер перевіряється на інших сторінках). */
const IGNORE_STICKY_CONTACT = ['[data-testid="site-header"]', '[data-testid="contact-title"]', '[data-testid="page-contact"] *'];

// ===================== AC-1 Сторінки й контент =====================

test.describe('AC-1 сторінки й контент', () => {
  test.use({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark', locale: 'en-US' });

  test('AC-1 [happy] Home: показники, плитки, AI-тизер, стек, CTA, контакти', async ({ page }) => {
    await open(page, '/');
    await expect(page.getByTestId('page-home')).toBeVisible();
    await expect(page.getByTestId('home-stat')).toHaveCount(3);
    await expect(page.getByTestId('home-work-tile')).toHaveCount(3);
    await expect(page.getByTestId('home-ai-tile').locator('> div').last().locator('> span')).toHaveCount(5);
    await expect(page.getByTestId('home-stack-tile').locator('> div').last().locator('> span')).toHaveCount(8);
    await expect(page.getByTestId('home-cta')).toBeVisible();
    await expect(page.getByTestId('home-links').locator('a')).toHaveCount(4);
    await expect(page.getByTestId('hero-name')).toHaveText(/Bohdan\s*Hnidenko/);
    await expect(page.getByTestId('hero-status')).toHaveText('Open to remote work · Worldwide');
    await expectTexts(page, [
      'Full-Stack Developer', 'React Native', 'AI Agent Workflows',
      '4 years shipping production products — from a cloud POS used by 1,000+ venues to my own mobile apps. I build end to end with my own team of AI agents.',
      'Download CV', 'View work', '4 yrs', 'commercial experience', '1,000+', 'venues on the POS I worked on', '~1 week', 'app MVP with my AI agents',
      'English B1 · Ukrainian native', 'SkyService POS', 'POS terminal', 'Catalog render for 1,000+ items on low-end POS devices.', '10–20 s → <1 s',
      'Own projects', 'Own mobile products', 'React Native & Expo — architecture, UI, API and subscriptions.', 'In App Store & Google Play review',
      'My projects', 'AI Chat', 'Chat with AI and authentication, built full-stack.', 'Vue 3 · Node.js · PostgreSQL',
      'How I build', 'With my own team of AI agents', 'PM / Orchestrator', 'Backend · Frontend · Mobile', 'Security pre-tester', 'QA agent', 'Verified',
      'Stack', 'Vue.js 3', 'Node.js', 'PostgreSQL', 'WebSockets', 'Claude Code',
      'Open to full-time, contract and freelance remote work.', 'I reply within a day.', 'Email me', 'All contacts', '© 2026 Bohdan Hnidenko',
    ]);
  });

  test('AC-1 [happy] Work: групи 3/2/1, 4 кейси, застосунки, банер, EN-тексти', async ({ page }) => {
    await open(page, '/work');
    await expect(page.getByTestId('page-work')).toBeVisible();
    await expect(page.getByTestId('work-group')).toHaveCount(3);
    await expect(page.getByTestId('work-group-count')).toHaveText(['3', '2', '1']);
    await expect(page.getByTestId('work-group-title')).toHaveText(['SkyService POS', 'Mobile apps', 'My projects']);
    await expect(page.getByTestId('case-card')).toHaveCount(4);
    await expect(page.getByTestId('case-title')).toHaveText(['POS terminal', 'Kitchen Display System', 'Marketplace module', 'AI Chat']);
    await expect(page.getByTestId('case-metric')).toHaveCount(4);
    await expect(page.getByTestId('apps-card')).toBeVisible();
    await expect(page.getByTestId('app-own')).toBeVisible();
    await expect(page.getByTestId('app-nda')).toBeVisible();
    await expect(page.getByTestId('apps-stage')).toBeAttached();
    await expect(page.getByTestId('cta-band')).toBeVisible();
    await expect(page.getByTestId('work-title')).toHaveText(/Selected\s*work/i);
    await expectTexts(page, [
      '4 years shipping production products — from a cloud POS used by 1,000+ venues to my own mobile apps.',
      'May 2023 – Jun 2026', '10–20 s → <1 s', '100+ orders / day / venue', 'DB → API → UI', 'Chat + auth',
      'A catalog of 1,000+ items took 10–20 s to render on low-end POS devices, while ordering and payments had to stay realtime.',
      'Realtime ordering and payments over WebSockets; catalog rendering reworked for low-end hardware.',
      'Catalog render for 1,000+ items cut from 10–20 s to under 1 s.',
      'Kitchens need every order on screen as it comes in, in sync with the POS.',
      'Realtime KDS screens with stop-list management and POS sync.',
      'Handles 100+ orders a day per venue in realtime.',
      'Products had to be managed in one place and connected to third-party POS systems.',
      'PostgreSQL + Node.js / Express REST API + UI: product CRUD with server-side validation and an image upload pipeline.',
      'One REST backend with third-party POS API integrations.',
      'Own project: an AI product built end to end.',
      'Chat with AI and authentication on a Vue 3 + Node.js + PostgreSQL stack.',
      'A working full-stack app — live demo and source on GitHub.',
      'Problem', 'Solution', 'Result', 'Vuex/Pinia', 'Kitchen Display System',
      'In review', 'React Native, Expo, TypeScript. Architecture, UI, API integration and subscriptions, end to end.',
      'Status: in App Store & Google Play review.', 'Client apps under NDA', 'NDA',
      'Cross-platform React Native / Expo apps delivered to client requirements.',
      'Open to full-time, contract and freelance remote work.', 'Email me', 'All contacts',
    ]);
  });

  test('AC-1 [happy] About: анкета, 2 посади, AI-схема, 3 картки, 6 рядків стеку, банер', async ({ page }) => {
    await open(page, '/about');
    await expect(page.getByTestId('page-about')).toBeVisible();
    await expect(page.getByTestId('profile-row')).toHaveCount(4);
    await expect(page.getByTestId('job')).toHaveCount(2);
    await expect(page.getByTestId('ai-flow')).toBeVisible();
    await expect(page.getByTestId('ai-card')).toHaveCount(3);
    await expect(page.getByTestId('ai-tools')).toBeVisible();
    await expect(page.getByTestId('stack-row')).toHaveCount(6);
    await expect(page.getByTestId('cta-band')).toBeVisible();
    await expect(page.getByTestId('about-title')).toBeVisible();
    await expectTexts(page, [
      'Now', 'Own mobile apps — in App Store & Google Play review', 'Before', 'SkyService POS · 2023–2026 · deputy team lead',
      'Format', 'Remote · full-time, contract, freelance', 'Languages', 'English B1 · Ukrainian native',
      'Experience', '2025 – Present', 'React Native Developer', 'Freelance & Own Products',
      'Own mobile products — in App Store & Google Play review.', 'Cross-platform client apps under NDA.',
      'May 2023 – Jun 2026', 'Frontend / Full-Stack Developer', 'Deputy team lead in a team of four.', 'Realtime POS & KDS.', 'Google and Apple OAuth.',
      'Replaced legacy polling with callback-driven handling and async/await, eliminating a class of race-condition bugs.',
      'AI Workflow', 'A team of role-based Claude Code agents, one job each. Every change ends verified on a real device or in the browser.',
      'Plan', 'Build', 'Review', 'Test', 'Verify', 'PM / Orchestrator', 'Backend agent', 'Frontend agent', 'Mobile agent', 'Security pre-tester', 'QA agent',
      'Verified on device / in browser', 'CLAUDE.md rules keep the code consistent across every agent.',
      'Caught a missing OAuth state / CSRF check in Google sign-in before release.',
      'Routine agent checks my email, monitors project status and alerts me when something goes down.',
      'App MVP in ~1 week instead of 1–2 months.', 'Tools', 'Gemini', 'ChatGPT', 'Stack',
      'Query optimization', 'Indexing', 'Claude Code agent team', 'Webpack', 'Postman', 'Vue Router', 'OAuth 2.0',
      'Download CV', 'All contacts',
    ]);
  });

  test('AC-1 [happy] Contact: email і 4 картки з EN-текстами', async ({ page }) => {
    await open(page, '/contact');
    await expect(page.getByTestId('page-contact')).toBeVisible();
    for (const id of ['contact-email', 'contact-linkedin', 'contact-github', 'contact-telegram', 'cv-contact']) {
      await expect(page.getByTestId(id)).toBeVisible();
    }
    await expect(page.getByTestId('contact-title')).toBeVisible();
    await expectTexts(page, [
      'Open to full-time, contract and freelance remote work.', 'I reply within a day.', 'bodyaghnidenko@gmail.com',
      'linkedin.com/in/bohdan-hnidenko-dev', 'github.com/BogdanHnidenko', '@Bohdan_Hnidenko', 'PDF', 'Download CV (PDF)',
    ]);
  });

  for (const p of PAGES) {
    test(`AC-1 [happy] header і footer на ${p.path}`, async ({ page }) => {
      await open(page, p.path);
      await expect(page.getByTestId('site-header')).toBeVisible();
      await expect(page.getByTestId('site-footer')).toBeVisible();
      await expect(page.getByTestId('nav-desktop')).toBeVisible();
      await expect(page.getByTestId('cv-header')).toBeVisible();
      await expect(page.getByTestId('main')).toHaveAttribute('id', 'main');
      // На кожній сторінці лише одна її кореневий елемент
      await expect(page.locator('[data-testid^="page-"]')).toHaveCount(1);
      await expect(page.getByTestId(p.id)).toBeVisible();
      await expect(page.getByTestId('site-footer')).toContainText('© 2026 Bohdan Hnidenko');
    });
  }

  test('AC-1 [negative] у тексті немає undefined / null / lorem / підписів фото-заглушки (EN і UA)', async ({ page }) => {
    for (const lang of ['en', 'ua'] as const) {
      await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [STORAGE_KEY, JSON.stringify({ state: { theme: 'dark', lang }, version: 0 })]);
      for (const p of PAGES) {
        await page.goto(p.path);
        await expect(page.getByTestId(p.id)).toBeVisible();
        // Увесь текст сторінки
        const text = await bodyText(page);
        for (const bad of ['undefined', 'null', 'NaN', '[object', 'lorem', 'Your photo', 'Твоє фото', '4:5', '3:4']) {
          expect(text.toLowerCase(), `${lang} ${p.path} містить ${bad}`).not.toContain(bad.toLowerCase());
        }
      }
    }
  });

  test('AC-1 [navigation] клієнтська навігація по всіх сторінках без помилок консолі', async ({ page }) => {
    await open(page, '/');
    for (const id of ['nav-link-work', 'nav-link-about', 'nav-link-contact']) {
      await page.getByTestId(id).click();
    }
    await page.getByTestId('logo-link').click();
    await page.getByTestId('view-work').click();
    await page.getByTestId('band-contacts').click();
    await expect(page.getByTestId('page-contact')).toBeVisible();
    // Фікстура errors перевірить, що в консолі порожньо (включно з попередженнями React Router)
  });

  test('AC-1 [boundary] кожен data-testid зі списку обовʼязкових присутній рівно стільки разів, скільки в специфікації', async ({ page }) => {
    // Очікувана кількість testid для кожної сторінки
    const expected: Record<string, Record<string, number>> = {
      '/': { 'home-stat': 3, 'home-work-tile': 3, 'home-ai-tile': 1, 'home-stack-tile': 1, 'home-cta': 1, 'home-email': 1, 'home-links': 1, 'photo-badge': 1, 'home-photo': 1, 'cv-hero': 1, 'view-work': 1 },
      '/work': { 'work-group': 3, 'case-card': 4, 'case-link': 1, 'apps-card': 1, 'app-own': 1, 'app-nda': 1, 'apps-stage': 1, 'cta-band': 1, 'band-primary': 1, 'band-contacts': 1 },
      '/about': { 'profile-row': 4, 'job': 2, 'ai-card': 3, 'stack-row': 6, 'about-avatar': 1, 'about-photo': 1, 'section-experience': 1, 'section-ai': 1, 'section-stack': 1, 'ai-flow': 1, 'ai-tools': 1, 'cta-band': 1 },
      '/contact': { 'contact-email': 1, 'contact-linkedin': 1, 'contact-github': 1, 'contact-telegram': 1, 'cv-contact': 1 },
    };
    for (const [path, ids] of Object.entries(expected)) {
      await open(page, path);
      for (const [id, n] of Object.entries(ids)) {
        await expect(page.getByTestId(id), `${path} ${id}`).toHaveCount(n);
      }
    }
  });
});

// ===================== AC-2 Навігація =====================

test.describe('AC-2 навігація', () => {
  test.use({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark', locale: 'en-US' });

  for (const [slug, path, pageId] of [['work', '/work', 'page-work'], ['about', '/about', 'page-about'], ['contact', '/contact', 'page-contact']] as const) {
    test(`AC-2 [happy] десктопний пункт ${slug}: URL, сторінка, aria-current, real href`, async ({ page }) => {
      await open(page, '/');
      // Посилання меню
      const link = page.getByTestId(`nav-link-${slug}`);
      await expect(link).toHaveAttribute('href', path);
      await link.click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.getByTestId(pageId)).toBeVisible();
      await expect(link).toHaveAttribute('aria-current', 'page');
      await expect(link).toHaveClass(/\bon\b|on/);
      // Інші пункти не активні
      await expect(page.locator('[data-testid^="nav-link-"][aria-current="page"]')).toHaveCount(1);
    });

    test(`AC-2 [happy] мобільний пункт ${slug}: URL, сторінка, aria-current`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 800 });
      await open(page, '/');
      // Посилання мобільного меню
      const link = page.getByTestId(`mnav-link-${slug}`);
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', path);
      await link.click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.getByTestId(pageId)).toBeVisible();
      await expect(link).toHaveAttribute('aria-current', 'page');
      await expect(page.locator('[data-testid^="mnav-link-"][aria-current="page"]')).toHaveCount(1);
    });
  }

  test('AC-2 [happy] на Home активного пункту меню немає (десктоп і мобільний); лого веде на /', async ({ page }) => {
    await open(page, '/');
    await expect(page.locator('[aria-current="page"]')).toHaveCount(0);
    await expect(page.getByTestId('logo-link')).toHaveAttribute('href', '/');
    await page.getByTestId('nav-link-about').click();
    await expect(page.getByTestId('page-about')).toBeVisible();
    await page.getByTestId('logo-link').click();
    await expect(page).toHaveURL(/localhost:\d+\/$/);
    await expect(page.getByTestId('page-home')).toBeVisible();
    await expect(page.locator('[aria-current="page"]')).toHaveCount(0);
    await expect(page.locator('[data-testid^="nav-link-"].on, [data-testid^="mnav-link-"].on')).toHaveCount(0);
  });

  test('AC-2 [navigation] внутрішні посилання Home ведуть на правильні адреси', async ({ page }) => {
    // Селектор і очікувана адреса кожного внутрішнього посилання Home
    const cases: [Locator, string][] = [];
    await open(page, '/');
    cases.push([page.getByTestId('view-work'), '/work'], [page.getByTestId('home-ai-tile'), '/about'], [page.getByTestId('home-stack-tile'), '/about'], [page.getByTestId('home-link-contacts'), '/contact']);
    for (let i = 0; i < 3; i++) cases.push([page.getByTestId('home-work-tile').nth(i), '/work']);
    for (const [loc, href] of cases) {
      await expect(loc).toHaveAttribute('href', href);
      expect(await loc.evaluate((e) => e.tagName)).toBe('A');
    }
    // Реальний перехід по кожній адресі
    await page.getByTestId('home-work-tile').nth(2).click();
    await expect(page).toHaveURL(/\/work$/);
    await page.goBack();
    await page.getByTestId('home-stack-tile').click();
    await expect(page).toHaveURL(/\/about$/);
    await page.goBack();
    await page.getByTestId('home-ai-tile').click();
    await expect(page.getByTestId('page-about')).toBeVisible();
    await page.goBack();
    await page.getByTestId('home-link-contacts').click();
    await expect(page.getByTestId('page-contact')).toBeVisible();
  });

  test('AC-2 [navigation] банери Work і About: «All contacts» -> /contact', async ({ page }) => {
    for (const path of ['/work', '/about']) {
      await open(page, path);
      await expect(page.getByTestId('band-contacts')).toHaveAttribute('href', '/contact');
      await page.getByTestId('band-contacts').click();
      await expect(page).toHaveURL(/\/contact$/);
      await expect(page.getByTestId('page-contact')).toBeVisible();
    }
  });

  test('AC-2 [navigation] після переходу сторінка починається зверху (scroll top)', async ({ page }) => {
    await open(page, '/about');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
    // Із низу About переходимо по меню та банеру
    await page.getByTestId('band-contacts').click();
    await expect(page.getByTestId('page-contact')).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await page.goto('/work');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.getByTestId('nav-link-about').click();
    await expect(page.getByTestId('page-about')).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('AC-2 [navigation] Назад і Вперед у браузері', async ({ page }) => {
    await open(page, '/');
    await page.getByTestId('nav-link-work').click();
    await page.getByTestId('nav-link-about').click();
    await page.getByTestId('nav-link-contact').click();
    await expect(page.getByTestId('page-contact')).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByTestId('page-about')).toBeVisible();
    await expect(page.getByTestId('nav-link-about')).toHaveAttribute('aria-current', 'page');
    await page.goBack();
    await expect(page.getByTestId('page-work')).toBeVisible();
    await page.goBack();
    await expect(page.getByTestId('page-home')).toBeVisible();
    await expect(page.locator('[aria-current="page"]')).toHaveCount(0);
    await page.goForward();
    await expect(page.getByTestId('page-work')).toBeVisible();
    await page.goForward();
    await page.goForward();
    await expect(page.getByTestId('page-contact')).toBeVisible();
    await expect(page.getByTestId('nav-link-contact')).toHaveAttribute('aria-current', 'page');
  });

  test('AC-2 [interrupt] швидкі послідовні кліки по меню: фінальна сторінка відповідає останньому кліку', async ({ page }) => {
    await open(page, '/');
    await page.getByTestId('nav-link-work').click({ noWaitAfter: true });
    await page.getByTestId('nav-link-about').click({ noWaitAfter: true });
    await page.getByTestId('nav-link-contact').click({ noWaitAfter: true });
    await page.getByTestId('nav-link-work').click({ noWaitAfter: true });
    await expect(page).toHaveURL(/\/work$/);
    await expect(page.getByTestId('page-work')).toBeVisible();
    await expect(page.locator('[data-testid^="page-"]')).toHaveCount(1);
    await expect(page.locator('[data-testid^="nav-link-"][aria-current="page"]')).toHaveText('Work');
  });

  test('AC-2 [interrupt] подвійний клік по пункту меню додає один запис в історію (Назад -> Home)', async ({ page }) => {
    await open(page, '/');
    await page.getByTestId('nav-link-about').dblclick();
    await expect(page.getByTestId('page-about')).toBeVisible();
    await page.goBack();
    await expect(page.getByTestId('page-home')).toBeVisible();
  });

  test('AC-2 [interrupt] Ctrl/Cmd+клік відкриває нову вкладку, поточна лишається', async ({ page, context }) => {
    await open(page, '/');
    // Модифікатор «відкрити в новій вкладці»
    const mod = process.platform === 'darwin' ? 'Meta' : 'Control';
    // Нова вкладка, що відкрилась після кліку
    const [popup] = await Promise.all([context.waitForEvent('page'), page.getByTestId('nav-link-about').click({ modifiers: [mod] })]);
    await popup.waitForLoadState();
    await expect(popup).toHaveURL(/\/about$/);
    await expect(popup.getByTestId('page-about')).toBeVisible();
    await expect(page).toHaveURL(/localhost:\d+\/$/);
    await expect(page.getByTestId('page-home')).toBeVisible();
  });

  test('AC-2 [negative] немає посилань-якорів #top / порожніх href; усі навігаційні посилання мають справжній href', async ({ page }) => {
    for (const p of PAGES) {
      await open(page, p.path);
      // Усі href на сторінці
      const hrefs = await page.locator('a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
      for (const h of hrefs) {
        expect(h, `${p.path}`).toBeTruthy();
        expect(['#', '#top', '#work', '#cv', '']).not.toContain(h);
      }
      // Єдине дозволене hash-посилання - skip-link
      expect(hrefs.filter((h) => h!.startsWith('#'))).toEqual(['#main']);
    }
  });

  test('AC-2 [boundary] aria-current лише на активному пункті при зміні мови', async ({ page }) => {
    await open(page, '/about');
    await page.getByTestId('lang-ua').click();
    await expect(page.getByTestId('nav-link-about')).toHaveAttribute('aria-current', 'page');
    await expect(page.getByTestId('nav-link-about')).toHaveText('Про мене');
    await expect(page.locator('[aria-current="page"]')).toHaveCount(2); // десктопний + мобільний пункти
  });
});

// ===================== AC-3 Прямі посилання =====================

test.describe('AC-3 прямі посилання', () => {
  test.use({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark', locale: 'en-US' });

  for (const p of PAGES) {
    test(`AC-3 [happy] пряме відкриття ${p.path}, перезавантаження, title EN`, async ({ page }) => {
      await open(page, p.path);
      await expect(page.getByTestId(p.id)).toBeVisible();
      await expect(page).toHaveTitle(p.en);
      await page.reload();
      await expect(page.getByTestId(p.id)).toBeVisible();
      await expect(page).toHaveTitle(p.en);
      await expect(page).toHaveURL(new RegExp(`${p.path === '/' ? '/$' : p.path + '$'}`));
    });

    test(`AC-3 [happy] title UA на ${p.path}`, async ({ page }) => {
      await open(page, p.path, { lang: 'ua' });
      await expect(page).toHaveTitle(p.ua);
      await expect(page.getByTestId(p.id)).toBeVisible();
    });
  }

  for (const bad of ['/foo', '/foo/bar/baz', '/work/x', '/index.html']) {
    test(`AC-3 [negative] невідомий шлях ${bad} веде на /`, async ({ page }) => {
      await open(page, bad);
      await expect(page).toHaveURL(/localhost:\d+\/$/);
      await expect(page.getByTestId('page-home')).toBeVisible();
      await expect(page).toHaveTitle(PAGES[0].en);
    });
  }

  test('AC-3 [negative] /foo не лишається в історії (replace): Назад не повертає на /foo', async ({ page }) => {
    await page.goto('/about');
    await page.goto('/foo');
    await expect(page).toHaveURL(/localhost:\d+\/$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/about$/);
  });

  test('AC-3 [boundary] /work/ з кінцевою слешею показує Work (або веде на / без помилок)', async ({ page }) => {
    await open(page, '/work/');
    await expect(page.locator('[data-testid^="page-"]')).toHaveCount(1);
    // Після слеша бачимо Work
    await expect(page.getByTestId('page-work')).toBeVisible();
    await expect(page).toHaveTitle(PAGES[1].en);
  });

  test('AC-3 [boundary] /Work (інший регістр) не ламає сайт: показується одна сторінка', async ({ page }) => {
    await open(page, '/Work');
    await expect(page.locator('[data-testid^="page-"]')).toHaveCount(1);
  });

  test('AC-3 [boundary] query і hash не ламають сторінку: /about?x=1#team', async ({ page }) => {
    await open(page, '/about?x=1#team');
    await expect(page.getByTestId('page-about')).toBeVisible();
    await expect(page).toHaveTitle(PAGES[2].en);
    await open(page, '/contact?utm_source=cv');
    await expect(page.getByTestId('page-contact')).toBeVisible();
  });

  test('AC-3 [navigation] title змінюється при клієнтській навігації і разом з мовою', async ({ page }) => {
    await open(page, '/');
    await page.getByTestId('nav-link-work').click();
    await expect(page).toHaveTitle(PAGES[1].en);
    await page.getByTestId('lang-ua').click();
    await expect(page).toHaveTitle(PAGES[1].ua);
    await page.getByTestId('nav-link-contact').click();
    await expect(page).toHaveTitle(PAGES[3].ua);
    await page.goBack();
    await expect(page).toHaveTitle(PAGES[1].ua);
    await page.getByTestId('logo-link').click();
    await expect(page).toHaveTitle(PAGES[0].ua);
    await page.getByTestId('lang-en').click();
    await expect(page).toHaveTitle(PAGES[0].en);
  });

  test('AC-3 [interrupt] перезавантаження посеред переходу (під час повільного завантаження) не лишає порожню сторінку', async ({ page }) => {
    await open(page, '/about');
    await page.getByTestId('nav-link-contact').click();
    await page.reload();
    await expect(page.getByTestId('page-contact')).toBeVisible();
    await page.goBack();
    await expect(page.getByTestId('page-about')).toBeVisible();
  });

  test('AC-3 [state] друга вкладка з тією ж адресою: тема і мова спільні', async ({ page, context }) => {
    await open(page, '/about', { lang: 'ua', theme: 'light' });
    // Друга вкладка того ж контексту (спільний localStorage)
    const p2 = await context.newPage();
    await p2.goto('/work');
    await expect(p2.getByTestId('app-root')).toHaveAttribute('data-theme', 'light');
    await expect(p2.getByTestId('lang-ua')).toHaveAttribute('aria-pressed', 'true');
    await expect(p2).toHaveTitle(PAGES[1].ua);
  });
});

// ===================== AC-4 Мова =====================

test.describe('AC-4 мова', () => {
  test.use({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark', locale: 'en-US' });

  /** UA-тексти для перевірки на кожній сторінці. */
  const UA: Record<string, string[]> = {
    '/': [
      'Роботи', 'Про мене', 'Контакти', 'Завантажити CV', 'Відкритий до віддаленої роботи', 'Богдан', 'Гніденко', 'Full-Stack розробник', 'Робота з AI-агентами',
      '4 роки випускаю продакшн-продукти — від хмарного POS, яким користуються 1 000+ закладів, до власних мобільних застосунків. Будую від початку до кінця з власною командою AI-агентів.',
      'Мої роботи', '4 роки', 'комерційного досвіду', '1 000+', 'закладів на POS, над яким я працював', '~7 днів', 'MVP застосунку з AI-агентами',
      'POS-термінал', 'Рендер каталогу з 1 000+ позицій на слабких POS-пристроях.', '10–20 с → <1 с', 'Власні проєкти', 'Власні мобільні продукти',
      'На рев\'ю в App Store і Google Play', 'Мої проєкти', 'Чат з AI та авторизація, повний стек.', 'Як я будую', 'З власною командою AI-агентів',
      'PM / Оркестратор', 'Security пре-тестер', 'QA-агент', 'Перевірено',
      'Відкритий до повної зайнятості, контракту та фрилансу', 'віддалено.', 'Відповідаю протягом доби.', 'Написати на email', 'Усі контакти',
    ],
    '/work': [
      'Роботи', 'Вибрані', 'трав. 2023 – черв. 2026', 'Мобільні застосунки', 'Мої проєкти', 'Проблема', 'Рішення', 'Результат', 'На рев\'ю',
      'Власні мобільні продукти', 'Клієнтські застосунки під NDA', 'Клієнтські продукти', 'Усі контакти', 'Написати на email',
      'Статус: на рев\'ю в App Store і Google Play.',
      'React Native, Expo, TypeScript. Архітектура, UI, інтеграція API та підписки — від початку до кінця.',
      'Кросплатформні застосунки на React Native / Expo, створені за вимогами клієнтів.',
    ],
    '/about': [
      'Про мене', 'Досвід', 'Формат', 'Мови', 'Усі контакти', 'Завантажити CV', 'Стек',
    ],
    '/contact': ['Контакти', 'Відповідаю протягом доби.', 'Завантажити CV (PDF)', 'Відкритий до повної зайнятості, контракту та фрилансу'],
  };

  for (const p of PAGES) {
    test(`AC-4 [happy] перемикання на UA перекладає ${p.path}, html lang, aria-pressed, title`, async ({ page }) => {
      await open(page, p.path);
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page.getByTestId('lang-en')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByTestId('lang-ua')).toHaveAttribute('aria-pressed', 'false');
      await page.getByTestId('lang-ua').click();
      await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
      await expect(page.getByTestId('lang-ua')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByTestId('lang-en')).toHaveAttribute('aria-pressed', 'false');
      await expect(page).toHaveTitle(p.ua);
      await expectTexts(page, UA[p.path]);
      // Англійські тексти розмітки більше не видно (тексти, що однакові в обох мовах, не беремо)
      const text = await bodyText(page);
      for (const en of ['Download CV', 'Skip to content', 'Open to full-time', 'I reply within a day', 'commercial experience', 'Email me', 'All contacts']) {
        expect(text, `англійське «${en}» лишилось`).not.toContain(en);
      }
      await expect(page.getByTestId('theme-toggle')).toHaveAttribute('aria-label', 'Змінити тему');
      await expect(page.getByTestId('skip-link')).toHaveText('Перейти до змісту');
      await page.getByTestId('lang-en').click();
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page).toHaveTitle(p.en);
      await expect(page.getByTestId('theme-toggle')).toHaveAttribute('aria-label', 'Toggle color theme');
    });
  }

  test('AC-4 [happy] UA-показники Home: «~7 днів» з нерозривним пробілом', async ({ page }) => {
    await open(page, '/', { lang: 'ua' });
    await expect(page.getByTestId('home-stat')).toHaveCount(3);
    await expect(page.getByTestId('home-stat').nth(2)).toContainText('~7 днів');
    await expect(page.getByTestId('home-stat').nth(0)).toContainText('4 роки');
    await expect(page.getByTestId('home-stat').nth(1)).toContainText('1 000+');
    await expect(page.getByTestId('case-title')).toHaveCount(0);
  });

  test('AC-4 [happy] UA: кейси Work мають переклад зі словника макета', async ({ page }) => {
    await open(page, '/work', { lang: 'ua' });
    await expect(page.getByTestId('work-group-title')).toHaveCount(3);
    await expect(page.getByTestId('case-card')).toHaveCount(4);
    await expect(page.getByTestId('case-link')).toHaveCount(1);
    // Жоден заголовок кейсу не пустий і не англомовний «undefined»
    for (const t of await page.getByTestId('case-title').allInnerTexts()) expect(t.trim().length).toBeGreaterThan(2);
    await expect(page.getByTestId('case-title').first()).toHaveText('POS-термінал');
  });

  test('AC-4 [navigation] мова зберігається при переходах і після перезавантаження', async ({ page }) => {
    await open(page, '/');
    await page.getByTestId('lang-ua').click();
    await page.getByTestId('nav-link-work').click();
    await expect(page.getByTestId('lang-ua')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
    await page.getByTestId('nav-link-about').click();
    await expect(page.getByTestId('about-title')).toBeVisible();
    await expect(page).toHaveTitle(PAGES[2].ua);
    await page.goBack();
    await expect(page).toHaveTitle(PAGES[1].ua);
    await page.reload();
    await expect(page.getByTestId('lang-ua')).toHaveAttribute('aria-pressed', 'true');
    await expect(page).toHaveTitle(PAGES[1].ua);
    await page.goto('/contact');
    await expect(page).toHaveTitle(PAGES[3].ua);
  });

  test('AC-4 [boundary] подвійний/швидкий клік по мові закінчується стабільним станом; повторний клік по активній мові нічого не ламає', async ({ page }) => {
    await open(page, '/about');
    await page.getByTestId('lang-ua').click();
    await page.getByTestId('lang-ua').click();
    await expect(page.getByTestId('lang-ua')).toHaveAttribute('aria-pressed', 'true');
    for (let i = 0; i < 6; i++) await page.getByTestId(i % 2 ? 'lang-en' : 'lang-ua').click();
    await expect(page.getByTestId('lang-en')).toHaveAttribute('aria-pressed', 'true');
    await expect(page).toHaveTitle(PAGES[2].en);
    expect((await stored(page))?.state.lang).toBe('en');
  });

  test('AC-4 [state] стор зберігає лише theme і lang', async ({ page }) => {
    await open(page, '/');
    await page.getByTestId('lang-ua').click();
    await page.getByTestId('theme-toggle').click();
    // Збережений стан або стилі елемента
    const s = await stored(page);
    expect(Object.keys(s!.state).sort()).toEqual(['lang', 'theme']);
    expect(s!.state.lang).toBe('ua');
  });

  test('AC-4 [state] перший візит: мова за системною (uk -> UA, en -> EN, інша -> EN)', async ({ browser }) => {
    for (const [locale, lang] of [['uk-UA', 'uk'], ['en-GB', 'en'], ['de-DE', 'en']] as const) {
      // Окремий контекст браузера
      const ctx = await browser.newContext({ locale });
      // Сторінка в окремому контексті
      const p = await ctx.newPage();
      await p.goto('/');
      await expect(p.locator('html')).toHaveAttribute('lang', lang);
      await expect(p).toHaveTitle(lang === 'uk' ? PAGES[0].ua : PAGES[0].en);
      await ctx.close();
    }
  });

  test('AC-4 [negative] пошкоджений localStorage не ламає сайт (сміття, неправильна структура, невалідні значення)', async ({ browser }) => {
    for (const raw of ['{not json', 'null', '"str"', '{"state":{"theme":"purple","lang":"fr"},"version":0}', '{"state":null,"version":0}', '[]']) {
      // Окремий контекст браузера
      const ctx = await browser.newContext({ locale: 'en-US', colorScheme: 'dark' });
      // Сторінка в окремому контексті
      const p = await ctx.newPage();
      // Помилки сторінки
      const errs: string[] = [];
      p.on('pageerror', (e) => errs.push(e.message));
      await p.addInitScript(([k, v]) => localStorage.setItem(k, v), [STORAGE_KEY, raw]);
      await p.goto('/about');
      await expect(p.getByTestId('page-about'), raw).toBeVisible();
      // Тема і мова мають валідні значення
      expect(['dark', 'light']).toContain(await p.getByTestId('app-root').getAttribute('data-theme'));
      expect(['en', 'uk']).toContain(await p.locator('html').getAttribute('lang'));
      expect(errs, raw).toEqual([]);
      await ctx.close();
    }
  });

  test('AC-4 [negative] недоступний localStorage (кидає виняток) не ламає сайт і навігацію', async ({ page }) => {
    await page.addInitScript(() => {
      // Імітуємо заборонене сховище (приватний режим, політика браузера)
      Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('denied', 'SecurityError'); } });
    });
    await page.goto('/work');
    await expect(page.getByTestId('page-work')).toBeVisible();
    await page.getByTestId('lang-ua').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
    await page.getByTestId('nav-link-about').click();
    await expect(page.getByTestId('page-about')).toBeVisible();
    await page.getByTestId('theme-toggle').click();
  });
});

// ===================== AC-5 Тема =====================

test.describe('AC-5 тема', () => {
  test.use({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark', locale: 'en-US' });

  for (const p of PAGES) {
    test(`AC-5 [happy] ${p.path}: перемикач dark -> light -> dark, data-theme, іконки, фон`, async ({ page }) => {
      await open(page, p.path, { theme: 'dark' });
      // Фон body і атрибути в поточний момент
      const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      await expect(page.getByTestId('app-root')).toHaveAttribute('data-theme', 'dark');
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      await expect(page.getByTestId('theme-icon-sun')).toBeVisible();
      await expect(page.getByTestId('theme-icon-moon')).toHaveCount(0);
      expect(await bg()).toBe(BG_DARK);
      await page.getByTestId('theme-toggle').click();
      await expect(page.getByTestId('app-root')).toHaveAttribute('data-theme', 'light');
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      await expect(page.getByTestId('theme-icon-moon')).toBeVisible();
      await expect(page.getByTestId('theme-icon-sun')).toHaveCount(0);
      await expect.poll(bg).toBe(BG_LIGHT);
      await page.getByTestId('theme-toggle').click();
      await expect(page.getByTestId('app-root')).toHaveAttribute('data-theme', 'dark');
      await expect.poll(bg).toBe(BG_DARK);
    });
  }

  test('AC-5 [navigation] тема зберігається при переходах, Назад і після перезавантаження', async ({ page }) => {
    await open(page, '/');
    await page.getByTestId('theme-toggle').click();
    await expect(page.getByTestId('app-root')).toHaveAttribute('data-theme', 'light');
    for (const id of ['nav-link-work', 'nav-link-about', 'nav-link-contact']) {
      await page.getByTestId(id).click();
      await expect(page.getByTestId('app-root')).toHaveAttribute('data-theme', 'light');
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    }
    await page.goBack();
    await expect(page.getByTestId('app-root')).toHaveAttribute('data-theme', 'light');
    await page.reload();
    await expect(page.getByTestId('app-root')).toHaveAttribute('data-theme', 'light');
    await expect(page.getByTestId('theme-icon-moon')).toBeVisible();
    expect((await stored(page))?.state.theme).toBe('light');
  });

  test('AC-5 [happy] тема й мова незалежні: зміна теми не скидає мову і навпаки', async ({ page }) => {
    await open(page, '/work');
    await page.getByTestId('lang-ua').click();
    await page.getByTestId('theme-toggle').click();
    await page.getByTestId('nav-link-contact').click();
    await expect(page.getByTestId('lang-ua')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('app-root')).toHaveAttribute('data-theme', 'light');
    await page.getByTestId('lang-en').click();
    await expect(page.getByTestId('app-root')).toHaveAttribute('data-theme', 'light');
  });

  test('AC-5 [state] перший візит: тема за системою (light/dark)', async ({ browser }) => {
    for (const scheme of ['light', 'dark'] as const) {
      // Окремий контекст браузера
      const ctx = await browser.newContext({ colorScheme: scheme });
      // Сторінка в окремому контексті
      const p = await ctx.newPage();
      await p.goto('/contact');
      await expect(p.getByTestId('app-root')).toHaveAttribute('data-theme', scheme);
      await expect(p.locator('html')).toHaveAttribute('data-theme', scheme);
      await ctx.close();
    }
  });

  test('AC-5 [state] збережена тема має пріоритет над системною', async ({ browser }) => {
    // Окремий контекст браузера
    const ctx = await browser.newContext({ colorScheme: 'dark' });
    // Сторінка в окремому контексті
    const p = await ctx.newPage();
    await p.addInitScript(([k, v]) => localStorage.setItem(k, v), [STORAGE_KEY, JSON.stringify({ state: { theme: 'light', lang: 'en' }, version: 0 })]);
    await p.goto('/about');
    await expect(p.getByTestId('app-root')).toHaveAttribute('data-theme', 'light');
    await ctx.close();
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`AC-5 [interrupt] без блимання: до запуску React на прямому /about тема ${theme} вже на html і фон правильний`, async ({ page }) => {
      await open(page, '/about', { theme });
      // Блокуємо JS-бандл: перевіряємо лише inline-скрипт з index.html
      await page.route(/\/src\/main\.tsx|\/assets\/.*\.js/, (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      // Фон кореневого елемента
      const bg = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor + '|' + getComputedStyle(document.body).backgroundColor);
      expect(bg).toContain(theme === 'dark' ? BG_DARK : BG_LIGHT);
    });
  }

  test('AC-5 [boundary] швидке багаторазове перемикання теми: стан узгоджений скрізь', async ({ page }) => {
    await open(page, '/', { theme: 'dark' });
    for (let i = 0; i < 7; i++) await page.getByTestId('theme-toggle').click();
    // Після 7 кліків із dark має бути light
    await expect(page.getByTestId('app-root')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.getByTestId('theme-icon-moon')).toBeVisible();
    expect((await stored(page))?.state.theme).toBe('light');
  });

  test('AC-5 [negative] контраст: основний текст не збігається з фоном у обох темах на кожній сторінці', async ({ page }) => {
    for (const theme of ['dark', 'light'] as const) {
      await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [STORAGE_KEY, JSON.stringify({ state: { theme, lang: 'en' }, version: 0 })]);
      for (const p of PAGES) {
        await page.goto(p.path);
        await settle(page);
        // Кольори заголовка та фону
        const [fg, bg] = await page.evaluate(() => {
          // Висота
          const h = document.querySelector('h1')!;
          return [getComputedStyle(h).color, getComputedStyle(document.body).backgroundColor];
        });
        expect(fg, `${theme} ${p.path}`).not.toBe(bg);
      }
    }
  });
});

// ===================== AC-6 Фото =====================

test.describe('AC-6 фото', () => {
  test.use({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark', locale: 'en-US' });

  test('AC-6 [happy] без photo.jpg: заглушки на Home, бейдж мов видно, підпису немає', async ({ page }) => {
    await mockPhoto(page, '404');
    await open(page, '/');
    await expect(page.getByTestId('home-photo').getByTestId('photo-placeholder')).toBeVisible();
    await expect(page.getByTestId('photo-img')).toHaveCount(0);
    await expect(page.getByTestId('photo-badge')).toBeVisible();
    await expect(page.getByTestId('photo-badge')).toHaveText('English B1 · Ukrainian native');
    await expect(page.getByTestId('home-photo')).not.toContainText(/Your photo|Твоє фото/);
  });

  test('AC-6 [happy] без photo.jpg: на About заглушки у фото й аватарі', async ({ page }) => {
    await mockPhoto(page, '404');
    await open(page, '/about');
    await expect(page.getByTestId('about-photo').getByTestId('photo-placeholder')).toBeVisible();
    // Аватар ava-m у макеті показується лише на вузьких екранах
    await expect(page.getByTestId('about-avatar').getByTestId('photo-placeholder')).toBeAttached();
    await page.setViewportSize({ width: 390, height: 800 });
    await expect(page.getByTestId('about-avatar').getByTestId('photo-placeholder')).toBeVisible();
    await expect(page.getByTestId('photo-img')).toHaveCount(0);
    await expect(page.getByTestId('about-photo')).not.toContainText(/Your photo|Твоє фото/);
  });

  test('AC-6 [happy] реальний (незамоканий) стан: public/photo.jpg немає -> заглушки без помилок консолі про фото', async ({ page }) => {
    await open(page, '/');
    // Чекаємо спроби завантаження
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('photo-placeholder')).toHaveCount(1);
    await expect(page.getByTestId('photo-badge')).toBeVisible();
  });

  test('AC-6 [happy] є photo.jpg: на Home photo-img з alt = імʼя, заглушки немає, бейдж видно', async ({ page }) => {
    await mockPhoto(page, 'ok');
    await open(page, '/');
    // Зображення в плитці
    const img = page.getByTestId('home-photo').getByTestId('photo-img');
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute('alt', 'Bohdan Hnidenko');
    await expect(img).toHaveAttribute('src', /\/photo\.jpg/);
    await expect(page.getByTestId('photo-placeholder')).toHaveCount(0);
    await expect(page.getByTestId('photo-badge')).toBeVisible();
    expect(await img.evaluate((e) => getComputedStyle(e).objectFit)).toBe('cover');
    expect(await img.evaluate((e: HTMLImageElement) => e.naturalWidth)).toBeGreaterThan(0);
  });

  test('AC-6 [happy] є photo.jpg: на About фото й аватар показують зображення', async ({ page }) => {
    await mockPhoto(page, 'ok');
    await open(page, '/about');
    await expect(page.getByTestId('about-photo').getByTestId('photo-img')).toBeVisible();
    await expect(page.getByTestId('about-avatar').getByTestId('photo-img')).toBeAttached();
    await page.setViewportSize({ width: 390, height: 800 });
    await expect(page.getByTestId('about-avatar').getByTestId('photo-img')).toBeVisible();
    await expect(page.getByTestId('photo-placeholder')).toHaveCount(0);
    for (const img of await page.getByTestId('photo-img').all()) await expect(img).toHaveAttribute('alt', 'Bohdan Hnidenko');
  });

  test('AC-6 [boundary] пропорції рамок: Home 4:5, About 3:4 (з фото і із заглушкою)', async ({ page }) => {
    // Відношення ширини до висоти рамки
    const ratio = async (loc: Locator) => {
      // Межі елемента
      const b = (await loc.boundingBox())!;
      return b.width / b.height;
    };
    for (const mode of ['404', 'ok'] as const) {
      await mockPhoto(page, mode);
      await open(page, '/');
      // Рамка фото
      const frame = page.getByTestId('home-photo').locator('[role="img"], [data-testid="photo-img"], [data-testid="photo-placeholder"]').first();
      // Співвідношення сторін фото на головній
      const home = await ratio(mode === 'ok' ? page.getByTestId('photo-img') : page.getByTestId('photo-placeholder'));
      expect(home, `Home ${mode}`).toBeGreaterThan(0.78);
      expect(home, `Home ${mode}`).toBeLessThan(0.82);
      await frame.count();
      await page.goto('/about');
      // Співвідношення сторін фото на сторінці About
      const about = await ratio(mode === 'ok' ? page.getByTestId('about-photo').getByTestId('photo-img') : page.getByTestId('about-photo').getByTestId('photo-placeholder'));
      expect(about, `About ${mode}`).toBeGreaterThan(0.73);
      expect(about, `About ${mode}`).toBeLessThan(0.77);
      await page.unroute('**/photo.jpg');
    }
  });

  test('AC-6 [negative] обрив зʼєднання / 200 зі сміттям -> після onError заглушка, без падіння', async ({ page }) => {
    for (const mode of ['abort', 'broken'] as const) {
      await mockPhoto(page, mode);
      await open(page, '/');
      await expect(page.getByTestId('photo-placeholder')).toBeVisible();
      await expect(page.getByTestId('photo-img')).toHaveCount(0);
      await expect(page.getByTestId('photo-badge')).toBeVisible();
      await page.unroute('**/photo.jpg');
    }
  });

  test('AC-6 [navigation] фото зберігається при переході Home -> About -> Home', async ({ page }) => {
    await mockPhoto(page, 'ok');
    await open(page, '/');
    await page.getByTestId('nav-link-about').click();
    await expect(page.getByTestId('photo-img')).toHaveCount(2);
    await page.getByTestId('logo-link').click();
    await expect(page.getByTestId('photo-img')).toHaveCount(1);
    await expect(page.getByTestId('photo-placeholder')).toHaveCount(0);
  });

  test('AC-6 [state] мова: alt фото і aria-label заглушки перекладаються', async ({ page }) => {
    await mockPhoto(page, 'ok');
    await open(page, '/', { lang: 'ua' });
    await expect(page.getByTestId('photo-img')).toHaveAttribute('alt', 'Богдан Гніденко');
    await mockPhoto(page, '404');
    await page.reload();
    await expect(page.getByTestId('photo-placeholder')).toBeVisible();
    await expect(page.getByTestId('photo-badge')).toContainText('Англійська B1');
  });

  test('AC-6 [interrupt] фото вдалося пізніше (повільна відповідь): спочатку не зламана іконка, потім зображення', async ({ page }) => {
    await page.route('**/photo.jpg', async (r) => {
      await new Promise((res) => setTimeout(res, 1200));
      await r.fulfill({ status: 200, contentType: 'image/png', body: PNG });
    });
    await open(page, '/');
    await expect(page.getByTestId('photo-img')).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId('photo-placeholder')).toHaveCount(0);
  });
});

// ===================== AC-7 Посилання =====================

test.describe('AC-7 посилання', () => {
  test.use({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark', locale: 'en-US' });

  for (const [path, ids] of [['/', ['cv-header', 'cv-hero']], ['/work', ['cv-header']], ['/about', ['cv-header', 'band-primary']], ['/contact', ['cv-header', 'cv-contact']]] as const) {
    test(`AC-7 [happy] CV-посилання на ${path}: /cv.pdf з download`, async ({ page }) => {
      await open(page, path);
      for (const id of ids) {
        // Посилання CV
        const el = page.getByTestId(id);
        await expect(el, id).toHaveAttribute('href', '/cv.pdf');
        await expect(el, id).toHaveAttribute('download', /.*/);
        expect(await el.evaluate((e) => e.tagName)).toBe('A');
      }
    });
  }

  for (const [path, ids] of [['/', ['home-email']], ['/work', ['band-primary']], ['/contact', ['contact-email']]] as const) {
    test(`AC-7 [happy] email-посилання на ${path}: mailto`, async ({ page }) => {
      await open(page, path);
      for (const id of ids) await expect(page.getByTestId(id)).toHaveAttribute('href', MAIL);
    });
  }

  test('AC-7 [happy] LinkedIn / GitHub / Telegram на Home і Contact: URL, target, rel', async ({ page }) => {
    for (const [path, prefix] of [['/', 'home-link'], ['/contact', 'contact']] as const) {
      await open(page, path);
      for (const k of ['linkedin', 'github', 'telegram'] as const) {
        // Зовнішнє посилання
        const a = page.getByTestId(`${prefix}-${k}`);
        await expect(a, `${path} ${k}`).toHaveAttribute('href', EXT[k]);
        await expect(a).toHaveAttribute('target', '_blank');
        await expect(a).toHaveAttribute('rel', /noopener/);
      }
    }
  });

  test('AC-7 [data] case-link: лише «GitHub» в AI Chat, URL правильний', async ({ page }) => {
    await open(page, '/work');
    await expect(page.getByTestId('case-link')).toHaveCount(1);
    await expect(page.getByTestId('case-link')).toHaveText('GitHub');
    await expect(page.getByTestId('case-link')).toHaveAttribute('href', EXT.github);
    await expect(page.getByTestId('case-card').nth(3)).toContainText('AI Chat');
    await expect(page.getByTestId('case-card').nth(3).getByTestId('case-link')).toHaveCount(1);
    for (let i = 0; i < 3; i++) await expect(page.getByTestId('case-card').nth(i).locator('a')).toHaveCount(0);
  });

  test('AC-7 [negative] жодного <a> з порожнім/# href; усі зовнішні мають target і rel noopener noreferrer', async ({ page }) => {
    for (const p of PAGES) {
      await open(page, p.path);
      // Дані всіх посилань
      const links = await page.locator('a').evaluateAll((as) =>
        as.map((a) => ({ href: a.getAttribute('href'), target: a.getAttribute('target'), rel: a.getAttribute('rel') ?? '' })),
      );
      for (const l of links) {
        expect(l.href, p.path).toBeTruthy();
        expect(l.href).not.toBe('#');
        expect(l.href).not.toContain('#top');
        if (/^https?:\/\//.test(l.href!)) {
          expect(l.target, l.href!).toBe('_blank');
          expect(l.rel, l.href!).toContain('noopener');
          expect(l.rel, l.href!).toContain('noreferrer');
        }
      }
    }
  });

  test('AC-7 [state] UA: ті самі URL і відсутність заглушок', async ({ page }) => {
    await open(page, '/contact', { lang: 'ua' });
    await expect(page.getByTestId('contact-email')).toHaveAttribute('href', MAIL);
    await expect(page.getByTestId('cv-contact')).toHaveAttribute('href', '/cv.pdf');
    await expect(page.getByTestId('contact-github')).toHaveAttribute('href', EXT.github);
    await page.goto('/work');
    await expect(page.getByTestId('case-link')).toHaveCount(1);
    await expect(page.getByTestId('band-primary')).toHaveAttribute('href', MAIL);
  });

  test('AC-7 [interrupt] клік по CV запускає завантаження, а не навігацію', async ({ page }) => {
    await open(page, '/about');
    await page.route('**/cv.pdf', (r) => r.fulfill({ status: 200, contentType: 'application/pdf', body: '%PDF-1.4' }));
    // Подія завантаження
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('band-primary').click()]);
    expect(download.suggestedFilename()).toBe('cv.pdf');
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByTestId('page-about')).toBeVisible();
  });

  test('AC-7 [boundary] email-плитка Home: клік не змінює сторінку і не дає помилок', async ({ page }) => {
    await open(page, '/');
    // Блокуємо mailto, щоб браузер не шукав обробник
    await page.evaluate(() => document.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('a[href^="mailto:"]')) e.preventDefault(); }, true));
    await page.getByTestId('home-email').click();
    await expect(page).toHaveURL(/localhost:\d+\/$/);
    await expect(page.getByTestId('page-home')).toBeVisible();
  });
});

// ===================== AC-8 Адаптив =====================

test.describe('AC-8 адаптив', () => {
  test.use({ colorScheme: 'dark', locale: 'en-US' });

  for (const p of PAGES) {
    test(`AC-8 [boundary] ${p.path}: немає горизонтального скролу на 320, 390, 768, 1024, 1440`, async ({ page }) => {
      await open(page, p.path);
      for (const w of [320, 390, 768, 1024, 1440]) {
        await page.setViewportSize({ width: w, height: 900 });
        await settle(page);
        expect(await hOverflow(page), `${p.path} @${w}`).toBeLessThanOrEqual(0);
      }
    });

    test(`AC-8 [responsive] ${p.path} EN dark на всіх ширинах`, async ({ page }, testInfo) => {
      await open(page, p.path, { lang: 'en', theme: 'dark' });
      await eachWidth(page, WIDTHS.deep, async (w) => {
        await settle(page);
        await checkLayout(page, testInfo, { name: `${p.id}-en-dark-${w}`, ignore: p.path === '/contact' ? IGNORE_STICKY_CONTACT : [] });
      });
    });

    test(`AC-8 [responsive] ${p.path} UA light на всіх ширинах`, async ({ page }, testInfo) => {
      await open(page, p.path, { lang: 'ua', theme: 'light' });
      await eachWidth(page, WIDTHS.deep, async (w) => {
        await settle(page);
        await checkLayout(page, testInfo, { name: `${p.id}-ua-light-${w}`, ignore: p.path === '/contact' ? IGNORE_STICKY_CONTACT : [] });
      });
    });
  }

  test('AC-8 [responsive] Work з фото-заглушкою і Home з реальним фото на 320 та 1440', async ({ page }, testInfo) => {
    await mockPhoto(page, 'ok');
    await open(page, '/');
    await eachWidth(page, [320, 390, 1440], async (w) => {
      await checkLayout(page, testInfo, { name: `home-photo-${w}` });
    });
    await page.goto('/about');
    await eachWidth(page, [320, 390, 1440], async (w) => {
      await checkLayout(page, testInfo, { name: `about-photo-${w}` });
    });
  });

  test('AC-8 [responsive] ворожий контент: довге слово в заголовку/питчі Home на 320', async ({ page }, testInfo) => {
    await open(page, '/');
    await page.setViewportSize({ width: 320, height: 800 });
    await page.evaluate(() => {
      // Вставляємо довге слово в питч, щоб перевірити перенесення
      const el = document.querySelector('[data-testid="hero-pitch"]')!;
      el.textContent = 'Supercalifragilisticexpialidocious'.repeat(3) + ' ' + 'Ґанокіїжак'.repeat(8);
    });
    // Горизонтального скролу немає навіть з довгим словом
    expect(await hOverflow(page)).toBeLessThanOrEqual(0);
    await checkLayout(page, testInfo, { name: 'home-hostile-320' });
  });

  test('AC-8 [happy] навігація: ≤900 видно nav-mobile і ховається nav-desktop; >900 навпаки', async ({ page }) => {
    await open(page, '/work');
    for (const w of [320, 390, 720, 768, 900]) {
      await page.setViewportSize({ width: w, height: 800 });
      await expect(page.getByTestId('nav-mobile'), `@${w}`).toBeVisible();
      await expect(page.getByTestId('nav-desktop'), `@${w}`).toBeHidden();
    }
    for (const w of [901, 1024, 1440]) {
      await page.setViewportSize({ width: w, height: 800 });
      await expect(page.getByTestId('nav-desktop'), `@${w}`).toBeVisible();
      await expect(page.getByTestId('nav-mobile'), `@${w}`).toBeHidden();
    }
  });

  test('AC-8 [happy] CV-кнопка в хедері: «CV» на ≤720, «Download CV» на >720', async ({ page }) => {
    await open(page, '/');
    for (const [w, text] of [[320, 'CV'], [390, 'CV'], [720, 'CV'], [721, 'Download CV'], [1024, 'Download CV'], [1440, 'Download CV']] as const) {
      await page.setViewportSize({ width: w, height: 800 });
      await expect(page.getByTestId('cv-header'), `@${w}`).toBeVisible();
      expect((await page.getByTestId('cv-header').innerText()).trim(), `@${w}`).toBe(text);
    }
  });

  test('AC-8 [navigation] мобільна навігація 390 на кожній сторінці: активна «пігулка» видима і всі три пункти досяжні', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await open(page, '/');
    for (const slug of ['work', 'about', 'contact']) {
      // Пункт мобільного меню
      const link = page.getByTestId(`mnav-link-${slug}`);
      await link.click();
      await expect(link).toHaveAttribute('aria-current', 'page');
      // Розміри цілі натискання
      const b = (await link.boundingBox())!;
      expect(b.height).toBeGreaterThanOrEqual(24);
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(390);
    }
  });

  test('AC-8 [state] Home на 1440: bento-розкладка (фото праворуч від intro, плитки у декілька колонок)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page, '/');
    // Позиція блоку intro
    const intro = (await page.getByTestId('home-intro').boundingBox())!;
    // Позиція блоку з фото
    const photo = (await page.getByTestId('home-photo').boundingBox())!;
    expect(photo.x).toBeGreaterThanOrEqual(intro.x + intro.width - 2);
    // Перші дві плитки робіт в одному ряду
    const t0 = (await page.getByTestId('home-work-tile').nth(0).boundingBox())!;
    // Позиція другої плитки робіт
    const t1 = (await page.getByTestId('home-work-tile').nth(1).boundingBox())!;
    expect(Math.abs(t0.y - t1.y)).toBeLessThan(4);
  });

  test('AC-8 [state] Home на 390: плитки йдуть в одну колонку, без горизонтального скролу', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await open(page, '/');
    // Горизонтальні позиції плиток робіт
    const xs: number[] = [];
    for (let i = 0; i < 3; i++) xs.push((await page.getByTestId('home-work-tile').nth(i).boundingBox())!.x);
    expect(new Set(xs.map((x) => Math.round(x))).size).toBe(1);
    expect(await hOverflow(page)).toBeLessThanOrEqual(0);
  });
});

// ===================== AC-9 Анімації й доступність =====================

test.describe('AC-9 анімації й доступність', () => {
  test.use({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark', locale: 'en-US' });

  for (const p of PAGES) {
    test(`AC-9 [happy] reduced motion на ${p.path}: жодної анімації, весь контент видимий`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await open(page, p.path);
      await page.waitForTimeout(300);
      // Кількість активних анімацій і елементів із нульовою прозорістю
      const res = await page.evaluate(() => ({
        anims: document.getAnimations().filter((a) => a.playState === 'running').length,
        hidden: [...document.querySelectorAll('main *')]
          .filter((e) => (e.textContent ?? '').trim() && !e.children.length && getComputedStyle(e).opacity === '0')
          .map((e) => e.tagName + ':' + (e.textContent ?? '').slice(0, 20)),
      }));
      expect(res.anims, 'running animations').toBe(0);
      expect(res.hidden).toEqual([]);
    });

    test(`AC-9 [boundary] після прокрутки ${p.path} жоден текст не лишається з opacity 0 (звичайний рух)`, async ({ page }) => {
      await open(page, p.path);
      // Повільно прокручуємо до кінця
      for (let y = 0; y <= 6000; y += 400) {
        await page.evaluate((v) => window.scrollTo(0, v), y);
        await page.waitForTimeout(40);
      }
      await settle(page);
      await page.waitForTimeout(1200);
      // Елементи, приховані на сторінці
      const hidden = await page.evaluate(() =>
        [...document.querySelectorAll('main *')]
          .filter((e) => (e.textContent ?? '').trim() && !e.children.length && parseFloat(getComputedStyle(e).opacity) < 0.5)
          .map((e) => e.tagName + ':' + (e.textContent ?? '').slice(0, 20)),
      );
      expect(hidden).toEqual([]);
    });
  }

  test('AC-9 [navigation] rise-анімація відпрацьовує і при переході між сторінками', async ({ page }) => {
    await open(page, '/');
    await settle(page);
    // Скільки анімацій на новій сторінці одразу після кліку
    await page.getByTestId('nav-link-about').click();
    await expect(page.getByTestId('page-about')).toBeVisible();
    // Кількість активних анімацій
    const count = await page.evaluate(() => document.getAnimations().filter((a) => a.timeline instanceof DocumentTimeline).length);
    expect(count).toBeGreaterThan(0);
    await settle(page);
  });

  test('AC-9 [happy] skip-link: перший Tab фокусує його, Enter веде до #main', async ({ page }) => {
    await open(page, '/work');
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('skip-link')).toBeFocused();
    await expect(page.getByTestId('skip-link')).toHaveAttribute('href', '#main');
    await expect(page.getByTestId('skip-link')).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main$/);
    // Фокус на main або всередині нього (наступний Tab піде в контент)
    expect(await page.evaluate(() => document.activeElement?.id === 'main' || !!document.activeElement?.closest('#main'))).toBe(true);
  });

  test('AC-9 [navigation] після переходу фокус на main або h1', async ({ page }) => {
    await open(page, '/');
    for (const slug of ['work', 'about', 'contact']) {
      await page.getByTestId(`nav-link-${slug}`).click();
      await expect(page.getByTestId(`page-${slug}`)).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.activeElement?.id === 'main' || document.activeElement?.tagName === 'H1'), { message: slug }).toBe(true);
    }
    await page.goBack();
    await expect.poll(() => page.evaluate(() => document.activeElement?.id === 'main' || document.activeElement?.tagName === 'H1')).toBe(true);
  });

  test('AC-9 [navigation] фокус на main/h1 і після переходу через лого й внутрішні плитки', async ({ page }) => {
    await open(page, '/');
    await page.getByTestId('home-stack-tile').click();
    await expect(page.getByTestId('page-about')).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.activeElement?.id === 'main' || document.activeElement?.tagName === 'H1')).toBe(true);
    await page.getByTestId('logo-link').click();
    await expect(page.getByTestId('page-home')).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.activeElement?.id === 'main' || document.activeElement?.tagName === 'H1')).toBe(true);
  });

  test('AC-9 [happy] плитки Home — справжні <a href>', async ({ page }) => {
    await open(page, '/');
    for (const id of ['home-work-tile', 'home-ai-tile', 'home-stack-tile']) {
      for (const el of await page.getByTestId(id).all()) {
        expect(await el.evaluate((e) => e.tagName), id).toBe('A');
        expect(await el.getAttribute('href'), id).toMatch(/^\//);
      }
    }
  });

  for (const p of PAGES) {
    test(`AC-9 [negative] ${p.path}: клавіатура досягає всіх інтерактивних елементів, фокус видно`, async ({ page }) => {
      await open(page, p.path);
      await settle(page);
      // Кількість інтерактивних елементів і назви тих, що без видимого фокусу
      const total = await page.locator('a[href], button').count();
      // Елементи без видимого фокус-кільця
      const noRing: string[] = [];
      // Вже відвідані елементи при Tab
      const seen = new Set<string>();
      for (let i = 0; i < total + 2; i++) {
        await page.keyboard.press('Tab');
        // Дані про елемент у фокусі
        const info = await page.evaluate(() => {
          // Елемент у фокусі
          const e = document.activeElement as HTMLElement;
          if (!e || e === document.body) return null;
          // Збережений стан або стилі елемента
          const s = getComputedStyle(e);
          // Чи є видиме фокус-кільце
          const ring = (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || (s.boxShadow !== 'none' && s.boxShadow !== '') ;
          // Геометрія елемента на екрані
          const r = e.getBoundingClientRect();
          return { id: e.dataset.testid || e.textContent?.slice(0, 20) || e.tagName, ring, size: r.width * r.height, vis: s.visibility };
        });
        if (!info) continue;
        seen.add(info.id);
        if (!info.ring) noRing.push(info.id);
        expect(info.size, info.id).toBeGreaterThan(0);
      }
      expect(seen.size).toBeGreaterThanOrEqual(Math.min(total, 8));
      expect(noRing, 'без видимого фокусу').toEqual([]);
    });
  }

  test('AC-9 [interrupt] Enter на пункті меню з клавіатури переходить на сторінку', async ({ page }) => {
    await open(page, '/');
    await page.getByTestId('nav-link-about').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('page-about')).toBeVisible();
    await expect(page).toHaveURL(/\/about$/);
  });

  test('AC-9 [happy] CV-кнопка без постійної анімації на About/Contact (лише hover)', async ({ page }) => {
    for (const path of ['/about', '/contact']) {
      await open(page, path);
      await settle(page);
      await page.mouse.move(0, 0);
      // Кількість анімацій, націлених на CV-кнопку
      const n = await page.getByTestId('cv-header').evaluate((el) => document.getAnimations().filter((a) => (a.effect as KeyframeEffect)?.target === el).length);
      expect(n).toBe(0);
    }
  });
});
