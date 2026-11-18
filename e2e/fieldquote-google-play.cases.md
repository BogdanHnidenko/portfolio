# fieldquote-google-play: план тестів (smoke)

| # | кейс | категорія | кроки | очікувано | режим |
|---|---|---|---|---|---|
| AC-1 | Посилання Google Play (EN/UA) | happy | відкрити /work | google-play-link: href, target, rel, текст; порядок кнопок; google-play-soon немає | auto |
| AC-2 | Бейдж і опис (EN/UA) | happy | /work | бейдж і «iOS & Android» / «iOS та Android» | auto |
| AC-3 | Інші тексти, відсутність «coming soon» | happy | Home, About, усі сторінки EN/UA | нові тексти; старих фраз немає | auto |
| AC-4 | Адаптивність /work | responsive | 320/390/1440 + 375/768/1280, EN і UA | без горизонтального скролу, кнопки в межах картки | auto |
