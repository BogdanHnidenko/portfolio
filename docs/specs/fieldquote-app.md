# Картка FieldQuote: справжні скриншоти, App Store і оновлені статуси

- **Task id:** fieldquote-app
- **Services:** web (frontend)
- **Infra changes:** no
- **QA:** e2e (Playwright), глибина `smoke`

## 1. Goal
Власний застосунок автора, **FieldQuote: Invoices & Quotes**, вийшов в App Store, а в Google Play буде незабаром. Зараз на сайті:
- загальний заголовок «Own mobile products»;
- статус «In review»;
- декоративні розмиті «телефони» замість скриншотів.

Відвідувач має бачити справжній продукт: назву, що він робить, три реальні скриншоти та посилання на App Store і сайт.

Джерела: [App Store](https://apps.apple.com/us/app/fieldquote-invoices-quotes/id6822302139), [fieldquote.org](https://fieldquote.org/). Слоган — «Quote on site. Get paid before you leave.» Застосунок для solo-контракторів: офлайн-кошториси та інвойси, PDF і підпис клієнта на місці.

## 2. Service changes

### web (frontend)

**Файли (уже додані PM):**
- `public/app/screen-center.webp` — головний екран (Needs attention);
- `public/app/screen-left.webp` — кошторис #EST-030;
- `public/app/screen-right.webp` — Preview & Sign.

Усі три — WebP 720×1566 (пропорції iPhone ≈ 0.46, конвертовано PM із PNG 1206×2622). Шляхи винести в константи в `src/data/` поруч з `CV_HREF` / `PHOTO_SRC`.

**Фото автора (правка користувача — зберегти):** користувач поклав `public/photo.webp` і змінив `PHOTO_SRC` у `src/data/contacts.ts` на `'/photo.webp'`. Цю зміну не відкочувати. Оновити JSDoc над константою: формат WebP або JPEG. Юніт-тести, що чекають `/photo.jpg`, оновити на константу `PHOTO_SRC`.

**1. Сцена з телефонами (Work → картка `apps-card`, компонент `PhonesStage`)**
- У кожному з трьох телефонів замість розмитих блоків показати справжній скриншот: `<img>` на весь екран телефона з `object-fit: cover; object-position: top`. Розташування таке: лівий — `screen-left`, центральний — `screen-center`, правий — `screen-right`. Розмиття (`blur`) для скриншотів прибрати. Рамки, кути, нахил, кільця й світіння сцени лишаються як у макеті.
- Скриншоти **не** розмиті й читабельні. Якщо через розмір телефона в макеті текст скриншота стає дрібним, допустимо збільшити телефони в межах сцени, але без переповнення картки на жодній ширині.
- `loading="lazy"`, `decoding="async"`, явні `width`/`height`, щоб макет не стрибав.
- Якщо картинка не завантажилась (`onError`), у цьому телефоні показати колишню розмиту заглушку.
- **Доступність:** з контейнера сцени прибрати `aria-hidden`. Кожен `<img>` має `alt`:
  - EN: «FieldQuote — estimate screen», «FieldQuote — home screen», «FieldQuote — preview and client signature»;
  - UA: «FieldQuote — екран кошторису», «FieldQuote — головний екран», «FieldQuote — перегляд і підпис клієнта».
- **На телефоні (≤ 720 px):** сцена й надалі показується під текстом, як у макеті. Скриншоти мають бути видимі.

**2. Блок «Own projects» у картці `apps-card` (Work)**

| Елемент | EN | UA |
|---|---|---|
| Підпис над заголовком (`appsOwn`) | Own projects (без змін) | Власні проєкти (без змін) |
| Заголовок (`featTitle`) | FieldQuote | FieldQuote |
| Бейдж (`inReview` → новий ключ, наприклад `appLive`) | On the App Store | В App Store |
| Опис (`featBody`) | Quote on site. Get paid before you leave. An offline-first iOS app for solo contractors: estimates, invoices, PDFs and client signatures right on the job. | Кошторис на обʼєкті — оплата ще до відʼїзду. Офлайн iOS-застосунок для контракторів-одинаків: кошториси, інвойси, PDF і підпис клієнта просто на місці. |
| Теги | React Native · Expo · TypeScript · Offline-first | React Native · Expo · TypeScript · Offline-first |

- Бейдж: той самий стиль `badge`, що й був, але крапка **не блимає**. Анімацію `blink` для нього прибрати.
- Рядок статусу з іконкою годинника (`featStatus`) замінити рядком дій:
  1. **App Store** — посилання-кнопка в стилі `btn` (малий розмір `sm`) на `https://apps.apple.com/us/app/fieldquote-invoices-quotes/id6822302139`. Текст EN «Download on the App Store», UA «Завантажити в App Store». Іконка — наявна стрілка-«вихід» (`↗`). **Без офіційного логотипа Apple** і без бейджа Apple.
  2. **Сайт** — посилання-кнопка `btn sm` на `https://fieldquote.org/` з текстом «fieldquote.org» та іконкою `↗`.
  3. **Google Play** — неактивна «пігулка» (не посилання, `<span>`), стиль `badge neutral`. Текст EN «Google Play — coming soon», UA «Google Play — незабаром».
- Обидва посилання зовнішні: `target="_blank" rel="noopener noreferrer"`. Пропустити їх через наявний `safeHref` / `links.ts`.
- На ≤ 720 px кнопки переносяться в кілька рядків і не вилазять за картку.
- Лічильник групи «Mobile apps» лишається 2 (FieldQuote + клієнтські застосунки під NDA). Блок NDA без змін.

**3. Інші тексти зі старим статусом «на рев'ю»**

| Де | EN | UA |
|---|---|---|
| Home → друга плитка робіт: заголовок | FieldQuote | FieldQuote |
| Home → друга плитка: текст | Offline-first quotes, invoices and client signatures for contractors. | Офлайн-кошториси, інвойси та підпис клієнта для контракторів. |
| Home → друга плитка: метрика | On the App Store · Google Play soon | В App Store · Google Play незабаром |
| About → анкета «Now» / «Зараз» | FieldQuote — my own iOS app, live on the App Store | FieldQuote — мій iOS-застосунок, уже в App Store |
| About → досвід, посада React Native, пункт 1 | Own product FieldQuote — live on the App Store, Google Play coming soon. | Власний продукт FieldQuote — уже в App Store, Google Play незабаром. |

- Плитка на Home, як і раніше, веде на `/work`. Мітка плитки «Own projects» / «Власні проєкти» не змінюється.
- Знайти й оновити **всі** інші місця з «review» / «рев'ю» в контексті статусу застосунку. Слово «Review» у кроках AI-процесу (`stReview`) — це інше значення, його не чіпати.
- Видалити ключі, що стали непотрібними (`inReview`, `featStatus`). Словник, як і раніше, має однакові ключі в EN і UA.

**Required `data-testid`** (нові; решта без змін):

| Елемент | `data-testid` |
|---|---|
| Скриншоти в телефонах | `app-screen-left`, `app-screen-center`, `app-screen-right` |
| Бейдж «On the App Store» | `app-live-badge` |
| Посилання App Store | `app-store-link` |
| Посилання на сайт | `app-site-link` |
| Позначка Google Play | `google-play-soon` |

**Unit-тести:**
- `PhonesStage`: три `<img>` з правильними `src` і `alt`; після `onError` показується заглушка.
- Картка застосунку: посилання з `target` / `rel`; Google Play не є посиланням.
- Словник: немає видалених ключів і однакові ключі в обох мовах.

## 3. Contracts
Немає.

## 4. Infra / deploy
Немає.

## 5. Acceptance criteria
1. **AC-1 — Скриншоти.** На `/work` (1440 і 390 px) `app-screen-left`, `app-screen-center` і `app-screen-right` видимі. Вони завантажені (`naturalWidth` > 0), мають `src` `/app/screen-*.webp`, не розмиті (`filter` без `blur`) і мають непорожній `alt`.
2. **AC-2 — Картка FieldQuote.**
   - Заголовок «FieldQuote», бейдж `app-live-badge` «On the App Store» без анімації.
   - `app-store-link` веде на URL App Store зі специфікації, `app-site-link` — на `https://fieldquote.org/`. Обидва мають `target="_blank"` і `rel` з `noopener`.
   - `google-play-soon` — не посилання, текст «Google Play — coming soon».
   - Рядка «Status: in … review» немає.
3. **AC-3 — Тексти.**
   - На Home друга плитка робіт має заголовок «FieldQuote» і метрику «On the App Store · Google Play soon».
   - About показує нові «Now» і пункт досвіду.
   - В EN жодна сторінка не містить «Google Play review», в UA — «на рев'ю».
   - UA-версія всіх нових текстів відповідає таблицям.
4. **AC-4 — Фото автора.** На Home і About рендериться `photo-img` з `src`, що закінчується на `/photo.webp`, і він завантажений (`naturalWidth` > 0).
5. **AC-5 — Без регресій.**
   - Наявні набори `e2e/*.spec.ts` проходять.
   - Тести, що підміняли `/photo.jpg`, перевести на `/photo.webp`, а тести «немає фото» — на `page.route('**/photo.webp', r => r.abort())`.
   - На 320, 390 і 1440 px немає горизонтального скролу на `/work`.

## 6. Test focus (for QA)
- **What changed for the user:** картка застосунків на Work, друга плитка на Home, анкета й досвід на About, справжнє фото.
- **What could break nearby:** переповнення картки `apps-card` на 320–720 px через кнопки; тести фото (тепер файл є насправді).
- **Not to re-test:** бургер, тема, мова, CV (покриті наявними наборами).
- **Risky cases:** 320 px (три кнопки дій); недоступний скриншот (`page.route` → abort) → заглушка в цьому телефоні.

## 7. Decisions (questions answered by the user)
| # | Question | Answer | Asked by | Date |
|---|---|---|---|---|
| 1 | Де брати фото застосунку | 3 скриншоти від користувача → `public/app/` | PM | 2026-11-11 |
| 2 | Посилання | App Store `id6822302139` і сайт fieldquote.org («візьми все, що треба») | PM | 2026-11-11 |
| 3 | Google Play | «Скоро буде» → неактивна позначка «coming soon» | PM | 2026-11-11 |
| 4 | Глибина QA | smoke | PM | 2026-11-11 |
| 5 | Тексти EN/UA про FieldQuote | assumed: за описом з App Store і сайту (таблиці вище) | PM | 2026-11-11 |
| 6 | Логотип Apple / офіційний бейдж | assumed: без нього, звичайна кнопка з текстом | PM | 2026-11-11 |
| 7 | Фото автора `photo.webp` | Правка користувача, зберегти | PM | 2026-11-11 |

## 8. Out of scope
- Окрема сторінка кейсу FieldQuote.
- Посилання на Google Play (додамо, коли застосунок вийде).
