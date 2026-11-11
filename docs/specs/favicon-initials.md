# Favicon з ініціалами «BH»

- **Task id:** favicon-initials
- **Services:** web (frontend)
- **Infra changes:** no
- **QA:** e2e (smoke)

## 1. Goal
У вкладці браузера замість порожньої іконки показувати ініціали «BH» латиницею — так само, як логотип у хедері (`data-testid="logo-link"`), щоб вкладку сайту було легко впізнати.

## 2. Service changes

### web (frontend)
- **Файл іконки:** новий `public/favicon.svg` (Vite копіює його в корінь `dist`, URL `/favicon.svg`).
  - Вигляд повторює `.mark` із `src/components/Header/Header.module.scss`: квадрат із заокругленими кутами (радіус ≈ 12/44 від сторони), тонка рамка, по центру текст «BH» моноширинним напівжирним шрифтом (у SVG — `font-family` зі списком `'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`, `font-weight` 600; зовнішні шрифти в SVG-іконці не завантажуються, тож це fallback-и).
  - Кольори темної теми з `src/styles/_tokens.scss`: фон `--surface` `#121419`, рамка — світла напівпрозора (як `--line2`), текст `--text` `#f1f2f5`.
  - Через `@media (prefers-color-scheme: light)` усередині SVG — світлий варіант кольорами світлої теми з тих самих токенів (фон, рамка, текст). Іконка залежить від теми браузера/ОС, не від перемикача теми на сайті.
  - Текст має бути читабельним на 16×16 і 32×32: великий кегль (≈ 45–50% висоти), без зайвих деталей.
  - `viewBox` квадратний (наприклад `0 0 64 64`), є `<title>BH</title>`.
- **index.html:** замінити `<link rel="icon" href="data:," />` на `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />` і оновити коментар над ним (українською).
- **`/favicon.ico`:** не додаємо. Браузери, що підтримують SVG-іконки, не роблять запит на `/favicon.ico`, коли в `<head>` є `rel="icon"`.
- **Required `data-testid`:** нових елементів UI немає. Тестувальник перевіряє `link[rel="icon"]` у `<head>`.

## 3. Contracts
Немає.

## 4. Infra / deploy
Немає. `public/_headers` не змінюється.

## 5. Acceptance criteria
1. AC-1: У `<head>` будь-якої сторінки (home, work, about, contact) є рівно один `link[rel="icon"]` з `href="/favicon.svg"` і `type="image/svg+xml"`; іконки `data:,` більше немає.
2. AC-2: `GET /favicon.svg` повертає 200, `Content-Type` містить `image/svg+xml`, а тіло — валідний SVG із текстом `BH`.
3. AC-3: Іконка відображає «BH» латиницею (перевірити, відкривши `/favicon.svg` у браузері та зробивши скриншот) у стилі логотипа хедера: заокруглений квадрат, рамка, моноширинний текст.
4. AC-4: Під час завантаження сторінки в консолі та в мережі немає 404 для іконки (`/favicon.svg`, `/favicon.ico`).
5. AC-5: Логотип у хедері (`logo-link`) не змінився: текст «BH», посилання на `/`.

## 6. Test focus (for QA)
- **What changed for the user:** іконка у вкладці браузера.
- **What could break nearby:** `<head>` в `index.html` (інлайн-скрипт теми/мови, назва сторінки `document.title` для UA) — назва вкладки має лишатися як була.
- **Not to re-test:** контент сторінок, меню, форми, адаптивна верстка (нічого не змінювалося; responsive-перевірку робити мінімально — 3 ширини, лише що сторінка не зламалася).
- **Risky cases:** UA-мова (заголовок вкладки українською) + іконка; світла тема ОС (`colorScheme: 'light'` у Playwright) — `/favicon.svg` все одно віддається і містить `BH`.

## 7. Decisions (questions answered by the user)
| # | Question | Answer | Asked by | Date |
|---|---|---|---|---|
| 1 | Глибина QA | smoke (поверхнево) | PM | 2026-11-11 |
| 2 | Формат і стиль іконки | SVG, стиль логотипа хедера, світлий/темний варіант за темою ОС — assumed (PM) | PM | 2026-11-11 |

## 8. Out of scope
- PNG/ICO-варіанти, `apple-touch-icon`, web manifest.
- Зміна іконки при перемиканні теми на самому сайті.
