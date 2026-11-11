# Підготовка до деплою на Cloudflare Workers

- **Task id:** cloudflare-deploy-config
- **Services:** web (frontend)
- **Infra changes:** yes (конфігурація деплою, без змін коду застосунку)
- **QA:** e2e (smoke) — проти локального сервера `wrangler dev`, який роздає зібраний `dist/`

## 1. Goal
Портфоліо (Vite SPA з `BrowserRouter`) має деплоїтися через Cloudflare Workers Builds з налаштуваннями
дашборда: build command `npm run build`, deploy command `npx wrangler deploy`, preview command
`npx wrangler preview`. Пряме відкриття або оновлення сторінок на кшталт `/about` чи `/work` не повинно
повертати 404, а відповіді мають містити базові безпекові заголовки й довгий кеш для хешованих асетів.

## 2. Service changes

### web (frontend) — тільки конфігурація, `src/` не змінюється
1. **`wrangler.jsonc`** у корені репозиторію (JSONC, коментарі українською):
   - `"$schema": "node_modules/wrangler/config-schema.json"`;
   - `"name": "portfolio"` — має точно збігатися з назвою проєкту в дашборді Cloudflare;
   - `"compatibility_date": "2026-10-01"`;
   - `"assets": { "directory": "./dist", "not_found_handling": "single-page-application" }`;
   - без `main` (Worker-скрипта немає, лише статичні асети);
   - **без** `routes` / `custom_domain` (див. Decisions #2).
2. **`package.json`**:
   - `wrangler` у `devDependencies` (поточна стабільна версія, фіксуємо через `^`), `package-lock.json` оновлено через `npm install -D wrangler`;
   - нові скрипти: `"deploy": "npm run build && wrangler deploy"` і `"preview:cf": "npm run build && wrangler dev"`;
   - існуючі скрипти (`dev`, `build`, `preview`, `lint`, `typecheck`, `test`) **не змінювати**.
3. **`.node-version`** у корені з вмістом `22`: Cloudflare-збірка використовуватиме Node 22, як і локально.
4. **`public/_headers`** (Vite копіює його в `dist/_headers`; Cloudflare читає файл, але не віддає його як сторінку):
   ```
   /*
     X-Content-Type-Options: nosniff
     X-Frame-Options: DENY
     Referrer-Policy: strict-origin-when-cross-origin
     Permissions-Policy: camera=(), microphone=(), geolocation=()
     Strict-Transport-Security: max-age=31536000; includeSubDomains

   /assets/*
     Cache-Control: public, max-age=31536000, immutable
   ```
   Можна додати рядок-коментар `# ...` українською на початку файлу (формат `_headers` підтримує `#`).
   **Content-Security-Policy не додаємо** (див. Out of scope).
5. **`.gitignore`**: додати `.wrangler` (локальний кеш `wrangler dev`).
6. **README або `docs/deploy.md`** (на вибір розробника, коротко, українською): налаштування дашборда Cloudflare
   (build / deploy / preview commands, production branch, підключення домену `portfolio-hnidenko.dev`
   через Settings → Domains & Routes), а також команди `npm run deploy` і `npm run preview:cf`.

- **Required `data-testid`:** нових немає; UI не змінюється. Тестувальник використовує наявні елементи сторінок
  (заголовки, навігацію) лише щоб переконатися, що сторінка відрендерилась.

## 3. Contracts
Немає (бекенду й API немає).

## 4. Infra / deploy
- Локальна перевірка: `npm run build && npx wrangler dev --port 8787` → сайт на `http://localhost:8787`.
  `wrangler dev` працює локально (workerd) і **не потребує** входу в акаунт Cloudflare.
- У дашборді Cloudflare користувач лишає build `npm run build`, deploy `npx wrangler deploy`, preview `npx wrangler preview`.
- Секретів і змінних оточення немає.

## 5. Acceptance criteria
1. **AC-1:** `npm run build` завершується успішно, і `dist/` містить `index.html`, `_headers` та папку `assets/`.
2. **AC-2:** `npx wrangler dev` (порт 8787) роздає зібраний сайт; `GET /` повертає 200 і рендерить головну сторінку.
3. **AC-3:** Пряме відкриття та перезавантаження `/about`, `/work`, `/contact` повертає 200 (не 404) і показує відповідну сторінку застосунку.
4. **AC-4:** Невідома адреса (наприклад, `/does-not-exist`) не повертає сирий 404 від сервера: віддається SPA (`index.html`, статус 200), а що саме показати, вирішує роутер застосунку (поведінка така сама, як у `npm run dev`).
5. **AC-5:** Відповідь на `GET /` містить заголовки `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`.
6. **AC-6:** Відповідь на будь-який файл із `/assets/` (JS або CSS бандла) має `Cache-Control`, що містить `max-age=31536000` та `immutable`; запит на неіснуючий `/assets/nope.js` не віддає JS-вміст.
7. **AC-7:** Статичні файли з `public/` віддаються як є: `/photo.webp` повертає 200 із типом `image/webp`; файли застосунку FieldQuote з `public/app/` теж доступні.
8. **AC-8:** `/_headers` не віддається як вміст файлу із заголовками (немає тексту `X-Frame-Options` у тілі відповіді).

## 6. Test focus (for QA)
- **What changed for the user:** нічого візуально; змінилося те, як сервер роздає сайт у продакшні.
- **What could break nearby:** перемикач теми й мови після перезавантаження на глибокій адресі; фото й скріншоти FieldQuote (статичні файли з `public/`); шрифти Google (заголовки не мають їх блокувати).
- **Not to re-test:** вміст сторінок, верстку, анімації, бургер-меню (покриті попередніми задачами).
- **Risky cases:** перезавантаження на `/about`; глибока адреса з кінцевим слешем (`/about/`); `/assets/nope.js` не повинен віддавати JS-вміст.
- **Як запускати:** `npm run build`, потім `npx wrangler dev --port 8787` у фоні; тести — з `baseURL` `http://localhost:8787` (не dev-сервер 5173). Responsive-перевірку робити на 3 ширинах для головної сторінки, віддаючи її через wrangler.

## 7. Decisions (questions answered by the user)
| # | Question | Answer | Asked by | Date |
|---|---|---|---|---|
| 1 | Обсяг підготовки | Мінімум + заголовки: wrangler.jsonc, wrangler у devDependencies, .node-version, public/_headers, npm-скрипти; без SEO-файлів | PM | 2026-11-11 |
| 2 | Адреса сайту | `https://portfolio-hnidenko.dev`. У `wrangler.jsonc` не прописується (assumed): якщо зони немає в акаунті Cloudflare, `wrangler deploy` впаде; домен підключається в дашборді (Settings → Domains & Routes) і описується в документації | користувач / PM | 2026-11-11 |
| 3 | Глибина QA | smoke | користувач | 2026-11-11 |

## 8. Out of scope
- Content-Security-Policy: `index.html` містить інлайн-скрипт теми та Google Fonts, тож CSP потребує окремої задачі з хешами.
- robots.txt, sitemap.xml, canonical, Open Graph, favicon.
- Будь-які зміни в `src/`.
- Сам деплой і налаштування дашборда Cloudflare (робить користувач).
