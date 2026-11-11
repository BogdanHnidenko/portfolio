import { useT } from '../../i18n';
import type { Lang } from '../../i18n/types';
import { useSettings } from '../../store/settings';
import { cx } from '../../utils/cx';
import s from './Header.module.scss';

/** Кнопки перемикача мов у порядку відображення. */
const LANG_OPTIONS: readonly { lang: Lang; label: string }[] = [
  { lang: 'en', label: 'EN' },
  { lang: 'ua', label: 'UA' },
];

/** Пропси перемикача мов. */
export interface LangSwitchProps {
  /** Префікс data-testid кнопок: `lang` у хедері, `menu-lang` у бургер-меню */
  testIdPrefix: 'lang' | 'menu-lang';
  /** Додатковий клас обгортки (наприклад, приховування на вузьких екранах) */
  className?: string;
}

/**
 * Сегментований перемикач EN / UA: змінює мову в глобальному сторі, активна кнопка має `aria-pressed`.
 * Той самий контрол стоїть у хедері й у панелі бургер-меню.
 * @param props - префікс data-testid і додатковий клас
 */
export function LangSwitch({ testIdPrefix, className }: LangSwitchProps) {
  // Тексти активної мови: підпис групи кнопок
  const t = useT();
  // Активна мова — для aria-pressed і підсвітки кнопок
  const lang = useSettings((state) => state.lang);
  // Дія зміни мови
  const setLang = useSettings((state) => state.setLang);

  return (
    <div className={cx(s.seg, className)} role="group" aria-label={t.langLabel}>
      {LANG_OPTIONS.map((option) => (
        <button
          key={option.lang}
          type="button"
          className={cx(lang === option.lang && s.on)}
          aria-pressed={lang === option.lang}
          onClick={() => setLang(option.lang)}
          data-testid={`${testIdPrefix}-${option.lang}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
