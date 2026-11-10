import type { Dictionary } from '../i18n/types';

/** Ідентифікатор секції: id елемента на сторінці і суфікс data-testid посилань навігації. */
export type SectionId = 'work' | 'apps' | 'ai' | 'stack' | 'contact';

/** Пункт навігації: секція і ключ словника з її назвою. */
export interface NavItem {
  id: SectionId;
  labelKey: 'navWork' | 'navApps' | 'navAi' | 'navStack' | 'navContact';
}

/** Пункти навігації в порядку секцій на сторінці (однакові для десктопу й мобільних «пігулок»). */
export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'work', labelKey: 'navWork' },
  { id: 'apps', labelKey: 'navApps' },
  { id: 'ai', labelKey: 'navAi' },
  { id: 'stack', labelKey: 'navStack' },
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
