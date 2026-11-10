import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Прибирає змонтовані компоненти після кожного тесту, щоб тести не впливали один на одного
afterEach(() => {
  cleanup();
});
