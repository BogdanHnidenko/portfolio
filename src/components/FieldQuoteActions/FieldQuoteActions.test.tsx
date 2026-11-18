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
  it('посилання на App Store, Google Play і сайт відкриваються в новій вкладці без window.opener', () => {
    render(<FieldQuoteActions />);
    // Кнопка App Store
    const store = screen.getByTestId('app-store-link');
    expect(store.tagName).toBe('A');
    expect(store).toHaveAttribute('href', 'https://apps.apple.com/us/app/fieldquote-invoices-quotes/id6822302139');
    expect(store).toHaveTextContent('Download on the App Store');
    // Кнопка Google Play
    const play = screen.getByTestId('google-play-link');
    expect(play.tagName).toBe('A');
    expect(play).toHaveAttribute('href', 'https://play.google.com/store/apps/details?id=com.modernapps.devstudio.fieldquote');
    expect(play).toHaveTextContent('Get it on Google Play');
    // Кнопка сайту
    const site = screen.getByTestId('app-site-link');
    expect(site.tagName).toBe('A');
    expect(site).toHaveAttribute('href', 'https://fieldquote.org/');
    expect(site).toHaveTextContent('fieldquote.org');
    for (const link of [store, play, site]) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
    expect(screen.getAllByRole('link')).toHaveLength(3);
  });

  it('кнопки йдуть у порядку App Store → Google Play → сайт, позначки «coming soon» немає', () => {
    render(<FieldQuoteActions />);
    // data-testid усіх посилань рядка дій у порядку DOM
    const order = screen.getAllByRole('link').map((link) => link.getAttribute('data-testid'));
    expect(order).toEqual(['app-store-link', 'google-play-link', 'app-site-link']);
    expect(screen.queryByTestId('google-play-soon')).toBeNull();
    expect(screen.getByTestId('app-actions')).not.toHaveTextContent(/coming soon/i);
  });

  it('українською показує перекладені тексти', () => {
    act(() => {
      useSettings.setState({ lang: 'ua' });
    });
    render(<FieldQuoteActions />);
    expect(screen.getByTestId('app-store-link')).toHaveTextContent('Завантажити в App Store');
    expect(screen.getByTestId('google-play-link')).toHaveTextContent('Завантажити з Google Play');
    expect(screen.getByTestId('app-actions')).not.toHaveTextContent(/незабаром/i);
  });
});
