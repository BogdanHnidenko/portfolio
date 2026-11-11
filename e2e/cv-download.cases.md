# cv-download — тест-план (smoke)

| # | кейс | категорія | дані | кроки | очікувано | режим |
|---|---|---|---|---|---|---|
| AC-1 | /cv.pdf віддає PDF | happy | GET /cv.pdf | запит | 200, application/pdf, тіло починається з %PDF | auto |
| AC-2 | байт у байт з оригіналом | happy | Downloads/Bohdan_Hnidenko_React_Native_CV.pdf | порівняти тіло | однакові | auto |
| AC-3 | href і download на 4 кнопках; клік cv-hero | happy | EN | відкрити /, /about, /contact | href=/cv.pdf, download=ім'я; suggestedFilename = ім'я | auto |
| AC-3 | band-primary на /work без download | negative | EN | відкрити /work | немає download, href не /cv.pdf | auto |
| AC-3 | верстка кнопок на 375/768/1280 | responsive | — | eachWidth + checkLayout | без проблем | auto |
| AC-4 | ті самі кнопки в UA | happy | lang=ua | відкрити сторінки, клік cv-hero | те саме ім'я та href | auto |
| AC-5 | регресія | happy | cv-button-static.spec.ts + cv-header на всіх сторінках | запустити | проходить | auto |
