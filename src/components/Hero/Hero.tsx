import { Fragment } from 'react';
import { CV_HREF } from '../../data/contacts';
import { useT } from '../../i18n';
import ui from '../../styles/ui.module.scss';
import { SPECTRUM_BARS } from '../../utils/bars';
import { cx } from '../../utils/cx';
import { ArrowRightIcon, DownloadIcon } from '../icons/Icons';
import s from './Hero.module.scss';

/** Класи затримки появи для слів імені (як у макеті: d2, d3, …). */
const NAME_DELAYS = [ui.d2, ui.d3, ui.d4, ui.d5, ui.d6];

/** Класи затримки появи для карток-напрямів (d4, d5, d6). */
const DIR_DELAYS = [ui.d4, ui.d5, ui.d6];

/**
 * Hero-секція: сітка, світіння, «спектр» із 96 барів, монограма, статус, ім'я по словах,
 * headline, pitch, кнопки «Download CV» / «View work» і три картки-напрями.
 */
export function Hero() {
  // Тексти активної мови
  const t = useT();

  return (
    <section className={s.hero} data-testid="hero">
      <div className={s.heroGrid} aria-hidden="true" />
      <div className={s.heroGlow} aria-hidden="true" />
      <div className={s.spec} aria-hidden="true" data-testid="hero-bars">
        {SPECTRUM_BARS.map((bar, i) => (
          <span
            key={i}
            className={cx(s.bar, bar.orange && s.o)}
            style={{ height: bar.height, animationDelay: bar.delay, animationDuration: bar.duration }}
            data-testid="hero-bar"
            data-orange={bar.orange ? 'true' : 'false'}
          />
        ))}
      </div>
      <div className={s.specHot} aria-hidden="true" />
      <div className={ui.wrap}>
        <div className={s.heroIn}>
          <div className={cx(s.chiprow, ui.rise, ui.d1)}>
            <div className={s.avaSm} role="img" aria-label={t.avatarLabel}>
              BH
            </div>
            <span className={s.chip} data-testid="hero-status">
              <span className={s.dot} aria-hidden="true" />
              {t.status}
            </span>
          </div>
          <h1 className={s.name} aria-label={t.name} data-testid="hero-name">
            {t.nameWords.map((word, i) => (
              // Пробіл між словами — для коректного textContent; у flex-контейнері він не рендериться
              <Fragment key={word}>
                {i > 0 && ' '}
                <span aria-hidden="true" className={NAME_DELAYS[i]}>
                  {word}
                </span>
              </Fragment>
            ))}
          </h1>
          <p className={cx(s.headline, ui.rise, ui.d4)} data-testid="hero-headline">
            {t.hl.map((part, i) => (
              <Fragment key={part}>
                {i > 0 && ' '}
                <span>{part}</span>
              </Fragment>
            ))}
          </p>
          <p className={cx(s.pitch, ui.rise, ui.d5)} data-testid="hero-pitch">
            {t.pitch}
          </p>
          <div className={cx(s.cta, ui.rise, ui.d6)}>
            <a className={cx(ui.btn, ui.primary, s.ctaBtn)} href={CV_HREF} download data-testid="cv-hero">
              <DownloadIcon size={16} />
              {t.cv}
            </a>
            <a className={cx(ui.btn, s.ctaBtn)} href="#work" data-testid="view-work">
              {t.viewWork}
              <ArrowRightIcon className={ui.arr} />
            </a>
          </div>
        </div>
        <nav className={s.dirs} aria-label={t.dirsLabel}>
          {t.dirs.map((dir, i) => (
            <a
              key={dir.href}
              className={cx(ui.card, s.dir, ui.rise, DIR_DELAYS[i])}
              href={dir.href}
              data-testid={`dir-card-${dir.href.slice(1)}`}
            >
              <span className={s.dirTxt}>
                <span className={s.dirH}>{dir.title}</span>
                <span className={s.dirP}>{dir.text}</span>
              </span>
              <span className={s.dirGo} aria-hidden="true">
                <ArrowRightIcon strokeWidth={2} />
              </span>
            </a>
          ))}
        </nav>
      </div>
    </section>
  );
}
