import { useRef } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Footer } from './components/Footer/Footer';
import { Header } from './components/Header/Header';
import { PATHS } from './data/routes';
import { useDocumentSettings } from './hooks/useDocumentSettings';
import { usePageTransition } from './hooks/usePageTransition';
import { useT } from './i18n';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { HomePage } from './pages/HomePage';
import { WorkPage } from './pages/WorkPage';
import { useSettings } from './store/settings';
import s from './App.module.scss';

/**
 * Корінь портфоліо: задає тему (`data-theme`) і контейнер для адаптиву, рендерить skip-link, хедер,
 * поточну сторінку за адресою (/, /work, /about, /contact; невідомі шляхи → /) і футер.
 * Роутер (BrowserRouter) підключається в main.tsx, щоб тести могли рендерити App у MemoryRouter.
 */
export function App() {
  // Активна тема; від неї залежать CSS-токени кольорів
  const theme = useSettings((state) => state.theme);
  // Тексти активної мови
  const t = useT();
  // <main>, на який переходить фокус після зміни сторінки
  const mainRef = useRef<HTMLElement>(null);
  useDocumentSettings();
  usePageTransition(mainRef);

  return (
    <div className={s.root} data-theme={theme} data-testid="app-root">
      <a className={s.skip} href="#main" data-testid="skip-link">
        {t.skip}
      </a>
      <Header />
      <main id="main" ref={mainRef} tabIndex={-1} className={s.main} data-testid="main">
        <Routes>
          <Route path={PATHS.home} element={<HomePage />} />
          <Route path={PATHS.work} element={<WorkPage />} />
          <Route path={PATHS.about} element={<AboutPage />} />
          <Route path={PATHS.contact} element={<ContactPage />} />
          <Route path="*" element={<Navigate to={PATHS.home} replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
