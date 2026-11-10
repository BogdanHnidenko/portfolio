import { useCallback, useEffect, useRef, useState, type MouseEvent, type RefObject } from 'react';
import { matchPath, useLocation } from 'react-router-dom';

/** Селектор елементів панелі, по яких ходить Tab: пункти меню й кнопки налаштувань. */
const FOCUSABLE = 'a[href], button:not([disabled])';

/** Стан і дії бургер-меню, які потрібні кнопці-бургеру й панелі. */
export interface MobileMenu {
  /** Чи відкрита панель */
  open: boolean;
  /** Кнопка-бургер: на неї повертається фокус, за її видимістю визначаємо ширину > 900 px */
  toggleRef: RefObject<HTMLButtonElement>;
  /** Панель меню: межа для «кліку поза панеллю» і пастки фокусу */
  panelRef: RefObject<HTMLDivElement>;
  /** Відкриває або закриває панель (клік на бургер); після закриття фокус лишається на бургері */
  toggle: () => void;
  /** Обробник кліку на пункт панелі: закриває її; фокус повертає на бургер лише якщо сторінка не змінюється */
  onLinkClick: (to: string, event: MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * Логіка бургер-меню: відкриття й закриття (бургер, Esc, клік поза панеллю, пункт меню, зміна сторінки,
 * перехід ширини на > 900 px), блокування прокрутки сторінки, фокус на першому пункті і пастка Tab
 * у межах панелі та бургера, повернення фокусу на бургер після закриття.
 * @returns стан панелі, refs для бургера й панелі та обробники
 */
export function useMobileMenu(): MobileMenu {
  // Чи відкрита панель
  const [open, setOpen] = useState(false);
  // Поточний шлях: при його зміні (пункт меню, «Назад») панель закривається
  const { pathname } = useLocation();
  // Шлях, на якому був попередній рендер; потрібен, щоб помітити зміну сторінки під час рендеру
  const [renderedPath, setRenderedPath] = useState(pathname);
  // Кнопка-бургер
  const toggleRef = useRef<HTMLButtonElement>(null);
  // Панель меню
  const panelRef = useRef<HTMLDivElement>(null);

  // Зміна сторінки закриває панель; фокус тоді ставить usePageTransition на <main>
  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    setOpen(false);
  }

  /**
   * Закриває панель і, якщо треба, повертає фокус на бургер.
   * @param returnFocus - true, коли сторінка не змінюється і фокус має лишитись біля меню
   */
  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) toggleRef.current?.focus();
  }, []);

  /** Перемикає панель кліком на бургер; фокус і так лишається на бургері. */
  const toggle = useCallback(() => {
    setOpen((value) => !value);
  }, []);

  /**
   * Закриває панель після кліку на пункт. Клік із модифікатором (нова вкладка) панель не закриває,
   * бо поточна сторінка лишається тією самою.
   * @param to - адреса пункту
   * @param event - клік по пункту
   */
  const onLinkClick = useCallback(
    (to: string, event: MouseEvent<HTMLAnchorElement>) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      // Пункт веде на поточну сторінку: переходу не буде, тож фокус повертаємо на бургер
      const samePage = matchPath({ path: to, end: true }, pathname) !== null;
      close(samePage);
    },
    [pathname, close],
  );

  // Поки панель відкрита: блокування прокрутки, фокус на першому пункті, Esc, Tab, клік поза панеллю
  useEffect(() => {
    if (!open) return;
    // Корінь документа, що прокручує сторінку
    const html = document.documentElement;
    // Попередні inline-стилі, щоб повернути їх після закриття
    const prevOverflow = html.style.overflow;
    const prevGutter = html.style.scrollbarGutter; // резерв під смугу прокрутки
    html.style.overflow = 'hidden';
    // Місце під смугу прокрутки лишається: ширина сторінки не стрибає і не перетинає брейкпоінт 900 px
    html.style.scrollbarGutter = 'stable';

    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    /**
     * Esc закриває панель; Tab і Shift+Tab ходять по колу «бургер → пункти панелі → бургер».
     * @param event - натискання клавіші в документі
     */
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close(true);
        return;
      }
      if (event.key !== 'Tab') return;
      // Бургер і всі фокусовані елементи панелі в порядку DOM (бургер стоїть раніше за панель)
      const items = [toggleRef.current, ...(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])].filter(
        (item): item is HTMLElement => item !== null,
      );
      if (items.length === 0) return;
      // Елемент із фокусом зараз
      const active = document.activeElement;
      // Позиція фокусу в колі; -1 — фокус поза меню
      const index = items.findIndex((item) => item === active);
      // Наступний елемент для фокусу, або null — тоді браузер переходить сам (усередині кола)
      let next: HTMLElement | null = null;
      if (index === -1) next = items[0];
      else if (event.shiftKey && index === 0) next = items[items.length - 1];
      else if (!event.shiftKey && index === items.length - 1) next = items[0];
      if (next) {
        event.preventDefault();
        next.focus();
      }
    };

    /**
     * Натискання поза панеллю й бургером закриває панель (бургер обробляє свій клік сам).
     * @param event - натискання вказівника в документі
     */
    const onPointerDown = (event: PointerEvent) => {
      // Елемент, на який натиснули
      const target = event.target as Node | null;
      if (target && (panelRef.current?.contains(target) || toggleRef.current?.contains(target))) return;
      close(true);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      html.style.overflow = prevOverflow;
      html.style.scrollbarGutter = prevGutter;
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open, close]);

  // Ширина > 900 px: CSS ховає бургер (розмір 0×0) — тоді закриваємо панель, щоб вона не лишилась відкритою
  useEffect(() => {
    // Кнопка-бургер, за розміром якої стежимо
    const toggleButton = toggleRef.current;
    if (!open || !toggleButton || typeof ResizeObserver === 'undefined') return;
    // Спостерігач за розміром бургера
    const observer = new ResizeObserver((entries) => {
      if (entries.some((entry) => entry.contentRect.width === 0)) setOpen(false);
    });
    observer.observe(toggleButton);
    return () => observer.disconnect();
  }, [open]);

  return { open, toggleRef, panelRef, toggle, onLinkClick };
}
