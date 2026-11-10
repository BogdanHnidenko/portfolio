import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SETTINGS_STORAGE_KEY, createSettingsStore, detectBrowserLang, detectSystemTheme } from './settings';

/**
 * Підміняє `window.matchMedia`, імітуючи системну тему.
 * @param prefersLight - чи система просить світлу тему
 */
function mockColorScheme(prefersLight: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: prefersLight && query === '(prefers-color-scheme: light)',
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

/**
 * Підміняє мови браузера.
 * @param languages - список `navigator.languages`
 * @param language - значення `navigator.language`
 */
function mockLanguages(languages: string[], language = languages[0] ?? ''): void {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(languages);
  vi.spyOn(navigator, 'language', 'get').mockReturnValue(language);
}

/**
 * Читає збережений стан напряму з localStorage.
 * @returns розпарсений JSON або null
 */
function readStored(): unknown {
  // Сирий рядок зі сховища
  const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

// Шпигун console.error: сайт не має писати помилок у жодному сценарії
let errorSpy: ReturnType<typeof vi.spyOn>;
// Шпигун console.warn: попереджень теж не має бути
let warnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  window.localStorage.clear();
  mockColorScheme(false);
  mockLanguages(['en-US', 'en']);
  errorSpy = vi.spyOn(console, 'error');
  warnSpy = vi.spyOn(console, 'warn');
});

afterEach(() => {
  expect(errorSpy).not.toHaveBeenCalled();
  expect(warnSpy).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe('початкові значення при першому візиті', () => {
  it('dark + en, коли система темна й мова англійська', () => {
    // Свіжий стор без збережених даних
    const store = createSettingsStore();
    expect(store.getState().theme).toBe('dark');
    expect(store.getState().lang).toBe('en');
  });

  it('light, коли prefers-color-scheme: light', () => {
    mockColorScheme(true);
    expect(createSettingsStore().getState().theme).toBe('light');
  });

  it('dark, коли matchMedia недоступний', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(detectSystemTheme()).toBe('dark');
    expect(createSettingsStore().getState().theme).toBe('dark');
  });

  it('dark, коли matchMedia кидає виняток', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => {
        throw new Error('not supported');
      }),
    );
    expect(detectSystemTheme()).toBe('dark');
  });

  it('ua, коли будь-яка мова браузера починається з uk', () => {
    mockLanguages(['en-US', 'uk-UA']);
    expect(detectBrowserLang()).toBe('ua');
    expect(createSettingsStore().getState().lang).toBe('ua');
  });

  it('ua за navigator.language, коли navigator.languages порожній', () => {
    mockLanguages([], 'uk');
    expect(detectBrowserLang()).toBe('ua');
  });

  it('en для інших мов (зокрема ru)', () => {
    mockLanguages(['ru-RU', 'de']);
    expect(detectBrowserLang()).toBe('en');
  });

  it('світла система + uk-UA дають light + ua', () => {
    mockColorScheme(true);
    mockLanguages(['uk-UA']);
    // Стор для першого візиту з українською світлою системою
    const store = createSettingsStore();
    expect(store.getState()).toMatchObject({ theme: 'light', lang: 'ua' });
  });
});

describe('дії', () => {
  it('toggleTheme перемикає dark ↔ light', () => {
    // Стор із темною темою
    const store = createSettingsStore();
    store.getState().toggleTheme();
    expect(store.getState().theme).toBe('light');
    store.getState().toggleTheme();
    expect(store.getState().theme).toBe('dark');
  });

  it('швидкі повторні toggleTheme дають передбачуваний результат', () => {
    // Стор із темною темою
    const store = createSettingsStore();
    for (let i = 0; i < 5; i++) store.getState().toggleTheme();
    expect(store.getState().theme).toBe('light');
  });

  it('setLang змінює мову; повторний виклик з тією ж мовою нічого не ламає', () => {
    // Стор з англійською
    const store = createSettingsStore();
    store.getState().setLang('ua');
    expect(store.getState().lang).toBe('ua');
    store.getState().setLang('ua');
    expect(store.getState().lang).toBe('ua');
    store.getState().setLang('en');
    expect(store.getState().lang).toBe('en');
  });

  it('setLang ігнорує недопустиме значення', () => {
    // Стор з англійською
    const store = createSettingsStore();
    // @ts-expect-error — перевіряємо захист від некоректного значення під час виконання
    store.getState().setLang('de');
    expect(store.getState().lang).toBe('en');
  });
});

describe('збереження в localStorage', () => {
  it('зберігає лише theme і lang під ключем portfolio-settings', () => {
    // Стор, зміни якого мають потрапити в сховище
    const store = createSettingsStore();
    store.getState().toggleTheme();
    store.getState().setLang('ua');
    expect(readStored()).toEqual({ state: { theme: 'light', lang: 'ua' }, version: 0 });
  });

  it('збережений вибір має пріоритет над системою', () => {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ state: { theme: 'dark', lang: 'en' }, version: 0 }));
    mockColorScheme(true);
    mockLanguages(['uk-UA']);
    expect(createSettingsStore().getState()).toMatchObject({ theme: 'dark', lang: 'en' });
  });

  it('пошкоджений JSON → початкові значення без помилок', () => {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, '{not json');
    mockColorScheme(true);
    expect(createSettingsStore().getState()).toMatchObject({ theme: 'light', lang: 'en' });
  });

  it('недопустимі значення → початкові значення для цих полів', () => {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ state: { theme: 'blue', lang: 'ua' }, version: 0 }));
    expect(createSettingsStore().getState()).toMatchObject({ theme: 'dark', lang: 'ua' });
  });

  it('неочікувана форма (масив, null, рядок, інша версія) не ламає стор', () => {
    for (const raw of ['[]', 'null', '"text"', '{"state":null}', JSON.stringify({ state: { theme: 'light' }, version: 7 })]) {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, raw);
      // Стор, створений поверх дивних даних
      const store = createSettingsStore();
      expect(['dark', 'light']).toContain(store.getState().theme);
      expect(store.getState().lang).toBe('en');
    }
  });

  it('localStorage кидає виняток → сайт працює, вибір просто не зберігається', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    // Стор без робочого сховища
    const store = createSettingsStore();
    expect(store.getState().theme).toBe('dark');
    store.getState().toggleTheme();
    expect(store.getState().theme).toBe('light');
  });

  it('доступ до window.localStorage кидає виняток → сайт працює', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    // Стор без доступу до сховища
    const store = createSettingsStore();
    store.getState().setLang('ua');
    expect(store.getState().lang).toBe('ua');
  });
});
