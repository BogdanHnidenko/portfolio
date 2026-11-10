import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { useSettings } from './store/settings';

// Шпигун console.error: React і React Router не мають писати помилок під час рендеру
let errorSpy: ReturnType<typeof vi.spyOn>;
// Шпигун console.warn: попередження React Router (future flags тощо) теж заборонені
let warnSpy: ReturnType<typeof vi.spyOn>;

/**
 * Службовий компонент для тестів: показує поточний шлях і дає кнопки «Назад» / «Вперед», як у браузері.
 */
function RouterProbe() {
  // Поточна адреса в MemoryRouter
  const location = useLocation();
  // Навігація по історії
  const navigate = useNavigate();
  return (
    <div>
      <output data-testid="probe-path">{location.pathname}</output>
      <button type="button" data-testid="probe-back" onClick={() => navigate(-1)}>
        back
      </button>
      <button type="button" data-testid="probe-forward" onClick={() => navigate(1)}>
        forward
      </button>
    </div>
  );
}

/**
 * Рендерить застосунок на заданій адресі в памʼяті (замість BrowserRouter з main.tsx).
 * @param path - початковий шлях
 * @returns результат render з Testing Library
 */
function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <RouterProbe />
    </MemoryRouter>,
  );
}

/** Сторінки сайту: шлях і data-testid кореневого елемента. */
const PAGES = [
  { path: '/', testId: 'page-home' },
  { path: '/work', testId: 'page-work' },
  { path: '/about', testId: 'page-about' },
  { path: '/contact', testId: 'page-contact' },
] as const;

beforeEach(() => {
  act(() => {
    useSettings.setState({ theme: 'dark', lang: 'en' });
  });
  errorSpy = vi.spyOn(console, 'error');
  warnSpy = vi.spyOn(console, 'warn');
});

afterEach(() => {
  expect(errorSpy).not.toHaveBeenCalled();
  expect(warnSpy).not.toHaveBeenCalled();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe('App — маршрутизація', () => {
  it.each(PAGES)('шлях $path рендерить лише свою сторінку, хедер і футер', ({ path, testId }) => {
    renderAt(path);
    expect(screen.getByTestId(testId)).toBeInTheDocument();
    for (const other of PAGES.filter((page) => page.testId !== testId)) {
      expect(screen.queryByTestId(other.testId)).not.toBeInTheDocument();
    }
    expect(screen.getByTestId('site-header')).toBeInTheDocument();
    expect(screen.getByTestId('site-footer')).toBeInTheDocument();
    expect(screen.getByTestId('main')).toHaveAttribute('id', 'main');
  });

  it('невідомий шлях веде на Home з заміною в історії', () => {
    renderAt('/foo');
    expect(screen.getByTestId('page-home')).toBeInTheDocument();
    expect(screen.getByTestId('probe-path')).toHaveTextContent(/^\/$/);
  });

  it('шлях з кінцевою слешою відкриває ту саму сторінку', () => {
    renderAt('/work/');
    expect(screen.getByTestId('page-work')).toBeInTheDocument();
  });

  it('активний пункт меню має клас on і aria-current="page"; Home активний лише на /', () => {
    renderAt('/');
    for (const prefix of ['nav-link', 'mmenu-link']) {
      expect(screen.getByTestId(`${prefix}-home`)).toHaveAttribute('aria-current', 'page');
      expect(screen.getByTestId(`${prefix}-home`)).toHaveClass('on');
      for (const id of ['work', 'about', 'contact']) {
        expect(screen.getByTestId(`${prefix}-${id}`)).not.toHaveAttribute('aria-current');
      }
    }
    fireEvent.click(screen.getByTestId('nav-link-about'));
    for (const prefix of ['nav-link', 'mmenu-link']) {
      expect(screen.getByTestId(`${prefix}-about`)).toHaveAttribute('aria-current', 'page');
      expect(screen.getByTestId(`${prefix}-about`)).toHaveClass('on');
      expect(screen.getByTestId(`${prefix}-home`)).not.toHaveAttribute('aria-current');
      expect(screen.getByTestId(`${prefix}-home`)).not.toHaveClass('on');
    }
    expect(screen.getByTestId('nav-link-work')).not.toHaveAttribute('aria-current');
    expect(screen.getByTestId('nav-link-work')).not.toHaveClass('on');
  });

  it('пункт Home у меню — перший, з текстом Home і адресою /, як у лого', () => {
    renderAt('/work');
    // Пункти десктопного меню в порядку DOM
    const items = within(screen.getByTestId('nav-desktop')).getAllByRole('link');
    expect(items.map((item) => item.textContent)).toEqual(['Home', 'Work', 'About', 'Contact']);
    expect(screen.getByTestId('nav-link-home')).toHaveAttribute('href', '/');
    fireEvent.click(screen.getByTestId('nav-link-home'));
    expect(screen.getByTestId('page-home')).toBeInTheDocument();
    expect(screen.getByTestId('nav-link-home')).toHaveAttribute('aria-current', 'page');
  });

  it('пункти меню, лого і внутрішні посилання — справжні <a href> на правильні адреси', () => {
    renderAt('/');
    for (const [id, href] of [['home', '/'], ['work', '/work'], ['about', '/about'], ['contact', '/contact']]) {
      expect(screen.getByTestId(`nav-link-${id}`)).toHaveAttribute('href', href);
      expect(screen.getByTestId(`mmenu-link-${id}`)).toHaveAttribute('href', href);
    }
    expect(screen.getByTestId('logo-link')).toHaveAttribute('href', '/');
    expect(screen.getByTestId('skip-link')).toHaveAttribute('href', '#main');
    expect(screen.getByTestId('view-work')).toHaveAttribute('href', '/work');
    for (const tile of screen.getAllByTestId('home-work-tile')) {
      expect(tile.tagName).toBe('A');
      expect(tile).toHaveAttribute('href', '/work');
    }
    expect(screen.getByTestId('home-ai-tile')).toHaveAttribute('href', '/about');
    expect(screen.getByTestId('home-stack-tile')).toHaveAttribute('href', '/about');
    expect(screen.getByTestId('home-link-contacts')).toHaveAttribute('href', '/contact');
  });

  it('після переходу прокручує на початок і ставить фокус на main; «Назад» і «Вперед» працюють', () => {
    renderAt('/');
    // Перший рендер не чіпає ні скрол, ні фокус
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(document.activeElement).not.toBe(screen.getByTestId('main'));

    fireEvent.click(screen.getByTestId('view-work'));
    expect(screen.getByTestId('page-work')).toBeInTheDocument();
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 0, left: 0, behavior: 'instant' });
    expect(document.activeElement).toBe(screen.getByTestId('main'));

    fireEvent.click(screen.getByTestId('band-contacts'));
    expect(screen.getByTestId('page-contact')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('probe-back'));
    expect(screen.getByTestId('page-work')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('probe-back'));
    expect(screen.getByTestId('page-home')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('probe-forward'));
    expect(screen.getByTestId('page-work')).toBeInTheDocument();
    expect(window.scrollTo).toHaveBeenCalledTimes(5);
  });

  it('перехід із бургер-меню закриває панель і ставить фокус на main, а не на бургер', async () => {
    // Імітація користувача
    const user = userEvent.setup();
    renderAt('/');
    await user.click(screen.getByTestId('menu-toggle'));
    expect(screen.getByTestId('mobile-menu')).toBeVisible();
    await user.click(screen.getByTestId('mmenu-link-about'));
    expect(screen.getByTestId('page-about')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-menu')).not.toBeVisible();
    expect(screen.getByTestId('menu-toggle')).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(screen.getByTestId('main'));
  });

  it('редірект з невідомого шляху не забирає фокус і не скролить', () => {
    renderAt('/foo');
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(document.activeElement).not.toBe(screen.getByTestId('main'));
  });

  it('клік із Cmd/Ctrl не змінює поточну сторінку (браузер відкриває нову вкладку)', () => {
    /**
     * Скасовує нативний перехід jsdom (він не вміє відкривати нові вкладки і пише про це в консоль).
     * Слухач на document спрацьовує вже після обробника React Router, тож перевірка роутера не змінюється.
     * @param event - клік по посиланню
     */
    const blockNativeNavigation = (event: MouseEvent) => event.preventDefault();
    document.addEventListener('click', blockNativeNavigation);
    renderAt('/');
    fireEvent.click(screen.getByTestId('nav-link-work'), { metaKey: true });
    fireEvent.click(screen.getByTestId('nav-link-about'), { ctrlKey: true });
    document.removeEventListener('click', blockNativeNavigation);
    expect(screen.getByTestId('page-home')).toBeInTheDocument();
    expect(screen.getByTestId('probe-path')).toHaveTextContent(/^\/$/);
  });
});

describe('App — контент сторінок', () => {
  it('Home: 3 показники, 3 плитки робіт, AI-тизер з 5 кроків, 8 тегів стеку, CTA і 4 рядки контактів', () => {
    renderAt('/');
    expect(screen.getAllByTestId('home-stat')).toHaveLength(3);
    expect(screen.getAllByTestId('home-work-tile')).toHaveLength(3);
    expect(screen.getByTestId('home-ai-tile').querySelectorAll('span[class~="mf"]')).toHaveLength(5);
    expect(screen.getByTestId('home-stack-tile').querySelectorAll('span[class~="tag"]')).toHaveLength(8);
    expect(screen.getByTestId('home-cta')).toBeInTheDocument();
    expect(within(screen.getByTestId('home-links')).getAllByRole('link')).toHaveLength(4);
    expect(screen.getByTestId('hero-name')).toHaveAttribute('aria-label', 'Bohdan Hnidenko');
    expect(screen.getByTestId('hero-status')).toHaveTextContent('Open to remote work · Worldwide');
    expect(screen.getByTestId('photo-badge')).toHaveTextContent('English B1 · Ukrainian native');
    expect(within(screen.getByTestId('home-photo')).getByTestId('photo-placeholder')).toBeInTheDocument();
  });

  it('Work: 3 групи з лічильниками 3 / 2 / 1, 4 кейси, картка застосунків і банер', () => {
    renderAt('/work');
    expect(screen.getAllByTestId('work-group')).toHaveLength(3);
    expect(screen.getAllByTestId('work-group-title').map((el) => el.textContent)).toEqual([
      'SkyService POS',
      'Mobile apps',
      'My projects',
    ]);
    expect(screen.getAllByTestId('work-group-count').map((el) => el.textContent)).toEqual(['3', '2', '1']);
    expect(screen.getAllByTestId('case-card')).toHaveLength(4);
    expect(screen.getByTestId('apps-card')).toBeInTheDocument();
    expect(screen.getByTestId('app-own')).toHaveTextContent('In review');
    expect(screen.getByTestId('app-nda')).toHaveTextContent('NDA');
    expect(screen.getByTestId('apps-stage')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('cta-band')).toBeInTheDocument();
    expect(screen.getByTestId('work-title')).toHaveTextContent('Selected work');
  });

  it('About: анкета з 4 рядків, 2 посади, AI-схема, 3 AI-картки, 6 рядків стеку, банер', () => {
    renderAt('/about');
    expect(screen.getAllByTestId('profile-row')).toHaveLength(4);
    expect(screen.getAllByTestId('job')).toHaveLength(2);
    expect(screen.getByTestId('ai-flow')).toBeInTheDocument();
    expect(screen.getAllByTestId('ai-card')).toHaveLength(3);
    expect(screen.getByTestId('ai-tools')).toHaveTextContent('Claude Code');
    expect(screen.getAllByTestId('stack-row')).toHaveLength(6);
    expect(screen.getByTestId('cta-band')).toBeInTheDocument();
    for (const id of ['section-experience', 'section-ai', 'section-stack']) {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    }
    expect(within(screen.getByTestId('about-photo')).getByTestId('photo-placeholder')).toBeInTheDocument();
    expect(within(screen.getByTestId('about-avatar')).getByTestId('photo-placeholder')).toBeInTheDocument();
  });

  it('Contact: email і 4 картки', () => {
    renderAt('/contact');
    expect(screen.getByTestId('contact-title')).toHaveTextContent('Open to full-time, contract and freelance remote work.');
    expect(screen.getByTestId('contact-email')).toHaveTextContent('bodyaghnidenko@gmail.com');
    for (const id of ['contact-linkedin', 'contact-github', 'contact-telegram', 'cv-contact']) {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    }
  });
});

describe('App — посилання', () => {
  it('усі кнопки CV ведуть на /cv.pdf з download', () => {
    renderAt('/');
    // Кнопки CV у хедері й на Home
    const cvHome = [screen.getByTestId('cv-header'), screen.getByTestId('cv-hero')];
    for (const link of cvHome) {
      expect(link).toHaveAttribute('href', '/cv.pdf');
      expect(link).toHaveAttribute('download');
    }
    fireEvent.click(screen.getByTestId('nav-link-about'));
    expect(screen.getByTestId('band-primary')).toHaveAttribute('href', '/cv.pdf');
    expect(screen.getByTestId('band-primary')).toHaveAttribute('download');
    expect(screen.getByTestId('band-primary')).toHaveTextContent('Download CV');
    fireEvent.click(screen.getByTestId('nav-link-contact'));
    expect(screen.getByTestId('cv-contact')).toHaveAttribute('href', '/cv.pdf');
    expect(screen.getByTestId('cv-contact')).toHaveAttribute('download');
  });

  it('email-кнопки ведуть на mailto у тій самій вкладці', () => {
    renderAt('/');
    expect(screen.getByTestId('home-email')).toHaveAttribute('href', 'mailto:bodyaghnidenko@gmail.com');
    fireEvent.click(screen.getByTestId('nav-link-work'));
    expect(screen.getByTestId('band-primary')).toHaveAttribute('href', 'mailto:bodyaghnidenko@gmail.com');
    expect(screen.getByTestId('band-primary')).not.toHaveAttribute('download');
    fireEvent.click(screen.getByTestId('nav-link-contact'));
    expect(screen.getByTestId('contact-email')).toHaveAttribute('href', 'mailto:bodyaghnidenko@gmail.com');
    expect(screen.getByTestId('contact-email')).not.toHaveAttribute('target');
  });

  it.each(PAGES)('на $path зовнішні посилання відкриваються в новій вкладці, порожніх і #top немає', ({ path }) => {
    renderAt(path);
    for (const link of Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="https://"]'))) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link.getAttribute('rel')).toContain('noopener');
    }
    for (const link of Array.from(document.querySelectorAll<HTMLAnchorElement>('a'))) {
      expect(link.getAttribute('href') ?? '').not.toBe('');
      expect(link.getAttribute('href')).not.toBe('#top');
    }
  });

  it('контакти на Home і Contact ведуть на правильні профілі', () => {
    renderAt('/');
    expect(screen.getByTestId('home-link-linkedin')).toHaveAttribute('href', 'https://www.linkedin.com/in/bohdan-hnidenko-dev');
    expect(screen.getByTestId('home-link-github')).toHaveAttribute('href', 'https://github.com/BogdanHnidenko');
    expect(screen.getByTestId('home-link-telegram')).toHaveAttribute('href', 'https://t.me/Bohdan_Hnidenko');
    fireEvent.click(screen.getByTestId('home-link-contacts'));
    expect(screen.getByTestId('contact-linkedin')).toHaveAttribute('href', 'https://www.linkedin.com/in/bohdan-hnidenko-dev');
    expect(screen.getByTestId('contact-github')).toHaveAttribute('href', 'https://github.com/BogdanHnidenko');
    expect(screen.getByTestId('contact-telegram')).toHaveAttribute('href', 'https://t.me/Bohdan_Hnidenko');
  });

  it('серед посилань кейсів лише GitHub у AI Chat', () => {
    renderAt('/work');
    expect(screen.getAllByTestId('case-link').map((el) => el.textContent)).toEqual(['GitHub']);
    expect(screen.getByTestId('case-link')).toHaveAttribute('href', 'https://github.com/BogdanHnidenko');
  });
});

describe('App — мова', () => {
  it('UA перекладає тексти, aria-pressed, html lang і title поточної сторінки; EN повертає назад', async () => {
    // Імітація користувача
    const user = userEvent.setup();
    renderAt('/about');
    expect(document.title).toBe('About — Bohdan Hnidenko');
    expect(screen.getByTestId('lang-en')).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByTestId('lang-ua'));

    expect(screen.getByTestId('lang-ua')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('lang-en')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('about-title')).toHaveTextContent('Про мене');
    expect(screen.getByTestId('nav-link-work')).toHaveTextContent('Роботи');
    expect(screen.getByTestId('mmenu-link-contact')).toHaveTextContent('Контакти');
    expect(screen.getByTestId('nav-link-home')).toHaveTextContent('Головна');
    expect(screen.getByTestId('theme-toggle')).toHaveAttribute('aria-label', 'Змінити тему');
    expect(screen.getByTestId('band-primary')).toHaveTextContent('Завантажити CV');
    expect(document.documentElement).toHaveAttribute('lang', 'uk');
    expect(document.title).toBe('Про мене — Богдан Гніденко');

    // Мова зберігається при переході на іншу сторінку
    await user.click(screen.getByTestId('nav-link-work'));
    expect(screen.getByTestId('work-title')).toHaveTextContent('Вибрані роботи');
    expect(document.title).toBe('Роботи — Богдан Гніденко');

    await user.click(screen.getByTestId('lang-en'));
    expect(screen.getByTestId('work-title')).toHaveTextContent('Selected work');
    expect(document.documentElement).toHaveAttribute('lang', 'en');
    expect(document.title).toBe('Work — Bohdan Hnidenko');
  });

  it.each([
    { path: '/', en: 'Bohdan Hnidenko — Full-Stack Developer', ua: 'Богдан Гніденко — Full-Stack розробник' },
    { path: '/contact', en: 'Contact — Bohdan Hnidenko', ua: 'Контакти — Богдан Гніденко' },
  ])('title на $path відповідає сторінці й мові', ({ path, en, ua }) => {
    renderAt(path);
    expect(document.title).toBe(en);
    act(() => {
      useSettings.setState({ lang: 'ua' });
    });
    expect(document.title).toBe(ua);
  });
});

describe('App — тема', () => {
  it('перемикає data-theme на корені й <html> та іконку; тема зберігається при переході', async () => {
    // Імітація користувача
    const user = userEvent.setup();
    renderAt('/');
    expect(screen.getByTestId('app-root')).toHaveAttribute('data-theme', 'dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(screen.getByTestId('theme-icon-sun')).toBeInTheDocument();
    expect(screen.queryByTestId('theme-icon-moon')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('theme-toggle'));

    expect(screen.getByTestId('app-root')).toHaveAttribute('data-theme', 'light');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(screen.getByTestId('theme-icon-moon')).toBeInTheDocument();
    expect(screen.queryByTestId('theme-icon-sun')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('nav-link-contact'));
    expect(screen.getByTestId('app-root')).toHaveAttribute('data-theme', 'light');
  });

  it('кнопки мови й теми — справжні <button>', () => {
    renderAt('/');
    for (const id of ['lang-en', 'lang-ua', 'theme-toggle']) {
      expect(screen.getByTestId(id).tagName).toBe('BUTTON');
      expect(screen.getByTestId(id)).toHaveAttribute('type', 'button');
    }
  });
});
