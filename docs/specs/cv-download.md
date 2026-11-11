# Завантаження реального CV

- **Task id:** cv-download
- **Services:** web (frontend)
- **Infra changes:** no
- **QA:** e2e (Playwright), глибина `smoke`

## 1. Goal
Кнопки «Download CV» / «Завантажити CV» мають віддавати справжнє резюме автора. Зараз вони ведуть на `/cv.pdf`, але файлу немає. Відвідувач (рекрутер) отримує PDF під зрозумілою назвою `Bohdan_Hnidenko_React_Native_CV.pdf`.

## 2. Service changes

### web (frontend)
- **Файл:** скопіювати `/Users/bohdanhnidenko/Downloads/Bohdan_Hnidenko_React_Native_CV.pdf` без змін у `public/cv.pdf` (бінарно, не перегенеровувати). Vite скопіює його в `dist/cv.pdf`.
- **Шлях на сайті:** лишається `/cv.pdf` (`CV_HREF` у `src/data/contacts.ts`).
- **Назва при збереженні:** додати в `src/data/contacts.ts` константу `CV_FILENAME = 'Bohdan_Hnidenko_React_Native_CV.pdf'` і передавати її як значення атрибута `download` (замість порожнього `download`) в усіх 4 місцях:
  - `cv-header` — `src/components/Header/Header.tsx`;
  - `cv-hero` — `src/pages/HomePage.tsx`;
  - `band-primary` на сторінці About — `src/pages/AboutPage.tsx` через `CtaBand` (змінити тип пропа `download` так, щоб він приймав назву файлу; на сторінках, де `download` не передано, атрибута як і раніше немає);
  - `cv-contact` — `src/pages/ContactPage.tsx` (`ContactCard`, так само).
- **Мова:** один і той самий англійський PDF для обох мов сайту (EN і UA).
- **Коментар у `contacts.ts`:** оновити (зараз там написано, що файл «додасть автор пізніше»).
- **Тести:** оновити `src/App.test.tsx` — перевіряти, що `download` дорівнює `Bohdan_Hnidenko_React_Native_CV.pdf`.
- **Не змінювати:** вигляд кнопок, тексти, `href`, решту сторінок, `public/_headers`.
- **Required `data-testid`:** без змін — `cv-header`, `cv-hero`, `band-primary` (About), `cv-contact`.

## 3. Contracts
Немає.

## 4. Infra / deploy
Немає. Файл роздається як статичний асет Cloudflare (`dist/cv.pdf`).

## 5. Acceptance criteria
1. **AC-1 — Файл існує.** `GET /cv.pdf` повертає статус 200, `Content-Type` містить `application/pdf`, тіло починається з `%PDF` і не є `index.html` (SPA-фолбек).
2. **AC-2 — Це саме CV автора.** Розмір відповіді збігається з розміром `/Users/bohdanhnidenko/Downloads/Bohdan_Hnidenko_React_Native_CV.pdf` (байт у байт).
3. **AC-3 — Назва файлу.** Елементи `cv-header`, `cv-hero` (головна), `band-primary` (About) і `cv-contact` (Contact) мають `href="/cv.pdf"` і `download="Bohdan_Hnidenko_React_Native_CV.pdf"`. Клік по `cv-hero` запускає завантаження з `suggestedFilename` = `Bohdan_Hnidenko_React_Native_CV.pdf`.
4. **AC-4 — Обидві мови.** Після перемикання сайту на UA кнопки ведуть на той самий файл з тією самою назвою.
5. **AC-5 — Без регресій.** Набір `e2e/portfolio-layout.spec.ts` та `e2e/cv-button-static.spec.ts` проходять.

## 6. Test focus (for QA)
- **What changed for the user:** кнопки CV реально завантажують PDF з іменем `Bohdan_Hnidenko_React_Native_CV.pdf`.
- **What could break nearby:** кнопка `band-primary` на інших сторінках (там, де вона не про CV, атрибута `download` бути не повинно); вигляд кнопок CV на мобільній ширині 390.
- **Not to re-test:** решту сторінок і анімацій.
- **Risky cases:** `/cv.pdf` віддає `index.html` замість PDF (SPA-фолбек, якщо файл не потрапив у збірку).

## 7. Decisions (questions answered by the user)
| # | Question | Answer | Asked by | Date |
|---|---|---|---|---|
| 1 | Що зробити з CV? | Лише підключити PDF до кнопок, тексти сайту не чіпати | PM | 2026-11-11 |
| 2 | Назва файлу при завантаженні | `Bohdan_Hnidenko_React_Native_CV.pdf` | PM | 2026-11-11 |
| 3 | CV для UA-версії | Той самий англійський PDF | PM | 2026-11-11 |
| 4 | Глибина QA | smoke | PM | 2026-11-11 |

## 8. Out of scope
- Звірка текстів сайту з CV.
- Українська версія CV.
