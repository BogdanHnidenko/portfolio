import { useT } from '../../i18n';
import ui from '../../styles/ui.module.scss';
import { cx } from '../../utils/cx';
import { ClockIcon, LockIcon } from '../icons/Icons';
import { PhonesStage } from './PhonesStage';
import s from './Apps.module.scss';

/** Технології власних застосунків (власні назви, не перекладаються). */
const OWN_APP_TAGS = ['React Native', 'Expo', 'TypeScript'];

/**
 * Секція «Mobile apps»: власні продукти (бейдж «In review», теги, статус), клієнтські застосунки під NDA
 * і декоративна сцена з трьома телефонами праворуч.
 */
export function Apps() {
  // Тексти активної мови
  const t = useT();

  return (
    <section className={cx(ui.sec, s.apps)} id="apps" data-testid="section-apps">
      <div className={ui.wrap}>
        <div className={s.appsGrid}>
          <div className={s.appsTxt}>
            <div className={cx(ui.eyebrow, ui.reveal)}>
              <span className={ui.ix}>02</span>
              <span className={ui.ln} />
              {t.navApps}
            </div>
            <h2 className={cx(ui.h2, ui.reveal, s.title)}>
              {t.appsTitleA} <span className={ui.em}>{t.appsTitleB}</span>
            </h2>

            <div className={cx(s.appItem, ui.reveal)} data-testid="app-own">
              <div className={ui.subL}>
                <span className={ui.grpDot} aria-hidden="true" />
                {t.appsOwn}
              </div>
              <div className={s.appRow}>
                <h3 className={ui.h3}>{t.featTitle}</h3>
                <span className={ui.badge}>
                  <span className={ui.bd} aria-hidden="true" />
                  {t.inReview}
                </span>
              </div>
              <p className={ui.p}>{t.featBody}</p>
              <div className={ui.tags}>
                {OWN_APP_TAGS.map((tag) => (
                  <span key={tag} className={ui.tag}>
                    {tag}
                  </span>
                ))}
              </div>
              <div className={s.statusL}>
                <ClockIcon />
                <span>{t.featStatus}</span>
              </div>
            </div>

            <div className={cx(s.appItem, s.ndaI, ui.reveal, ui.r2)} data-testid="app-nda">
              <div className={s.ndaIco} aria-hidden="true">
                <LockIcon />
              </div>
              <div className={s.ndaBody}>
                <div className={ui.subL}>
                  <span className={ui.grpDot} aria-hidden="true" />
                  {t.appsClient}
                </div>
                <div className={s.appRow}>
                  <h3 className={cx(ui.h3, ui.sm)}>{t.ndaTitle}</h3>
                  <span className={cx(ui.badge, ui.neutral)}>NDA</span>
                </div>
                <p className={ui.p}>{t.ndaBody}</p>
              </div>
            </div>
          </div>

          <PhonesStage className={ui.reveal} />
        </div>
      </div>
    </section>
  );
}
