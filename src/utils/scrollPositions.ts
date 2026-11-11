/**
 * Збережені позиції прокрутки записів історії браузера, щоб «Назад» / «Вперед» повертали сторінку туди,
 * де її залишили. Основне сховище — памʼять модуля; копія пишеться в sessionStorage, щоб позиції пережили
 * перезавантаження вкладки. Запис у сховище не робиться на кожну подію scroll: він відкладається (одна
 * синхронна серіалізація на PERSIST_DELAY_MS) і примусово виконується, коли сторінку ховають чи вивантажують
 * (`pagehide`, `visibilitychange` → hidden), тож перезавантаження вкладки бачить актуальні позиції. Якщо sessionStorage недоступний (приватний режим, заборона cookies, переповнення),
 * усе продовжує працювати лише з памʼяттю.
 */

/** Ключ у sessionStorage, під яким лежить обʼєкт «запис історії → scrollY». */
const STORAGE_KEY = 'bh-scroll-positions';

/** Скільки записів зберігати; найстаріші відкидаються, щоб сховище не росло безмежно за довгу сесію. */
const MAX_ENTRIES = 50;

/** Затримка відкладеного запису в sessionStorage, мс: прибирає синхронний JSON + setItem з кожного кадру прокрутки. */
const PERSIST_DELAY_MS = 200;

/** Позиції в памʼяті: ключ запису історії → scrollY у пікселях; порядок вставки = від найстаріших. */
let positions: Map<string, number> | null = null;

/**
 * Читає збережені позиції з sessionStorage; некоректні дані чи недоступне сховище дають порожній набір.
 * @returns позиції з попереднього завантаження вкладки
 */
function loadFromSession(): Map<string, number> {
  // Результат: лише записи з числовими скінченними значеннями
  const result = new Map<string, number>();
  try {
    // Сирий JSON зі сховища або null, якщо ще нічого не зберігали
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return result;
    // Розібраний JSON; форму перевіряємо нижче, бо дані могли змінити поза застосунком
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return result;
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'number' && Number.isFinite(value) && value >= 0) result.set(key, value);
    }
  } catch {
    // sessionStorage недоступний або JSON зіпсований — працюємо з памʼяттю
  }
  return result;
}

/**
 * Повертає позиції з памʼяті, при першому зверненні підтягує їх із sessionStorage.
 * @returns набір позицій модуля
 */
function getPositions(): Map<string, number> {
  positions ??= loadFromSession();
  return positions;
}

/**
 * Пише поточний набір позицій у sessionStorage; помилки (квота, заборона) ігнорує — памʼять лишається джерелом.
 * @param map - позиції для збереження
 */
function persist(map: Map<string, number>): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(map)));
  } catch {
    // Сховище недоступне — позиції житимуть лише до перезавантаження вкладки
  }
}

/** Таймер запланованого запису в sessionStorage; null — запису в черзі немає. */
let persistTimer: ReturnType<typeof setTimeout> | null = null;

/** Чи вже підписані слухачі `pagehide` / `visibilitychange`, що негайно скидають позиції у сховище. */
let flushListenersAttached = false;

/**
 * Негайно пише в sessionStorage позиції, запис яких ще чекає таймера; без запланованого запису нічого не робить.
 */
export function flushScrollPositions(): void {
  if (persistTimer === null) return;
  clearTimeout(persistTimer);
  persistTimer = null;
  if (positions) persist(positions);
}

/**
 * Скидає позиції у сховище, коли вкладку ховають: після цього сторінку можуть вивантажити без `pagehide`
 * (мобільні браузери), а таймер може вже не спрацювати.
 */
function onVisibilityChange(): void {
  if (document.visibilityState === 'hidden') flushScrollPositions();
}

/**
 * Один раз підписується на події вивантаження сторінки, щоб відкладений запис не загубився при перезавантаженні.
 */
function attachFlushListeners(): void {
  if (flushListenersAttached) return;
  flushListenersAttached = true;
  window.addEventListener('pagehide', flushScrollPositions);
  document.addEventListener('visibilitychange', onVisibilityChange);
}

/**
 * Планує запис позицій у sessionStorage, якщо він ще не запланований: серія подій scroll дає один запис.
 */
function schedulePersist(): void {
  attachFlushListeners();
  if (persistTimer !== null) return;
  persistTimer = setTimeout(flushScrollPositions, PERSIST_DELAY_MS);
}

/**
 * Запамʼятовує позицію прокрутки для запису історії: памʼять оновлюється одразу, sessionStorage — відкладено.
 * @param entryId - ідентифікатор запису історії (див. `scrollEntryId`)
 * @param top - вертикальна прокрутка вікна в пікселях
 */
export function saveScrollPosition(entryId: string, top: number): void {
  // Набір позицій модуля
  const map = getPositions();
  if (map.get(entryId) === top) return;
  // Видаляємо перед вставкою, щоб запис став «найсвіжішим» у порядку Map
  map.delete(entryId);
  map.set(entryId, Math.max(0, top));
  while (map.size > MAX_ENTRIES) {
    // Найстаріший ключ — перший у порядку вставки
    const oldest = map.keys().next().value;
    if (oldest === undefined) break;
    map.delete(oldest);
  }
  // Памʼять уже актуальна; копію в sessionStorage пишемо відкладено, щоб не гальмувати прокрутку
  schedulePersist();
}

/**
 * Повертає збережену позицію запису історії.
 * @param entryId - ідентифікатор запису історії
 * @returns scrollY у пікселях або undefined, якщо для запису нічого не збережено
 */
export function readScrollPosition(entryId: string): number | undefined {
  return getPositions().get(entryId);
}

/**
 * Будує ідентифікатор запису історії для сховища: ключ роутера плюс адреса. Ключ першого запису вкладки
 * завжди `default`, тож адреса не дає змішати позиції різних сторінок, відкритих напряму.
 * @param location - адреса роутера з ключем запису
 * @returns рядок-ключ для сховища позицій
 */
export function scrollEntryId(location: { key: string; pathname: string; hash: string }): string {
  return `${location.key}|${location.pathname}${location.hash}`;
}

/**
 * Скидає всі збережені позиції (памʼять і sessionStorage). Потрібно тестам, щоб кожен починав з чистого стану.
 */
export function clearScrollPositions(): void {
  if (persistTimer !== null) clearTimeout(persistTimer);
  persistTimer = null;
  positions = null;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Сховище недоступне — у ньому й нема чого чистити
  }
}
