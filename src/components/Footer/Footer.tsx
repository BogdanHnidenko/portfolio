import { useT } from '../../i18n';
import ui from '../../styles/ui.module.scss';
import { cx } from '../../utils/cx';
import s from './Footer.module.scss';

/**
 * Футер: копірайт і рівень володіння мовами.
 */
export function Footer() {
  // Тексти активної мови
  const t = useT();

  return (
    <footer className={s.foot} data-testid="site-footer">
      <div className={cx(ui.wrap, s.footIn)}>
        <span>{t.copy}</span>
        <span>{t.langs}</span>
      </div>
    </footer>
  );
}
