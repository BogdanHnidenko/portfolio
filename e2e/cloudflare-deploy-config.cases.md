# cloudflare-deploy-config — план тестів (smoke)

Усі тести йдуть проти `wrangler dev` на http://localhost:8787 (спочатку `npm run build`).

| # | AC | кейс | категорія | кроки | очікувано | режим |
|---|----|------|-----------|-------|-----------|-------|
| 1 | AC-1 | dist містить index.html, _headers, assets/ | happy | перевірити файли після збірки | файли є | auto |
| 2 | AC-2 | GET / | happy | відкрити / | 200, застосунок відрендерився | auto |
| 3 | AC-3 | /about, /work, /contact, /about/ напряму і після reload | happy | goto + reload | 200, застосунок відрендерився | auto |
| 4 | AC-4 | /does-not-exist | happy | goto | 200, html, застосунок відрендерився | auto |
| 5 | AC-5 | безпекові заголовки на / | happy | GET / | три заголовки | auto |
| 6 | AC-6 | кеш /assets/*, /assets/nope.js | happy | GET бандла, GET nope.js | immutable; nope.js не JS | auto |
| 7 | AC-7 | статика public/ | happy | GET photo.webp, public/app/* | 200, image/webp | auto |
| 8 | AC-8 | /_headers | happy | GET | у тілі немає X-Frame-Options | auto |
| 9 | AC-2 | [responsive] головна на 3 ширинах | responsive | eachWidth + checkLayout | без проблем верстки | auto |
