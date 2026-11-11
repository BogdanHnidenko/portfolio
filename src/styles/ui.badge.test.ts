/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Сирий текст спільних стилів: jsdom не обчислює CSS-анімації, тому перевіряємо правила у файлі (як у ui.primary.test.ts)
const uiScss = readFileSync(resolve(process.cwd(), 'src/styles/ui.module.scss'), 'utf8');

describe('крапка бейджа .bd', () => {
  it('статична: без анімації blink', () => {
    expect(uiScss).not.toMatch(/@keyframes\s+blink\b/);
    expect(uiScss).not.toMatch(/animation:\s*blink/);
  });
});
