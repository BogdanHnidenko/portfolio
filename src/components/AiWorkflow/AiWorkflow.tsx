import { useT } from '../../i18n';
import ui from '../../styles/ui.module.scss';
import { cx } from '../../utils/cx';
import { CheckIcon, FileIcon } from '../icons/Icons';
import s from './AiWorkflow.module.scss';

/** AI-інструменти (власні назви, не перекладаються). */
const AI_TOOLS = ['Claude Code', 'Gemini', 'ChatGPT'];

/** Класи каскадної появи AI-карток (як `r1..r3` у макеті; r1 не має окремого стилю). */
const REVEAL_STAGGER = ['', ui.r2, ui.r3];

/**
 * Пропси з'єднувача між кроками схеми.
 */
interface ConnectorProps {
  /** Клас затримки пульсу, щоб пульси бігли по черзі */
  pulseDelay?: string;
}

/**
 * Стрілка-з'єднувач між кроками схеми з «пульсом», що біжить уздовж неї.
 * @param props - клас затримки пульсу
 */
function Connector({ pulseDelay }: ConnectorProps) {
  return (
    <div className={s.conn} aria-hidden="true">
      <span className={cx(s.pulse, pulseDelay)} />
    </div>
  );
}

/**
 * Секція «AI workflow»: lead, схема з 5 кроків (план → розробка → рев'ю → тест → перевірка),
 * рейка CLAUDE.md, три AI-картки та інструменти.
 */
export function AiWorkflow() {
  // Тексти активної мови
  const t = useT();

  return (
    <section className={ui.sec} id="ai" data-testid="section-ai">
      <div className={ui.wrap}>
        <div className={cx(ui.eyebrow, ui.reveal)}>
          <span className={ui.ix}>03</span>
          <span className={ui.ln} />
          {t.navAi}
        </div>
        <h2 className={cx(ui.h2, ui.reveal)}>
          {t.aiTitleA} <span className={ui.em}>{t.aiTitleB}</span>
        </h2>
        <p className={cx(ui.lead, ui.reveal)}>{t.aiLead}</p>

        <div className={cx(s.flowBox, ui.reveal)} data-testid="ai-flow">
          <div className={s.flowGlow} aria-hidden="true" />
          <div className={s.flowScan} aria-hidden="true" />
          <div className={s.flow}>
            <div className={cx(s.node, s.pm)}>
              <div className={cx(ui.lbl, s.smLbl)}>01 · {t.stPlan}</div>
              <div className={s.nodeN}>{t.nPm}</div>
            </div>
            <Connector />
            <div className={cx(s.grp, s.l2)}>
              <div className={cx(ui.lbl, s.smLbl, s.grpLbl)}>02 · {t.stBuild}</div>
              {[t.nBack, t.nFront, t.nMobile].map((agent) => (
                <div key={agent} className={s.sub}>
                  <span className={s.sq} aria-hidden="true" />
                  {agent}
                </div>
              ))}
            </div>
            <Connector pulseDelay={s.p2} />
            <div className={cx(s.node, s.l3)}>
              <div className={cx(ui.lbl, s.smLbl)}>03 · {t.stReview}</div>
              <div className={s.nodeN}>{t.nSec}</div>
            </div>
            <Connector pulseDelay={s.p3} />
            <div className={cx(s.node, s.l4)}>
              <div className={cx(ui.lbl, s.smLbl)}>04 · {t.stTest}</div>
              <div className={s.nodeN}>{t.nQa}</div>
            </div>
            <Connector pulseDelay={s.p4} />
            <div className={cx(s.node, s.done, s.l5)}>
              <div className={cx(ui.lbl, s.smLbl)}>05 · {t.stShip}</div>
              <div className={s.nodeN}>
                <CheckIcon />
                <span>{t.nDone}</span>
              </div>
            </div>
          </div>
          <div className={s.rail}>
            <span className={s.file}>
              <FileIcon />
              CLAUDE.md
            </span>
            <span>{t.rail}</span>
          </div>
        </div>

        <div className={s.aiCards}>
          {t.aiCards.map((card, i) => (
            <article
              key={card.n}
              className={cx(ui.card, s.aiCard, ui.reveal, REVEAL_STAGGER[i % REVEAL_STAGGER.length])}
              data-testid="ai-card"
            >
              <div className={s.aiCardTop}>
                <span className={ui.lbl}>{card.k}</span>
                <span className={s.n}>{card.n}</span>
              </div>
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
  );
}
