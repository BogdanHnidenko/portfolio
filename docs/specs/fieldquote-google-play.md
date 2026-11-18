# FieldQuote вийшов у Google Play: посилання і нові статуси

- **Task id:** fieldquote-google-play
- **Services:** web (frontend)
- **Infra changes:** no
- **QA:** e2e (Playwright), глибина `smoke`

## 1. Goal
Застосунок автора **FieldQuote: Invoices & Quotes** тепер є і в Google Play:
<https://play.google.com/store/apps/details?id=com.modernapps.devstudio.fieldquote>.
Зараз сайт показує неактивну позначку «Google Play — coming soon» і тексти «iOS app», «Google Play soon».
Відвідувач має бачити, що застосунок доступний на обох платформах, і могти перейти в Google Play одним кліком.

Попередня задача з картою FieldQuote: `docs/specs/fieldquote-app.md` (усе, що тут не змінюється, лишається як там).

## 2. Service changes

### web (frontend)

**Дані:** у `src/data/apps.ts` додати константу `FIELDQUOTE_GOOGLE_PLAY_HREF = 'https://play.google.com/store/apps/details?id=com.modernapps.devstudio.fieldquote'` з JSDoc. JSDoc над `FIELDQUOTE_APP_STORE_HREF` не має називати застосунок «лише iOS».

**1. Рядок дій картки FieldQuote (`FieldQuoteActions`, Work → `apps-card`)**
- Неактивну позначку `google-play-soon` (`<span>`) **прибрати**.
- Замість неї додати третю кнопку-посилання в тому самому стилі, що й App Store (`btn sm`, іконка `↗`, через `externalLinkProps` / `isRenderableHref`): `target="_blank"`, `rel="noopener noreferrer"`.
- Порядок: App Store → Google Play → fieldquote.org.
- Текст: EN «Get it on Google Play», UA «Завантажити з Google Play». **Без офіційного логотипа/бейджа Google**.
- На ≤ 720 px кнопки переносяться й не виходять за картку (як зараз).
- Оновити JSDoc компонента та коментар у `FieldQuoteActions.module.scss` (позначки Google Play більше немає; правило `.soon` прибрати, якщо стає непотрібним).

**2. Тексти (EN / UA)**

| Ключ / де | EN | UA |
|---|---|---|
| `appLive` — бейдж біля заголовка FieldQuote | On App Store & Google Play | В App Store і Google Play |
| `featBody` — опис | Quote on site. Get paid before you leave. An offline-first iOS & Android app for solo contractors: estimates, invoices, PDFs and client signatures right on the job. | Кошторис на обʼєкті — оплата ще до відʼїзду. Офлайн-застосунок для iOS та Android для контракторів-одинаків: кошториси, інвойси, PDF і підпис клієнта просто на місці. |
| `googlePlaySoon` → перейменувати на `googlePlayCta` | Get it on Google Play | Завантажити з Google Play |
| Home → друга плитка робіт, `metric` | On App Store & Google Play | В App Store і Google Play |
| About → анкета `prof[0]` «Now» / «Зараз» | FieldQuote — my own app, live on App Store & Google Play | FieldQuote — мій застосунок, уже в App Store і Google Play |
| About → досвід, посада React Native, пункт 1 | Own product FieldQuote — live on the App Store and Google Play. | Власний продукт FieldQuote — уже в App Store і Google Play. |

- Ключ `googlePlaySoon` видалити з типу й обох словників; ключі EN і UA лишаються однаковими.
- Більше ніде на сайті не має лишитися «coming soon» / «незабаром» / «Google Play soon» щодо Google Play.

**Required `data-testid`:**

| Елемент | `data-testid` |
|---|---|
| Посилання Google Play (нове) | `google-play-link` |
| Позначка `google-play-soon` | **видалена** — не повинна існувати |
| Решта (`app-store-link`, `app-site-link`, `app-live-badge`, `app-actions`, `home-work-tile`) | без змін |

**Unit-тести:** оновити наявні тести (`FieldQuoteActions.test.tsx`, `dictionary.test.ts`, `App.test.tsx`) під нові тексти; перевірити, що `google-play-link` — посилання з правильним `href`, `target="_blank"`, `rel` з `noopener`, і що `google-play-soon` немає; у словнику — заборонити «coming soon» / «незабаром» / «Google Play soon».

## 3. Contracts
Немає.

## 4. Infra / deploy
Немає.

## 5. Acceptance criteria
1. **AC-1 — Посилання Google Play.** На `/work` у `app-actions` є `google-play-link` з `href` `https://play.google.com/store/apps/details?id=com.modernapps.devstudio.fieldquote`, `target="_blank"`, `rel` містить `noopener`, текст EN «Get it on Google Play» (UA «Завантажити з Google Play»). Порядок кнопок: `app-store-link`, `google-play-link`, `app-site-link`. Елемента `google-play-soon` немає.
2. **AC-2 — Бейдж і опис.** `app-live-badge` показує «On App Store & Google Play» (UA «В App Store і Google Play»); опис картки містить «iOS & Android» (UA «iOS та Android»).
3. **AC-3 — Інші тексти.** На Home друга `home-work-tile` має метрику «On App Store & Google Play»; на About — нові «Now» і пункт досвіду з таблиці. На жодній сторінці (EN і UA) немає «coming soon», «Google Play soon», «незабаром».
4. **AC-4 — Без регресій і переповнення.** Наявні набори `e2e/*.spec.ts` проходять (оновити ті, що чекали `google-play-soon` чи старі тексти). На 320, 390 і 1440 px на `/work` немає горизонтального скролу, три кнопки не виходять за `apps-card`.

## 6. Test focus (for QA)
- **What changed for the user:** третя кнопка Google Play у картці FieldQuote, нові статуси на Work, Home, About.
- **What could break nearby:** переповнення рядка дій на 320 px (тепер три кнопки замість двох + позначки); старі e2e, що шукали `google-play-soon`.
- **Not to re-test:** скриншоти в телефонах, фото, бургер, тема, CV.
- **Risky cases:** 320 px в UA (найдовші тексти кнопок).

## 7. Decisions (questions answered by the user)
| # | Question | Answer | Asked by | Date |
|---|---|---|---|---|
| 1 | Глибина QA | smoke | PM | 2026-11-18 |
| 2 | Текст бейджа | «On App Store & Google Play» / «В App Store і Google Play» | PM | 2026-11-18 |
| 3 | Текст кнопки і решта текстів | assumed: таблиця вище, без офіційного логотипа Google | PM | 2026-11-18 |

## 8. Out of scope
- Офіційні бейджі магазинів, окрема сторінка кейсу, скриншоти Android.
