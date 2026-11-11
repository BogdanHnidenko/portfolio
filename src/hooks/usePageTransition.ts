import { useEffect, useRef, type RefObject } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Після переходу на іншу сторінку прокручує вікно на початок і переводить фокус на `<main>`,
 * щоб скрінрідер оголосив нову сторінку, а клавіатурна навігація почалась із її змісту.
 * Перший рендер і редіректи (`<Navigate replace>`, наприклад `/foo` → `/`) не чіпають фокус,
 * інакше при відкритті сайту фокус перескочив би повз skip-link.
 * @param mainRef - посилання на елемент `<main>` з `tabIndex={-1}`
 */
export function usePageTransition(mainRef: RefObject<HTMLElement | null>): void {
  // Поточний шлях без query і hash: перехід за якорем (skip-link) не вважається зміною сторінки
  const { pathname } = useLocation();
  // Тип останньої навігації: PUSH (клік), POP («Назад» / «Вперед»), REPLACE (редірект)
  const navigationType = useNavigationType();
  // Шлях, для якого вже відпрацювали; переживає повторний запуск ефектів у StrictMode
  const handledPath = useRef(pathname);

  useEffect(() => {
    if (handledPath.current === pathname) return;
    handledPath.current = pathname;
    if (navigationType === 'REPLACE') return;
    // 'instant' перекриває `scroll-behavior: smooth` на <html>: нова сторінка одразу показується з початку
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname, navigationType, mainRef]);
}
