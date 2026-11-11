import { useCallback, useContext, type MouseEvent } from 'react';
import {
  Link,
  NavLink,
  UNSAFE_NavigationContext,
  useHref,
  useNavigate,
  type LinkProps,
  type NavLinkProps,
} from 'react-router-dom';

/** Історія роутера з актуальною адресою (BrowserRouter і MemoryRouter передають саме її як navigator). */
interface HistoryLike {
  location?: { pathname: string; search: string; hash: string };
}

/**
 * Перевіряє, що клік — звичайний лівий без модифікаторів у поточну вкладку, тобто роутер обробить його сам
 * (Ctrl/Cmd/Shift/Alt-клік і середня кнопка лишаються браузеру: нова вкладка чи вікно).
 * @param event - подія кліку по посиланню
 * @returns true, якщо клік веде до клієнтської навігації в поточній вкладці
 */
function isPlainClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  // Атрибут target посилання: інше вікно чи фрейм — справа браузера
  const target = event.currentTarget.getAttribute('target');
  const sameTab = !target || target === '_self'; // посилання відкривається в поточній вкладці
  return sameTab && event.button === 0 && !event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey;
}

/**
 * Обробник кліку, який замінює запис в історії, якщо посилання веде на адресу, де ми вже є.
 * React Router сам ставить `replace` для поточної адреси, але бере її з останнього рендеру:
 * другий клік подвійного кліку приходить раніше за перерендер і додав би ще один запис
 * (тоді один «Назад» лишає на тій самій сторінці). Тут адреса береться з історії в момент кліку.
 * @param to - адреса посилання
 * @param onClick - зовнішній обробник кліку, викликається першим
 * @returns обробник для `onClick` посилання
 */
function useReplaceIfCurrent(
  to: string,
  onClick: LinkProps['onClick'],
): (event: MouseEvent<HTMLAnchorElement>) => void {
  // Повна адреса посилання (з basename), у тому ж форматі, що й адреса з історії
  const href = useHref(to);
  // Історія роутера: її location оновлюється одразу після push, ще до перерендеру
  const { navigator } = useContext(UNSAFE_NavigationContext);
  // Функція програмної навігації роутера
  const navigate = useNavigate();

  return useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      if (event.defaultPrevented || !isPlainClick(event)) return;
      // Актуальна адреса з історії; якщо роутер її не надає — далі працює стандартна логіка Link
      const current = (navigator as HistoryLike).location;
      if (!current) return;
      // Поточна адреса у форматі href для порівняння з адресою посилання
      const currentHref = navigator.createHref(current);
      if (currentHref !== href) return;
      // Скасовуємо обробку Link (вона зробила б push) і лише замінюємо поточний запис
      event.preventDefault();
      navigate(to, { replace: true });
    },
    [onClick, navigator, href, navigate, to],
  );
}

/** Пропси внутрішнього посилання: адреса лише рядком, як у PATHS. */
export type RouteLinkProps = Omit<LinkProps, 'to'> & { to: string };

/**
 * Внутрішнє посилання сайту (`Link`), яке не додає дубль запису в історію при повторному
 * чи подвійному кліку на адресу, де користувач уже перебуває.
 * @param props - пропси `Link`; `to` — адреса сторінки
 */
export function RouteLink({ to, onClick, ...rest }: RouteLinkProps) {
  // Обробник кліку з заміною запису для поточної адреси
  const handleClick = useReplaceIfCurrent(to, onClick);
  return <Link to={to} onClick={handleClick} {...rest} />;
}

/** Пропси пункту навігації: адреса лише рядком, як у PATHS. */
export type RouteNavLinkProps = Omit<NavLinkProps, 'to'> & { to: string };

/**
 * Пункт меню (`NavLink` з `aria-current` і класом активного пункту), який не додає дубль запису
 * в історію при повторному чи подвійному кліку на поточну сторінку.
 * @param props - пропси `NavLink`; `to` — адреса сторінки
 */
export function RouteNavLink({ to, onClick, ...rest }: RouteNavLinkProps) {
  // Обробник кліку з заміною запису для поточної адреси
  const handleClick = useReplaceIfCurrent(to, onClick);
  return <NavLink to={to} onClick={handleClick} {...rest} />;
}
