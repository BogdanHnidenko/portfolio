import type { Dictionary, PageId } from '../i18n/types';

/** Адреси сторінок сайту (BrowserRouter, справжні шляхи). */
export const PATHS: Readonly<Record<PageId, string>> = {
  home: '/',
  work: '/work',
  about: '/about',
  contact: '/contact',
};

/** Сторінка, на яку веде пункт навігації (Home у меню немає — на неї веде лого). */
export type NavPageId = Exclude<PageId, 'home'>;

/** Пункт навігації: сторінка і ключ словника з її назвою. */
export interface NavItem {
  id: NavPageId;
  labelKey: 'navWork' | 'navAbout' | 'navContact';
}

/** Пункти навігації в порядку макета (однакові для десктопу й мобільних «пігулок»). */
export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'work', labelKey: 'navWork' },
  { id: 'about', labelKey: 'navAbout' },
  { id: 'contact', labelKey: 'navContact' },
];

/**
 * Повертає підпис пункту навігації активною мовою.
 * @param t - словник активної мови
 * @param item - пункт навігації
 * @returns текст посилання
 */
export function navLabel(t: Dictionary, item: NavItem): string {
  return t[item.labelKey];
}
