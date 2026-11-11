# nav-burger-layout: тест-план (smoke)

| # | Кейс | Категорія | Кроки | Очікується | Режим |
|---|---|---|---|---|---|
| AC-1.1 | Home перший у меню | happy | 1440, відкрити `/`, потім клік Work | `nav-link-home` перший, «Home», href `/`, aria-current лише на `/` | auto |
| AC-1.2 | UA-текст | happy | мова UA | «Головна» | auto |
| AC-2.1 | Бургер видно на 390 і 900, немає на 901 і 1440 | responsive | змінити ширину | menu-toggle 44x44, nav-desktop і перемикачі хедера сховані | auto |
| AC-2.2 | Відкриття і перехід | happy | клік бургера, клік About | aria-expanded, aria-label, перехід, панель закрита | auto |
| AC-2.3 | Esc, клік поза, повторний клік | happy | відкрити і закрити трьома способами | панель закрита, фокус на бургері | auto |
| AC-2.4 | Мова і тема в панелі | happy | клік UA, клік теми | переклад, панель відкрита, тема light | auto |
| AC-2.5 | Розширення вікна при відкритій панелі | interrupt | 390 -> 1440 | панель закрита | auto |
| AC-2.6 | Scroll lock | state | відкрита панель, колесо миші | scrollY = 0 | auto |
| AC-2.7 | Верстка панелі на 320/390/768/900 | responsive | відкрити панель | немає порушень | auto |
| AC-3.1 | Рівна сітка на 1024 і 800 | responsive | виміряти блоки | intro+photo в ряду, Stack+Contact в ряду, CTA нижче на всю ширину | auto |
| AC-3.2 | 390: усі плитки на всю ширину | responsive | виміряти | однакова ширина | auto |
| AC-3.3 | Без горизонтального скролу | responsive | 320/390/800/1024/1440 x 4 сторінки | scrollWidth = clientWidth | auto |
| AC-4.1 | Фото на 1440 і 800 | happy | підмінити photo.webp | cover, позиція 20%, плитка вища за ширину | auto |
| AC-4.2 | Фото на 390 | happy | підмінити photo.webp | 4:5 ±2px | auto |
| AC-4.3 | Заглушка | happy | photo.webp 404 | placeholder і badge видно | auto |
| AC-5 | Регресії | happy | portfolio-pages і cv-button-static | усі проходять; застарілі тести про nav-mobile / mnav-link-* переписано на бургер | auto |
