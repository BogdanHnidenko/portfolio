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

describe('словник', () => {
  it('en і ua мають однаковий набір ключів і однакову структуру', () => {
    expect(shape(dictionaries.ua)).toEqual(shape(dictionaries.en));
  });

  it('не містить порожніх рядків, крім порожнього meta групи та href-заглушок', () => {
    for (const dict of Object.values(dictionaries)) {
      expect(dict.groupMeta[1]).toBe('');
      expect(dict.groupMeta[0]).not.toBe('');
      expect(dict.skip.length).toBeGreaterThan(0);
      expect(dict.themeLabel.length).toBeGreaterThan(0);
    }
  });

  it('має очікувані обсяги контенту', () => {
    for (const dict of Object.values(dictionaries)) {
      expect(dict.cases).toHaveLength(4);
      expect(dict.aiCards).toHaveLength(3);
      expect(dict.jobs).toHaveLength(2);
      expect(dict.stack).toHaveLength(6);
      expect(dict.dirs).toHaveLength(3);
    }
  });

  it('кейс AI Chat має org «Own project» і єдине непорожнє посилання на GitHub', () => {
    // Кейс AI Chat англійською
    const aiChat = dictionaries.en.cases[3];
    expect(aiChat.title).toBe('AI Chat');
    expect(aiChat.org).toBe('Own project');
    expect(aiChat.links.filter((l) => l.href !== '').map((l) => l.href)).toEqual(['https://github.com/BogdanHnidenko']);
  });

  it('зберігає нерозривні пробіли з макета', () => {
    expect(dictionaries.en.cases[0].metric).toBe('10–20 s → <1 s');
    expect(dictionaries.ua.dirs[0].text).toBe('Хмарний POS для 1 000+ закладів');
  });

  it('має заголовки документа й коди мови html', () => {
    expect(dictionaries.en.docTitle).toBe('Bohdan Hnidenko — Full-Stack Developer');
    expect(dictionaries.ua.docTitle).toBe('Богдан Гніденко — Full-Stack розробник');
    expect(htmlLang).toEqual({ en: 'en', ua: 'uk' });
  });
});
