/** Один стовпчик «спектра» в hero: значення готові для inline-стилів. */
export interface SpectrumBar {
  /** Висота у відсотках від висоти контейнера, напр. `"57%"` */
  height: string;
  /** Від'ємна затримка анімації, щоб стовпчики стартували з різних фаз, напр. `"-1.23s"` */
  delay: string;
  /** Тривалість циклу анімації, напр. `"2.10s"` */
  duration: string;
  /** Центральні стовпчики (|x| < 0.24) мають оранжевий градієнт замість синього */
  orange: boolean;
}

/** Кількість стовпчиків спектра, як у макеті. */
export const BAR_COUNT = 96;

/** Межа |x| (від центру), всередині якої стовпчик оранжевий. */
export const ORANGE_ZONE = 0.24;

/**
 * Генерує стовпчики спектра: висота дзвоном до центру, детермінований шум, підйом по краях.
 * Формула перенесена з `BARS` макета без змін, тому результат однаковий при кожному рендері.
 * @param count - кількість стовпчиків (за замовчуванням 96)
 * @returns масив стовпчиків зліва направо
 */
export function generateBars(count: number = BAR_COUNT): SpectrumBar[] {
  if (!Number.isInteger(count) || count < 2) return [];
  // Половина ширини в індексах, щоб нормувати позицію до -1..1
  const half = (count - 1) / 2;
  return Array.from({ length: count }, (_, i) => {
    // Позиція від -1 (лівий край) до 1 (правий край)
    const x = (i - half) / half;
    // Форма дзвона: високо в центрі, низько по краях
    const bell = Math.exp(-x * x * 3.4);
    // Псевдовипадкове значення 0..1, однакове при кожному виклику
    const noise = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
    // Підйом стовпчиків по краях, як у спектрі
    const edge = Math.pow(Math.abs(x), 6) * 30;
    return {
      height: `${Math.round(12 + bell * 74 + noise * 12 + edge)}%`,
      delay: `${(-noise * 3).toFixed(2)}s`,
      duration: `${(1.5 + (1 - bell) * 1.6 + noise * 0.9).toFixed(2)}s`,
      orange: Math.abs(x) < ORANGE_ZONE,
    };
  });
}

/** Готовий набір стовпчиків для hero (обчислюється один раз при завантаженні модуля). */
export const SPECTRUM_BARS: readonly SpectrumBar[] = generateBars();
