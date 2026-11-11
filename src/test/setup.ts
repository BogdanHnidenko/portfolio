import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { clearScrollPositions } from '../utils/scrollPositions';

// jsdom не реалізує window.scrollTo і пише про це помилку в консоль; застосунок викликає його при зміні сторінки
beforeEach(() => {
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});

// Прибирає змонтовані компоненти і збережені позиції прокрутки після кожного тесту, щоб тести не впливали один на одного
afterEach(() => {
  cleanup();
  clearScrollPositions();
});
