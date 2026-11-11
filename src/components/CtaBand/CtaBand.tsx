import { PATHS } from '../../data/routes';
import { useT } from '../../i18n';
import ui from '../../styles/ui.module.scss';
import { cx } from '../../utils/cx';
import s from './CtaBand.module.scss';
import { RouteLink } from '../RouteLink/RouteLink';

/** Головна кнопка банера: адреса, підпис і (для CV) назва файлу при завантаженні. */
export interface CtaBandPrimary {
  href: string;
  label: string;
  /** Назва файлу для атрибута `download`; без неї кнопка — звичайне посилання */
  download?: string;
}

/** Пропси банера. */
export interface CtaBandProps {
  /** Оранжева кнопка: «Email me» на Work, «Download CV» на About */
  primary: CtaBandPrimary;
}

/**
 * Банер-заклик унизу Work і About: заголовок «Open to … remote work.», підзаголовок,
 * головна кнопка і посилання «All contacts» на сторінку /contact.
 * @param props - головна кнопка банера
 */
export function CtaBand({ primary }: CtaBandProps) {
  // Тексти активної мови
  const t = useT();

  return (
    <div className={cx(s.band, ui.reveal)} data-testid="cta-band">
      <div>
        <h2 className={s.bandH}>
          {t.cHeadA} <span className={ui.em}>{t.cHeadB}</span>
        </h2>
        <p className={s.bandS}>{t.cSub}</p>
      </div>
      <div className={s.bandCta}>
        <a
          className={cx(ui.btn, ui.primary)}
          href={primary.href}
          download={primary.download}
          data-testid="band-primary"
        >
          {primary.label}
        </a>
        <RouteLink className={ui.btn} to={PATHS.contact} data-testid="band-contacts">
          {t.allContacts}
        </RouteLink>
      </div>
    </div>
  );
}
