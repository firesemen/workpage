import { describe, expect, it } from 'vitest';
import { SKILLS, addSkills, parseSkills, searchSkills, skillKey, suggestSkills } from './skills';

describe('skill selection and suggestions', () => {
  it('reads old lists without discarding custom names or C++/C# punctuation', () => {
    expect(parseSkills('Python, C++, C#; Мой инструмент\r\nПроектирование БД,')).toEqual([
      'Python', 'C++', 'C#', 'Мой инструмент', 'Проектирование БД',
    ]);
  });
  it('deduplicates case and aliases while preserving existing lines', () => {
    const old = 'python, Golang\nМой инструмент';
    expect(addSkills(old, 'Python, Go, golang')).toBe(old);
    expect(addSkills(old, 'TS, TypeScript, Новый инструмент')).toBe(old + ', TypeScript, Новый инструмент');
  });
  it('searches aliases and categories, excluding selected names', () => {
    expect(searchSkills('golang', '').map(s => s.name)).toEqual(['Go']);
    expect(searchSkills('golang', 'Go')).toEqual([]);
    expect(searchSkills('тестирование', '').some(s => s.name === 'Pytest')).toBe(true);
  });
  it('uses exact skill associations and ranks corroborated suggestions first', () => {
    expect(suggestSkills('Неизвестный инструмент')).toEqual([]);
    expect(suggestSkills('C').some(s => s.name === '.NET')).toBe(false);
    const suggestions = suggestSkills('Python, Django, postgres');
    expect(suggestions[0]).toEqual({ name: 'Pytest', basedOn: ['Python', 'Django'] });
    expect(suggestions.some(s => ['Python', 'Django', 'PostgreSQL'].includes(s.name))).toBe(false);
    expect(suggestions.every(s => s.basedOn.length > 0)).toBe(true);
  });
  it('supports design stacks and keeps all suggested names selectable', () => {
    expect(suggestSkills('Figma').some(s => s.name === 'Прототипирование')).toBe(true);
    expect(suggestSkills('Git, Git, гит').every(s => s.basedOn.length === 1)).toBe(true);
    const catalog = new Set(SKILLS.map(s => skillKey(s.name)));
    for (const skill of SKILLS) for (const name of skill.related) expect(catalog.has(skillKey(name))).toBe(true);
  });
});
