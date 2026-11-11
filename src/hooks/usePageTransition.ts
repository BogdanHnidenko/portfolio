import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { useLocation, useNavigationType, type Location } from 'react-router-dom';
import { readScrollPosition, saveScrollPosition, scrollEntryId } from '../utils/scrollPositions';

/** Скільки мілісекунд після переходу утримувати цільову позицію, поки догружається контент (зображення, шрифти). */
const SETTLE_MS = 1000;

/** Допуск у пікселях, у межах якого позиція вважається досягнутою (дробові scrollY на HiDPI-екранах). */
const SCROLL_TOLERANCE_PX = 1;

/** Дії користувача, після яких утримання позиції припиняється, щоб не боротися з його власною прокруткою. */
const USER_SCROLL_EVENTS = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;

/** Попередня оброблена адреса: ключ запису історії і шлях. */
interface HandledLocation {
  key: string;
  pathname: string;
}

/**
 * Миттєво прокручує вікно; 'instant' перекриває `scroll-behavior: smooth` на <html>.
 * @param top - вертикальна позиція в пікселях
 */
function scrollInstantly(top: number): void {
  window.scrollTo({ top, left: 0, behavior: 'instant' });
}

/**
 * Шукає на сторінці елемент, на який вказує hash адреси.
 * @param hash - hash адреси роутера разом із `#` (або порожній рядок)
 * @returns елемент з таким `id` або null, якщо hash порожній, некоректний чи елемента немає
 */
function findAnchor(hash: string): HTMLElement | null {
  if (hash.length <= 1) return null;
  try {
    return document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    // Некоректне %-кодування в адресі — вважаємо, що якоря немає
    return null;
  }
}

/**
 * Рахує scrollY, за якого верх елемента стоїть під sticky-хедером: враховує `scroll-margin-top` якоря.
 * @param element - цільовий блок
 * @returns позиція прокрутки в пікселях (не менше 0)
 */
function anchorTop(element: HTMLElement): number {
  // Відступ від верху вікна, заданий у CSS класом `anchor` (висота хедера + зазор)
  const margin = parseFloat(getComputedStyle(element).scrollMarginTop) || 0;
  return Math.max(0, element.getBoundingClientRect().top + window.scrollY - margin);
}

/**
 * Перевіряє, чи документ завантажено перезавантаженням або кнопками «Назад» / «Вперед» між документами:
 * лише тоді збережена позиція першого запису доречна (свіжий захід за адресою має починатися з початку чи якоря).
 * @returns true для типів навігації `reload` і `back_forward`
 */
function isRestoredDocumentLoad(): boolean {
  try {
    // Запис Navigation Timing поточного документа; у старих браузерах і тестовому середовищі його може не бути
    const [entry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    return entry?.type === 'reload' || entry?.type === 'back_forward';
  } catch {
    return false;
  }
}

/**
 * Утримує цільову позицію протягом SETTLE_MS: поки сторінка ще недостатньо висока чи зсувається через
 * контент, що догружається, на кожному кадрі знову прокручує до цілі. Зупиняється, щойно користувач сам
 * почав прокручувати чи натиснув клавішу.
 * @param getTop - повертає актуальну ціль у пікселях або null, якщо ціль зникла (тоді утримання завершується)
 * @returns функція, що достроково зупиняє утримання
 */
function holdScroll(getTop: () => number | null): () => void {
  // Момент, після якого ціль більше не утримується
  const deadline = performance.now() + SETTLE_MS;
  // Ідентифікатор запланованого кадру
  let frame = 0;

  /** Скасовує наступний кадр і знімає слухачів дій користувача. */
  const stop = () => {
    cancelAnimationFrame(frame);
    for (const type of USER_SCROLL_EVENTS) window.removeEventListener(type, stop, true);
  };

  /** Один крок утримання: доводить прокрутку до цілі і планує наступний кадр, поки не вийде час. */
  const tick = () => {
    // Актуальна ціль: позиція якоря могла змінитися після догрузки контенту вище
    const top = getTop();
    if (top === null || performance.now() >= deadline) {
      stop();
      return;
    }
    if (Math.abs(window.scrollY - top) > SCROLL_TOLERANCE_PX) scrollInstantly(top);
    frame = requestAnimationFrame(tick);
  };

  for (const type of USER_SCROLL_EVENTS) window.addEventListener(type, stop, { capture: true, passive: true });
  frame = requestAnimationFrame(tick);
  return stop;
}

/**
 * Ставить сторінку на ціль одразу (до відмальовування) і утримує її, поки догружається контент.
 * @param getTop - повертає ціль у пікселях або null, якщо ціль зникла
 * @returns функція зупинки утримання, або null, якщо цілі немає
 */
function scrollAndHold(getTop: () => number | null): (() => void) | null {
  // Початкова ціль
  const top = getTop();
  if (top === null) return null;
  scrollInstantly(top);
  return holdScroll(getTop);
}

/**
 * Готує функцію цілі для якоря з hash адреси.
 * @param hash - hash адреси роутера
 * @returns функція цілі або null, якщо елемента з таким `id` на сторінці немає
 */
function anchorTarget(hash: string): (() => number | null) | null {
  // Цільовий блок на щойно відрендереній сторінці
  const element = findAnchor(hash);
  if (!element) return null;
  return () => (element.isConnected ? anchorTop(element) : null);
}

/**
 * Обирає ціль прокрутки для сторінки, на яку щойно перейшли.
 * @param location - нова адреса
 * @param restore - чи брати збережену позицію запису («Назад» / «Вперед», перезавантаження)
 * @returns функція цілі або null, якщо доречного місця немає (тоді — початок сторінки)
 */
function pickTarget(location: Location, restore: boolean): (() => number | null) | null {
  // Позиція, на якій цей запис залишили востаннє
  const saved = restore ? readScrollPosition(scrollEntryId(location)) : undefined;
  if (saved !== undefined) return () => saved;
  return anchorTarget(location.hash);
}

/**
 * Керує прокруткою і фокусом при зміні сторінки:
 * - перехід за посиланням (PUSH) відкриває сторінку одразу на блоці з hash адреси (під sticky-хедером),
 *   а без hash чи без такого блоку — з початку;
 * - «Назад» / «Вперед» (POP) повертають сторінку на позицію, де цей запис історії залишили; позиції
 *   зберігаються для кожного запису (`location.key`) і переживають перезавантаження вкладки;
 * - після зміни сторінки фокус переходить на `<main>` (без прокрутки), щоб скрінрідер оголосив нову сторінку.
 * Перший рендер не чіпає фокус (інакше при відкритті сайту фокус перескочив би повз skip-link), але показує
 * блок з hash адреси чи збережену позицію після перезавантаження. Редіректи (REPLACE) і зміна лише hash на тій
 * самій сторінці (skip-link `#main`) прокрутку не змінюють.
 * @param mainRef - посилання на елемент `<main>` з `tabIndex={-1}`
 */
export function usePageTransition(mainRef: RefObject<HTMLElement | null>): void {
  // Поточна адреса: шлях, hash і ключ запису історії
  const location = useLocation();
  // Тип останньої навігації: PUSH (клік), POP («Назад» / «Вперед»), REPLACE (редірект)
  const navigationType = useNavigationType();
  // Адреса, для якої вже відпрацювали; null — ще жодної (перший рендер). Переживає повторний запуск ефектів у StrictMode
  const handled = useRef<HandledLocation | null>(null);
  // Запис історії, якому належить поточна прокрутка; оновлюється до того, як браузер надішле події scroll нової сторінки
  const entryRef = useRef(scrollEntryId(location));
  // Зупинка утримання позиції попереднього переходу
  const stopHold = useRef<(() => void) | null>(null);

  // Позицію відновлює сам застосунок: браузер не має прокручувати сторінку паралельно з роутером
  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
  }, []);

  // Кожна прокрутка записується в памʼять за поточним записом історії (у sessionStorage — відкладено) — так позиція відома ще до того, як із запису підуть
  useEffect(() => {
    /** Зберігає поточну прокрутку для активного запису історії. */
    const onScroll = () => saveScrollPosition(entryRef.current, window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // При демонтажі зупиняє утримання і забуває оброблену адресу: повторний монтаж (StrictMode у dev)
  // знову виставить позицію першого рендеру, а не залишить її без утримання
  useLayoutEffect(
    () => () => {
      stopHold.current?.();
      stopHold.current = null;
      handled.current = null;
    },
    [],
  );

  // Layout-ефект: позиція виставляється до першого відмальовування нової сторінки, без кадру «з початку»
  useLayoutEffect(() => {
    // Попередня оброблена адреса
    const previous = handled.current;
    if (previous?.key === location.key) return;
    handled.current = { key: location.key, pathname: location.pathname };
    entryRef.current = scrollEntryId(location);
    stopHold.current?.();
    stopHold.current = null;

    if (previous === null) {
      // Перший рендер: прямий захід за адресою з якорем або перезавантаження вкладки; інакше прокрутку не чіпаємо
      const initialTarget = pickTarget(location, isRestoredDocumentLoad());
      if (initialTarget) stopHold.current = scrollAndHold(initialTarget);
      return;
    }
    if (navigationType === 'REPLACE' || previous.pathname === location.pathname) {
      // Сторінка та сама (редірект, повторний клік, skip-link) — прокрутка лишається, запис отримує поточну позицію
      saveScrollPosition(entryRef.current, window.scrollY);
      return;
    }

    // Ціль: збережена позиція при «Назад» / «Вперед», інакше блок з hash; без них — початок сторінки
    const target = pickTarget(location, navigationType === 'POP');
    if (target) stopHold.current = scrollAndHold(target);
    else scrollInstantly(0);
    mainRef.current?.focus({ preventScroll: true });
  }, [location, navigationType, mainRef]);
}
