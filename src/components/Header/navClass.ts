import s from './Header.module.scss';

/**
 * Клас пункту навігації: активна сторінка отримує `on`, як у макеті.
 * `aria-current="page"` ставить NavLink усередині RouteNavLink.
 * @param state - стан NavLink від React Router (через RouteNavLink)
 * @returns клас активного пункту або undefined
 */
export function navClass({ isActive }: { isActive: boolean }): string | undefined {
  return isActive ? s.on : undefined;
}
