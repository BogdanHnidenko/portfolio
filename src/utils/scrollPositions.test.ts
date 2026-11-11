import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearScrollPositions,
  flushScrollPositions,
  readScrollPosition,
  saveScrollPosition,
  scrollEntryId,
} from './scrollPositions';

/** Ключ sessionStorage, який використовує модуль. */
const STORAGE_KEY = 'bh-scroll-positions';

/**
 * Завантажує модуль заново з порожньою памʼяттю — як після перезавантаження вкладки.
 * @returns свіжий екземпляр модуля
 */
async function reloadModule() {
  vi.resetModules();
  return import('./scrollPositions');
}

/**
 * Читає обʼєкт позицій, записаний модулем у sessionStorage.
 * @returns розібраний JSON або null, якщо запису ще немає
 */
function storedPositions(): unknown {
  // Сирий рядок зі сховища
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  return raw === null ? null : JSON.parse(raw);
}

afterEach(() => {
  clearScrollPositions();
  vi.useRealTimers();
  vi.restoreAllMocks();
  window.sessionStorage.clear();
});

describe('scrollPositions', () => {
  it('зберігає і повертає позицію запису; невідомий запис дає undefined', () => {
    saveScrollPosition('a|/', 320);
    expect(readScrollPosition('a|/')).toBe(320);
    expect(readScrollPosition('b|/work')).toBeUndefined();
  });

  it('пише позиції в sessionStorage, і вони переживають перезавантаження вкладки', async () => {
    saveScrollPosition('k1|/about', 900);
    flushScrollPositions();
    expect(storedPositions()).toEqual({ 'k1|/about': 900 });
    // Модуль після «перезавантаження»: памʼять порожня, дані беруться зі сховища
    const fresh = await reloadModule();
    expect(fresh.readScrollPosition('k1|/about')).toBe(900);
  });

  it('серію прокруток пише в сховище одним відкладеним записом, памʼять оновлює одразу', () => {
    vi.useFakeTimers();
    // Шпигун за записами в sessionStorage
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    for (let top = 0; top < 30; top += 1) saveScrollPosition('s|/', top * 10);
    expect(readScrollPosition('s|/')).toBe(290);
    expect(setItem).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(storedPositions()).toEqual({ 's|/': 290 });
  });

  it('при pagehide і приховуванні вкладки одразу скидає відкладені позиції у сховище', () => {
    vi.useFakeTimers();
    saveScrollPosition('p|/work', 120);
    expect(storedPositions()).toBeNull();
    window.dispatchEvent(new Event('pagehide'));
    expect(storedPositions()).toEqual({ 'p|/work': 120 });

    saveScrollPosition('p|/work', 480);
    // Стан видимості вкладки, підмінений на «прихована»
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(storedPositions()).toEqual({ 'p|/work': 480 });
  });

  it('ігнорує зіпсований JSON і некоректні значення в сховищі', async () => {
    window.sessionStorage.setItem(STORAGE_KEY, '{oops');
    // Свіжий екземпляр модуля після кожного «перезавантаження»
    let fresh = await reloadModule();
    expect(fresh.readScrollPosition('x')).toBeUndefined();

    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ok: 10, neg: -5, str: '7', inf: null }));
    fresh = await reloadModule();
    expect(fresh.readScrollPosition('ok')).toBe(10);
    expect(fresh.readScrollPosition('neg')).toBeUndefined();
    expect(fresh.readScrollPosition('str')).toBeUndefined();
    expect(fresh.readScrollPosition('inf')).toBeUndefined();
  });

  it('працює з памʼяттю, якщо sessionStorage кидає помилки', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('denied');
    });
    clearScrollPositions();
    saveScrollPosition('m|/', 42);
    expect(readScrollPosition('m|/')).toBe(42);
    expect(() => clearScrollPositions()).not.toThrow();
  });

  it('тримає не більше 50 записів, відкидаючи найстаріші', () => {
    for (let i = 0; i < 55; i += 1) saveScrollPosition(`k${i}`, i);
    expect(readScrollPosition('k0')).toBeUndefined();
    expect(readScrollPosition('k4')).toBeUndefined();
    expect(readScrollPosition('k5')).toBe(5);
    expect(readScrollPosition('k54')).toBe(54);
  });

  it('від’ємна позиція зберігається як 0', () => {
    saveScrollPosition('n|/', -12);
    expect(readScrollPosition('n|/')).toBe(0);
  });

  it('ідентифікатор запису містить ключ роутера, шлях і hash', () => {
    expect(scrollEntryId({ key: 'default', pathname: '/work', hash: '#work-apps' })).toBe('default|/work#work-apps');
  });
});
