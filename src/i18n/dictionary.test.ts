import { describe, expect, it } from 'vitest';
import { dictionaries, htmlLang } from './index';

/**
 * Будує «форму» значення: ключі об'єктів, довжини масивів і типи листків, без самих текстів.
 * @param value - значення словника
 * @returns структура для порівняння між мовами
 */
function shape(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, shape((value as Record<string, unknown>)[key])]),
    );
  }
  return typeof value;
}

/** Ключі макета, які розмітка не використовує, тож їх не переносимо (розділ «Тексти» специфікації). */
const DROPPED_KEYS = ['featured', 'allWork', 'openCase', 'teaserGo', 'photoBadge', 'photoCap', 'photoCap2'];

/** Ключі попередньої односторінкової версії, які більше не потрібні. */
const LEGACY_KEYS = ['docTitle', 'navApps', 'navAi', 'navStack', 'navExp', 'dirs', 'dirsLabel', 'groupNames', 'groupMeta', 'avatarLabel', 'stackHead', 'navSectionsLabel'];

describe('словник', () => {
  it('en і ua мають однаковий набір ключів і однакову структуру', () => {
    expect(shape(dictionaries.ua)).toEqual(shape(dictionaries.en));
  });

  it('не містить невикористаних ключів макета і ключів старої версії', () => {
    for (const dict of Object.values(dictionaries)) {
      for (const key of [...DROPPED_KEYS, ...LEGACY_KEYS]) {
        expect(dict).not.toHaveProperty(key);
      }
    }
  });

  it('має очікувані обсяги контенту для кожної сторінки', () => {
    for (const dict of Object.values(dictionaries)) {
      expect(dict.istats).toHaveLength(3);
      expect(dict.workTiles).toHaveLength(3);
      expect(dict.miniFlow).toHaveLength(5);
      expect(dict.stackKey).toHaveLength(8);
      expect(dict.cases).toHaveLength(4);
      expect(dict.prof).toHaveLength(4);
      expect(dict.jobs).toHaveLength(2);
      expect(dict.aiCards).toHaveLength(3);
      expect(dict.stack).toHaveLength(6);
    }
  });

  it('кейс AI Chat має єдине непорожнє посилання на GitHub, решта кейсів — лише заглушки', () => {
    for (const dict of Object.values(dictionaries)) {
      // Непорожні адреси всіх кейсів по черзі
      const hrefs = dict.cases.flatMap((item) => item.links.map((link) => link.href).filter((href) => href !== ''));
      expect(hrefs).toEqual(['https://github.com/BogdanHnidenko']);
      expect(dict.cases[3].title).toBe('AI Chat');
    }
  });

  it('зберігає нерозривні пробіли з макета', () => {
    expect(dictionaries.en.cases[0].metric).toBe('10–20 s → <1 s');
    expect(dictionaries.en.istats[0].v).toBe('4 yrs');
    expect(dictionaries.ua.istats[1].v).toBe('1 000+');
    expect(dictionaries.ua.istats[2].v).toBe('~7 днів');
  });

  it('має заголовки вкладок для кожної сторінки й коди мови html', () => {
    expect(dictionaries.en.titles).toEqual({
      home: 'Bohdan Hnidenko — Full-Stack Developer',
      work: 'Work — Bohdan Hnidenko',
      about: 'About — Bohdan Hnidenko',
      contact: 'Contact — Bohdan Hnidenko',
    });
    expect(dictionaries.ua.titles).toEqual({
      home: 'Богдан Гніденко — Full-Stack розробник',
      work: 'Роботи — Богдан Гніденко',
      about: 'Про мене — Богдан Гніденко',
      contact: 'Контакти — Богдан Гніденко',
    });
    expect(htmlLang).toEqual({ en: 'en', ua: 'uk' });
  });
});
