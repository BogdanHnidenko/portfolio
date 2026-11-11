import { useState, type ReactNode } from 'react';
import {
  FIELDQUOTE_SCREEN_HEIGHT,
  FIELDQUOTE_SCREEN_WIDTH,
  FIELDQUOTE_SCREENS,
  type AppScreenPosition,
} from '../../data/apps';
import { useT } from '../../i18n';
import { cx } from '../../utils/cx';
import s from './PhonesStage.module.scss';

/** Клас положення телефона в сцені: лівий і правий нахилені, центральний більший і попереду. */
const POSITION_CLASS: Readonly<Record<AppScreenPosition, string>> = {
  left: s.l,
  center: s.c,
  right: s.r,
};

/** Порядок рендеру: бічні телефони першими, центральний останнім, щоб лежав поверх них. */
const RENDER_ORDER: readonly AppScreenPosition[] = ['left', 'right', 'center'];

/**
 * Розмита заглушка екрана з макета для телефона, чий скриншот не завантажився.
 * Декоративна, тому прихована від скрінрідерів.
 * @param props - позиція телефона: від неї залежить набір блоків, як у макеті
 */
function BlurredScreen({ position }: { position: AppScreenPosition }) {
  // Блоки «інтерфейсу» для кожного телефона, як у макеті
  const blocks: Record<AppScreenPosition, ReactNode> = {
    left: (
      <>
        <div className={cx(s.bl, s.t)} />
        <div className={cx(s.bl, s.tiles)}>
          <div className={cx(s.bl, s.tile, s.a)} />
          <div className={cx(s.bl, s.tile)} />
          <div className={cx(s.bl, s.tile)} />
          <div className={cx(s.bl, s.tile, s.o)} />
        </div>
        <div className={cx(s.bl, s.row)} />
      </>
    ),
    right: (
      <>
        <div className={cx(s.bl, s.t)} />
        <div className={cx(s.bl, s.t2)} />
        <div className={cx(s.bl, s.row)} />
        <div className={cx(s.bl, s.row)} />
        <div className={cx(s.bl, s.row)} />
        <div className={cx(s.bl, s.row)} />
      </>
    ),
    center: (
      <>
        <div className={cx(s.bl, s.t)} />
        <div className={cx(s.bl, s.t2)} />
        <div className={cx(s.bl, s.hero)} />
        <div className={cx(s.bl, s.tiles)}>
          <div className={cx(s.bl, s.tile)} />
          <div className={cx(s.bl, s.tile, s.o)} />
        </div>
        <div className={cx(s.bl, s.row)} />
      </>
    ),
  };

  return (
    <div className={s.blur} aria-hidden="true" data-testid={`app-screen-${position}-fallback`}>
      {blocks[position]}
    </div>
  );
}

/** Пропси одного телефона сцени. */
interface PhoneProps {
  /** Положення телефона в сцені */
  position: AppScreenPosition;
  /** Підпис скриншота активною мовою */
  alt: string;
}

/**
 * Телефон зі скриншотом FieldQuote; якщо файл не завантажився, показує розмиту заглушку з макета.
 * @param props - положення телефона і alt скриншота
 */
function Phone({ position, alt }: PhoneProps) {
  // Скриншот не завантажився (файлу немає або мережа впала) — показуємо заглушку
  const [failed, setFailed] = useState(false);

  return (
    <div className={cx(s.phone, POSITION_CLASS[position])}>
      <div className={s.scr}>
        {failed ? (
          <BlurredScreen position={position} />
        ) : (
          <img
            className={s.shot}
            src={FIELDQUOTE_SCREENS[position]}
            alt={alt}
            width={FIELDQUOTE_SCREEN_WIDTH}
            height={FIELDQUOTE_SCREEN_HEIGHT}
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
            data-testid={`app-screen-${position}`}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Сцена картки застосунків на Work: світіння, два кільця і три телефони зі справжніми скриншотами FieldQuote
 * (лівий — кошторис, центральний — головний екран, правий — перегляд і підпис). Скриншоти мають alt,
 * тож сцена доступна скрінрідерам; кільця й заглушки — декоративні.
 */
export function PhonesStage() {
  // Тексти активної мови: alt скриншотів
  const t = useT();

  return (
    <div className={s.appsStage} data-testid="apps-stage">
      <div className={cx(s.ring, s.r1)} aria-hidden="true" />
      <div className={cx(s.ring, s.r2)} aria-hidden="true" />
      <div className={s.pw}>
        {RENDER_ORDER.map((position) => (
          <Phone key={position} position={position} alt={t.appScreenAlts[position]} />
        ))}
      </div>
    </div>
  );
}
