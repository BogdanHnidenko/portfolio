import { useT } from '../../i18n';
import ui from '../../styles/ui.module.scss';
import { cx } from '../../utils/cx';
import { CheckIcon } from '../icons/Icons';
import s from './AiFlow.module.scss';

/**
 * Зʼєднувач між кроками схеми з імпульсом, що біжить уздовж лінії.
 * @param props - клас затримки імпульсу (кожен наступний стартує пізніше)
 */
function Conn({ delayClass }: { delayClass?: string }) {
  return (
    <div className={s.conn} aria-hidden="true">
      <span className={cx(s.pulse, delayClass)} />
    </div>
  );
}

/**
 * Схема AI-процесу на About: План → Розробка (3 агенти) → Рев'ю → Тест → Перевірка,
 * під нею рейка з правилами CLAUDE.md. На телефоні схема стає вертикальною.
 */
export function AiFlow() {
  // Тексти активної мови
  const t = useT();

  return (
    <div className={cx(s.flowBox, ui.reveal)} data-testid="ai-flow">
      <div className={s.flow}>
        <div className={s.node}>
          <div className={ui.lbl}>01 · {t.stPlan}</div>
          <div className={s.nodeN}>{t.nPm}</div>
        </div>
        <Conn />
        <div className={s.grp}>
          <div className={ui.lbl}>02 · {t.stBuild}</div>
          {[t.nBack, t.nFront, t.nMobile].map((agent) => (
            <div key={agent} className={s.sub}>
              <span className={s.sq} aria-hidden="true" />
              {agent}
            </div>
          ))}
        </div>
        <Conn delayClass={s.p2} />
        <div className={s.node}>
          <div className={ui.lbl}>03 · {t.stReview}</div>
          <div className={s.nodeN}>{t.nSec}</div>
        </div>
        <Conn delayClass={s.p3} />
        <div className={s.node}>
          <div className={ui.lbl}>04 · {t.stTest}</div>
          <div className={s.nodeN}>{t.nQa}</div>
        </div>
        <Conn delayClass={s.p4} />
        <div className={cx(s.node, s.done)}>
          <div className={ui.lbl}>05 · {t.stShip}</div>
          <div className={s.nodeN}>
            <CheckIcon />
            <span>{t.nDone}</span>
          </div>
        </div>
      </div>
      <div className={s.rail}>
        <span className={s.file}>CLAUDE.md</span>
        <span>{t.rail}</span>
      </div>
    </div>
  );
}
