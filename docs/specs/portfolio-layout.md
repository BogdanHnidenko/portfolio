# Портфоліо: верстка односторінкового сайту за макетом

- **Task id:** portfolio-layout
- **Services:** web (frontend)
- **Infra changes:** no
- **QA:** e2e (Playwright, браузер), глибина `deep`

## 1. Goal
Рекрутер або замовник відкриває односторінкове портфоліо Богдана Гніденка. Він бачить кейси, мобільні застосунки, AI-процес, досвід і стек та може звʼязатися або завантажити CV. Сайт двомовний (EN/UA), має темну й світлу теми та адаптивний від 320 до 1440+ px.

## 2. Service changes

### web (frontend) — новий проєкт у корені репозиторію

**Джерело дизайну (єдине):** [docs/design/portfolio.dc.html](../design/portfolio.dc.html). Це один адаптивний HTML-макет:
- рядки 10–487 — CSS (`<helmet><style>`): кольорові токени для `data-theme="dark|light"`, усі компоненти, анімації, брейкпоінти `@container page` 1100 / 900 / 720 px;
- рядки 488–873 — розмітка;
- рядки 875–1188 — дані та логіка: словник `COPY.en` / `COPY.ua`, генератор `BARS`, `prepare()` (розбивка кейсів на групи, широкі картки bento).

Відтворити макет піксель-у-піксель: кольори, шрифти, відступи, радіуси, тіні, градієнти, анімації та адаптив. Синтаксис `{{…}}`, `<sc-for>`, `<sc-if>` і клас `DCLogic` — це формат редактора дизайну, а не код для перенесення. Брейкпоінти перенести як `@media (max-width: …)` з тими самими значеннями, або як container queries на корені — на розсуд розробника.

**Стек і скелет проєкту (у корені репозиторію, поруч із `docs/`, `e2e/`, `contracts/`):**
- Vite + React 18 + TypeScript (strict) + SCSS modules (`sass`) + Zustand (з `persist`).
- Vitest + @testing-library/react + jsdom — юніт-тести.
- ESLint (flat config, typescript-eslint, react-hooks).
- Скрипти `package.json`: `dev` (порт **5173**, `strictPort`), `build` (`tsc -b && vite build`), `lint`, `preview`. Маніфест пайплайну викликає `npx tsc --noEmit -p tsconfig.app.json` і `npx vitest run`, тож ці команди мають працювати.
- `.gitignore` для `node_modules`, `dist`, `coverage`.
- Шрифти Geist, Geist Mono, Instrument Serif, Playfair Display (italic 400) підключити через Google Fonts у `index.html`, як у макеті.

**Структура (рекомендована):** `src/i18n/` (типізований словник en/ua), `src/store/` (Zustand), `src/styles/` (токени теми, глобальні стилі, міксини брейкпоінтів), `src/components/<Section>/` (компонент + `.module.scss`), `src/utils/` (генератор барів тощо).

**Стан (Zustand, `src/store`):**
- `theme: 'dark' | 'light'`, `lang: 'en' | 'ua'`, `toggleTheme()`, `setLang(lang)`.
- `persist` у localStorage під ключем **`portfolio-settings`**, зберігаються лише `theme` і `lang`.
- Початкові значення при першому візиті (коли збереженого немає):
  - тема: `window.matchMedia('(prefers-color-scheme: light)').matches` → `light`, інакше `dark`. Якщо `matchMedia` недоступний, то `dark`;
  - мова: якщо будь-який елемент `navigator.languages` (або `navigator.language`) починається з `uk`, то `ua`, інакше `en`.
- Збережений вибір завжди має пріоритет над системою.
- Якщо в localStorage пошкоджений JSON або недопустимі значення, використовуються початкові значення без помилки в консолі й без білого екрана. Якщо localStorage недоступний (кидає виняток), сайт працює, а вибір просто не зберігається.

**Тема і мова в DOM:**
- Кореневий елемент застосунку має `data-theme="dark|light"`. Те саме значення ставиться на `<html data-theme>`, щоб фон `body` збігався з темою (у макеті `#060A16` для dark і `#F7F8FB` для light). Під час скролу не має бути білих смуг.
- `<html lang>` = `en` для EN і `uk` для UA.
- `document.title`: EN — «Bohdan Hnidenko — Full-Stack Developer», UA — «Богдан Гніденко — Full-Stack розробник».
- Щоб при завантаженні не блимала неправильна тема, у `index.html` додати маленький inline-скрипт. Він читає `portfolio-settings` або системну тему й ставить `data-theme` на `<html>` до рендеру React.

**Тексти:** перенести зі словника макета (`COPY`) лише ключі, що використовуються в розмітці. Ключі `stats`, `prof`, `profLabel`, `profSub`, `filterLabel`, `filterNames`, `prodTitleA/B`, `expTitle`, `stackTitle`, `contact` у розмітці не використовуються — не переносити. Тип словника має гарантувати, що в обох мовах однаковий набір ключів (`Record`/`satisfies`). Нерозривні пробіли (`NB`) зберегти. Кейс 4 «AI Chat», як і в макеті, має `org` «Own project».

**Секції (порядок як у макеті):**
1. Skip-link «Skip to content» → `#work`.
2. Header (sticky, як у макеті): лого «BH» → `#top`; десктопна навігація (5 якорів: `#work`, `#apps`, `#ai`, `#stack`, `#contact`); перемикач мов EN/UA (`aria-pressed`); кнопка теми (іконка сонця в темній темі, місяця у світлій; `aria-label` з `t.themeLabel`); кнопка CV (на ≤720 px текст «CV», інакше `t.cv`); мобільна навігація-«пігулки» (видима на ≤900 px, десктопна прихована); смуга прогресу скролу.
3. Hero: сітка, світіння, «спектр» із 96 барів (перенести генератор `BARS` у `src/utils`, детермінований, з юніт-тестом: 96 елементів, центральні мають клас/ознаку «оранжевий» при `|x| < 0.24`), аватар-монограма «BH», статус-чип, імʼя по словах, headline, pitch, кнопки «Download CV» та «View work», 3 картки-напрями.
4. `#work` — Selected work: 2 групи («SkyService POS» з 3 кейсами та мета «May 2023 – Jun 2026»; «My projects» з 1 кейсом), лічильник кейсів у групі, картки кейсів (Problem / Solution / Result, теги, посилання). Bento: POS і AI Chat широкі.
5. `#apps` — Mobile apps: власні продукти (бейдж «In review», теги, статус) і клієнтські під NDA. Праворуч декоративна сцена з трьома телефонами (`aria-hidden`).
6. `#ai` — AI workflow: lead, схема з 5 кроків із пульсами, рейка CLAUDE.md, 3 AI-картки, інструменти.
7. `#stack` — Experience & stack: таймлайн із 2 посад, «What I work with» із 6 рядків тегів.
8. `#contact` — заголовок, підзаголовок, велика картка email, картки LinkedIn / GitHub / Telegram / CV (PDF).
9. Footer: © і мови.

**Посилання:**
- CV — усі три кнопки (header, hero, contact): `href="/cv.pdf"` з атрибутом `download`. Самий файл `public/cv.pdf` додасть користувач пізніше. **Не створювати фейковий PDF.** Окремий якір `id="cv"` не потрібен.
- Посилання в кейсах: у даних для заглушок `href: ''`. Посилання з порожнім `href` **не рендериться**. Якщо в кейсу не лишилося жодного посилання, блок посилань не рендериться взагалі. Зараз видно лише «GitHub» → `https://github.com/BogdanHnidenko` у кейсі AI Chat.
- Email: `mailto:bodyaghnidenko@gmail.com`.
- LinkedIn `https://www.linkedin.com/in/bohdan-hnidenko-dev`, GitHub `https://github.com/BogdanHnidenko`, Telegram `https://t.me/Bohdan_Hnidenko`.
- Усі зовнішні `https://` посилання: `target="_blank" rel="noopener noreferrer"`. Якорі та `mailto` відкриваються в тій самій вкладці.

**Анімації:** як у макеті. Поява hero (`rise`, `d1..d6`) на CSS; поява секцій `.reveal` і смуга прогресу через CSS scroll-driven animations під `@supports (animation-timeline: …)`. Без підтримки контент просто видимий, а смуга прогресу не рухається. `prefers-reduced-motion: reduce` вимикає всі анімації, переходи й плавний скрол. **Контент ніколи не залишається прихованим** (opacity 0) після прокрутки до нього.

**States:** даних із мережі немає, тож станів loading / error немає. Є стани теми (dark/light), мови (en/ua) і ширини (≤720, ≤900, ≤1100, >1100).

**Required `data-testid`** (обовʼязкові, саме ці назви):

| Елемент | `data-testid` |
|---|---|
| Кореневий контейнер застосунку (має `data-theme`) | `app-root` |
| Skip-link | `skip-link` |
| Header | `site-header` |
| Лого «BH» | `logo-link` |
| Десктопна навігація | `nav-desktop` |
| Посилання десктопної навігації | `nav-link-work`, `nav-link-apps`, `nav-link-ai`, `nav-link-stack`, `nav-link-contact` |
| Мобільна навігація | `nav-mobile` |
| Посилання мобільної навігації | `mnav-link-work`, `mnav-link-apps`, `mnav-link-ai`, `mnav-link-stack`, `mnav-link-contact` |
| Кнопки мови | `lang-en`, `lang-ua` |
| Кнопка теми | `theme-toggle` |
| Іконки теми всередині кнопки (рендериться лише одна) | `theme-icon-sun` (у dark), `theme-icon-moon` (у light) |
| CV у header / hero / contact | `cv-header`, `cv-hero`, `cv-contact` |
| Смуга прогресу | `scroll-progress` |
| Hero-секція | `hero` |
| Контейнер барів спектра / один бар | `hero-bars` / `hero-bar` |
| Статус-чип | `hero-status` |
| Імʼя (h1) | `hero-name` |
| Headline / pitch | `hero-headline` / `hero-pitch` |
| Кнопка «View work» | `view-work` |
| Картки-напрями | `dir-card-work`, `dir-card-apps`, `dir-card-ai` |
| Секції | `section-work`, `section-apps`, `section-ai`, `section-stack`, `section-contact` |
| Група кейсів / її назва / лічильник | `work-group` / `work-group-title` / `work-group-count` |
| Картка кейсу / заголовок / метрика / посилання | `case-card` / `case-title` / `case-metric` / `case-link` |
| Власні застосунки / NDA / сцена з телефонами | `app-own` / `app-nda` / `apps-stage` |
| Схема AI-процесу / AI-картка / інструменти | `ai-flow` / `ai-card` / `ai-tools` |
| Посада в таймлайні / рядок стеку | `job` / `stack-row` |
| Email / LinkedIn / GitHub / Telegram | `contact-email` / `contact-linkedin` / `contact-github` / `contact-telegram` |
| Footer | `site-footer` |

**Unit-тести (мінімум):** генератор барів; стор (toggle, setLang, початкові значення з `matchMedia` / `navigator.languages`, пошкоджений localStorage); словник (однакові ключі в en/ua); рендер `CaseCard` без порожніх посилань; перемикання мови змінює тексти та `aria-pressed`.

## 3. Contracts
Немає: бекенду й HTTP-викликів немає.

## 4. Infra / deploy
Немає. Деплой не налаштовується.

## 5. Acceptance criteria
1. **AC-1 — Структура й контент.** На 1440 px сторінка показує по черзі: header, hero, `#work`, `#apps`, `#ai`, `#stack`, `#contact`, footer. Тексти EN дослівно збігаються з `COPY.en` макета: 2 групи кейсів (3 + 1), 4 картки кейсів, 3 AI-картки, 2 посади, 6 рядків стеку, 3 картки-напрями, 96 барів. Немає помилок і попереджень React у консолі.
2. **AC-2 — Мова.** Клік на `lang-ua` переводить усі тексти на UA, зокрема навігацію, `aria-label` кнопки теми, `<html lang="uk">` і `document.title`. При цьому `lang-ua` має `aria-pressed="true"`, а `lang-en` має `"false"`. Клік на `lang-en` повертає EN. Повторний клік на активну мову нічого не ламає.
3. **AC-3 — Тема.** Клік на `theme-toggle` змінює `data-theme` на `app-root` і на `<html>` (dark ↔ light), фон `body` і кольори за токенами макета. У dark видно `theme-icon-sun`, у light — `theme-icon-moon`.
4. **AC-4 — Збереження.** Після вибору мови та теми й перезавантаження сторінки вибір зберігається (localStorage `portfolio-settings`). Під час завантаження немає блимання іншої теми.
5. **AC-5 — Перший візит.** Без збереженого вибору тема йде за `prefers-color-scheme`, а мова — за мовою браузера (`uk*` → UA, інше → EN). Збережений вибір перекриває систему. Якщо в `portfolio-settings` пошкоджений JSON, сайт рендериться з початковими значеннями без помилок у консолі.
6. **AC-6 — Навігація.** Посилання навігації, лого, «View work», картки-напрями та skip-link ведуть до відповідних секцій (змінюється hash, секція в області видимості, під sticky-хедером не ховається заголовок секції). На 1440 px видно `nav-desktop`, а `nav-mobile` приховано. На ≤900 px навпаки.
7. **AC-7 — CV і посилання кейсів.** `cv-header`, `cv-hero` і `cv-contact` мають `href="/cv.pdf"` і атрибут `download`. Серед `case-link` є лише одне посилання — «GitHub» у кейсі AI Chat. Немає посилань з `href="#work"` чи порожнім href. У трьох інших кейсах блоку посилань немає.
8. **AC-8 — Контакти.** `contact-email` має `href="mailto:bodyaghnidenko@gmail.com"`. LinkedIn, GitHub і Telegram ведуть на URL зі специфікації. Усі зовнішні посилання мають `target="_blank"` і `rel`, що містить `noopener`.
9. **AC-9 — Адаптив.** На ширинах 320, 390, 768, 1024 і 1440 немає горизонтального скролу сторінки. На 390 px розкладка відповідає макету Mobile: одна колонка кейсів, CV-кнопка в хедері з текстом «CV», напрями в одну колонку, контактні картки — як у CSS макета: по 2 в ряд на ≤900 px, в одну колонку на ≤720 px. На 1440 px вона відповідає макету Desktop.
10. **AC-10 — Анімації й доступність.** При `prefers-reduced-motion: reduce` анімацій немає, і весь контент видимий. Після прокрутки до будь-якої секції її контент видимий (не opacity 0). Усі інтерактивні елементи доступні з клавіатури (Tab) та мають видимий фокус. Кнопки — це справжні `<button>`, посилання — `<a href>`.

## 6. Test focus (for QA)
- **What changed for the user:** увесь сайт новий.
- **What could break nearby:** збереження теми й мови між перезавантаженнями; узгодженість теми між `app-root`, `<html>` і фоном body; переклад усіх видимих текстів (жодного EN-рядка в UA, крім власних назв і тегів технологій); hash-навігація під sticky-хедером.
- **Not to re-test:** вміст зовнішніх сайтів (LinkedIn, GitHub, Telegram). Завантаження самого PDF: файла ще немає, перевіряються лише `href` і `download`.
- **Risky cases:** пошкоджений або недоступний localStorage; системна світла тема + мова браузера `uk-UA` при першому візиті; швидкі повторні кліки на `theme-toggle`; дуже вузький екран 320 px (горизонтальний скрол, обрізані теги та email); прокрутка до секцій у браузері без підтримки scroll-driven animations (контент має бути видимий); reduced motion.

## 7. Decisions (questions answered by the user)
| # | Question | Answer | Asked by | Date |
|---|---|---|---|---|
| 1 | Який стор? | Zustand | PM | 2026-11-10 |
| 2 | Де розмістити застосунок? | Корінь репозиторію | PM | 2026-11-10 |
| 3 | Деплой? | Поки без деплою | PM | 2026-11-10 |
| 4 | i18n? | Власний типізований словник у `src/i18n`, мова в сторі | PM | 2026-11-10 |
| 5 | Що роблять кнопки CV? | `/cv.pdf` з `download`, файл у `public/` додасть користувач | PM | 2026-11-10 |
| 6 | Посилання-заглушки в кейсах? | Ховати посилання без URL | PM | 2026-11-10 |
| 7 | Тема й мова при першому візиті? | За системою (`prefers-color-scheme`, мова браузера), далі збережений вибір | PM | 2026-11-10 |
| 8 | Глибина QA | deep | PM | 2026-11-10 |
| 9 | Аватар у hero | assumed: монограма «BH», як у макеті (фото — пізніше) | PM | 2026-11-10 |
| 10 | Анімації reveal/progress | assumed: CSS scroll-driven, як у макеті, без JS-fallback; без підтримки контент статично видимий | PM | 2026-11-10 |
| 11 | Зовнішні посилання | assumed: у новій вкладці (`target="_blank"`, `rel="noopener noreferrer"`) | PM | 2026-11-10 |
| 12 | `document.title` | assumed: «Bohdan Hnidenko — Full-Stack Developer» / «Богдан Гніденко — Full-Stack розробник» | PM | 2026-11-10 |

## 8. Out of scope
- Справжній файл CV, фото, favicon, OG-зображення.
- Деплой, CI, аналітика.
- Фільтр проєктів, блоки `stats`/`prof` (є в словнику макета, але не в розмітці).
- Роутинг (сайт односторінковий).
