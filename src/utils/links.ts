import type { AnchorHTMLAttributes } from 'react';

/**
 * Перевіряє, що посилання веде на зовнішній сайт (лише https), а не на якір чи mailto.
 * @param href - адреса посилання
 * @returns true для `https://…`
 */
export function isExternalHref(href: string): boolean {
  return /^https:\/\//i.test(href);
}

/**
 * Атрибути, з якими зовнішні посилання відкриваються в новій вкладці без доступу до `window.opener`.
 * Для якорів і mailto повертає порожній об'єкт — вони відкриваються в тій самій вкладці.
 * @param href - адреса посилання
 * @returns `target` і `rel` для зовнішніх посилань
 */
export function externalLinkProps(href: string): Pick<AnchorHTMLAttributes<HTMLAnchorElement>, 'target' | 'rel'> {
  return isExternalHref(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {};
}

/**
 * Перевіряє, чи можна рендерити посилання з даних: непорожнє і лише безпечні схеми (https, mailto, якір, шлях від кореня).
 * Захищає від `javascript:` та інших схем у даних.
 * @param href - адреса з даних
 * @returns true, якщо посилання можна показати
 */
export function isRenderableHref(href: string | null | undefined): href is string {
  if (typeof href !== 'string') return false;
  // Адреса без пробілів по краях: порожній рядок означає заглушку
  const value = href.trim();
  return value !== '' && /^(https:\/\/|mailto:|#|\/(?!\/))/i.test(value);
}
