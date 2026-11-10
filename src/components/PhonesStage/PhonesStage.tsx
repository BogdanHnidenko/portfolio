import { cx } from '../../utils/cx';
import s from './PhonesStage.module.scss';

/**
 * Декоративна сцена картки застосунків: кільця і три розмиті телефони. Прихована від скрінрідерів.
 */
export function PhonesStage() {
  return (
    <div className={s.appsStage} aria-hidden="true" data-testid="apps-stage">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
