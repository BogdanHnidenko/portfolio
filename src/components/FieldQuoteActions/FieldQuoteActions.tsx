import { FIELDQUOTE_APP_STORE_HREF, FIELDQUOTE_GOOGLE_PLAY_HREF, FIELDQUOTE_SITE_HREF } from '../../data/apps';
import { useT } from '../../i18n';
import ui from '../../styles/ui.module.scss';
import { cx } from '../../utils/cx';
import { externalLinkProps, isRenderableHref } from '../../utils/links';
import { ArrowUpRightIcon } from '../icons/Icons';
import s from './FieldQuoteActions.module.scss';

/** Зовнішнє посилання рядка дій: адреса, текст і data-testid для QA. */
interface ActionLink {
  href: string;
  label: string;
  testId: string;
}

/**
 * Рядок дій картки FieldQuote на Work: кнопки-посилання на App Store, Google Play і сайт у такому порядку
 * (нова вкладка, без `window.opener`). Без офіційних бейджів магазинів — лише текстові кнопки.
 * Посилання з небезпечною чи порожньою адресою не рендеряться (див. `isRenderableHref`).
 */
export function FieldQuoteActions() {
  // Тексти активної мови
  const t = useT();
  // Зовнішні посилання застосунку в порядку App Store → Google Play → сайт; сайт підписаний доменом
  const links: ActionLink[] = [
    { href: FIELDQUOTE_APP_STORE_HREF, label: t.appStoreCta, testId: 'app-store-link' },
    { href: FIELDQUOTE_GOOGLE_PLAY_HREF, label: t.googlePlayCta, testId: 'google-play-link' },
    { href: FIELDQUOTE_SITE_HREF, label: 'fieldquote.org', testId: 'app-site-link' },
  ];

  return (
    <div className={s.actions} data-testid="app-actions">
      {links
        .filter((link) => isRenderableHref(link.href))
        .map((link) => (
          <a
            key={link.testId}
            className={cx(ui.btn, ui.sm, s.action)}
            href={link.href}
            {...externalLinkProps(link.href)}
            data-testid={link.testId}
          >
            {link.label}
            <ArrowUpRightIcon />
          </a>
        ))}
    </div>
  );
}
