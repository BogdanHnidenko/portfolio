# Тест-план: portfolio-pages (глибина deep)

Файл тестів: `e2e/portfolio-pages.spec.ts`. Усі кейси `auto`, окрім зазначених як manual внизу.
Для кожного тесту діє фікстура: будь-яка помилка або попередження консолі / pageerror = падіння.

## AC-1 Сторінки й контент
| # | кейс | категорія | дані | кроки | очікується | режим |
|---|---|---|---|---|---|---|
| 1 | Home: кількості й EN-тексти | happy | `/` | відкрити | 3 показники, 3 плитки, 5 кроків AI, 8 тегів, CTA, 4 рядки контактів; тексти COPY.en | auto |
| 2 | Work | happy | `/work` | відкрити | групи 3/2/1, 4 кейси, apps-card, банер, тексти | auto |
| 3 | About | happy | `/about` | відкрити | 4 рядки анкети, 2 посади, схема, 3 картки, 6 рядків стеку, банер | auto |
| 4 | Contact | happy | `/contact` | відкрити | email + 4 картки | auto |
| 5 | header/footer на кожній сторінці (x4) | happy | 4 шляхи | відкрити | header, footer, один `page-*` | auto |
| 6 | Немає undefined/null/lorem/«Your photo» (EN, UA) | negative | 4 сторінки x 2 мови | відкрити | таких слів у тексті немає | auto |
| 7 | Навігація по всіх сторінках | navigation | клік по меню/лого/плитках | пройти | консоль чиста | auto |
| 8 | Кількість testid за специфікацією | boundary | усі сторінки | порахувати | співпадає | auto |

## AC-2 Навігація
| # | кейс | категорія | очікується | режим |
|---|---|---|---|---|
| 1-3 | десктопний пункт work/about/contact | happy | URL, сторінка, `aria-current`, клас `on` | auto |
| 4-6 | мобільний пункт (390 px) | happy | те саме | auto |
| 7 | Home без активного пункту, лого -> `/` | happy | немає `aria-current` | auto |
| 8 | Внутрішні посилання Home | navigation | `<a href>` на правильні адреси | auto |
| 9 | Банери Work/About -> `/contact` | navigation | перехід | auto |
| 10 | Scroll top після переходу | navigation | scrollY = 0 | auto |
| 11 | Назад/Вперед | navigation | правильні сторінки й aria-current | auto |
| 12 | Швидкі послідовні кліки | interrupt | фінальна сторінка = останній клік | auto |
| 13 | Подвійний клік | interrupt | одна сторінка, Назад -> Home | auto |
| 14 | Ctrl/Cmd+клік | interrupt | нова вкладка, поточна не змінилась | auto |
| 15 | Немає `#top`/порожніх href | negative | лише skip-link `#main` | auto |
| 16 | aria-current при зміні мови | boundary | лишається на активному | auto |

## AC-3 Прямі посилання
| # | кейс | категорія | очікується | режим |
|---|---|---|---|---|
| 1-4 | пряме відкриття + reload, title EN | happy | сторінка й title | auto |
| 5-8 | title UA на кожній | happy | title UA | auto |
| 9-13 | `/foo`, `/foo/bar/baz`, `/Work`, `/work/x`, `/index.html` | negative | редірект на `/` | auto |
| 14 | `/foo` не лишається в історії | negative | Назад -> попередня | auto |
| 15 | `/work/` | boundary | показує Work | auto |
| 16 | `?query`, `#hash` | boundary | сторінка показується | auto |
| 17 | title при навігації й зміні мови | navigation | змінюється | auto |
| 18 | reload після переходу, Назад | interrupt | сторінка не порожня | auto |
| 19 | друга вкладка | state | спільні тема й мова | auto |

## AC-4 Мова
| # | кейс | категорія | очікується | режим |
|---|---|---|---|---|
| 1-4 | UA/EN на кожній сторінці | happy | переклад, `html lang`, `aria-pressed`, title, немає англійських текстів | auto |
| 5 | UA-показники з NB, «~7 днів» | happy | як у макеті | auto |
| 6 | UA кейси Work | happy | переклад | auto |
| 7 | Збереження при переходах і reload | navigation | UA лишається | auto |
| 8 | Багаторазові кліки | boundary | стабільний стан | auto |
| 9 | У сторі лише theme/lang | state | ключі | auto |
| 10 | Мова за системою на першому візиті | state | uk -> UA, інше -> EN | auto |
| 11 | Пошкоджений localStorage (6 варіантів) | negative | сайт працює | auto |
| 12 | localStorage кидає виняток | negative | сайт працює | auto |

## AC-5 Тема
| # | кейс | категорія | очікується | режим |
|---|---|---|---|---|
| 1-4 | dark -> light -> dark на кожній сторінці | happy | data-theme на root і html, іконки, фон | auto |
| 5 | Збереження при переходах, Назад, reload | navigation | light | auto |
| 6 | Тема й мова незалежні | happy | | auto |
| 7 | Системна тема на першому візиті | state | light/dark | auto |
| 8 | Збережена тема > системної | state | | auto |
| 9-10 | Без блимання на прямому `/about` (без JS бандла) | interrupt | `data-theme` і фон від inline-скрипта | auto |
| 11 | 7 швидких кліків | boundary | light | auto |
| 12 | Колір заголовка != фон | negative | обидві теми | auto |

## AC-6 Фото
| # | кейс | категорія | очікується | режим |
|---|---|---|---|---|
| 1-3 | Без файлу: Home, About, реальний стан | happy | заглушки, бейдж, без підпису | auto |
| 4-5 | З фото (route): Home, About | happy | `photo-img`, alt = імʼя, cover | auto |
| 6 | Пропорції 4:5 / 3:4 | boundary | у обох станах | auto |
| 7 | abort / 200 зі сміттям | negative | заглушка після onError | auto |
| 8 | Home -> About -> Home | navigation | фото лишається | auto |
| 9 | UA alt | state | | auto |
| 10 | Повільна відповідь | interrupt | потім фото | auto |

## AC-7 Посилання
CV на 4 сторінках (happy x4), mailto на 3 (happy x3), соцмережі Home+Contact (happy), case-link (data), усі `<a>` без порожніх/`#` і зовнішні з noopener noreferrer (negative), UA (state), клік по CV = download (interrupt), клік по email (boundary).

## AC-8 Адаптив
Для кожної з 4 сторінок: немає гор. скролу на 320/390/768/1024/1440 (boundary), `checkLayout` на 7 ширинах EN dark і UA light (responsive). Плюс: фото на 320/390/1440, ворожий довгий текст 320, перемикання nav-mobile/nav-desktop на 900/901, CV «CV» на 720/721, мобільна навігація 390, bento 1440 і 390 (state).

## AC-9 Анімації й доступність
reduced-motion x4 (happy), прокрутка без opacity 0 x4 (boundary), rise при переході (navigation), skip-link (happy), фокус на main/h1 (navigation x2), плитки Home — `<a>` (happy), клавіатура й видимий фокус x4 (negative), Enter на меню (interrupt), CV без анімації (happy).

## Не застосовується
- `partial`: на сайті немає форм і чернеток.

## Manual
- Порівняння з артбордами Desktop 1440 / Mobile 390 «піксель-у-піксель»: ручний огляд скриншотів (див. звіт, source visual).
- Справжня реакція ОС на `mailto:` і завантаження PDF: поза межами (за специфікацією).
