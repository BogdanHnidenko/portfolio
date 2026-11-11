/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Конфігурація Vite і Vitest: фіксований порт 5173 (на нього чекають e2e) та jsdom для юніт-тестів.
// Dev- і preview-сервер слухають усі мережеві інтерфейси (host: true), тож сайт відкривається
// і за localhost, і з інших пристроїв у тій самій мережі (наприклад, з телефона в тій самій Wi-Fi).
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: {
      modules: { classNameStrategy: 'non-scoped' },
    },
  },
});
