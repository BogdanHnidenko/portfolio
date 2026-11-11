import { NAV_ITEMS, PATHS, navLabel } from '../../data/routes';
import { useT } from '../../i18n';
import ui from '../../styles/ui.module.scss';
import { cx } from '../../utils/cx';
import { RouteNavLink } from '../RouteLink/RouteLink';
import s from './Header.module.scss';
import { LangSwitch } from './LangSwitch';
import { ThemeToggle } from './ThemeToggle';
import type { MobileMenu as MobileMenuState } from './useMobileMenu';
import { navClass } from './navClass';

/** Пропси панелі бургер-меню. */
export interface MobileMenuProps {
  /** id панелі для `aria-controls` бургера */
  id: string;
  /** Чи відкрита панель */
  open: MobileMenuState['open'];
  /** Ref панелі з useMobileMenu */
  panelRef: MobileMenuState['panelRef'];
  /** Обробник кліку на пункт з useMobileMenu */
  onLinkClick: MobileMenuState['onLinkClick'];
}

/**
 * Панель бургер-меню (≤ 900 px), що випадає під хедером: 4 пункти Home · Work · About · Contact
 * і рядок налаштувань (мова EN/UA і тема). Закрита панель лишається в DOM з атрибутом `hidden`,
 * щоб `aria-controls` бургера завжди вказував на існуючий елемент.
 * @param props - id панелі, чи вона відкрита, ref панелі й обробник кліку на пункт
 */
export function MobileMenu({ id, open, panelRef, onLinkClick }: MobileMenuProps) {
  // Тексти активної мови
  const t = useT();

  return (
    <div className={cx(ui.wrap, s.menuWrap)}>
      <div id={id} ref={panelRef} className={s.menu} hidden={!open} data-testid="mobile-menu">
        <nav className={s.menuNav} aria-label={t.navPrimaryLabel}>
          {NAV_ITEMS.map((item) => (
            <RouteNavLink
              key={item.id}
              to={PATHS[item.id]}
              end={item.end}
              className={navClass}
              onClick={(event) => onLinkClick(PATHS[item.id], event)}
              data-testid={`mmenu-link-${item.id}`}
            >
              {navLabel(t, item)}
            </RouteNavLink>
          ))}
        </nav>
        <div className={s.menuSettings}>
          <LangSwitch testIdPrefix="menu-lang" />
          <ThemeToggle testId="menu-theme-toggle" />
        </div>
      </div>
    </div>
  );
}
