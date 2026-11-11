/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { dictionaries, type Lang } from '../../i18n';
import { useSettings } from '../../store/settings';
import { AiFlow } from './AiFlow';

// Сирий текст стилів схеми: jsdom не обчислює розкладку й container queries, тому перевіряємо правила у файлі
const flowScss = readFileSync(resolve(process.cwd(), 'src/components/AiFlow/AiFlow.module.scss'), 'utf8');

/**
 * Витягує тіло правила верхнього рівня за точним селектором (без вкладених @-блоків).
 * @param selector - селектор на початку рядка, напр. `.node`
 * @returns текст між фігурними дужками правила або порожній рядок, якщо правила немає
 */
function topLevelRule(selector: string): string {
  // Позиція відкривальної дужки правила
  const start = flowScss.indexOf(`\n${selector} {`);
  if (start === -1) return '';
  // Кінець правила: перша закривальна дужка на початку рядка
  const end = flowScss.indexOf('\n}', start);
  return flowScss.slice(start, end);
}

beforeEach(() => {
  act(() => {
    useSettings.setState({ theme: 'dark', lang: 'en' });
  });
});

describe('AiFlow', () => {
  it.each<Lang>(['en', 'ua'])('рендерить 5 кроків у порядку Plan → Build → Review → Test → Verify (%s)', (lang) => {
    act(() => {
      useSettings.setState({ lang });
    });
    render(<AiFlow />);
    // Тексти мови, з якою рендеримо схему
    const t = dictionaries[lang];
    // Кроки всередині контейнера кроків, у порядку DOM
    const steps = within(screen.getByTestId('ai-flow-steps')).getAllByTestId('ai-flow-step');
    expect(steps).toHaveLength(5);
    // Очікувані підписи кроків з номерами
    const labels = [`01 · ${t.stPlan}`, `02 · ${t.stBuild}`, `03 · ${t.stReview}`, `04 · ${t.stTest}`, `05 · ${t.stShip}`];
    labels.forEach((label, i) => {
      expect(steps[i]).toHaveTextContent(label);
    });
    expect(steps[1]).toHaveTextContent(t.nBack);
    expect(steps[1]).toHaveTextContent(t.nFront);
    expect(steps[1]).toHaveTextContent(t.nMobile);
    expect(steps[4]).toHaveTextContent(t.nDone);
  });
});

describe('стилі AiFlow', () => {
  it('кроки не мають фіксованої ширини в px, лише гнучку базу й мінімум', () => {
    for (const selector of ['.node', '.node.done', '.grp']) {
      // Тіло правила кроку верхнього рівня
      const rule = topLevelRule(selector);
      expect(rule, selector).not.toBe('');
      expect(rule, selector).not.toMatch(/(^|[\s;])width:\s*\d+px/m);
      expect(rule, selector).toMatch(/min-width:/);
    }
    expect(flowScss).not.toMatch(/(^|[\s;{])width:\s*1[4-9]\dpx/m);
  });

  it('вертикальний режим вмикається container query на схемі, а не лише на телефоні', () => {
    expect(flowScss).toMatch(/container:\s*aiflow\s*\/\s*inline-size/);
    expect(flowScss).toMatch(/@container aiflow \(width < #\{\$flow-min\}\)\s*\{[\s\S]*flex-direction:\s*column/);
  });
});
