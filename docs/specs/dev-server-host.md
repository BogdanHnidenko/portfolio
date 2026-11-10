# Dev-сервер завжди доступний і локально, і в мережі

- **Task id:** dev-server-host
- **Services:** web (frontend)
- **Infra changes:** no
- **QA:** skip. Поведінка сайту не змінюється, змінюється лише адреса, на якій слухає dev/preview-сервер. PM перевіряє запуск вручну.

## 1. Goal
Власник хоче відкривати сайт і на компʼютері, і на телефоні в тій самій Wi-Fi. Для цього звичайний `npm run dev` має одразу показувати й `Local: http://localhost:5173/`, і `Network: http://<IP>:5173/`, без додаткових прапорців.

## 2. Service changes

### web (frontend)
- **Файл:** [vite.config.ts](../../vite.config.ts).
- **Зміна:** додати `host: true` у `server` і `preview`. Порти 5173 і 4173 та `strictPort` не змінювати.
- Оновити коментар над конфігурацією: сервер слухає всі мережеві інтерфейси, тож сайт видно іншим пристроям у тій самій мережі.
- **Не змінювати:** код сайту, тести, `e2e/playwright.config.ts`.

## 3. Contracts
Немає.

## 4. Infra / deploy
Немає.

## 5. Acceptance criteria
1. **AC-1.** `npm run dev` виводить два рядки: `Local: http://localhost:5173/` і щонайменше один `Network: http://<IP>:5173/`. Сайт відповідає 200 за обома адресами.
2. **AC-2.** `npm run preview` після `npm run build` так само виводить і Local (4173), і Network.
3. **AC-3.** `npm run dev -- --host` і далі працює та нічого не ламає.
4. **AC-4.** lint, typecheck, test і build зелені. e2e-конфіг, як і раніше, знаходить сервер на `http://localhost:5173`.

## 6. Test focus (for QA)
QA пропущено (`--no-qa`). AC-1–AC-3 перевіряє PM запуском сервера.

## 7. Decisions (questions answered by the user)
| # | Question | Answer | Asked by | Date |
|---|---|---|---|---|
| 1 | Як відкривати dev-сервер? | Завжди і localhost, і мережева адреса | PM | 2026-11-10 |
| 2 | Чи робити те саме для `preview`? | assumed: так, для однакової поведінки | PM | 2026-11-10 |

## 8. Out of scope
- Публічний деплой.
- HTTPS для dev-сервера.
