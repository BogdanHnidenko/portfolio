import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { RouteLink, RouteNavLink } from './RouteLink';

/**
 * Клікає посилання двічі поспіль в одному act: React не перерендерить між кліками,
 * як у браузері, коли другий клік dblclick приходить раніше за перерендер.
 * @param link - посилання, по якому клікаємо
 */
function doubleClickBeforeRerender(link: HTMLElement): void {
  act(() => {
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
  });
}

describe('RouteLink / RouteNavLink', () => {
  // Повертає jsdom-адресу на початок, щоб тести не впливали один на одного
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('подвійний клік по пункту меню додає в історію лише один запис', () => {
    window.history.replaceState(null, '', '/');
    // Довжина історії до кліків
    const before = window.history.length;
    render(
      <BrowserRouter>
        <RouteNavLink to="/about" data-testid="nav-link-about">
          About
        </RouteNavLink>
      </BrowserRouter>,
    );
    doubleClickBeforeRerender(screen.getByTestId('nav-link-about'));
    expect(window.location.pathname).toBe('/about');
    expect(window.history.length).toBe(before + 1);
    expect(screen.getByTestId('nav-link-about')).toHaveAttribute('aria-current', 'page');
  });

  it('клік по посиланню на поточну адресу не додає запис в історію', () => {
    window.history.replaceState(null, '', '/work');
    // Довжина історії до кліку
    const before = window.history.length;
    render(
      <BrowserRouter>
        <RouteLink to="/work" data-testid="link">
          Work
        </RouteLink>
      </BrowserRouter>,
    );
    doubleClickBeforeRerender(screen.getByTestId('link'));
    expect(window.location.pathname).toBe('/work');
    expect(window.history.length).toBe(before);
  });

  it('Ctrl/Cmd-клік лишається браузеру: роутер не навігує', () => {
    window.history.replaceState(null, '', '/');
    render(
      <BrowserRouter>
        <RouteLink to="/about" data-testid="link">
          About
        </RouteLink>
      </BrowserRouter>,
    );
    // Подія кліку з модифікатором «нова вкладка»
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ctrlKey: true });
    // Чи скасував роутер дію браузера; після перевірки скасовуємо самі, бо jsdom не вміє відкривати вкладки
    let preventedByRouter: boolean | undefined;
    /**
     * Запамʼятовує, чи роутер скасував дію браузера, і блокує навігацію jsdom.
     * @param e - подія кліку, що спливла до window
     */
    const probe = (e: Event) => {
      preventedByRouter = e.defaultPrevented;
      e.preventDefault();
    };
    window.addEventListener('click', probe);
    act(() => {
      screen.getByTestId('link').dispatchEvent(event);
    });
    window.removeEventListener('click', probe);
    expect(preventedByRouter).toBe(false);
    expect(window.location.pathname).toBe('/');
  });
});
