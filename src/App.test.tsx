import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { useSettings } from './store/settings';

// Шпигун console.error: React не має писати помилок і попереджень під час рендеру
let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  act(() => {
    useSettings.setState({ theme: 'dark', lang: 'en' });
  });
  errorSpy = vi.spyOn(console, 'error');
});

afterEach(() => {
  expect(errorSpy).not.toHaveBeenCalled();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe('App — структура', () => {
  it('рендерить секції в порядку макета та очікувану кількість елементів', () => {
    render(<App />);
    // Ідентифікатори секцій у порядку появи в DOM
    const order = Array.from(document.querySelectorAll('[data-testid^="section-"], [data-testid="hero"]')).map((el) =>
      el.getAttribute('data-testid'),
    );
    expect(order).toEqual(['hero', 'section-work', 'section-apps', 'section-ai', 'section-stack', 'section-contact']);
    expect(screen.getAllByTestId('hero-bar')).toHaveLength(96);
    expect(screen.getAllByTestId('work-group')).toHaveLength(2);
    expect(screen.getAllByTestId('case-card')).toHaveLength(4);
    expect(screen.getAllByTestId('ai-card')).toHaveLength(3);
    expect(screen.getAllByTestId('job')).toHaveLength(2);
    expect(screen.getAllByTestId('stack-row')).toHaveLength(6);
    expect(screen.getAllByTestId(/^dir-card-/)).toHaveLength(3);
    expect(screen.getAllByTestId('work-group-count').map((el) => el.textContent)).toEqual(['3', '1']);
  });

  it('CV-кнопки ведуть на /cv.pdf з download, а посилання кейсів — лише GitHub', () => {
    render(<App />);
    for (const id of ['cv-header', 'cv-hero', 'cv-contact']) {
      // Кнопка завантаження CV
      const link = screen.getByTestId(id);
      expect(link).toHaveAttribute('href', '/cv.pdf');
      expect(link).toHaveAttribute('download');
    }
    expect(screen.getAllByTestId('case-link').map((el) => el.textContent)).toEqual(['GitHub']);
    // Жодного порожнього href чи href="#work" серед посилань кейсів
    const caseHrefs = screen.getAllByTestId('case-card').flatMap((card) =>
      Array.from(card.querySelectorAll('a')).map((a) => a.getAttribute('href')),
    );
    expect(caseHrefs).toEqual(['https://github.com/BogdanHnidenko']);
  });

  it('контакти ведуть на правильні адреси, зовнішні — у новій вкладці', () => {
    render(<App />);
    expect(screen.getByTestId('contact-email')).toHaveAttribute('href', 'mailto:bodyaghnidenko@gmail.com');
    expect(screen.getByTestId('contact-email')).not.toHaveAttribute('target');
    expect(screen.getByTestId('contact-linkedin')).toHaveAttribute('href', 'https://www.linkedin.com/in/bohdan-hnidenko-dev');
    expect(screen.getByTestId('contact-github')).toHaveAttribute('href', 'https://github.com/BogdanHnidenko');
    expect(screen.getByTestId('contact-telegram')).toHaveAttribute('href', 'https://t.me/Bohdan_Hnidenko');
    for (const link of Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="https://"]'))) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link.getAttribute('rel')).toContain('noopener');
    }
    for (const link of Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="#"], a[href^="mailto:"]'))) {
      expect(link).not.toHaveAttribute('target');
    }
  });

  it('навігація має 5 якорів у десктопній і мобільній версіях', () => {
    render(<App />);
    for (const id of ['work', 'apps', 'ai', 'stack', 'contact']) {
      expect(screen.getByTestId(`nav-link-${id}`)).toHaveAttribute('href', `#${id}`);
      expect(screen.getByTestId(`mnav-link-${id}`)).toHaveAttribute('href', `#${id}`);
      expect(document.getElementById(id)).not.toBeNull();
    }
    expect(screen.getByTestId('logo-link')).toHaveAttribute('href', '#top');
    expect(document.getElementById('top')).toBe(screen.getByTestId('app-root'));
    expect(screen.getByTestId('skip-link')).toHaveAttribute('href', '#work');
    expect(screen.getByTestId('view-work')).toHaveAttribute('href', '#work');
  });
});

describe('App — мова', () => {
  it('перемикання на UA змінює тексти, aria-pressed, html lang і title; EN повертає назад', async () => {
    // Імітація користувача
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByTestId('lang-en')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('lang-ua')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('nav-link-work')).toHaveTextContent('Work');
    expect(screen.getByTestId('hero-name')).toHaveTextContent('Bohdan Hnidenko');

    await user.click(screen.getByTestId('lang-ua'));

    expect(screen.getByTestId('lang-ua')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('lang-en')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('nav-link-work')).toHaveTextContent('Роботи');
    expect(screen.getByTestId('mnav-link-contact')).toHaveTextContent('Контакти');
    expect(screen.getByTestId('theme-toggle')).toHaveAttribute('aria-label', 'Змінити тему');
    expect(screen.getByTestId('hero-name')).toHaveAttribute('aria-label', 'Богдан Гніденко');
    expect(within(screen.getByTestId('cv-hero')).getByText('Завантажити CV')).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('lang', 'uk');
    expect(document.title).toBe('Богдан Гніденко — Full-Stack розробник');

    // Повторний клік на активну мову нічого не ламає
    await user.click(screen.getByTestId('lang-ua'));
    expect(screen.getByTestId('lang-ua')).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByTestId('lang-en'));
    expect(screen.getByTestId('nav-link-work')).toHaveTextContent('Work');
    expect(screen.getByTestId('theme-toggle')).toHaveAttribute('aria-label', 'Toggle color theme');
    expect(document.documentElement).toHaveAttribute('lang', 'en');
    expect(document.title).toBe('Bohdan Hnidenko — Full-Stack Developer');
  });
});

describe('App — тема', () => {
  it('перемикає data-theme на корені й <html> та іконку сонця/місяця', async () => {
    // Імітація користувача
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByTestId('app-root')).toHaveAttribute('data-theme', 'dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(screen.getByTestId('theme-icon-sun')).toBeInTheDocument();
    expect(screen.queryByTestId('theme-icon-moon')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('theme-toggle'));

    expect(screen.getByTestId('app-root')).toHaveAttribute('data-theme', 'light');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(screen.getByTestId('theme-icon-moon')).toBeInTheDocument();
    expect(screen.queryByTestId('theme-icon-sun')).not.toBeInTheDocument();
  });

  it('кнопки — справжні <button>', () => {
    render(<App />);
    for (const id of ['lang-en', 'lang-ua', 'theme-toggle']) {
      expect(screen.getByTestId(id).tagName).toBe('BUTTON');
      expect(screen.getByTestId(id)).toHaveAttribute('type', 'button');
    }
  });
});
