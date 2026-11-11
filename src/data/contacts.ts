/** Шлях до CV: файл `public/cv.pdf` (англійське резюме автора, спільне для EN і UA); кнопки завантаження посилаються сюди. */
export const CV_HREF = '/cv.pdf';

/** Назва, під якою браузер зберігає CV (значення атрибута `download` на всіх кнопках CV). */
export const CV_FILENAME = 'Bohdan_Hnidenko_React_Native_CV.pdf';

/** Адреса пошти для картки email. */
export const EMAIL = 'bodyaghnidenko@gmail.com';

/** Посилання mailto для картки email. */
export const EMAIL_HREF = `mailto:${EMAIL}`;

/** Профіль LinkedIn. */
export const LINKEDIN_HREF = 'https://www.linkedin.com/in/bohdan-hnidenko-dev';

/** Профіль GitHub. */
export const GITHUB_HREF = 'https://github.com/BogdanHnidenko';

/** Профіль Telegram. */
export const TELEGRAM_HREF = 'https://t.me/Bohdan_Hnidenko';

/**
 * Фото автора: файл `public/photo.webp`; якщо він недоступний, показується заглушка.
 * Рекомендований файл: вертикальне фото по пояс, ~1200×1500 px (4:5), WebP або JPEG. Рамки обрізають кадр
 * з `object-position: center 20%`, тож обличчя має бути у верхній третині.
 */
export const PHOTO_SRC = '/photo.webp';
