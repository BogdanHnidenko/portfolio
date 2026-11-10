import { create } from 'zustand';
import { persist, type PersistStorage, type StorageValue } from 'zustand/middleware';
import type { Lang } from '../i18n/types';

/** Колірна тема сайту. */
export type Theme = 'dark' | 'light';

/** Частина стану, що зберігається між візитами. */
export interface PersistedSettings {
  theme: Theme;
  lang: Lang;
}

/** Глобальний стан налаштувань: тема, мова та дії для їх зміни. */
export interface SettingsState extends PersistedSettings {
  toggleTheme: () => void;
  setLang: (lang: Lang) => void;
}

/** Ключ у localStorage; той самий читає inline-скрипт в index.html до рендеру React. */
export const SETTINGS_STORAGE_KEY = 'portfolio-settings';

/** Версія формату збереженого стану (zustand persist порівнює її при гідратації). */
const STORE_VERSION = 0;

/**
 * Перевіряє, що значення — допустима тема.
 * @param value - будь-яке значення зі сховища
 * @returns true, якщо це `dark` або `light`
 */
export function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light';
}

/**
 * Перевіряє, що значення — допустима мова.
 * @param value - будь-яке значення зі сховища
 * @returns true, якщо це `en` або `ua`
 */
export function isLang(value: unknown): value is Lang {
  return value === 'en' || value === 'ua';
}

/**
 * Визначає тему для першого візиту за системним налаштуванням `prefers-color-scheme`.
 * @returns `light`, якщо система просить світлу тему; інакше (і коли matchMedia недоступний) — `dark`
 */
export function detectSystemTheme(): Theme {
  try {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'dark';
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

/**
 * Визначає мову для першого візиту за мовами браузера.
 * @returns `ua`, якщо будь-яка мова з `navigator.languages` (або `navigator.language`) починається з `uk`; інакше `en`
 */
export function detectBrowserLang(): Lang {
  if (typeof navigator === 'undefined') return 'en';
  // Мови браузера в порядку пріоритету; `languages` буває порожнім у деяких середовищах
  const candidates: readonly string[] =
    navigator.languages && navigator.languages.length > 0 ? navigator.languages : [navigator.language ?? ''];
  return candidates.some((code) => String(code ?? '').toLowerCase().startsWith('uk')) ? 'ua' : 'en';
}

/**
 * Безпечно повертає localStorage: у приватному режимі чи з вимкненими cookies доступ до нього кидає виняток.
 * @returns сховище або null, якщо воно недоступне
 */
function getLocalStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Сховище для zustand persist, стійке до пошкоджених даних і недоступного localStorage.
 * Повертає лише валідні поля; усе інше ігнорується, тож застосунок бере початкові значення без помилок у консолі.
 */
export const safeSettingsStorage: PersistStorage<Partial<PersistedSettings>> = {
  /**
   * Читає й валідує збережений стан.
   * @param name - ключ у localStorage
   * @returns валідні поля з поточною версією або null, якщо даних немає чи вони пошкоджені
   */
  getItem(name) {
    try {
      // Сирий рядок зі сховища або null, якщо нічого не збережено
      const raw = getLocalStorage()?.getItem(name);
      if (!raw) return null;
      // Розпарсений JSON; тип невідомий, бо дані могли змінити вручну
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      // Вкладений об'єкт state у форматі zustand persist
      const state = (parsed as { state?: unknown }).state;
      if (!state || typeof state !== 'object') return null;
      // Тільки ті поля, що пройшли перевірку
      const valid: Partial<PersistedSettings> = {};
      // Збережена тема до перевірки
      const theme = (state as { theme?: unknown }).theme;
      // Збережена мова до перевірки
      const lang = (state as { lang?: unknown }).lang;
      if (isTheme(theme)) valid.theme = theme;
      if (isLang(lang)) valid.lang = lang;
      // Версію завжди ставимо поточну: інакше persist без migrate пише помилку в консоль
      const value: StorageValue<Partial<PersistedSettings>> = { state: valid, version: STORE_VERSION };
      return value;
    } catch {
      return null;
    }
  },
  /**
   * Зберігає стан; помилки сховища (переповнення, заборона) тихо ігноруються.
   * @param name - ключ у localStorage
   * @param value - стан у форматі zustand persist
   */
  setItem(name, value) {
    try {
      getLocalStorage()?.setItem(name, JSON.stringify(value));
    } catch {
      // Сховище переповнене або заборонене — вибір просто не зберігається, сайт працює далі
    }
  },
  /**
   * Видаляє збережений стан, якщо сховище доступне.
   * @param name - ключ у localStorage
   */
  removeItem(name) {
    try {
      getLocalStorage()?.removeItem(name);
    } catch {
      // Сховище недоступне — нічого видаляти
    }
  },
};

/**
 * Створює стор налаштувань із початковими значеннями від системи та збереженням у localStorage.
 * Окрема фабрика потрібна тестам, щоб перевіряти перший візит із різним оточенням.
 * @returns хук zustand зі станом теми й мови
 */
export function createSettingsStore() {
  return create<SettingsState>()(
    persist(
      (set) => ({
        theme: detectSystemTheme(),
        lang: detectBrowserLang(),
        toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
        setLang: (lang) => {
          if (isLang(lang)) set({ lang });
        },
      }),
      {
        name: SETTINGS_STORAGE_KEY,
        version: STORE_VERSION,
        storage: safeSettingsStorage,
        partialize: (state) => ({ theme: state.theme, lang: state.lang }),
      },
    ),
  );
}

/** Єдиний стор налаштувань застосунку (тема й мова). */
export const useSettings = createSettingsStore();
