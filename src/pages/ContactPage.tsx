import type { ReactNode } from 'react';
import { ArrowUpRightIcon, DownloadIcon, MailIcon } from '../components/icons/Icons';
import { CV_FILENAME, CV_HREF, EMAIL, EMAIL_HREF, GITHUB_HREF, LINKEDIN_HREF, TELEGRAM_HREF } from '../data/contacts';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useT } from '../i18n';
import ui from '../styles/ui.module.scss';
import { cx } from '../utils/cx';
import { externalLinkProps } from '../utils/links';
import s from './ContactPage.module.scss';

/** Пропси картки контакту. */
interface ContactCardProps {
  /** Адреса посилання */
  href: string;
  /** Мітка над значенням (LinkedIn, GitHub, Telegram, PDF) */
  label: string;
  /** Значення: адреса профілю або підпис CV */
  value: string;
  /** Іконка праворуч від мітки */
  icon: ReactNode;
  /** Клас затримки появи (d5 / d6) */
  delayClass: string;
  /** data-testid картки */
  testId: string;
  /** Назва файлу для атрибута `download` (лише для CV); без неї атрибута немає */
  download?: string;
}

/**
 * Картка контакту: мітка з іконкою і значення; зовнішні посилання відкриваються в новій вкладці.
 * @param props - адреса, тексти, іконка, затримка появи, testid і назва файлу для завантаження (CV)
 */
function ContactCard({ href, label, value, icon, delayClass, testId, download }: ContactCardProps) {
  return (
    <a
      className={cx(ui.card, s.cLink, ui.rise, delayClass)}
      href={href}
      download={download}
      {...externalLinkProps(href)}
      data-testid={testId}
    >
      <div className={s.cLinkTop}>
        <span className={ui.lbl}>{label}</span>
        {icon}
      </div>
      <span className={s.cLinkV}>{value}</span>
    </a>
  );
}

/**
 * Сторінка Contact: заголовок «Open to … remote work.», велика оранжева картка email
 * і чотири картки: LinkedIn, GitHub, Telegram та завантаження CV.
 */
export function ContactPage() {
  // Тексти активної мови
  const t = useT();
  useDocumentTitle('contact');

  return (
    <div className={ui.pg} data-testid="page-contact">
      <section className={cx(ui.pageHead, s.head)}>
        <div className={s.contactGlow} aria-hidden="true" />
        <div className={cx(ui.wrap, ui.relative)}>
          <div className={cx(ui.eyebrow, ui.rise, ui.d1)}>{t.navContact}</div>
          <h1 className={cx(s.cH, ui.rise, ui.d2)} data-testid="contact-title">
            {t.cHeadA} <span className={ui.em}>{t.cHeadB}</span>
          </h1>
          <p className={cx(s.cSub, ui.rise, ui.d3)}>{t.cSub}</p>
          <a className={cx(s.mail, ui.rise, ui.d4)} href={EMAIL_HREF} data-testid="contact-email">
            <div className={s.mailL}>
              <div className={s.mailIc} aria-hidden="true">
                <MailIcon size={20} />
              </div>
              <div className={s.mailText}>
                <div className={s.mailK}>Email</div>
                <div className={s.mailT}>{EMAIL}</div>
              </div>
            </div>
            <span className={s.mailArr} aria-hidden="true">
              <ArrowUpRightIcon size={22} strokeWidth={2} />
            </span>
          </a>
          <div className={s.cLinks}>
            <ContactCard
              href={LINKEDIN_HREF}
              label="LinkedIn"
              value="linkedin.com/in/bohdan-hnidenko-dev"
              icon={<ArrowUpRightIcon size={16} strokeWidth={1.8} />}
              delayClass={ui.d5}
              testId="contact-linkedin"
            />
            <ContactCard
              href={GITHUB_HREF}
              label="GitHub"
              value="github.com/BogdanHnidenko"
              icon={<ArrowUpRightIcon size={16} strokeWidth={1.8} />}
              delayClass={ui.d5}
              testId="contact-github"
            />
            <ContactCard
              href={TELEGRAM_HREF}
              label="Telegram"
              value="@Bohdan_Hnidenko"
              icon={<ArrowUpRightIcon size={16} strokeWidth={1.8} />}
              delayClass={ui.d6}
              testId="contact-telegram"
            />
            <ContactCard
              href={CV_HREF}
              label="PDF"
              value={t.cvPdf}
              icon={<DownloadIcon size={16} strokeWidth={1.9} />}
              delayClass={ui.d6}
              testId="cv-contact"
              download={CV_FILENAME}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
