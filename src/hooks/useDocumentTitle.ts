import { useEffect } from 'react';
import { useT } from '../i18n';
import type { PageId } from '../i18n/types';

/**
 * Ставить `document.title` для сторінки активною мовою; оновлює його при зміні мови.
 * @param page - сторінка, яку зараз показано
 */
export function useDocumentTitle(page: PageId): void {
  // Заголовок вкладки для цієї сторінки й мови
  const title = useT().titles[page];

  useEffect(() => {
    document.title = title;
  }, [title]);
}
