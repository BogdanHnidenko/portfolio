// Декоративні SVG-іконки з макета. Усі мають aria-hidden: зміст передає текст поруч або aria-label батька.

/** Спільні пропси іконок: розмір у px, товщина лінії і додатковий клас. */
interface IconProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

/**
 * Стрілка «завантажити» (кнопки CV, картка PDF).
 * @param props - розмір (за замовчуванням 16), товщина лінії (2) і клас
 */
export function DownloadIcon({ size = 16, strokeWidth = 2, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" />
    </svg>
  );
}

/**
 * Стрілка вправо («View work», «All contacts» у плитці контактів).
 * @param props - розмір (за замовчуванням 15), товщина лінії (1.9) і клас
 */
export function ArrowRightIcon({ size = 15, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/**
 * Діагональна стрілка «відкрити» (плитки Home, посилання кейсів і контактів).
 * @param props - розмір (за замовчуванням 14), товщина лінії (1.9) і клас
 */
export function ArrowUpRightIcon({ size = 14, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M7 17L17 7M9 7h8v8" />
    </svg>
  );
}

/** Пропси іконок теми: data-testid, щоб іконки в хедері й у бургер-меню не мали однакових ідентифікаторів. */
interface ThemeIconProps {
  testId?: string;
}

/**
 * Сонце — показується в темній темі на кнопці перемикання.
 * @param props - data-testid (за замовчуванням `theme-icon-sun`)
 */
export function SunIcon({ testId = 'theme-icon-sun' }: ThemeIconProps) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true" data-testid={testId}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </svg>
  );
}

/**
 * Місяць — показується у світлій темі на кнопці перемикання.
 * @param props - data-testid (за замовчуванням `theme-icon-moon`)
 */
export function MoonIcon({ testId = 'theme-icon-moon' }: ThemeIconProps) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" data-testid={testId}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
    </svg>
  );
}

/** Замок — клієнтські застосунки під NDA. */
export function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" />
    </svg>
  );
}

/** Галочка — фінальний крок AI-процесу. */
export function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 12.5l5 5 10-11" />
    </svg>
  );
}

/**
 * Конверт — кнопка «Email me» і велика картка email.
 * @param props - розмір (за замовчуванням 16) і клас
 */
export function MailIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3.5 7l8.5 6 8.5-6" />
    </svg>
  );
}

/**
 * Силует людини — заглушка фото й аватара, поки немає справжнього зображення.
 * @param props - розмір (за замовчуванням 30), товщина лінії (1.4) і клас
 */
export function PersonIcon({ size = 30, strokeWidth = 1.4, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

/** Глобус — бейдж із мовами на фото Home. */
export function GlobeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}

/** Три лінії — кнопка-бургер у закритому стані. */
export function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" data-testid="menu-icon-open">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

/** Хрестик — кнопка-бургер, коли панель меню відкрита. */
export function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" data-testid="menu-icon-close">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
