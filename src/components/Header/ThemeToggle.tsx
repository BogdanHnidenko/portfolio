import { useT } from '../../i18n';
import { useSettings } from '../../store/settings';
import { cx } from '../../utils/cx';
import { MoonIcon, SunIcon } from '../icons/Icons';
import s from './Header.module.scss';

/** Пропси кнопки теми. */
export interface ThemeToggleProps {
  /** data-testid кнопки: `theme-toggle` у хедері, `menu-theme-toggle` у бургер-меню */
  testId: 'theme-toggle' | 'menu-theme-toggle';
  /** Додатковий клас кнопки (наприклад, приховування на вузьких екранах) */
  className?: string;
}

/**
 * Квадратна кнопка перемикання теми dark / light; іконка показує тему, на яку перемкнеться сайт.
 * @param props - data-testid і додатковий клас
 */
export function ThemeToggle({ testId, className }: ThemeToggleProps) {
  // Тексти активної мови: aria-label кнопки
  const t = useT();
  // Активна тема — визначає іконку на кнопці
  const theme = useSettings((state) => state.theme);
  // Дія перемикання теми
  const toggleTheme = useSettings((state) => state.toggleTheme);
  // Префікс data-testid іконок: у бургер-меню свій, щоб не дублювати іконки хедера
  const iconPrefix = testId === 'theme-toggle' ? 'theme-icon' : 'menu-theme-icon';

  return (
    <button type="button" className={cx(s.ibtn, className)} aria-label={t.themeLabel} onClick={toggleTheme} data-testid={testId}>
      {theme === 'dark' ? <SunIcon testId={`${iconPrefix}-sun`} /> : <MoonIcon testId={`${iconPrefix}-moon`} />}
    </button>
  );
}
