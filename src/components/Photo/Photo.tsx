import { useState, type ReactNode } from 'react';
import { PHOTO_SRC } from '../../data/contacts';
import { useT } from '../../i18n';
import { cx } from '../../utils/cx';
import { PersonIcon } from '../icons/Icons';
import s from './Photo.module.scss';

/** Стан завантаження фото: чекаємо відповіді, завантажено, або файлу немає / він битий. */
type PhotoStatus = 'loading' | 'loaded' | 'error';

/** Варіант рамки: Home (заповнює плитку; на телефоні 4:5), About (3:4) або круглий аватар About на вузьких екранах. */
export type PhotoVariant = 'home' | 'about' | 'avatar';

/** Пропси фото. */
export interface PhotoProps {
  /** Варіант рамки й заглушки */
  variant: PhotoVariant;
  /** Додатковий вміст поверх фото (бейдж мов на Home); видно і з фото, і із заглушкою */
  children?: ReactNode;
}

/**
 * Фото автора з `/photo.jpg` або заглушка з макета (рамка й іконка людини, без підпису).
 * `<img>` монтується одразу, але прихований, доки не прийде `onLoad`; при `onError` (файлу немає,
 * сервер віддав не зображення) він прибирається, і лишається тільки заглушка.
 * @param props - варіант рамки і вміст поверх фото
 */
export function Photo({ variant, children }: PhotoProps) {
  // Тексти активної мови: alt фото та підпис заглушки для скрінрідерів
  const t = useT();
  // Чи вдалося завантажити зображення
  const [status, setStatus] = useState<PhotoStatus>('loading');
  // Фото показане: заглушку прибираємо повністю
  const loaded = status === 'loaded';
  // Розмір іконки-заглушки: у малому аватарі вона менша, як у макеті
  const iconSize = variant === 'avatar' ? 22 : 30;

  return (
    <div
      className={cx(s.frame, s[variant])}
      role={loaded ? undefined : 'img'}
      aria-label={loaded ? undefined : t.photoAlt}
    >
      {!loaded && (
        <div className={s.placeholder} data-testid="photo-placeholder">
          <div className={s.ico}>
            <PersonIcon size={iconSize} strokeWidth={variant === 'avatar' ? 1.6 : 1.4} />
          </div>
        </div>
      )}
      {status !== 'error' && (
        <img
          className={cx(s.img, loaded && s.shown)}
          src={PHOTO_SRC}
          alt={loaded ? t.name : ''}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          data-testid="photo-img"
        />
      )}
      {children}
    </div>
  );
}
