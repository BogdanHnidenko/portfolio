import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { dictionaries } from '../../i18n';
import type { CaseItem } from '../../i18n/types';
import { CaseCard } from './CaseCard';

/** Підписи кроків для тестів. */
const LABELS = { problem: 'Problem', solution: 'Solution', result: 'Result' };

/**
 * Створює кейс для тесту з потрібними посиланнями.
 * @param links - посилання кейсу
 * @returns кейс на основі першого кейсу словника
 */
function makeCase(links: CaseItem['links']): CaseItem {
  return { ...dictionaries.en.cases[0], links };
}

describe('CaseCard', () => {
  it('рендерить заголовок, метрику, кроки й теги', () => {
    render(<CaseCard item={dictionaries.en.cases[1]} labels={LABELS} />);
    expect(screen.getByTestId('case-title')).toHaveTextContent('Kitchen Display System');
    expect(screen.getByTestId('case-metric')).toHaveTextContent('100+ orders / day / venue');
    expect(screen.getByText('Problem')).toBeInTheDocument();
    expect(screen.getByText('Solution')).toBeInTheDocument();
    expect(screen.getByText('Result')).toBeInTheDocument();
    expect(screen.getByText('WebSockets')).toBeInTheDocument();
  });

  it('не рендерить блок посилань, якщо всі href порожні', () => {
    // Картка з самими заглушками
    const { container } = render(<CaseCard item={makeCase([{ label: 'Case study', href: '' }])} labels={LABELS} />);
    expect(screen.queryByTestId('case-link')).not.toBeInTheDocument();
    expect(screen.queryByText('Case study')).not.toBeInTheDocument();
    expect(container.querySelectorAll('a')).toHaveLength(0);
  });

  it('у кейсі AI Chat показує лише GitHub і відкриває його в новій вкладці', () => {
    render(<CaseCard item={dictionaries.en.cases[3]} labels={LABELS} />);
    // Усі видимі посилання кейсу
    const links = screen.getAllByTestId('case-link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveTextContent('GitHub');
    expect(links[0]).toHaveAttribute('href', 'https://github.com/BogdanHnidenko');
    expect(links[0]).toHaveAttribute('target', '_blank');
    expect(links[0]?.getAttribute('rel')).toContain('noopener');
    expect(screen.queryByText('Live demo')).not.toBeInTheDocument();
  });

  it('відкидає небезпечні посилання з даних', () => {
    render(
      <CaseCard
        item={makeCase([
          { label: 'Bad', href: 'javascript:alert(1)' },
          { label: 'Anchor', href: '#work' },
        ])}
        labels={LABELS}
      />,
    );
    // Картка з єдиним безпечним посиланням
    const card = screen.getByTestId('case-card');
    expect(within(card).queryByText('Bad')).not.toBeInTheDocument();
    // Якір відкривається в тій самій вкладці
    const anchor = within(card).getByTestId('case-link');
    expect(anchor).toHaveAttribute('href', '#work');
    expect(anchor).not.toHaveAttribute('target');
  });
});
