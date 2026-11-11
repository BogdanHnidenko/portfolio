/** Сторінка FieldQuote: Invoices & Quotes в App Store (власний iOS-застосунок автора). */
export const FIELDQUOTE_APP_STORE_HREF = 'https://apps.apple.com/us/app/fieldquote-invoices-quotes/id6822302139';

/** Сайт застосунку FieldQuote. */
export const FIELDQUOTE_SITE_HREF = 'https://fieldquote.org/';

/** Позиція телефона в сцені картки застосунків: лівий, центральний або правий. */
export type AppScreenPosition = 'left' | 'center' | 'right';

/**
 * Скриншоти FieldQuote у телефонах сцени (файли в `public/app/`): лівий — кошторис #EST-030,
 * центральний — головний екран «Needs attention», правий — Preview & Sign.
 */
export const FIELDQUOTE_SCREENS: Readonly<Record<AppScreenPosition, string>> = {
  left: '/app/screen-left.webp',
  center: '/app/screen-center.webp',
  right: '/app/screen-right.webp',
};

/** Ширина файлів скриншотів у px; явні розміри в `<img>` тримають пропорції, поки файл вантажиться. */
export const FIELDQUOTE_SCREEN_WIDTH = 720;

/** Висота файлів скриншотів у px (пропорції iPhone ≈ 0.46). */
export const FIELDQUOTE_SCREEN_HEIGHT = 1566;
