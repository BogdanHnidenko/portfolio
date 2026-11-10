import { CV_HREF, EMAIL, EMAIL_HREF, GITHUB_HREF, LINKEDIN_HREF, TELEGRAM_HREF } from '../../data/contacts';
import { useT } from '../../i18n';
import ui from '../../styles/ui.module.scss';
import { cx } from '../../utils/cx';
import { externalLinkProps } from '../../utils/links';
import { ArrowUpRightIcon, DownloadIcon, MailIcon } from '../icons/Icons';
import s from './Contact.module.scss';

/** Картка соцмережі в контактах. */
interface SocialLink {
  /** Суфікс data-testid: contact-<id> */
  id: 'linkedin' | 'github' | 'telegram';
  /** Назва мережі (власна назва, не перекладається) */
  label: string;
  /** Повний URL профілю */
  href: string;
  /** Видимий текст адреси */
  value: string;
  /** Клас каскадної появи */
  reveal: string;
}

/** Соцмережі в порядку макета. */
const SOCIAL_LINKS: readonly SocialLink[] = [
  { id: 'linkedin', label: 'LinkedIn', href: LINKEDIN_HREF, value: 'linkedin.com/in/bohdan-hnidenko-dev', reveal: '' },
  { id: 'github', label: 'GitHub', href: GITHUB_HREF, value: 'github.com/BogdanHnidenko', reveal: ui.r2 },
  { id: 'telegram', label: 'Telegram', href: TELEGRAM_HREF, value: '@Bohdan_Hnidenko', reveal: ui.r2 },
];

/**
 * Секція контактів: заголовок, підзаголовок, велика картка email і картки LinkedIn / GitHub / Telegram / CV (PDF).
 */
export function Contact() {
  // Тексти активної мови
  const t = useT();

  return (
    <section className={s.contact} id="contact" data-testid="section-contact">
      <div className={s.contactGlow} aria-hidden="true" />
      <div className={cx(ui.wrap, s.inner)}>
        <div className={cx(ui.eyebrow, ui.reveal)}>
          <span className={ui.ix}>05</span>
          <span className={ui.ln} />
          {t.navContact}
        </div>
        <h2 className={cx(s.cH, ui.reveal)}>
          {t.cHeadA} <span className={ui.em}>{t.cHeadB}</span>
        </h2>
        <p className={cx(s.cSub, ui.reveal)}>{t.cSub}</p>
        <a className={cx(s.mail, ui.reveal)} href={EMAIL_HREF} data-testid="contact-email">
          <div className={s.mailL}>
            <div className={s.mailIc} aria-hidden="true">
              <MailIcon />
            </div>
            <div className={s.mailBody}>
              <div className={s.mailK}>Email</div>
              <div className={s.mailT}>{EMAIL}</div>
            </div>
          </div>
          <span className={s.mailArr} aria-hidden="true">
            <ArrowUpRightIcon size={22} strokeWidth={2} />
          </span>
        </a>
        <div className={s.cLinks}>
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.id}
              className={cx(ui.card, s.cLink, ui.reveal, link.reveal)}
              href={link.href}
              {...externalLinkProps(link.href)}
              data-testid={`contact-${link.id}`}
            >
              <div className={s.cLinkTop}>
                <span className={ui.lbl}>{link.label}</span>
                <ArrowUpRightIcon size={16} strokeWidth={1.8} />
              </div>
              <span className={s.cLinkV}>{link.value}</span>
            </a>
          ))}
          <a className={cx(ui.card, s.cLink, s.cv, ui.reveal, ui.r3)} href={CV_HREF} download data-testid="cv-contact">
            <div className={s.cLinkTop}>
              <span className={ui.lbl}>PDF</span>
              <DownloadIcon size={16} strokeWidth={1.9} />
            </div>
            <span className={s.cLinkV}>{t.cvPdf}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
