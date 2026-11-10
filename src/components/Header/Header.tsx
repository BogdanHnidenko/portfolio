import { useId } from 'react';
import { CV_HREF } from '../../data/contacts';
import { NAV_ITEMS, PATHS, navLabel } from '../../data/routes';
import { useT } from '../../i18n';
import ui from '../../styles/ui.module.scss';
import { cx } from '../../utils/cx';
import { CloseIcon, DownloadIcon, MenuIcon } from '../icons/Icons';
import { RouteLink, RouteNavLink } from '../RouteLink/RouteLink';
import s from './Header.module.scss';
import { LangSwitch } from './LangSwitch';
import { MobileMenu } from './MobileMenu';
import { navClass } from './navClass';
import { ThemeToggle } from './ThemeToggle';
import { useMobileMenu } from './useMobileMenu';

/**
 * Sticky-хедер: лого (→ Home), десктопна навігація Home · Work · About · Contact, перемикач мов,
 * кнопка теми, кнопка CV. На ≤ 900 px навігація, мова й тема ховаються, замість них — кнопка-бургер
 * і панель меню під хедером. Пункти меню — справжні посилання на /, /work, /about, /contact.
 */
export function Header() {
  // Тексти активної мови
  const t = useT();
  // Стан і обробники бургер-меню
  const { open, toggleRef, panelRef, toggle, onLinkClick } = useMobileMenu();
  // id панелі меню для aria-controls бургера
  const menuId = useId();

  return (
    <header className={s.top} data-testid="site-header">
      <div className={cx(ui.wrap, s.topIn)}>
        <RouteLink className={s.mark} to={PATHS.home} aria-label={t.homeLabel} data-testid="logo-link">
          BH
        </RouteLink>
        <nav className={s.nav} aria-label={t.navPrimaryLabel} data-testid="nav-desktop">
          {NAV_ITEMS.map((item) => (
            <RouteNavLink key={item.id} to={PATHS[item.id]} end={item.end} className={navClass} data-testid={`nav-link-${item.id}`}>
              {navLabel(t, item)}
            </RouteNavLink>
          ))}
        </nav>
        <div className={s.topAct}>
          <LangSwitch testIdPrefix="lang" className={s.wideOnly} />
          <ThemeToggle testId="theme-toggle" className={s.wideOnly} />
          <a className={cx(ui.btn, ui.primary, ui.sm)} href={CV_HREF} download data-testid="cv-header">
            <DownloadIcon size={15} />
            <span className={s.full}>{t.cv}</span>
            <span className={s.short}>CV</span>
          </a>
          <button
            ref={toggleRef}
            type="button"
            className={cx(s.ibtn, s.burger)}
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? t.menuClose : t.menuOpen}
            onClick={toggle}
            data-testid="menu-toggle"
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>
      <MobileMenu id={menuId} open={open} panelRef={panelRef} onLinkClick={onLinkClick} />
    </header>
  );
}
