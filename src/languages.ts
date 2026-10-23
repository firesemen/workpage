// Approximate order by total speakers (first + second language), not by native
// speakers or demand in job postings. This is a curated list, not a live census.
export const LANGUAGES = [
  'Английский', 'Китайский (мандаринский)', 'Хинди', 'Испанский',
  'Арабский (литературный)', 'Французский', 'Бенгальский', 'Португальский',
  'Русский', 'Индонезийский', 'Урду', 'Немецкий', 'Японский',
  'Нигерийский пиджин', 'Маратхи', 'Вьетнамский', 'Телугу', 'Хауса',
  'Турецкий', 'Панджаби', 'Суахили', 'Тагальский', 'Китайский (кантонский)',
  'Тамильский', 'Китайский (у)', 'Персидский', 'Корейский', 'Тайский',
  'Яванский', 'Итальянский', 'Гуджарати', 'Каннада', 'Бирманский',
  'Польский', 'Узбекский', 'Украинский', 'Азербайджанский', 'Нидерландский', 'Румынский',
  'Казахский', 'Греческий', 'Чешский', 'Шведский',
  'Белорусский', 'Армянский', 'Финский', 'Грузинский', 'Литовский',
  'Латышский', 'Эстонский',
] as const;

export const LANGUAGE_LEVELS = [
  { value: '', label: 'Не указывать' },
  { value: 'родной', label: 'Родной' },
  { value: 'A1', label: 'A1 — начальный' },
  { value: 'A2', label: 'A2 — базовый' },
  { value: 'B1', label: 'B1 — средний' },
  { value: 'B2', label: 'B2 — выше среднего' },
  { value: 'C1', label: 'C1 — продвинутый' },
  { value: 'C2', label: 'C2 — владение в совершенстве' },
] as const;

export type LanguageEntry = {
  language: string;
  level: string;
  // Keep untouched legacy lines verbatim when another row is edited.
  original?: string;
};

function normalizeLevel(level: string): string {
  const value = level.trim();
  if (/^(родной|native)$/i.test(value)) return 'родной';
  const cefr = value.toUpperCase().replace(/[АВС]/g, letter => ({ А: 'A', В: 'B', С: 'C' })[letter]!);
  return /^[ABC][12]$/.test(cefr) ? cefr : value;
}

export function parseLanguages(text: string): LanguageEntry[] {
  return text.split(/\r?\n/).filter(line => line.trim()).map(original => {
    const match = original.trim().match(/^(.*?)(?:\s*[—–:]\s*|\s+-\s*)(.+)$/);
    return match
      ? { language: match[1].trim(), level: normalizeLevel(match[2]), original }
      : { language: original.trim(), level: '', original };
  });
}

export function serializeLanguages(entries: LanguageEntry[]): string {
  return entries.filter(entry => entry.language.trim()).map(entry =>
    entry.original ?? [entry.language.trim(), entry.level.trim()].filter(Boolean).join(' — '),
  ).join('\n');
}
