import { CV_HREF } from '../../data/contacts';
import { NAV_ITEMS, navLabel } from '../../data/sections';
import { useT } from '../../i18n';
import type { Lang } from '../../i18n/types';
import { useSettings } from '../../store/settings';
import ui from '../../styles/ui.module.scss';
import { cx } from '../../utils/cx';
import { DownloadIcon, MoonIcon, SunIcon } from '../icons/Icons';
import s from './Header.module.scss';

/** Кнопки перемикача мов у порядку відображення. */
const LANG_OPTIONS: readonly { lang: Lang; label: string }[] = [
  { lang: 'en', label: 'EN' },
  { lang: 'ua', label: 'UA' },
];

/**
 * Sticky-хедер: лого, десктопна навігація, перемикач мов, кнопка теми, кнопка CV,
 * мобільна навігація-«пігулки» (≤900 px) і смуга прогресу скролу.
 */
export function Header() {
  // Тексти активної мови
  const t = useT();
  // Активна мова — для aria-pressed і підсвітки кнопок
  const lang = useSettings((state) => state.lang);
  // Активна тема — визначає іконку на кнопці
  const theme = useSettings((state) => state.theme);
  // Дія зміни мови
  const setLang = useSettings((state) => state.setLang);
  // Дія перемикання теми
  const toggleTheme = useSettings((state) => state.toggleTheme);

  return (
    <header className={s.top} data-testid="site-header">
      <div className={cx(ui.wrap, s.topIn)}>
        <a className={s.mark} href="#top" aria-label={t.homeLabel} data-testid="logo-link">
          BH
        </a>
        <nav className={s.nav} aria-label={t.navPrimaryLabel} data-testid="nav-desktop">
          {NAV_ITEMS.map((item) => (
            <a key={item.id} href={`#${item.id}`} data-testid={`nav-link-${item.id}`}>
              {navLabel(t, item)}
            </a>
          ))}
        </nav>
        <div className={s.topAct}>
          <div className={s.seg} role="group" aria-label={t.langLabel}>
            {LANG_OPTIONS.map((option) => (
              <button
                key={option.lang}
                type="button"
                className={cx(lang === option.lang && s.on)}
                aria-pressed={lang === option.lang}
                onClick={() => setLang(option.lang)}
                data-testid={`lang-${option.lang}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button type="button" className={s.ibtn} aria-label={t.themeLabel} onClick={toggleTheme} data-testid="theme-toggle">
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <a className={cx(ui.btn, ui.primary, ui.sm)} href={CV_HREF} download data-testid="cv-header">
            <DownloadIcon size={15} />
            <span className={s.full}>{t.cv}</span>
            <span className={s.short}>CV</span>
          </a>
        </div>
      </div>
      <nav className={s.mnav} aria-label={t.navSectionsLabel} data-testid="nav-mobile">
        {NAV_ITEMS.map((item) => (
          <a key={item.id} href={`#${item.id}`} data-testid={`mnav-link-${item.id}`}>
            {navLabel(t, item)}
          </a>
        ))}
      </nav>
      <div className={s.progress} aria-hidden="true" data-testid="scroll-progress" />
    </header>
  );
}
