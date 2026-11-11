import type { Dictionary, PageId } from '../i18n/types';

/** Адреси сторінок сайту (BrowserRouter, справжні шляхи). */
export const PATHS: Readonly<Record<PageId, string>> = {
  home: '/',
  work: '/work',
  about: '/about',
  contact: '/contact',
};

/** Пункт навігації: сторінка, ключ словника з її назвою і чи активний він лише при точному збігу адреси. */
export interface NavItem {
  id: PageId;
  labelKey: 'navHome' | 'navWork' | 'navAbout' | 'navContact';
  /** `end` для NavLink: Home (`/`) інакше був би активним на кожній сторінці */
  end: boolean;
}

/** Пункти навігації: Home першим, далі порядок макета (однакові для десктопу й бургер-меню). */
export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'home', labelKey: 'navHome', end: true },
  { id: 'work', labelKey: 'navWork', end: false },
  { id: 'about', labelKey: 'navAbout', end: false },
  { id: 'contact', labelKey: 'navContact', end: false },
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

/** Якорі (атрибут `id`) груп на сторінці Work; однакові для всіх мов, тому не в словнику. */
export const WORK_ANCHORS = {
  sky: 'work-sky',
  apps: 'work-apps',
  own: 'work-own',
} as const;

/** Якорі (атрибут `id`) секцій сторінки About, на які ведуть плитки головної. */
export const ABOUT_ANCHORS = {
  ai: 'ai',
  stack: 'stack',
} as const;

/**
 * Будує внутрішню адресу з якорем на блок сторінки.
 * @param path - шлях сторінки з PATHS
 * @param anchor - `id` цільового блоку
 * @returns адреса виду `/work#work-apps`
 */
export function withAnchor(path: string, anchor: string): string {
  return `${path}#${anchor}`;
}
