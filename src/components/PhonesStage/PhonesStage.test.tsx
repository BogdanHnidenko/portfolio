import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSettings } from '../../store/settings';
import { PhonesStage } from './PhonesStage';

beforeEach(() => {
  act(() => {
    useSettings.setState({ theme: 'dark', lang: 'en' });
  });
});

/** Очікувані скриншоти в кожному телефоні: data-testid, файл і alt англійською. */
const EXPECTED = [
  { id: 'app-screen-left', src: '/app/screen-left.webp', alt: 'FieldQuote — estimate screen' },
  { id: 'app-screen-center', src: '/app/screen-center.webp', alt: 'FieldQuote — home screen' },
  { id: 'app-screen-right', src: '/app/screen-right.webp', alt: 'FieldQuote — preview and client signature' },
];

describe('PhonesStage', () => {
  it('показує три скриншоти з правильними src, alt і атрибутами завантаження', () => {
    render(<PhonesStage />);
    expect(screen.getAllByRole('img')).toHaveLength(3);
    for (const { id, src, alt } of EXPECTED) {
      // Скриншот у конкретному телефоні
      const img = screen.getByTestId(id);
      expect(img.tagName).toBe('IMG');
      expect(img).toHaveAttribute('src', src);
      expect(img).toHaveAttribute('alt', alt);
      expect(img).toHaveAttribute('loading', 'lazy');
      expect(img).toHaveAttribute('decoding', 'async');
      expect(img).toHaveAttribute('width', '720');
      expect(img).toHaveAttribute('height', '1566');
      expect(screen.queryByTestId(`${id}-fallback`)).not.toBeInTheDocument();
    }
  });

  it('сцена не прихована від скрінрідерів', () => {
    render(<PhonesStage />);
    expect(screen.getByTestId('apps-stage')).not.toHaveAttribute('aria-hidden');
  });

  it('після onError показує розмиту заглушку лише в тому телефоні, де скриншот не завантажився', () => {
    render(<PhonesStage />);
    fireEvent.error(screen.getByTestId('app-screen-center'));
    expect(screen.queryByTestId('app-screen-center')).not.toBeInTheDocument();
    // Заглушка центрального телефона
    const fallback = screen.getByTestId('app-screen-center-fallback');
    expect(fallback).toHaveAttribute('aria-hidden', 'true');
    expect(fallback.childElementCount).toBeGreaterThan(0);
    expect(screen.getByTestId('app-screen-left')).toBeInTheDocument();
    expect(screen.getByTestId('app-screen-right')).toBeInTheDocument();
    expect(screen.queryByTestId('app-screen-left-fallback')).not.toBeInTheDocument();
  });

  it('alt скриншотів перекладається разом із мовою', () => {
    render(<PhonesStage />);
    act(() => {
      useSettings.setState({ lang: 'ua' });
    });
    expect(screen.getByTestId('app-screen-left')).toHaveAttribute('alt', 'FieldQuote — екран кошторису');
    expect(screen.getByTestId('app-screen-center')).toHaveAttribute('alt', 'FieldQuote — головний екран');
    expect(screen.getByTestId('app-screen-right')).toHaveAttribute('alt', 'FieldQuote — перегляд і підпис клієнта');
  });
});
