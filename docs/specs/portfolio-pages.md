# Портфоліо: редизайн на 4 сторінки (Home / Work / About / Contact)

- **Task id:** portfolio-pages
- **Services:** web (frontend)
- **Infra changes:** no
- **QA:** e2e (Playwright), глибина `deep`

## 1. Goal
Макет змінився: замість однієї довгої сторінки з якорями тепер чотири сторінки з власними адресами. Home — це bento-огляд, Work — кейси, About — анкета, досвід, AI-процес і стек, Contact — контакти. Рекрутер може дати пряме посилання на будь-яку сторінку, а кнопка «Назад» у браузері працює.

## 2. Service changes

### web (frontend)

**Джерело дизайну (єдине):** [docs/design/portfolio.dc.html](../design/portfolio.dc.html), файл оновлено. Це один адаптивний макет:
- рядки 10–458 — CSS: токени dark/light, компоненти, анімації, брейкпоінти `@container page` 1100 / 900 / 720;
- рядки 459–955 — розмітка. Кожна сторінка — окремий блок `<sc-if value="{{isHome|isWork|isAbout|isContact}}">`;
- рядки 957–1241 — словник `COPY.en` / `COPY.ua` і логіка: `prepare()` ділить кейси на `casesSky` (перші 3) і `casesOwn` (останній), `miniFlow` підсвічує останній крок.

Відтворити макет піксель-у-піксель (кольори, шрифти, відступи, радіуси, тіні, анімації, адаптив) **для всіх чотирьох сторінок**. Попередня одностороннкова верстка повністю замінюється. Компоненти, які більше не потрібні (Hero зі «спектром» барів, окремі секції Apps/AiWorkflow/Experience/Contact у старому вигляді), переробити або видалити. Мертвого коду, стилів і текстів не лишати. Генератор `BARS` у макеті є, але в розмітці не використовується, тож не переносити, а старий `src/utils/bars.ts` видалити разом із тестом.

**Що не змінюється (з попередніх задач — зберегти):**
- стек: React 18 + TS strict + SCSS modules + Zustand (`persist`, ключ `portfolio-settings`, лише `theme` і `lang`);
- початкові тема й мова за системою, пошкоджений або недоступний localStorage не ламає сайт;
- `data-theme` на кореневому елементі й на `<html>`, `<html lang>` (`en` / `uk`), inline-скрипт проти блимання теми в `index.html`;
- захист посилань (`src/utils/links.ts`): посилання з порожнім `href` не рендеряться, зовнішні мають `target="_blank" rel="noopener noreferrer"`;
- оранжева кнопка CV без постійного відблиску, лише hover (задача cv-button-static);
- `vite.config.ts` з `host: true` не чіпати.

**Маршрутизація (нове):**
- Додати `react-router-dom` (v6 або v7 у режимі бібліотеки, `BrowserRouter`).
- Маршрути: `/` → Home, `/work` → Work, `/about` → About, `/contact` → Contact. Невідомий шлях (наприклад, `/foo`) → `<Navigate to="/" replace />`.
- Усі переходи — справжні `<Link>`/`<NavLink>` з `href` (`/work` тощо), а не `href="#top"` з `onClick`, як у макеті. Відкриття в новій вкладці (Cmd/Ctrl+клік) має працювати.
- Активний пункт меню (десктоп і мобільний) має клас як у макеті (`on`) і `aria-current="page"`. На Home активного пункту немає.
- Після переходу на іншу сторінку прокрутка йде на початок сторінки (top). «Назад» і «Вперед» у браузері працюють.
- Зміна сторінки не скидає тему й мову.
- Під час переходу фокус клавіатури переходить на `<main id="main">` (`tabIndex={-1}`) або на h1 сторінки, щоб скрінрідер оголосив нову сторінку.
- `document.title` для кожної сторінки й мови:
  - EN: Home — «Bohdan Hnidenko — Full-Stack Developer», Work — «Work — Bohdan Hnidenko», About — «About — Bohdan Hnidenko», Contact — «Contact — Bohdan Hnidenko»;
  - UA: «Богдан Гніденко — Full-Stack розробник», «Роботи — Богдан Гніденко», «Про мене — Богдан Гніденко», «Контакти — Богдан Гніденко».
- Dev-сервер Vite і `vite preview` уже віддають `index.html` на будь-який шлях (SPA fallback), тож пряме відкриття `/about` працює. Налаштування хостингу (GitHub Pages тощо) не входить у задачу.

**Фото (Home і About):**
- Компонент фото бере зображення з `/photo.jpg` (файл `public/photo.jpg` користувач додасть пізніше). **Фейкового фото не додавати.**
- Поки файлу немає або він не завантажився (`onError`), показується заглушка з макета (рамка й іконка людини) **без підпису** «Your photo · 4:5» / «Твоє фото · 4:5» / «· 3:4». Ключі `photoCap` і `photoCap2` не переносити.
- Коли фото є, воно заповнює рамку (`object-fit: cover`) із `alt` = `t.name`. Пропорції рамок як у макеті: Home 4:5, About 3:4.
- Бейдж із мовами на фото Home (`photo-badge`, текст `t.langs`) показується в обох станах.
- Маленький аватар `ava-m` на About поводиться так само (фото або іконка-заглушка).

**Тексти:** перенести зі словника макета лише ключі, що використовуються в розмітці, плюс заголовки сторінок вище. Ключі `featured`, `allWork`, `openCase`, `teaserGo`, `photoBadge`, `photoCap`, `photoCap2` не використовуються — не переносити. Тип словника, як і раніше, гарантує однакові ключі в обох мовах. Нерозривні пробіли (`NB`) зберегти. UA-показник «~7 днів» узяти як у макеті.

**Посилання:**
- CV: усі кнопки «Download CV» (header; Home → intro; About → банер унизу) і картка `PDF` на Contact мають `href="/cv.pdf"` з `download`, як і раніше. Окремий якір `id="cv"` не потрібен.
- Кейси: у макеті заглушки `href: "#top"`. Як і раніше, у даних вони стають `''` і не рендеряться (Decision 6 з portfolio-layout). Видно лише «GitHub» у кейсі AI Chat.
- `mailto:bodyaghnidenko@gmail.com` — кнопки «Email me» (Home, банер Work) і велика картка email на Contact.
- LinkedIn, GitHub і Telegram — ті самі URL, що й раніше: на Home у плитці контактів, на Contact у картках.
- Внутрішні посилання з макета: лого «BH» → `/`; «View work» і 3 плитки робіт на Home → `/work`; плитки «How I build» і «Stack» на Home → `/about`; «All contacts» (Home, банери Work і About) → `/contact`.

**Анімації:** як у макеті. `rise` + `d1..d6` при появі сторінки; `.reveal` через CSS scroll-driven animations під `@supports`; пульси в AI-схемі; бейдж «In review». `prefers-reduced-motion: reduce` вимикає всі анімації. Контент ніколи не лишається прихованим. Анімація `rise` має відпрацьовувати і при переході між сторінками, а не лише при першому завантаженні.

**Адаптив:** брейкпоінти макета 1100 / 900 / 720 px: на ≤900 мобільна навігація-пігулки, на ≤720 текст CV-кнопки «CV». Bento-сітку Home, сітку кейсів, картку застосунків, схему AI-процесу та картки контактів на кожній ширині зробити як у CSS макета. Горизонтального скролу немає від 320 до 1440+.

**Required `data-testid`** (обовʼязкові саме ці назви; ті, що збереглися з минулої задачі, не перейменовувати):

| Елемент | `data-testid` |
|---|---|
| Кореневий контейнер (має `data-theme`) | `app-root` |
| Skip-link (→ `#main`) | `skip-link` |
| Header / лого «BH» | `site-header` / `logo-link` |
| Десктопна навігація / пункти | `nav-desktop` / `nav-link-work`, `nav-link-about`, `nav-link-contact` |
| Мобільна навігація / пункти | `nav-mobile` / `mnav-link-work`, `mnav-link-about`, `mnav-link-contact` |
| Мова / тема / іконки теми | `lang-en`, `lang-ua` / `theme-toggle` / `theme-icon-sun`, `theme-icon-moon` |
| CV у header | `cv-header` |
| `<main>` | `main` |
| Сторінки (кореневий елемент кожної) | `page-home`, `page-work`, `page-about`, `page-contact` |
| Footer | `site-footer` |
| **Home:** intro-плитка / статус / h1 / headline / pitch | `home-intro` / `hero-status` / `hero-name` / `hero-headline` / `hero-pitch` |
| Home: CV / «View work» | `cv-hero` / `view-work` |
| Home: показник (×3) | `home-stat` |
| Home: фото-плитка / бейдж мов | `home-photo` / `photo-badge` |
| Home: плитка роботи (×3) / AI-тизер / стек / CTA-плитка / «Email me» / плитка контактів | `home-work-tile` / `home-ai-tile` / `home-stack-tile` / `home-cta` / `home-email` / `home-links` |
| Home: рядки контактів | `home-link-linkedin`, `home-link-github`, `home-link-telegram`, `home-link-contacts` |
| Фото (будь-де): `<img>` / заглушка | `photo-img` / `photo-placeholder` |
| **Work:** h1 / lead | `work-title` / `work-lead` |
| Work: група / назва / лічильник | `work-group` / `work-group-title` / `work-group-count` |
| Work: картка кейсу / заголовок / метрика / посилання | `case-card` / `case-title` / `case-metric` / `case-link` |
| Work: картка застосунків / власні / NDA / сцена телефонів | `apps-card` / `app-own` / `app-nda` / `apps-stage` |
| Банер CTA (Work і About) / його кнопки | `cta-band` / `band-primary`, `band-contacts` |
| **About:** h1 / аватар / фото / рядок анкети (×4) | `about-title` / `about-avatar` / `about-photo` / `profile-row` |
| About: секції | `section-experience`, `section-ai`, `section-stack` |
| About: посада / AI-схема / AI-картка / інструменти / рядок стеку | `job` / `ai-flow` / `ai-card` / `ai-tools` / `stack-row` |
| **Contact:** h1 / email / LinkedIn / GitHub / Telegram / CV | `contact-title` / `contact-email` / `contact-linkedin` / `contact-github` / `contact-telegram` / `cv-contact` |

**Unit-тести:** оновити під нову структуру. Мінімум: маршрутизація (кожен шлях рендерить свою сторінку, невідомий → Home, активний пункт меню з `aria-current`); фото (заглушка без файлу або після `onError`, `<img>` коли завантажено); словник (однакові ключі, немає видалених ключів); наявні тести стору, links і CSS кнопки CV мають лишитися зеленими або бути оновлені за змістом.

## 3. Contracts
Немає.

## 4. Infra / deploy
Немає. Хостинг для `BrowserRouter` (SPA fallback на GitHub Pages тощо) налаштуємо окремою задачею разом із деплоєм.

## 5. Acceptance criteria
1. **AC-1 — Сторінки й контент.** `/`, `/work`, `/about` і `/contact` рендерять відповідну сторінку (`page-*`), а EN-тексти дослівно збігаються з `COPY.en` макета.
   - Home: 3 показники, 3 плитки робіт, AI-тизер із 5 кроків, плитка стеку з 8 тегами, CTA-плитка, 4 рядки контактів.
   - Work: 3 групи з лічильниками 3 / 2 / 1, 4 картки кейсів, картка застосунків, банер.
   - About: анкета з 4 рядків, 2 посади, AI-схема, 3 AI-картки, 6 рядків стеку, банер.
   - Contact: email і 4 картки.
   Header і footer є на всіх сторінках. У консолі немає помилок і попереджень React чи React Router.
2. **AC-2 — Навігація.** Пункти меню (десктоп і мобільний), лого та внутрішні посилання з розділу «Посилання» ведуть на правильні адреси. URL змінюється, сторінка показується з початку (scroll top), активний пункт має `aria-current="page"`. «Назад» і «Вперед» у браузері повертають попередню сторінку.
3. **AC-3 — Прямі посилання.** Відкриття `/work`, `/about` або `/contact` напряму (і перезавантаження на них) показує цю сторінку. Невідомий шлях `/foo` веде на `/`. `document.title` відповідає сторінці й мові.
4. **AC-4 — Мова.** `lang-ua` / `lang-en` перекладають усі тексти поточної сторінки, `aria-pressed`, `<html lang>` і `document.title`. Мова зберігається при переходах між сторінками та після перезавантаження.
5. **AC-5 — Тема.** `theme-toggle` перемикає dark ↔ light на всіх сторінках: `data-theme` на `app-root` і `<html>`, фон і кольори за токенами макета. Іконка: сонце в dark, місяць у light. Тема зберігається при переходах і після перезавантаження. При завантаженні тема не блимає.
6. **AC-6 — Фото.** Без `public/photo.jpg` на Home (`home-photo`) і About (`about-photo`, `about-avatar`) видно заглушки `photo-placeholder` без текстів «Your photo» / «Твоє фото», а бейдж мов на Home видно. Якщо `/photo.jpg` доступний, рендериться `photo-img` з `alt` = імʼя, і заглушки немає. Для перевірки цього стану QA може підмінити відповідь через `page.route`.
7. **AC-7 — Посилання.**
   - CV (`cv-header`, `cv-hero`, `band-primary` на About, `cv-contact`): `href="/cv.pdf"` з `download`.
   - Email (`home-email`, `band-primary` на Work, `contact-email`): `mailto:bodyaghnidenko@gmail.com`.
   - LinkedIn, GitHub і Telegram ведуть на правильні URL, мають `target="_blank"` і `rel` з `noopener`.
   - Серед `case-link` є лише «GitHub» в AI Chat. Посилань на `#top` чи з порожнім href немає.
8. **AC-8 — Адаптив.** На 320, 390, 768, 1024 і 1440 жодна з 4 сторінок не має горизонтального скролу.
   - На 1440 розкладка відповідає артбордам Desktop, на 390 — артбордам Mobile.
   - На ≤900 px видно `nav-mobile`, а `nav-desktop` приховано. На ≤720 px CV-кнопка в хедері має текст «CV».
9. **AC-9 — Анімації й доступність.** При `prefers-reduced-motion: reduce` анімацій немає, і весь контент видимий. Після прокрутки контент не лишається з opacity 0. Кнопка CV не має постійної анімації, лише hover.
   - Skip-link веде до `#main`.
   - Після переходу між сторінками фокус на `main` або на h1.
   - Усі інтерактивні елементи доступні з клавіатури й мають видимий фокус.
   - Плитки-посилання на Home — це справжні `<a href>`.

## 6. Test focus (for QA)
- **What changed for the user:** увесь сайт, бо структура тепер з 4 сторінок. Старі e2e-тести `e2e/portfolio-layout.spec.ts` прив'язані до одностороннкової верстки (секції-якорі, hero-bars тощо) і застаріли. Перепиши або видали їх. Тести, що досі валідні (тема, мова, збереження, пошкоджений localStorage, системні налаштування першого візиту, посилання, адаптив), перенеси в новий набір `e2e/portfolio-pages.spec.ts`. `e2e/cv-button-static.spec.ts` має лишитися зеленим; онови його лише якщо змінились селектори.
- **What could break nearby:** збереження теми й мови між сторінками; блимання теми при прямому відкритті `/about`; скрол при переході (сторінка не має відкриватися посередині); активний пункт меню; «Назад»; переклад усіх текстів на кожній сторінці.
- **Not to re-test:** вміст зовнішніх сайтів; завантаження PDF (файла немає).
- **Risky cases:** пряме відкриття й перезавантаження вкладених адрес; `/foo` і `/work/` (з кінцевою слешою); швидкі послідовні кліки по меню; перемикання мови на кожній сторінці; ширина 320 для bento-сітки Home та AI-схеми; відсутнє фото (404) та фото, що завантажилось; reduced motion; Cmd/Ctrl+клік по пункту меню (відкривається нова вкладка, а поточна сторінка не змінюється).

## 7. Decisions (questions answered by the user)
| # | Question | Answer | Asked by | Date |
|---|---|---|---|---|
| 1 | Адреси сторінок | Справжні шляхи `/work`, `/about`, `/contact` через React Router | PM | 2026-11-10 |
| 2 | Що показувати замість фото | `public/photo.jpg`, коли буде; до того заглушка без підпису «Твоє фото» | PM | 2026-11-10 |
| 3 | Глибина QA | deep | PM | 2026-11-10 |
| 4 | Посилання-заглушки в кейсах (`#top`) | Ховати, як і раніше (Decision 6 у portfolio-layout) | PM | 2026-11-10 |
| 5 | Невідомий шлях | assumed: редірект на `/` | PM | 2026-11-10 |
| 6 | Заголовки вкладок сторінок | assumed: як у розділі «Маршрутизація» | PM | 2026-11-10 |
| 7 | Фокус при переході між сторінками | assumed: на `main` або h1 (доступність) | PM | 2026-11-10 |
| 8 | Hover кнопок: новий макет `.btn:hover` має `translateY(-1px)`, а задача cv-button-static перевіряла 2px | Як у новому макеті: підйом на 1px; очікування в `e2e/cv-button-static.spec.ts` оновити (запит користувача «зробити як на макеті») | QA → PM | 2026-11-10 |

## 8. Out of scope
- Справжні файли CV і фото, favicon, OG-зображення.
- Деплой і налаштування хостингу під SPA.
- Скриншот-тести та мобільні профілі Playwright (окрема задача).
