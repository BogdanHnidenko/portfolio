import type { ReactNode } from 'react';
import { CaseCard, type CaseStepLabels } from '../components/CaseCard/CaseCard';
import { CtaBand } from '../components/CtaBand/CtaBand';
import { ClockIcon, LockIcon } from '../components/icons/Icons';
import { PhonesStage } from '../components/PhonesStage/PhonesStage';
import { EMAIL_HREF } from '../data/contacts';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useT } from '../i18n';
import ui from '../styles/ui.module.scss';
import { cx } from '../utils/cx';
import s from './WorkPage.module.scss';

/** Кількість кейсів SkyService POS (перші в словнику); решта — власні проєкти, як `prepare()` у макеті. */
const SKY_CASES_COUNT = 3;

/** Теги власних мобільних продуктів, як у макеті. */
const OWN_APP_TAGS: readonly string[] = ['React Native', 'Expo', 'TypeScript'];

/** Кількість карток у групі «Mobile apps»: власні продукти і клієнтські під NDA. */
const APPS_COUNT = 2;

/** Пропси заголовка групи робіт. */
interface GroupHeadProps {
  /** Назва групи */
  title: string;
  /** Скільки робіт у групі */
  count: number;
  /** Період роботи (лише для SkyService POS) */
  meta?: string;
}

/**
 * Заголовок групи: ромбик, назва, лічильник, необовʼязковий період і лінія до краю.
 * @param props - назва, лічильник і період
 */
function GroupHead({ title, count, meta }: GroupHeadProps) {
  return (
    <div className={cx(s.grpH, ui.reveal)}>
      <span className={ui.grpDot} aria-hidden="true" />
      <h2 className={s.grpT} data-testid="work-group-title">
        {title}
      </h2>
      <span className={s.grpC} data-testid="work-group-count">
        {count}
      </span>
      {meta && <span className={s.grpM}>{meta}</span>}
      <span className={s.grpLine} aria-hidden="true" />
    </div>
  );
}

/**
 * Група робіт: заголовок і вміст.
 * @param props - пропси заголовка і вміст групи
 */
function Group({ children, ...head }: GroupHeadProps & { children: ReactNode }) {
  return (
    <div data-testid="work-group">
      <GroupHead {...head} />
      {children}
    </div>
  );
}

/**
 * Сторінка Work: шапка «Selected work», групи SkyService POS (3 кейси), Mobile apps (картка застосунків
 * зі сценою телефонів) і My projects (AI Chat), банер з «Email me».
 */
export function WorkPage() {
  // Тексти активної мови
  const t = useT();
  useDocumentTitle('work');
  // Підписи кроків кейсу активною мовою
  const labels: CaseStepLabels = { problem: t.lProblem, solution: t.lSolution, result: t.lResult };
  // Кейси SkyService POS
  const casesSky = t.cases.slice(0, SKY_CASES_COUNT);
  // Власні проєкти (AI Chat)
  const casesOwn = t.cases.slice(SKY_CASES_COUNT);

  return (
    <div className={ui.pg} data-testid="page-work">
      <section className={ui.pageHead}>
        <div className={ui.pageGlow} aria-hidden="true" />
        <div className={cx(ui.wrap, ui.relative)}>
          <div className={cx(ui.eyebrow, ui.rise, ui.d1)}>{t.navWork}</div>
          <h1 className={cx(ui.h1, ui.rise, ui.d2)} data-testid="work-title">
            {t.workTitleA} <span className={ui.em}>{t.workTitleB}</span>
          </h1>
          <p className={cx(ui.lead, ui.rise, ui.d3)} data-testid="work-lead">
            {t.workLead}
          </p>
        </div>
      </section>
      <div className={ui.wrap}>
        <div className={s.groups}>
          <Group title={t.g1} count={casesSky.length} meta={t.g1Meta}>
            <div className={s.work}>
              {casesSky.map((item) => (
                <CaseCard key={item.title} item={item} labels={labels} className={ui.reveal} />
              ))}
            </div>
          </Group>

          <Group title={t.g2} count={APPS_COUNT}>
            <article className={cx(ui.card, s.appsCard, ui.reveal)} data-testid="apps-card">
              <div className={s.appsTxt}>
                <div className={s.appItem} data-testid="app-own">
                  <div className={s.subL}>
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
                <div className={s.appItem} data-testid="app-nda">
                  <div className={s.subL}>
                    <span className={ui.grpDot} aria-hidden="true" />
                    {t.appsClient}
                  </div>
                  <div className={s.appRow}>
                    <div className={s.ndaIco} aria-hidden="true">
                      <LockIcon />
                    </div>
                    <h3 className={cx(ui.h3, ui.sm)}>{t.ndaTitle}</h3>
                    <span className={cx(ui.badge, ui.neutral)}>NDA</span>
                  </div>
                  <p className={ui.p}>{t.ndaBody}</p>
                </div>
              </div>
              <PhonesStage />
            </article>
          </Group>

          <Group title={t.g3} count={casesOwn.length}>
            <div className={s.work}>
              {casesOwn.map((item) => (
                <CaseCard key={item.title} item={item} labels={labels} className={ui.reveal} />
              ))}
            </div>
          </Group>
        </div>

        <CtaBand primary={{ href: EMAIL_HREF, label: t.emailMe }} />
      </div>
    </div>
  );
}
