# fieldquote-app: тест-план (глибина smoke)

## AC-1 Скриншоти
| # | case | category | data | steps | expected | mode |
|---|---|---|---|---|---|---|
| 1 | Скриншоти на 1440 і 390 | happy | /work | відкрити, прокрутити до картки | 3 img видимі, naturalWidth>0, src /app/screen-*.webp, без blur, alt не порожній | auto |
| 2 | Скриншот недоступний | negative | abort screen-left | відкрити /work | у лівому телефоні заглушка, інші img на місці | auto |
| 3 | UA alt | state | мова UA | відкрити /work | alt українською за специфікацією | auto |

## AC-2 Картка FieldQuote
| # | case | category | data | steps | expected | mode |
|---|---|---|---|---|---|---|
| 1 | Картка EN | happy | /work | відкрити | заголовок, бейдж без анімації, посилання з target/rel, Google Play це span, немає «Status» | auto |
| 2 | Картка UA | state | UA | відкрити | тексти за таблицею | auto |

## AC-3 Тексти
| # | case | category | data | steps | expected | mode |
|---|---|---|---|---|---|---|
| 1 | EN Home/About | happy | EN | Home, About | нові тексти плитки, Now і досвіду | auto |
| 2 | UA Home/About | happy | UA | Home, About | UA-тексти за таблицею | auto |
| 3 | Старі фрази | negative | 4 сторінки EN/UA | відкрити | немає «Google Play review», «In review», «на рев'ю» | auto |

## AC-4 Фото
| # | case | category | data | steps | expected | mode |
|---|---|---|---|---|---|---|
| 1 | Home і About | happy | реальний файл | відкрити | photo-img src .../photo.webp, naturalWidth>0 | auto |

## AC-5 Без регресій
| # | case | category | data | steps | expected | mode |
|---|---|---|---|---|---|---|
| 1 | Горизонтальний скрол /work | happy | 320, 390, 1440 | відкрити | scrollWidth <= clientWidth | auto |
| 2 | Адаптивність картки EN і UA | responsive | 375, 768, 1280 | checkLayout | без переповнення (нахил телефонів і sticky-хедер у винятках) | auto |
| 3 | Кнопки на 320 | responsive | UA | відкрити | кнопки й позначка в межах картки | auto |
| 4 | Наявні набори | happy | e2e/*.spec.ts | повний прогін | проходять | auto |
