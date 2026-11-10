import { describe, expect, it } from 'vitest';
import { externalLinkProps, isExternalHref, isRenderableHref } from './links';

describe('links', () => {
  it('зовнішні https-посилання відкриваються в новій вкладці з noopener', () => {
    expect(isExternalHref('https://github.com/BogdanHnidenko')).toBe(true);
    expect(externalLinkProps('https://t.me/x')).toEqual({ target: '_blank', rel: 'noopener noreferrer' });
  });

  it('якорі та mailto відкриваються в тій самій вкладці', () => {
    expect(externalLinkProps('#work')).toEqual({});
    expect(externalLinkProps('mailto:a@b.c')).toEqual({});
  });

  it('не рендерить порожні та небезпечні посилання', () => {
    expect(isRenderableHref('')).toBe(false);
    expect(isRenderableHref('   ')).toBe(false);
    expect(isRenderableHref(undefined)).toBe(false);
    expect(isRenderableHref('javascript:alert(1)')).toBe(false);
    expect(isRenderableHref('//evil.example')).toBe(false);
    expect(isRenderableHref('http://insecure.example')).toBe(false);
  });

  it('рендерить https, mailto, якорі та шляхи від кореня', () => {
    expect(isRenderableHref('https://github.com/BogdanHnidenko')).toBe(true);
    expect(isRenderableHref('mailto:a@b.c')).toBe(true);
    expect(isRenderableHref('#work')).toBe(true);
    expect(isRenderableHref('/cv.pdf')).toBe(true);
  });
});
