/**
 * Склеює CSS-класи, пропускаючи порожні та вимкнені значення.
 * @param classes - імена класів або false/undefined для умовних класів
 * @returns рядок класів через пробіл
 */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
