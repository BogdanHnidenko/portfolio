import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSettings } from '../../store/settings';
import { FieldQuoteActions } from './FieldQuoteActions';

beforeEach(() => {
  act(() => {
    useSettings.setState({ theme: 'dark', lang: 'en' });
  });
});

describe('FieldQuoteActions', () => {
  it('посилання на App Store і сайт відкриваються в новій вкладці без window.opener', () => {
    render(<FieldQuoteActions />);
    // Кнопка App Store
    const store = screen.getByTestId('app-store-link');
    expect(store.tagName).toBe('A');
    expect(store).toHaveAttribute('href', 'https://apps.apple.com/us/app/fieldquote-invoices-quotes/id6822302139');
    expect(store).toHaveTextContent('Download on the App Store');
    // Кнопка сайту
    const site = screen.getByTestId('app-site-link');
    expect(site.tagName).toBe('A');
    expect(site).toHaveAttribute('href', 'https://fieldquote.org/');
    expect(site).toHaveTextContent('fieldquote.org');
    for (const link of [store, site]) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it('Google Play — неактивна позначка, а не посилання', () => {
    render(<FieldQuoteActions />);
    // Позначка Google Play
    const soon = screen.getByTestId('google-play-soon');
    expect(soon.tagName).toBe('SPAN');
    expect(soon).not.toHaveAttribute('href');
    expect(soon.closest('a')).toBeNull();
    expect(soon).toHaveTextContent('Google Play — coming soon');
  });

  it('українською показує перекладені тексти', () => {
    act(() => {
      useSettings.setState({ lang: 'ua' });
    });
    render(<FieldQuoteActions />);
    expect(screen.getByTestId('app-store-link')).toHaveTextContent('Завантажити в App Store');
    expect(screen.getByTestId('google-play-soon')).toHaveTextContent('Google Play — незабаром');
  });
});
