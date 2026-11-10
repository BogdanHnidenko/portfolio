import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSettings } from '../../store/settings';
import { Header } from './Header';

// Шпигун console.error: компоненти не мають писати помилок під час рендеру й взаємодії
let errorSpy: ReturnType<typeof vi.spyOn>;

/**
 * Службовий компонент для тестів: показує поточний шлях роутера.
 */
function PathProbe() {
  // Поточна адреса в MemoryRouter
  const { pathname } = useLocation();
  return <output data-testid="probe-path">{pathname}</output>;
}

/**
 * Рендерить хедер на заданій адресі разом із кнопкою «поза панеллю» і пробою шляху.
 * @param path - початковий шлях
 * @returns результат render з Testing Library
 */
function renderHeaderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Header />
      <button type="button" data-testid="outside">
        outside
      </button>
      <PathProbe />
    </MemoryRouter>,
  );
}

/**
 * Відкриває бургер-меню кліком і перевіряє, що панель показалась.
 * @param user - екземпляр userEvent
 */
async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId('menu-toggle'));
  expect(screen.getByTestId('mobile-menu')).toBeVisible();
}

beforeEach(() => {
  act(() => {
    useSettings.setState({ theme: 'dark', lang: 'en' });
  });
  errorSpy = vi.spyOn(console, 'error');
});

afterEach(() => {
  expect(errorSpy).not.toHaveBeenCalled();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.localStorage.clear();
  document.documentElement.removeAttribute('style');
});

describe('Header — пункт Home', () => {
  it('Home активний лише на /: на /work aria-current має Work', () => {
    renderHeaderAt('/work');
    expect(screen.getByTestId('nav-link-home')).not.toHaveAttribute('aria-current');
    expect(screen.getByTestId('nav-link-home')).not.toHaveClass('on');
    expect(screen.getByTestId('nav-link-work')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('mmenu-link-home')).not.toHaveAttribute('aria-current');
    expect(screen.getByTestId('mmenu-link-work')).toHaveAttribute('aria-current', 'page');
  });

  it('на / активний Home, і в десктопному меню, і в панелі', () => {
    renderHeaderAt('/');
    expect(screen.getByTestId('nav-link-home')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('mmenu-link-home')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('mmenu-link-home')).toHaveClass('on');
  });
});

describe('Header — бургер-меню', () => {
  it('бургер — справжня кнопка з aria-expanded і aria-controls; відкриває й закриває панель', async () => {
    // Імітація користувача
    const user = userEvent.setup();
    renderHeaderAt('/');
    // Кнопка-бургер
    const toggle = screen.getByTestId('menu-toggle');
    // Панель меню
    const panel = screen.getByTestId('mobile-menu');
    expect(toggle.tagName).toBe('BUTTON');
    expect(toggle).toHaveAttribute('type', 'button');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', panel.id);
    expect(toggle).toHaveAttribute('aria-label', 'Open menu');
    expect(screen.getByTestId('menu-icon-open')).toBeInTheDocument();
    expect(panel).not.toBeVisible();

    await openMenu(user);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveAttribute('aria-label', 'Close menu');
    expect(screen.getByTestId('menu-icon-close')).toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByTestId('mmenu-link-home'));

    await user.click(toggle);
    expect(panel).not.toBeVisible();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(toggle);
  });

  it('aria-label бургера перекладається українською', async () => {
    // Імітація користувача
    const user = userEvent.setup();
    act(() => {
      useSettings.setState({ lang: 'ua' });
    });
    renderHeaderAt('/');
    expect(screen.getByTestId('menu-toggle')).toHaveAttribute('aria-label', 'Відкрити меню');
    await openMenu(user);
    expect(screen.getByTestId('menu-toggle')).toHaveAttribute('aria-label', 'Закрити меню');
    expect(screen.getByTestId('mmenu-link-home')).toHaveTextContent('Головна');
  });

  it('панель має 4 пункти в порядку Home · Work · About · Contact з правильними адресами', () => {
    renderHeaderAt('/');
    // Пункти панелі в порядку DOM
    const links = screen.getAllByTestId(/^mmenu-link-/);
    expect(links.map((link) => link.getAttribute('data-testid'))).toEqual([
      'mmenu-link-home',
      'mmenu-link-work',
      'mmenu-link-about',
      'mmenu-link-contact',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/', '/work', '/about', '/contact']);
  });

  it('Esc закриває панель і повертає фокус на бургер', async () => {
    // Імітація користувача
    const user = userEvent.setup();
    renderHeaderAt('/');
    await openMenu(user);
    await user.keyboard('{Escape}');
    expect(screen.getByTestId('mobile-menu')).not.toBeVisible();
    expect(document.activeElement).toBe(screen.getByTestId('menu-toggle'));
  });

  it('клік поза панеллю закриває її, клік усередині — ні', async () => {
    // Імітація користувача
    const user = userEvent.setup();
    renderHeaderAt('/');
    await openMenu(user);
    fireEvent.pointerDown(screen.getByTestId('mobile-menu'));
    expect(screen.getByTestId('mobile-menu')).toBeVisible();
    await user.click(screen.getByTestId('outside'));
    expect(screen.getByTestId('mobile-menu')).not.toBeVisible();
    expect(screen.getByTestId('menu-toggle')).toHaveAttribute('aria-expanded', 'false');
  });

  it('клік на пункт іншої сторінки переходить на неї і закриває панель', async () => {
    // Імітація користувача
    const user = userEvent.setup();
    renderHeaderAt('/');
    await openMenu(user);
    await user.click(screen.getByTestId('mmenu-link-about'));
    expect(screen.getByTestId('probe-path')).toHaveTextContent('/about');
    expect(screen.getByTestId('mobile-menu')).not.toBeVisible();
    expect(screen.getByTestId('mmenu-link-about')).toHaveAttribute('aria-current', 'page');
  });

  it('клік на пункт поточної сторінки закриває панель і повертає фокус на бургер', async () => {
    // Імітація користувача
    const user = userEvent.setup();
    renderHeaderAt('/work');
    await openMenu(user);
    await user.click(screen.getByTestId('mmenu-link-work'));
    expect(screen.getByTestId('probe-path')).toHaveTextContent('/work');
    expect(screen.getByTestId('mobile-menu')).not.toBeVisible();
    expect(document.activeElement).toBe(screen.getByTestId('menu-toggle'));
  });

  it('клік із Ctrl/Cmd (нова вкладка) лишає панель відкритою', async () => {
    /**
     * Скасовує нативний перехід jsdom (він не вміє відкривати вкладки й пише про це в консоль).
     * @param event - клік по посиланню
     */
    const blockNativeNavigation = (event: MouseEvent) => event.preventDefault();
    // Імітація користувача
    const user = userEvent.setup();
    renderHeaderAt('/');
    await openMenu(user);
    document.addEventListener('click', blockNativeNavigation);
    fireEvent.click(screen.getByTestId('mmenu-link-about'), { ctrlKey: true });
    document.removeEventListener('click', blockNativeNavigation);
    expect(screen.getByTestId('probe-path')).toHaveTextContent(/^\/$/);
    expect(screen.getByTestId('mobile-menu')).toBeVisible();
  });

  it('мова в панелі перекладає сайт і не закриває панель', async () => {
    // Імітація користувача
    const user = userEvent.setup();
    renderHeaderAt('/');
    await openMenu(user);
    expect(screen.getByTestId('menu-lang-en')).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByTestId('menu-lang-ua'));
    expect(useSettings.getState().lang).toBe('ua');
    expect(screen.getByTestId('menu-lang-ua')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('menu-lang-en')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('lang-ua')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('mmenu-link-about')).toHaveTextContent('Про мене');
    expect(screen.getByTestId('mobile-menu')).toBeVisible();
  });

  it('тема в панелі перемикає тему і не закриває панель', async () => {
    // Імітація користувача
    const user = userEvent.setup();
    renderHeaderAt('/');
    await openMenu(user);
    expect(screen.getByTestId('menu-theme-icon-sun')).toBeInTheDocument();
    await user.click(screen.getByTestId('menu-theme-toggle'));
    expect(useSettings.getState().theme).toBe('light');
    expect(screen.getByTestId('menu-theme-icon-moon')).toBeInTheDocument();
    expect(screen.getByTestId('menu-theme-toggle')).toHaveAttribute('aria-label', 'Toggle color theme');
    expect(screen.getByTestId('mobile-menu')).toBeVisible();
  });

  it('Tab ходить по колу «бургер → пункти й налаштування панелі → бургер»', async () => {
    // Імітація користувача
    const user = userEvent.setup();
    renderHeaderAt('/');
    await openMenu(user);
    // Бургер
    const toggle = screen.getByTestId('menu-toggle');
    screen.getByTestId('menu-theme-toggle').focus();
    await user.tab();
    expect(document.activeElement).toBe(toggle);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(screen.getByTestId('menu-theme-toggle'));
    toggle.focus();
    await user.tab();
    expect(document.activeElement).toBe(screen.getByTestId('mmenu-link-home'));
  });

  it('поки панель відкрита, сторінка не прокручується; після закриття стилі повертаються', async () => {
    // Імітація користувача
    const user = userEvent.setup();
    renderHeaderAt('/');
    await openMenu(user);
    expect(document.documentElement.style.overflow).toBe('hidden');
    await user.keyboard('{Escape}');
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('коли ширина стає > 900 px і бургер ховається (0×0), панель закривається', async () => {
    // Колбек останнього створеного спостерігача; тест викликає його вручну, як браузер при зміні розміру
    let notify: ResizeObserverCallback | undefined;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        /**
         * Запамʼятовує колбек спостерігача.
         * @param callback - обробник змін розміру
         */
        constructor(callback: ResizeObserverCallback) {
          notify = callback;
        }
        /** Початок спостереження: у тесті нічого не робить. */
        observe() {}
        /** Кінець спостереження: у тесті нічого не робить. */
        disconnect() {}
      },
    );
    // Імітація користувача
    const user = userEvent.setup();
    renderHeaderAt('/');
    await openMenu(user);
    act(() => {
      notify?.([{ contentRect: { width: 44 } } as ResizeObserverEntry], {} as ResizeObserver);
    });
    expect(screen.getByTestId('mobile-menu')).toBeVisible();
    act(() => {
      notify?.([{ contentRect: { width: 0 } } as ResizeObserverEntry], {} as ResizeObserver);
    });
    expect(screen.getByTestId('mobile-menu')).not.toBeVisible();
    expect(document.documentElement.style.overflow).toBe('');
  });
});
