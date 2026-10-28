import { describe, expect, it } from 'vitest';
import { dateLabel, emptyResume, resumeWarnings, safeLink, sampleResume, validateResume } from './model';

describe('resume backup validation', () => {
  it('loads old backups without group assignments and round-trips manual groups', () => {
    const old = { ...emptyResume(), skills: 'Python, Личный навык' };
    delete old.skillGroups;
    expect(validateResume(old).skillGroups).toEqual({});
    const resume = { ...old, skillGroups: { python: 'Анализ данных', 'личный навык': 'Инструменты' } };
    expect(validateResume(JSON.parse(JSON.stringify(resume)))).toEqual(resume);
  });
  it('rejects malformed group metadata before rendering PDF', () => {
    for (const skillGroups of [null, [], 'group', { python: 4 }, { python: '' }, { python: 'a'.repeat(81) }]) {
      expect(() => validateResume({ ...emptyResume(), skillGroups })).toThrow('группы навыков');
    }
  });
  it('round-trips a complete Russian-language resume without losing content or layout', () => {
    const resume = { ...sampleResume(), hidden: ['projects'], density: 'compact' as const, template: 'classic' as const };
    expect(validateResume(JSON.parse(JSON.stringify(resume)))).toEqual(resume);
  });

  it('accepts an empty editable resume', () => {
    expect(validateResume(emptyResume())).toEqual(emptyResume());
  });

  it.each([null, [], {}, { ...emptyResume(), version: 2 }, { ...emptyResume(), name: 123 }])('rejects malformed or unsupported files: %j', (input) => {
    expect(() => validateResume(input)).toThrow();
  });

  it('rejects corrupt nested records rather than crashing later in the editor', () => {
    expect(() => validateResume({ ...sampleResume(), experience: [{ company: 'Example' }] })).toThrow('опыт');
    expect(() => validateResume({ ...sampleResume(), education: [null] })).toThrow('образование');
    expect(() => validateResume({ ...sampleResume(), hidden: [true] })).toThrow('разделы');
  });

  it('rejects oversized content and untrusted photo formats', () => {
    expect(() => validateResume({ ...emptyResume(), summary: 'a'.repeat(30001) })).toThrow();
    expect(() => validateResume({ ...emptyResume(), experience: Array(101).fill(sampleResume().experience[0]) })).toThrow();
    for (const photo of ['https://example.com/avatar.png', 'data:image/svg+xml;base64,PHN2Zz4=', 'data:text/html;base64,PHNjcmlwdD4=']) {
      expect(() => validateResume({ ...emptyResume(), photo })).toThrow('фото');
    }
  });
});

describe('safe portfolio links', () => {
  it('normalizes a hostname and preserves valid HTTPS paths', () => {
    expect(safeLink(' portfolio.example.com/work ')).toBe('https://portfolio.example.com/work');
    expect(safeLink('https://example.com/a?b=1#work')).toBe('https://example.com/a?b=1#work');
    expect(safeLink('http://example.com')).toBe('http://example.com/');
  });

  it.each(['', 'javascript:alert(1)', 'data:text/html,test', 'ftp://example.com', '//example.com', 'https://user:pass@example.com', 'https://exa mple.com', 'https://example.com\n/evil', 'https:\\example.com'])('rejects unsafe or ambiguous links: %s', (input) => {
    expect(safeLink(input)).toBe('');
  });
});

describe('content readiness feedback', () => {
  it('asks for identity, position and a contact on a new resume', () => {
    expect(resumeWarnings(emptyResume())).toHaveLength(3);
    expect(resumeWarnings(sampleResume())).toEqual([]);
  });

  it('reports reversed employment dates and malformed email', () => {
    const resume = sampleResume();
    resume.email = 'invalid';
    resume.experience[1].end = '2019-01';
    expect(resumeWarnings(resume)).toContain('Проверьте адрес электронной почты.');
    expect(resumeWarnings(resume)).toContain('Дата окончания работы раньше даты начала.');
  });

  it('does not flag a stale end date for a current role', () => {
    const resume = sampleResume();
    resume.experience[0].end = '2001-01';
    expect(resumeWarnings(resume)).toEqual([]);
  });

  it('flags an unusually long summary without dropping its text', () => {
    const resume = { ...sampleResume(), summary: 'Текст '.repeat(150) };
    expect(resumeWarnings(resume)).toContain('Попробуйте сократить раздел «О себе» до 3–5 предложений.');
    expect(validateResume(resume).summary).toBe(resume.summary);
  });
});

describe('Russian employment dates', () => {
  it('formats a month and keeps a year-only education value', () => {
    expect(dateLabel('')).toBe('');
    expect(dateLabel('2020')).toBe('2020');
    expect(dateLabel('2022-09')).toMatch(/сент.*2022/);
  });
});
