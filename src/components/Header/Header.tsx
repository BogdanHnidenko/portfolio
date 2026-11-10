import { CV_HREF } from '../../data/contacts';
import { NAV_ITEMS, PATHS, navLabel } from '../../data/routes';
import { useT } from '../../i18n';
import type { Lang } from '../../i18n/types';
import { useSettings } from '../../store/settings';
import ui from '../../styles/ui.module.scss';
import { cx } from '../../utils/cx';
import { DownloadIcon, MoonIcon, SunIcon } from '../icons/Icons';
import s from './Header.module.scss';
import { RouteLink, RouteNavLink } from '../RouteLink/RouteLink';

/** Кнопки перемикача мов у порядку відображення. */
const LANG_OPTIONS: readonly { lang: Lang; label: string }[] = [
  { lang: 'en', label: 'EN' },
  { lang: 'ua', label: 'UA' },
];

/**
 * Клас пункту навігації: активна сторінка отримує `on`, як у макеті.
 * `aria-current="page"` ставить NavLink усередині RouteNavLink.
 * @param state - стан NavLink від React Router (через RouteNavLink)
 * @returns клас активного пункту або undefined
 */
function navClass({ isActive }: { isActive: boolean }): string | undefined {
  return isActive ? s.on : undefined;
}

/**
 * Sticky-хедер: лого (→ Home), десктопна навігація, перемикач мов, кнопка теми, кнопка CV
 * і мобільна навігація-«пігулки» (≤900 px). Пункти меню — справжні посилання на /work, /about, /contact.
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
        <RouteLink className={s.mark} to={PATHS.home} aria-label={t.homeLabel} data-testid="logo-link">
          BH
        </RouteLink>
        <nav className={s.nav} aria-label={t.navPrimaryLabel} data-testid="nav-desktop">
          {NAV_ITEMS.map((item) => (
            <RouteNavLink key={item.id} to={PATHS[item.id]} className={navClass} data-testid={`nav-link-${item.id}`}>
              {navLabel(t, item)}
            </RouteNavLink>
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
          <RouteNavLink key={item.id} to={PATHS[item.id]} className={navClass} data-testid={`mnav-link-${item.id}`}>
            {navLabel(t, item)}
          </RouteNavLink>
        ))}
      </nav>
    </header>
  );
}
