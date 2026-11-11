# favicon-initials — план тестів (smoke)

| # | кейс | категорія | дані | кроки | очікувано | auto/manual |
|---|---|---|---|---|---|---|
| AC-1 | Один link rel=icon на кожній сторінці | happy | /, /work, /about, /contact | відкрити, прочитати link[rel=icon] | один, href=/favicon.svg, type=image/svg+xml, без data:, | auto |
| AC-2 | GET /favicon.svg | happy | request | GET | 200, image/svg+xml, SVG з BH | auto |
| AC-2 | Світла тема ОС | happy | colorScheme light | GET | 200, містить BH | auto |
| AC-3 | Вигляд іконки | happy | 64 і 16 px | відкрити /favicon.svg, скриншот | BH, заокруглений квадрат | auto (+ перегляд скриншота) |
| AC-4 | Немає 404 | happy | усі сторінки | слухати відповіді/консоль | немає 404 на favicon | auto |
| AC-5 | Логотип хедера | happy | / | logo-link | текст BH, href / | auto |
| Сусідній | Заголовок вкладки EN/UA | happy | lang en/ua | відкрити | заголовок не змінився | auto |
| Responsive | 3 ширини | responsive | 375/768/1280 | checkLayout | без помилок верстки | auto |
