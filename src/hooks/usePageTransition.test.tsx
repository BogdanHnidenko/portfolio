import { act, fireEvent, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { Link, MemoryRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearScrollPositions, saveScrollPosition } from '../utils/scrollPositions';
import { usePageTransition } from './usePageTransition';

/** Тривалість одного кадру в тестах, мс (≈ 60 fps). */
const FRAME_MS = 16;

/** Відступ якоря від верху вікна, як у класі `anchor` (хедер + зазор), px. */
const ANCHOR_MARGIN_PX = 92;

/** Відстань від початку документа до верху тестового якоря, px. */
const ANCHOR_DOC_TOP_PX = 1500;

// Поточна вертикальна прокрутка імітованого вікна
let scrollY = 0;
// Найбільша можлива прокрутка: імітує висоту сторінки (браузер обрізає scrollTo до неї)
let maxScroll = 10_000;

/**
 * Імітує прокрутку вікна користувачем чи браузером: змінює scrollY і надсилає подію scroll.
 * @param top - нова позиція в пікселях
 */
function scrollWindowTo(top: number) {
  scrollY = Math.min(Math.max(0, top), maxScroll);
  window.dispatchEvent(new Event('scroll'));
}

/**
 * Тестова оболонка: `<main>` з хуком і маршрути з посиланнями, якорем і кнопками «Назад» / «Вперед».
 */
function Harness() {
  // <main>, на який хук переводить фокус
  const mainRef = useRef<HTMLElement>(null);
  // Навігація по історії, як кнопки браузера
  const navigate = useNavigate();
  usePageTransition(mainRef);
  return (
    <>
      <button type="button" data-testid="back" onClick={() => navigate(-1)}>
        back
      </button>
      <button type="button" data-testid="forward" onClick={() => navigate(1)}>
        forward
      </button>
      <main ref={mainRef} tabIndex={-1} data-testid="main">
        <Routes>
          <Route
            path="/"
            element={
              <div data-testid="page-a">
                <Link to="/b#target" data-testid="to-anchor">
                  anchor
                </Link>
                <Link to="/b#missing" data-testid="to-missing">
                  missing
                </Link>
                <Link to="/b" data-testid="to-b">
                  b
                </Link>
              </div>
            }
          />
          <Route
            path="/b"
            element={
              <div data-testid="page-b">
                <div id="target" data-testid="target" style={{ scrollMarginTop: `${ANCHOR_MARGIN_PX}px` }} />
                <Link to="/" data-testid="to-a">
                  a
                </Link>
              </div>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

/**
 * Рендерить оболонку на заданій адресі.
 * @param path - початкова адреса
 */
function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Harness />
    </MemoryRouter>,
  );
}

/**
 * Прокручує на задану кількість кадрів уперед (requestAnimationFrame і performance.now підроблені).
 * @param frames - кількість кадрів
 */
function advanceFrames(frames: number) {
  act(() => {
    vi.advanceTimersByTime(frames * FRAME_MS);
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'setTimeout'] });
  scrollY = 0;
  maxScroll = 10_000;
  Object.defineProperty(window, 'scrollY', { configurable: true, get: () => scrollY });
  window.scrollTo = vi.fn((options: ScrollToOptions) => scrollWindowTo(options.top ?? 0)) as unknown as typeof window.scrollTo;
  // Верх якоря у вікні залежить від прокрутки, як у справжньому браузері
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    // Верх елемента відносно вікна
    const top = this.id === 'target' ? ANCHOR_DOC_TOP_PX - scrollY : 0;
    return { top, left: 0, right: 0, bottom: top, width: 0, height: 0, x: 0, y: top, toJSON: () => ({}) } as DOMRect;
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('usePageTransition — перехід за посиланням (PUSH)', () => {
  it('адреса з якорем одразу ставить верх блоку під хедер, без анімації, і фокусує main', () => {
    renderAt('/');
    fireEvent.click(screen.getByTestId('to-anchor'));
    expect(screen.getByTestId('page-b')).toBeInTheDocument();
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: ANCHOR_DOC_TOP_PX - ANCHOR_MARGIN_PX,
      left: 0,
      behavior: 'instant',
    });
    expect(scrollY).toBe(ANCHOR_DOC_TOP_PX - ANCHOR_MARGIN_PX);
    expect(document.activeElement).toBe(screen.getByTestId('main'));
  });

  it('адреса без hash або з неіснуючим якорем відкривається з початку', () => {
    renderAt('/');
    scrollWindowTo(400);
    fireEvent.click(screen.getByTestId('to-missing'));
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 0, left: 0, behavior: 'instant' });
    fireEvent.click(screen.getByTestId('to-a'));
    scrollWindowTo(400);
    fireEvent.click(screen.getByTestId('to-b'));
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 0, left: 0, behavior: 'instant' });
    expect(scrollY).toBe(0);
  });

  it('утримує блок під хедером, якщо вміст вище догрузився і зсунув його', () => {
    renderAt('/');
    fireEvent.click(screen.getByTestId('to-anchor'));
    // Зображення вище якоря догрузилось: блок зсунувся на 200 px нижче
    const shifted = vi.mocked(HTMLElement.prototype.getBoundingClientRect);
    shifted.mockImplementation(function (this: HTMLElement) {
      // Новий верх елемента відносно вікна
      const top = this.id === 'target' ? ANCHOR_DOC_TOP_PX + 200 - scrollY : 0;
      return { top, toJSON: () => ({}) } as DOMRect;
    });
    advanceFrames(2);
    expect(scrollY).toBe(ANCHOR_DOC_TOP_PX + 200 - ANCHOR_MARGIN_PX);
  });
});

describe('usePageTransition — «Назад» / «Вперед» (POP)', () => {
  it('«Назад» повертає попередню сторінку на збережену позицію, «Вперед» — наступну', () => {
    renderAt('/');
    scrollWindowTo(700);
    fireEvent.click(screen.getByTestId('to-b'));
    expect(scrollY).toBe(0);
    scrollWindowTo(250);

    fireEvent.click(screen.getByTestId('back'));
    expect(screen.getByTestId('page-a')).toBeInTheDocument();
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 700, left: 0, behavior: 'instant' });
    expect(scrollY).toBe(700);
    expect(document.activeElement).toBe(screen.getByTestId('main'));

    fireEvent.click(screen.getByTestId('forward'));
    expect(screen.getByTestId('page-b')).toBeInTheDocument();
    expect(scrollY).toBe(250);
  });

  it('без збереженої позиції «Назад» показує якір з адреси, а без якоря — початок', () => {
    renderAt('/b#target');
    fireEvent.click(screen.getByTestId('to-a'));
    expect(scrollY).toBe(0);
    // Позиції втрачено (наприклад, сховище очистили)
    clearScrollPositions();
    fireEvent.click(screen.getByTestId('back'));
    expect(scrollY).toBe(ANCHOR_DOC_TOP_PX - ANCHOR_MARGIN_PX);
    clearScrollPositions();
    fireEvent.click(screen.getByTestId('forward'));
    expect(screen.getByTestId('page-a')).toBeInTheDocument();
    expect(scrollY).toBe(0);
  });

  it('поки сторінка закоротка, повторює спробу на наступних кадрах і доходить до позиції', () => {
    renderAt('/');
    scrollWindowTo(3000);
    fireEvent.click(screen.getByTestId('to-b'));
    // Сторінка ще не догрузилась: прокрутити можна лише до 1000 px
    maxScroll = 1000;
    fireEvent.click(screen.getByTestId('back'));
    expect(scrollY).toBe(1000);
    advanceFrames(3);
    expect(scrollY).toBe(1000);
    maxScroll = 10_000;
    advanceFrames(1);
    expect(scrollY).toBe(3000);
  });

  it('через ~1 с припиняє спроби і лишає сторінку як є', () => {
    renderAt('/');
    scrollWindowTo(3000);
    fireEvent.click(screen.getByTestId('to-b'));
    maxScroll = 1000;
    fireEvent.click(screen.getByTestId('back'));
    advanceFrames(70);
    vi.mocked(window.scrollTo).mockClear();
    maxScroll = 10_000;
    advanceFrames(5);
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(scrollY).toBe(1000);
  });

  it('власна прокрутка користувача зупиняє утримання позиції', () => {
    renderAt('/');
    scrollWindowTo(3000);
    fireEvent.click(screen.getByTestId('to-b'));
    maxScroll = 1000;
    fireEvent.click(screen.getByTestId('back'));
    fireEvent.wheel(window);
    maxScroll = 10_000;
    vi.mocked(window.scrollTo).mockClear();
    advanceFrames(5);
    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});

describe('usePageTransition — перший рендер і редіректи', () => {
  it('прямий захід за адресою з якорем показує блок і не забирає фокус', () => {
    renderAt('/b#target');
    expect(scrollY).toBe(ANCHOR_DOC_TOP_PX - ANCHOR_MARGIN_PX);
    expect(document.activeElement).not.toBe(screen.getByTestId('main'));
  });

  it('прямий захід без якоря не прокручує і не забирає фокус', () => {
    renderAt('/b');
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(document.activeElement).not.toBe(screen.getByTestId('main'));
  });

  it('після перезавантаження вкладки відновлює збережену позицію першого запису', () => {
    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([{ type: 'reload' } as PerformanceNavigationTiming]);
    saveScrollPosition('default|/b', 640);
    renderAt('/b');
    expect(scrollY).toBe(640);
  });

  it('свіжий захід за адресою не бере позицію з іншого відвідування', () => {
    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([{ type: 'navigate' } as PerformanceNavigationTiming]);
    saveScrollPosition('default|/b', 640);
    renderAt('/b');
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it('редірект (REPLACE) не прокручує і не забирає фокус', () => {
    renderAt('/unknown');
    expect(screen.getByTestId('page-a')).toBeInTheDocument();
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(document.activeElement).not.toBe(screen.getByTestId('main'));
  });
});
