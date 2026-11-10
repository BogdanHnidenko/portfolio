import { cx } from '../../utils/cx';
import s from './PhonesStage.module.scss';

/** Пропси сцени з телефонами. */
interface PhonesStageProps {
  /** Додаткові класи (анімація появи) */
  className?: string;
}

/**
 * Декоративна сцена з трьома розмитими телефонами, кільцями та світінням. Прихована від скрінрідерів.
 * @param props - додаткові класи
 */
export function PhonesStage({ className }: PhonesStageProps) {
  return (
    <div className={cx(s.appsStage, className)} aria-hidden="true" data-testid="apps-stage">
      <div className={s.stageGlow} />
      <div className={cx(s.ring, s.r1)} />
      <div className={cx(s.ring, s.r2)} />
      <div className={s.pw}>
        <div className={cx(s.phone, s.l)}>
          <div className={s.scr}>
            <div className={s.blur}>
              <div className={cx(s.bl, s.t)} />
              <div className={cx(s.bl, s.tiles)}>
                <div className={cx(s.bl, s.tile, s.a)} />
                <div className={cx(s.bl, s.tile)} />
                <div className={cx(s.bl, s.tile)} />
                <div className={cx(s.bl, s.tile, s.o)} />
              </div>
              <div className={cx(s.bl, s.row)} />
              <div className={cx(s.bl, s.bar)} />
            </div>
          </div>
        </div>
        <div className={cx(s.phone, s.r)}>
          <div className={s.scr}>
            <div className={s.blur}>
              <div className={cx(s.bl, s.t)} />
              <div className={cx(s.bl, s.t2)} />
              <div className={cx(s.bl, s.row)} />
              <div className={cx(s.bl, s.row)} />
              <div className={cx(s.bl, s.row)} />
              <div className={cx(s.bl, s.row)} />
              <div className={cx(s.bl, s.bar)} />
            </div>
          </div>
        </div>
        <div className={cx(s.phone, s.c)}>
          <div className={s.scr}>
            <div className={s.blur}>
              <div className={cx(s.bl, s.t)} />
              <div className={cx(s.bl, s.t2)} />
              <div className={cx(s.bl, s.hero)} />
              <div className={cx(s.bl, s.tiles)}>
                <div className={cx(s.bl, s.tile)} />
                <div className={cx(s.bl, s.tile, s.o)} />
              </div>
              <div className={cx(s.bl, s.row)} />
              <div className={cx(s.bl, s.row)} />
              <div className={cx(s.bl, s.bar)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
