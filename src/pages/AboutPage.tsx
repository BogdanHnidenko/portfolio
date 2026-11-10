import { AiFlow } from '../components/AiFlow/AiFlow';
import { CtaBand } from '../components/CtaBand/CtaBand';
import { Photo } from '../components/Photo/Photo';
import { CV_HREF } from '../data/contacts';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useT } from '../i18n';
import ui from '../styles/ui.module.scss';
import { cx } from '../utils/cx';
import s from './AboutPage.module.scss';

/** AI-інструменти під картками AI-процесу, як у макеті. */
const AI_TOOLS: readonly string[] = ['Claude Code', 'Gemini', 'ChatGPT'];

/** Пропси надзаголовка секції. */
interface SectionEyebrowProps {
  /** Номер секції («01») */
  index: string;
  /** Назва секції */
  title: string;
}

/**
 * Надзаголовок секції About: номер, риска і назва.
 * @param props - номер і назва секції
 */
function SectionEyebrow({ index, title }: SectionEyebrowProps) {
  return (
    <div className={cx(ui.eyebrow, ui.reveal)}>
      <span className={ui.ix}>{index}</span>
      <span className={ui.ln} />
      {title}
    </div>
  );
}

/**
 * Сторінка About: шапка з анкетою й фото (на вузьких екранах — круглий аватар), досвід,
 * AI-процес (схема, картки, інструменти), стек і банер із кнопкою CV.
 */
export function AboutPage() {
  // Тексти активної мови
  const t = useT();
  useDocumentTitle('about');

  return (
    <div className={ui.pg} data-testid="page-about">
      <section className={ui.pageHead}>
        <div className={ui.pageGlow} aria-hidden="true" />
        <div className={cx(ui.wrap, ui.relative)}>
          <div className={s.aboutHead}>
            <div>
              <div className={cx(s.chiprow, ui.rise, ui.d1)}>
                <div className={s.avaM} data-testid="about-avatar">
                  <Photo variant="avatar" />
                </div>
                <div className={ui.eyebrow}>{t.name}</div>
              </div>
              <h1 className={cx(ui.h1, ui.rise, ui.d2)} data-testid="about-title">
                {t.aboutTitleA} <span className={ui.em}>{t.aboutTitleB}</span>
              </h1>
              <p className={cx(ui.lead, ui.rise, ui.d3)}>{t.pitch}</p>
              <dl className={cx(s.profDl, ui.rise, ui.d4)}>
                {t.prof.map((row) => (
                  <div key={row.k} className={s.profRow} data-testid="profile-row">
                    <dt className={ui.lbl}>{row.k}</dt>
                    <dd>{row.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className={cx(s.aboutPhoto, ui.rise, ui.d3)} data-testid="about-photo">
              <Photo variant="about" />
            </div>
          </div>
        </div>
      </section>

      <section className={ui.sec} id="experience" data-testid="section-experience">
        <div className={ui.wrap}>
          <SectionEyebrow index="01" title={t.expTitle} />
          <div className={s.tl}>
            {t.jobs.map((job) => (
              <div key={job.role} className={cx(s.tlItem, ui.reveal)} data-testid="job">
                <div className={s.tlWhen}>
                  <span className={s.tlPeriod}>{job.period}</span>
                  <span className={ui.lbl}>{job.place}</span>
                </div>
                <div>
                  <h3 className={s.tlRole}>{job.role}</h3>
                  <div className={s.tlOrg}>{job.org}</div>
                  <ul className={s.tlList}>
                    {job.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={ui.sec} id="ai" data-testid="section-ai">
        <div className={ui.wrap}>
          <SectionEyebrow index="02" title={t.aiEyebrow} />
          <h2 className={cx(ui.h2, ui.reveal)}>
            {t.aiTitleA} <span className={ui.em}>{t.aiTitleB}</span>
          </h2>
          <p className={cx(ui.lead, ui.reveal)}>{t.aiLead}</p>
          <AiFlow />
          <div className={s.aiCards}>
            {t.aiCards.map((card) => (
              <article key={card.k} className={cx(ui.card, s.aiCard, ui.reveal)} data-testid="ai-card">
                <span className={ui.lbl}>{card.k}</span>
                <p className={s.aiCardT}>{card.t}</p>
              </article>
            ))}
          </div>
          <div className={cx(s.tools, ui.reveal)} data-testid="ai-tools">
            <span className={ui.lbl}>{t.tools}</span>
            <div className={ui.tags}>
              {AI_TOOLS.map((tool) => (
                <span key={tool} className={ui.tag}>
                  {tool}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={ui.sec} id="stack" data-testid="section-stack">
        <div className={ui.wrap}>
          <SectionEyebrow index="03" title={t.stackTitle} />
          <div className={s.stack}>
            {t.stack.map((group) => (
              <div key={group.name} className={cx(s.stRow, ui.reveal)} data-testid="stack-row">
                <span className={ui.lbl}>{group.name}</span>
                <div className={ui.tags}>
                  {group.items.map((item) => (
                    <span key={item} className={ui.tag}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <CtaBand primary={{ href: CV_HREF, label: t.cv, download: true }} />
        </div>
      </section>
    </div>
  );
}
