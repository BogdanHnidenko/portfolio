import type { CaseItem } from '../../i18n/types';
import { useT } from '../../i18n';
import ui from '../../styles/ui.module.scss';
import { cx } from '../../utils/cx';
import { CaseCard, type CaseStepLabels } from './CaseCard';
import s from './Work.module.scss';

/** Розбивка кейсів на групи за індексами в словнику: SkyService POS (3 кейси) і власні проєкти (1). */
const GROUP_SPLIT: readonly (readonly number[])[] = [[0, 1, 2], [3]];

/** Широкі картки bento за індексом кейсу: POS і AI Chat. */
const WIDE_CASES: readonly boolean[] = [true, false, false, true];

/** Класи каскадної появи карток (як `r1..r3` у макеті; r1 не має окремого стилю). */
const REVEAL_STAGGER = ['', ui.r2, ui.r3];

/** Група кейсів, готова до рендеру. */
interface CaseGroup {
  name: string;
  meta: string;
  cases: { item: CaseItem; index: number }[];
}

/**
 * Секція «Selected work»: дві групи кейсів із лічильником і картками bento.
 */
export function Work() {
  // Тексти активної мови
  const t = useT();
  // Підписи кроків для всіх карток
  const labels: CaseStepLabels = { problem: t.lProblem, solution: t.lSolution, result: t.lResult };
  // Групи з назвами й кейсами активної мови
  const groups: CaseGroup[] = GROUP_SPLIT.map((indexes, gi) => ({
    name: t.groupNames[gi] ?? '',
    meta: t.groupMeta[gi] ?? '',
    cases: indexes.map((index) => ({ item: t.cases[index], index })).filter((entry) => entry.item !== undefined),
  }));

  return (
    <section className={ui.sec} id="work" data-testid="section-work">
      <div className={ui.wrap}>
        <div className={cx(ui.eyebrow, ui.reveal)}>
          <span className={ui.ix}>01</span>
          <span className={ui.ln} />
          {t.navWork}
        </div>
        <h2 className={cx(ui.h2, ui.reveal)}>
          {t.workTitleA} <span className={ui.em}>{t.workTitleB}</span>
        </h2>
        <div className={s.groups}>
          {groups.map((group) => (
            <div key={group.name} data-testid="work-group">
              <div className={cx(s.grpH, ui.reveal)}>
                <span className={ui.grpDot} aria-hidden="true" />
                <h3 className={s.grpT} data-testid="work-group-title">
                  {group.name}
                </h3>
                <span className={s.grpC} data-testid="work-group-count">
                  {group.cases.length}
                </span>
                <span className={s.grpM}>{group.meta}</span>
                <span className={s.grpLine} aria-hidden="true" />
              </div>
              <div className={s.work}>
                {group.cases.map(({ item, index }) => (
                  <CaseCard
                    key={item.n}
                    item={item}
                    labels={labels}
                    wide={WIDE_CASES[index] ?? false}
                    className={cx(ui.reveal, REVEAL_STAGGER[index % REVEAL_STAGGER.length])}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
