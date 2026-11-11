import { useEffect } from 'react';
import { htmlLang } from '../i18n';
import { useSettings } from '../store/settings';

/**
 * Синхронізує `<html data-theme>` і `<html lang>` з поточними темою та мовою зі стору.
 * Фон body залежить від `html[data-theme]`, тому тема має стояти саме на `<html>`, а не лише на корені застосунку.
 * Заголовок вкладки ставить кожна сторінка сама (див. `useDocumentTitle`).
 */
export function useDocumentSettings(): void {
  // Активна тема
  const theme = useSettings((state) => state.theme);
  // Активна мова
  const lang = useSettings((state) => state.lang);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('lang', htmlLang[lang]);
  }, [lang]);
}
