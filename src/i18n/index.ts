import { useSettings } from '../store/settings';
import { en } from './en';
import { ua } from './ua';
import type { Dictionary, Lang } from './types';

/** Словники для всіх мов; тип `Record<Lang, Dictionary>` гарантує повний і однаковий набір ключів. */
export const dictionaries: Record<Lang, Dictionary> = { en, ua };

/** Значення атрибута `<html lang>` для кожної мови (внутрішній код `ua` → BCP 47 `uk`). */
export const htmlLang: Record<Lang, string> = { en: 'en', ua: 'uk' };

/**
 * Повертає тексти поточної мови зі стору; компонент перерендериться при зміні мови.
 * @returns словник активної мови
 */
export function useT(): Dictionary {
  // Активна мова з глобального стору
  const lang = useSettings((state) => state.lang);
  return dictionaries[lang];
}

export type { Dictionary, Lang } from './types';
