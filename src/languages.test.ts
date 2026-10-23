import { describe, expect, it } from 'vitest';
import { parseLanguages, serializeLanguages } from './languages';

describe('language field compatibility', () => {
  it('reads legacy separators, native levels and Cyrillic CEFR letters', () => {
    const rows = parseLanguages('Русский - родной\r\nАнглийский — В2\nФранцузский: с1');
    expect(rows.map(({ language, level }) => ({ language, level }))).toEqual([
      { language: 'Русский', level: 'родной' },
      { language: 'Английский', level: 'B2' },
      { language: 'Французский', level: 'C1' },
    ]);
  });
  it('preserves freeform text and untouched rows exactly', () => {
    const old = 'Татарский — свободно\nНемецкий (читаю со словарём)\nРусский - родной';
    const rows = parseLanguages(old);
    expect(serializeLanguages(rows)).toBe(old);
    rows[2] = { language: 'Русский', level: 'C2' };
    expect(serializeLanguages(rows)).toBe('Татарский — свободно\nНемецкий (читаю со словарём)\nРусский — C2');
  });
  it('omits unfinished rows and does not invent a level', () => {
    expect(serializeLanguages([
      { language: '', level: 'родной' },
      { language: 'Английский', level: '' },
      { language: 'Русский', level: 'родной' },
    ])).toBe('Английский\nРусский — родной');
  });
});
