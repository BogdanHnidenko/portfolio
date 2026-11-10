import { useT } from '../../i18n';
import ui from '../../styles/ui.module.scss';
import { cx } from '../../utils/cx';
import s from './Experience.module.scss';

/**
 * Секція «Experience & stack» (якір `#stack`): таймлайн посад і таблиця «What I work with» з рядками тегів.
 */
export function Experience() {
  // Тексти активної мови
  const t = useT();

  return (
    <section className={ui.sec} id="stack" data-testid="section-stack">
      <div className={ui.wrap}>
        <div className={cx(ui.eyebrow, ui.reveal)}>
          <span className={ui.ix}>04</span>
          <span className={ui.ln} />
          {t.navExp}
        </div>
        <h2 className={cx(ui.h2, ui.reveal)}>
          {t.expTitleA} <span className={ui.em}>{t.expTitleB}</span>
        </h2>
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
        <h3 className={cx(s.subH, ui.reveal)}>{t.stackHead}</h3>
        <div className={s.stack}>
          {t.stack.map((group) => (
            <div key={group.name} className={cx(s.stRow, ui.reveal)} data-testid="stack-row">
              <span className={ui.lbl}>{group.name}</span>
              <div className={ui.tags}>
                {group.items.map((item) => (
                  <span key={item} className={cx(ui.tag, s.stTag)}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
