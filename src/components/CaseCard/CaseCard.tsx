import type { CaseItem } from '../../i18n/types';
import ui from '../../styles/ui.module.scss';
import { cx } from '../../utils/cx';
import { externalLinkProps, isRenderableHref } from '../../utils/links';
import { ArrowUpRightIcon } from '../icons/Icons';
import s from './CaseCard.module.scss';

/** Підписи кроків кейсу активною мовою. */
export interface CaseStepLabels {
  problem: string;
  solution: string;
  result: string;
}

/** Пропси картки кейсу. */
export interface CaseCardProps {
  /** Дані кейсу зі словника */
  item: CaseItem;
  /** Підписи «Проблема / Рішення / Результат» */
  labels: CaseStepLabels;
  /** Додаткові класи (анімація появи) */
  className?: string;
}

/**
 * Картка кейсу: заголовок, метрика, три кроки Problem / Solution / Result, теги та посилання.
 * Посилання з порожнім або небезпечним href не рендеряться; якщо не лишилось жодного — блоку посилань немає.
 * @param props - кейс, підписи кроків і класи
 */
export function CaseCard({ item, labels, className }: CaseCardProps) {
  // Посилання, які справді можна показати (заглушки з порожнім href відкидаються)
  const links = item.links.filter((link) => isRenderableHref(link.href));

  return (
    <article className={cx(ui.card, s.case, className)} data-testid="case-card">
      <div className={s.caseHead}>
        <h3 className={ui.h3} data-testid="case-title">
          {item.title}
        </h3>
        <div className={s.big} data-testid="case-metric">
          {item.metric}
        </div>
      </div>
      <div className={s.steps}>
        <div className={s.step}>
          <span className={ui.lbl}>{labels.problem}</span>
          <p>{item.p}</p>
        </div>
        <div className={cx(s.step, s.s2)}>
          <span className={ui.lbl}>{labels.solution}</span>
          <p>{item.s}</p>
        </div>
        <div className={cx(s.step, s.s3)}>
          <span className={cx(ui.lbl, s.resLbl)}>{labels.result}</span>
          <p>{item.r}</p>
        </div>
      </div>
      <div className={s.caseFoot}>
        <div className={ui.tags}>
          {item.tags.map((tag) => (
            <span key={tag} className={ui.tag}>
              {tag}
            </span>
          ))}
        </div>
        {links.length > 0 && (
          <div className={s.links}>
            {links.map((link) => (
              <a key={link.href} className={ui.lnk} href={link.href} {...externalLinkProps(link.href)} data-testid="case-link">
                {link.label}
                <ArrowUpRightIcon />
              </a>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
