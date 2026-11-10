/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Сирий текст стилів: jsdom не обчислює CSS-анімації, а Vite перехоплює `?raw` для CSS-модулів, тому читаємо файл напряму.
// Шлях від кореня проєкту: у jsdom import.meta.url не є file:-URL, а Vitest запускається з кореня
const uiScss = readFileSync(resolve(process.cwd(), 'src/styles/ui.module.scss'), 'utf8');
// Блок правил .primary разом з вкладеним :hover (до наступного правила .btn.sm)
const primaryBlock = uiScss.slice(uiScss.indexOf('.primary {'), uiScss.indexOf('.btn.sm'));

describe('кнопка .primary (CV)', () => {
  it('знаходить блок .primary у стилях', () => {
    expect(primaryBlock.startsWith('.primary {')).toBe(true);
  });

  it('не має псевдоелементів чи анімацій з постійним відблиском', () => {
    expect(uiScss).not.toMatch(/\.primary\s*::?(after|before)/);
    expect(primaryBlock).not.toMatch(/&::?(after|before)/);
    expect(primaryBlock).not.toMatch(/animation/);
  });

  it('не містить keyframes відблиску shine', () => {
    expect(uiScss).not.toMatch(/@keyframes\s+shine\b/);
  });

  it('зберігає оранжевий фон і hover з більшою тінню', () => {
    expect(primaryBlock).toContain('background: var(--accent2)');
    expect(primaryBlock).toMatch(/&:hover\s*\{[^}]*box-shadow/);
  });
});
