import { describe, expect, it } from 'vitest';
import { BAR_COUNT, ORANGE_ZONE, SPECTRUM_BARS, generateBars } from './bars';

describe('generateBars', () => {
  it('повертає 96 стовпчиків за замовчуванням', () => {
    expect(generateBars()).toHaveLength(96);
    expect(SPECTRUM_BARS).toHaveLength(BAR_COUNT);
  });

  it('детермінований: два виклики дають однаковий результат', () => {
    expect(generateBars()).toEqual(generateBars());
  });

  it('позначає оранжевими лише центральні стовпчики з |x| < 0.24', () => {
    // Згенеровані стовпчики
    const bars = generateBars();
    // Половина ширини в індексах для обчислення x
    const half = (bars.length - 1) / 2;
    bars.forEach((bar, i) => {
      // Нормована позиція стовпчика
      const x = (i - half) / half;
      expect(bar.orange).toBe(Math.abs(x) < ORANGE_ZONE);
    });
    // Індекси оранжевих стовпчиків
    const orangeIdx = bars.flatMap((bar, i) => (bar.orange ? [i] : []));
    expect(orangeIdx.length).toBeGreaterThan(0);
    expect(orangeIdx).toContain(47);
    expect(orangeIdx).toContain(48);
    expect(bars[0]?.orange).toBe(false);
    expect(bars[95]?.orange).toBe(false);
  });

  it('висота — відсотки, затримка від\'ємна, тривалість у секундах', () => {
    for (const bar of generateBars()) {
      expect(bar.height).toMatch(/^\d+%$/);
      expect(bar.delay).toMatch(/^-?\d+\.\d{2}s$/);
      expect(bar.duration).toMatch(/^\d+\.\d{2}s$/);
      expect(Number.parseFloat(bar.delay)).toBeLessThanOrEqual(0);
    }
  });

  it('центр вищий за краї (форма дзвона)', () => {
    // Згенеровані стовпчики
    const bars = generateBars();
    // Висота центрального стовпчика у відсотках
    const center = Number.parseInt(bars[48]?.height ?? '0', 10);
    // Висота стовпчика на чверті ширини
    const quarter = Number.parseInt(bars[24]?.height ?? '0', 10);
    expect(center).toBeGreaterThan(quarter);
  });

  it('для некоректної кількості повертає порожній масив', () => {
    expect(generateBars(0)).toEqual([]);
    expect(generateBars(1)).toEqual([]);
    expect(generateBars(2.5)).toEqual([]);
  });
});
