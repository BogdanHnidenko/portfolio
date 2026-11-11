# Portfolio

Односторінковий застосунок портфоліо: React 18 + TypeScript + Vite, SCSS modules, Zustand.

## Локальна розробка

```bash
npm install
npm run dev        # dev-сервер Vite на http://localhost:5173
npm run lint
npm run typecheck
npm test
```

## Деплой на Cloudflare Workers

Сайт роздається як статичні асети Cloudflare Workers (без Worker-скрипта). Конфігурація — у `wrangler.jsonc`:

- `assets.directory: ./dist` — результат `npm run build`;
- `not_found_handling: single-page-application` — пряме відкриття `/about`, `/work`, `/contact` та невідомих адрес віддає `index.html` зі статусом 200, далі адресу обробляє роутер застосунку;
- `public/_headers` (копіюється в `dist/_headers`) — безпекові заголовки для всіх відповідей і річний кеш `immutable` для хешованих файлів у `/assets/`.

Версія Node для збірки задана у `.node-version` (`22`).

### Налаштування в дашборді Cloudflare (Workers Builds)

1. **Workers & Pages → Create → Import a repository**, обрати цей репозиторій.
2. Назва проєкту — `portfolio` (має точно збігатися з `name` у `wrangler.jsonc`).
3. **Build command:** `npm run build`
4. **Deploy command:** `npx wrangler deploy`
5. **Non-production branch deploy command (preview):** `npx wrangler preview`
6. **Production branch:** `prod` (гілка `staging` збирається як preview-версія).
7. Змінних оточення та секретів не потрібно.

### Домен `portfolio-hnidenko.dev`

Домен у `wrangler.jsonc` не прописаний навмисно: якщо зони немає в акаунті Cloudflare, `wrangler deploy` завершиться помилкою.
Підключення домену:

1. Додати зону `portfolio-hnidenko.dev` в акаунт Cloudflare (DNS має обслуговувати Cloudflare).
2. Відкрити Worker `portfolio` → **Settings → Domains & Routes → Add → Custom domain**.
3. Ввести `portfolio-hnidenko.dev` і підтвердити; Cloudflare сам створить DNS-запис і сертифікат.

### Команди з терміналу

```bash
npm run preview:cf  # збірка + локальний сервер wrangler dev (http://localhost:8787), вхід в акаунт не потрібен
npm run deploy      # збірка + wrangler deploy (потрібен `npx wrangler login` або CLOUDFLARE_API_TOKEN)
```
