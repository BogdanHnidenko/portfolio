# home-tile-anchors — план тестів (smoke)

| AC | кейс | категорія | очікування | режим |
|---|---|---|---|---|
| AC-1 | href 5 плиток + view-work + контакти | happy | href за специфікацією | auto |
| AC-2 | клік по кожній із 5 плиток | happy | блок видно під хедером | auto |
| AC-2 | Work за якорем на 375/768/1280 | responsive | немає проблем верстки | auto |
| AC-3 | прямий захід і reload `/work#work-apps`, `/about#stack` | navigation | блок видно | auto |
| AC-4 | view-work, пункт меню | navigation | scrollY = 0 | auto |
| AC-5/6 | скрол, плитка, Назад, Вперед | navigation | позиція ±5 px | auto |
| AC-7 | About скрол, Contact, Назад | navigation | позиція ±5 px | auto |
| AC-8 | 375 px: плитка, Назад, бургер | responsive | як на десктопі | auto |
