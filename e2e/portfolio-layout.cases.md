# Тест-план: portfolio-layout (глибина deep)

Тести: `e2e/portfolio-layout.spec.ts`. Кожен `test()` — один кейс, назва `AC-<n> [категорія] ...`.
Кожен тест додатково падає, якщо в консолі є error/warning або pageerror.

## AC-1 Структура й контент
| # | case | category | data | steps | expected | mode |
|---|---|---|---|---|---|---|
| 1 | порядок блоків і кількості | happy | 1440, dark, en | відкрити сайт | header, hero, 5 секцій, footer по порядку; 2 групи, 4 кейси, 3 AI-картки, 2 посади, 6 рядків стеку, 96 барів, 3 напрями, один h1 | auto |
| 2 | тексти EN дослівно з COPY.en | data | ~100 фрагментів | зібрати текст сторінки | усі фрагменти є | auto |
| 3 | групи 3+1, назви, лічильники, мета | boundary | | перевірити групи | 3 і 1 кейси, мета «May 2023 – Jun 2026» | auto |
| 4 | без плейсхолдерів і невикористаних ключів | negative | undefined, {{, lorem, Filter projects... | пошук у тексті | не знайдено | auto |
| 5 | нерозривні пробіли | data | «~1 week» | перевірити сирий текст | NB збережено | auto |
| 6 | прокрутка + reload | state | | скрол до низу, reload | сторінка жива, консоль чиста | auto |

## AC-2 Мова
| # | case | category | steps | expected | mode |
|---|---|---|---|---|---|
| 1 | EN -> UA | happy | клік lang-ua | навігація, aria-label теми, html lang=uk, title, aria-pressed | auto |
| 2 | UA -> EN | happy | клік lang-ua, lang-en | усе англійською | auto |
| 3 | повторні кліки на активну мову, dblclick | boundary | | нічого не ламається | auto |
| 4 | у UA немає EN-рядків | data | зібрати текст | немає англійських фраз, є українські | auto |
| 5 | 12 швидких перемикань | interrupt | | стан узгоджений | auto |
| 6 | Enter/Space, скрол не скидається | navigation | | працює з клавіатури | auto |
| 7 | UA на 390 px | a11y | | мобільна навігація UA, CV=«CV» | auto |

## AC-3 Тема
| # | case | category | steps | expected | mode |
|---|---|---|---|---|---|
| 1 | dark -> light | happy | клік theme-toggle | data-theme на root і html, фон body, іконки | auto |
| 2 | light -> dark | happy | два кліки | токени dark | auto |
| 3 | токени light | data | | колір і фон за макетом | auto |
| 4 | 7 швидких кліків, dblclick | interrupt | | узгоджено, одна іконка | auto |
| 5 | без білих смуг внизу | boundary | скрол до низу в обох темах | фон теми | auto |
| 6 | клавіатура, скрол не стрибає | navigation | | працює | auto |
| 7 | тема і мова незалежні | state | | | auto |

## AC-4 Збереження
| # | case | category | expected | mode |
|---|---|---|---|---|
| 1 | вибір переживає reload; у сховищі лише theme і lang | happy | | auto |
| 2 | кілька reload і нова вкладка | interrupt | | auto |
| 3 | немає блимання: журнал змін data-theme без dark | negative | | auto |
| 4 | inline-скрипт ставить тему без бандла | boundary | | auto |
| 5 | очищений localStorage | state | початкові значення | auto |
| 6 | збережена лише мова | partial | тема за системою | auto |

## AC-5 Перший візит
| # | case | category | expected | mode |
|---|---|---|---|---|
| 1-2 | prefers-color-scheme light/dark | happy | відповідна тема | auto |
| 3 | light + uk-UA | boundary | light + UA | auto |
| 4 | збережене перекриває систему | state | | auto |
| 5-8 | локалі en-GB, ru-RU, de-DE, uk | data | en, en, en, uk | auto |
| 9 | uk не першою в navigator.languages | data | UA | auto |
| 10-15 | пошкоджений JSON, порожній, null, невалідні значення, числа, масив | negative | початкові значення, без помилок, сайт працює | auto |
| 16 | localStorage кидає виняток | negative | працює, не зберігається | auto |
| 17 | matchMedia недоступний | boundary | dark | auto |
| 18 | валідна тема + недопустима мова | partial | мова початкова | auto |

## AC-6 Навігація
| # | case | category | expected | mode |
|---|---|---|---|---|
| 1-5 | кожне посилання desktop nav | navigation | hash, секція видима, заголовок не під хедером | auto |
| 6 | лого | navigation | #top, скрол нагору | auto |
| 7 | View work і 3 картки-напрями | navigation | відповідні секції | auto |
| 8 | skip-link (Tab, Enter) | navigation | #work | auto |
| 9 | 1440 і 901 | boundary | desktop-nav видима, mobile прихована | auto |
| 10-13 | 900/768/390/320 | boundary | mobile-nav видима | auto |
| 14 | 5 мобільних посилань | navigation | секції | auto |
| 15 | back/forward, відкриття з hash | navigation | | auto |
| 16 | dblclick + reload | interrupt | | auto |
| 17 | UA + light | state | | auto |

## AC-7 CV і посилання кейсів
Кейси: три CV (href, download); лише один case-link GitHub у AI Chat (data); три кейси без посилань і без «Live demo/Case study» (negative); немає порожніх/`#`/`#work` href (negative); UA (state); клік запускає download, а не навігацію (interrupt).

## AC-8 Контакти
Кейси: URL зі специфікації (happy); усі https-посилання target=_blank + noopener (data); якорі/mailto без _blank, Telegram відкриває popup (negative); UA (state); без дублів і видимі (boundary).

## AC-9 Адаптив
Кейси: відсутність hscroll на 320/390/768/1024/1440 (boundary); UA+light на 320/390 (data); email і теги не виходять за екран на 320 (boundary); 390: одна колонка кейсів, CV, напрями (visual); контакти 4/2/1 в ряд (visual); 1440 desktop (visual); брейкпоінт 720/721 (visual); resize 1440-390-1440 (interrupt).

## AC-10 Анімації й доступність
Кейси: після скролу до кожної з 5 секцій контент opacity 1 (happy); reduced motion: немає анімацій і контент видимий (state); reduced motion: transitions 0, миттєва навігація (state); без reduced motion анімації є (negative); Tab проходить усі елементи, фокус видимий (navigation); справжні button/a[href], aria (a11y); імена посилань (a11y); світла тема opacity (visual); progress-смуга і hscroll (boundary).

## Manual (не автоматизовано)
- Браузер без підтримки scroll-driven animations (CSS `@supports` не емулюється в Chromium): відкрити в Firefox/старому Safari, прокрутити, контент має бути видимий, смуга прогресу статична.
- Візуальне порівняння піксель-у-піксель з макетом (шрифти, тіні, градієнти): людина порівнює скриншоти з docs/design.
- Реальне завантаження cv.pdf: файлу ще немає.
