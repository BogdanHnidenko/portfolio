import { AiWorkflow } from './components/AiWorkflow/AiWorkflow';
import { Apps } from './components/Apps/Apps';
import { Contact } from './components/Contact/Contact';
import { Experience } from './components/Experience/Experience';
import { Footer } from './components/Footer/Footer';
import { Header } from './components/Header/Header';
import { Hero } from './components/Hero/Hero';
import { Work } from './components/Work/Work';
import { useDocumentSettings } from './hooks/useDocumentSettings';
import { useT } from './i18n';
import { useSettings } from './store/settings';
import s from './App.module.scss';

/**
 * Корінь односторінкового портфоліо: задає тему (`data-theme`) і контейнер для адаптиву,
 * рендерить skip-link, хедер, усі секції в порядку макета та футер.
 */
export function App() {
  // Активна тема; від неї залежать CSS-токени кольорів
  const theme = useSettings((state) => state.theme);
  // Тексти активної мови
  const t = useT();
  useDocumentSettings();

  return (
    <div className={s.root} data-theme={theme} id="top" data-testid="app-root">
      <a className={s.skip} href="#work" data-testid="skip-link">
        {t.skip}
      </a>
      <Header />
      <main>
        <Hero />
        <Work />
        <Apps />
        <AiWorkflow />
        <Experience />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
