type Skill = { name: string; category: string; aliases: string[]; related: string[] };
const group = (category: string, rows: [string, string[], string[]][]): Skill[] =>
  rows.map(([name, aliases, related]) => ({ name, aliases, related, category }));

// Curated associations suggest topics to consider, never infer proficiency.
export const SKILLS: Skill[] = [
  ...group('Языки программирования', [
    ['JavaScript', ['js', 'javascript es6'], ['TypeScript', 'HTML', 'CSS', 'React', 'Node.js', 'Jest']],
    ['TypeScript', ['ts'], ['JavaScript', 'React', 'Node.js', 'Next.js', 'Jest']],
    ['Python', ['python3', 'python 3', 'питон'], ['Pytest', 'NumPy', 'pandas', 'FastAPI', 'SQL']],
    ['Java', [], ['Spring Boot', 'ООП', 'SQL', 'Unit-тестирование']],
    ['C', ['си'], ['C++', 'Assembler', 'Linux', 'Алгоритмы и структуры данных']],
    ['C++', ['cpp', 'cplusplus'], ['C', 'ООП', 'Алгоритмы и структуры данных', 'Unit-тестирование']],
    ['C#', ['csharp', 'c sharp'], ['.NET', 'ООП', 'SQL', 'Unit-тестирование']],
    ['Go', ['golang'], ['REST API', 'Docker', 'PostgreSQL', 'Linux']],
    ['Rust', [], ['Linux', 'Алгоритмы и структуры данных', 'Unit-тестирование']],
    ['Kotlin', [], ['Java', 'ООП', 'Unit-тестирование']],
    ['Swift', [], ['ООП', 'Unit-тестирование']],
    ['PHP', [], ['MySQL', 'HTML', 'CSS', 'REST API']],
    ['R', [], ['Анализ данных', 'SQL', 'Excel']],
    ['SQL', ['sql-запросы'], ['PostgreSQL', 'MySQL', 'Проектирование БД']],
    ['Assembler', ['assembly', 'ассемблер'], ['C', 'C++', 'Linux']],
  ]),
  ...group('Веб-разработка', [
    ['HTML', ['html5'], ['CSS', 'JavaScript']],
    ['CSS', ['css3'], ['HTML', 'JavaScript', 'UI-дизайн']],
    ['React', ['react.js', 'reactjs'], ['TypeScript', 'Next.js', 'Jest', 'Playwright']],
    ['Vue.js', ['vue', 'vuejs'], ['TypeScript', 'JavaScript', 'CSS', 'Playwright']],
    ['Angular', [], ['TypeScript', 'CSS', 'Unit-тестирование']],
    ['Node.js', ['node', 'nodejs'], ['JavaScript', 'TypeScript', 'REST API', 'PostgreSQL']],
    ['Next.js', ['next', 'nextjs'], ['React', 'TypeScript', 'CSS']],
    ['Django', [], ['Python', 'PostgreSQL', 'REST API', 'Pytest']],
    ['FastAPI', ['fast api'], ['Python', 'REST API', 'Pytest', 'PostgreSQL']],
    ['Flask', [], ['Python', 'REST API', 'Pytest']],
    ['Spring Boot', ['spring'], ['Java', 'SQL', 'REST API']],
    ['.NET', ['dotnet', 'asp.net'], ['C#', 'SQL', 'REST API']],
    ['REST API', ['rest', 'restful api'], ['Postman', 'Тестирование API', 'GraphQL']],
    ['GraphQL', [], ['REST API', 'Node.js', 'TypeScript']],
  ]),
  ...group('Данные и ИИ', [
    ['PostgreSQL', ['postgres'], ['SQL', 'Проектирование БД', 'Docker']],
    ['MySQL', [], ['SQL', 'Проектирование БД']],
    ['SQLite', [], ['SQL', 'Проектирование БД']],
    ['MongoDB', ['mongo'], ['Проектирование БД', 'Node.js']],
    ['Redis', [], ['Docker', 'Linux']],
    ['Проектирование БД', ['проектирование баз данных', 'database design'], ['SQL', 'PostgreSQL']],
    ['pandas', [], ['Python', 'NumPy', 'Анализ данных', 'SQL']],
    ['NumPy', [], ['Python', 'pandas', 'Анализ данных']],
    ['Scikit-learn', ['sklearn', 'scikit learn'], ['Python', 'pandas', 'Машинное обучение']],
    ['PyTorch', [], ['Python', 'NumPy', 'Машинное обучение', 'Дообучение ИИ-моделей']],
    ['TensorFlow', ['tf'], ['Python', 'NumPy', 'Машинное обучение']],
    ['Машинное обучение', ['ml', 'machine learning'], ['Python', 'Scikit-learn', 'PyTorch', 'Анализ данных']],
    ['Анализ данных', ['data analysis'], ['SQL', 'Excel', 'pandas', 'Power BI']],
    ['Prompt engineering', ['промпт-инжиниринг', 'promt engineering'], ['RAG', 'Дообучение ИИ-моделей', 'Python']],
    ['Дообучение ИИ-моделей', ['fine-tuning', 'fine tuning', 'дообучение моделей'], ['PyTorch', 'Python', 'Машинное обучение', 'Prompt engineering']],
    ['RAG', [], ['Python', 'Prompt engineering', 'REST API']],
  ]),
  ...group('Инструменты и инфраструктура', [
    ['Git', ['гит'], ['CI/CD']],
    ['Linux', ['линукс'], ['Bash', 'Docker', 'Nginx']],
    ['Docker', ['докер'], ['Linux', 'CI/CD', 'Kubernetes']],
    ['Kubernetes', ['k8s'], ['Docker', 'Linux', 'Terraform']],
    ['CI/CD', ['cicd', 'ci cd'], ['Git', 'Docker', 'Unit-тестирование']],
    ['Bash', ['shell', 'bash scripting'], ['Linux', 'Git']],
    ['Nginx', [], ['Linux', 'Docker']],
    ['Terraform', [], ['Linux', 'Docker', 'Kubernetes']],
  ]),
  ...group('Тестирование', [
    ['Pytest', ['py.test'], ['Python', 'Unit-тестирование', 'Тестирование API']],
    ['Jest', [], ['JavaScript', 'TypeScript', 'Unit-тестирование']],
    ['Playwright', [], ['TypeScript', 'Тестирование API', 'CI/CD']],
    ['Тестирование API', ['api testing'], ['Postman', 'REST API', 'Playwright']],
    ['Postman', [], ['Тестирование API', 'REST API']],
    ['Unit-тестирование', ['unit testing', 'модульное тестирование', 'юнит-тесты'], ['CI/CD']],
  ]),
  ...group('Дизайн', [
    ['Figma', [], ['Прототипирование', 'Дизайн-системы', 'UI-дизайн', 'UX-исследования']],
    ['UX-исследования', ['ux research', 'ux исследования'], ['Прототипирование', 'Figma']],
    ['Прототипирование', ['prototyping'], ['Figma', 'UX-исследования', 'UI-дизайн']],
    ['Дизайн-системы', ['design systems', 'дизайн системы'], ['Figma', 'UI-дизайн']],
    ['UI-дизайн', ['ui design'], ['Figma', 'Прототипирование', 'Дизайн-системы']],
    ['Adobe Photoshop', ['photoshop'], ['Adobe Illustrator', 'UI-дизайн']],
    ['Adobe Illustrator', ['illustrator'], ['Adobe Photoshop', 'Figma']],
  ]),
  ...group('Методы работы и бизнес', [
    ['ООП', ['oop', 'объектно-ориентированное программирование'], ['Алгоритмы и структуры данных', 'Unit-тестирование']],
    ['Алгоритмы и структуры данных', ['алгоритмы', 'data structures'], ['Unit-тестирование']],
    ['Agile', ['аджайл'], ['Scrum', 'Управление проектами']],
    ['Scrum', ['скрам'], ['Agile', 'Управление проектами']],
    ['Управление проектами', ['project management'], ['Agile', 'Scrum', 'Бизнес-анализ']],
    ['Бизнес-анализ', ['business analysis'], ['Excel', 'Анализ данных', 'Управление проектами']],
    ['Excel', ['ms excel', 'microsoft excel'], ['Power BI', 'Анализ данных', 'SQL']],
    ['Power BI', ['powerbi'], ['Excel', 'SQL', 'Анализ данных']],
  ]),
];

const key = (value: string) => value.normalize('NFKC').trim().toLocaleLowerCase('ru-RU').replace(/ё/g, 'е').replace(/\s+/g, ' ');
const byAlias = new Map(SKILLS.flatMap(skill => [skill.name, ...skill.aliases].map(alias => [key(alias), skill] as const)));
export function skillKey(value: string): string {
  return key(byAlias.get(key(value))?.name ?? value);
}

export function parseSkills(text: string): string[] {
  return text.split(/[,;\r\n]+/).map(value => value.trim()).filter(Boolean);
}

export const SKILL_GROUPS = [
  'Языки', 'Backend и базы данных', 'Frontend', 'Анализ данных',
  'Машинное обучение и ИИ', 'Инструменты', 'Тестирование', 'Дизайн',
  'Основы разработки', 'Управление и бизнес', 'Другие навыки',
] as const;

export type SkillGroupAssignments = Record<string, string>;
export type SkillGroup = { name: string; skills: string[] };

export function defaultSkillGroup(value: string): string {
  const skill = byAlias.get(key(value));
  const name = skill?.name;
  if (['SQL', 'PostgreSQL', 'MySQL', 'SQLite', 'MongoDB', 'Redis', 'Проектирование БД'].includes(name ?? '')) return 'Backend и базы данных';
  if (['pandas', 'NumPy', 'Анализ данных', 'Power BI', 'Excel'].includes(name ?? '')) return 'Анализ данных';
  if (['ООП', 'Алгоритмы и структуры данных'].includes(name ?? '')) return 'Основы разработки';
  if (key(value) === 'html и css') return 'Frontend';
  switch (skill?.category) {
    case 'Языки программирования': return 'Языки';
    case 'Веб-разработка': return ['HTML', 'CSS', 'React', 'Vue.js', 'Angular', 'Next.js'].includes(name!) ? 'Frontend' : 'Backend и базы данных';
    case 'Данные и ИИ': return 'Машинное обучение и ИИ';
    case 'Инструменты и инфраструктура': return 'Инструменты';
    case 'Тестирование': return 'Тестирование';
    case 'Дизайн': return 'Дизайн';
    case 'Методы работы и бизнес': return 'Управление и бизнес';
    default: return 'Другие навыки';
  }
}

export function groupSkills(text: string, assignments: SkillGroupAssignments = {}): SkillGroup[] {
  const groups = new Map<string, string[]>();
  for (const skill of parseSkills(text)) {
    const id = skillKey(skill);
    const name = Object.hasOwn(assignments, id) ? assignments[id] : defaultSkillGroup(skill);
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name)!.push(skill);
  }
  const order: string[] = [...SKILL_GROUPS];
  const rank = (name: string) => order.includes(name) ? order.indexOf(name) : order.length;
  return [...groups].sort(([a], [b]) => rank(a) - rank(b))
    .map(([name, skills]) => ({ name, skills }));
}

export function addSkills(text: string, input: string): string {
  const selected = new Set(parseSkills(text).map(skillKey));
  const additions: string[] = [];
  for (const value of parseSkills(input)) {
    const id = skillKey(value);
    if (selected.has(id)) continue;
    selected.add(id);
    additions.push(byAlias.get(key(value))?.name ?? value);
  }
  // Preserve original spelling and paragraph breaks until explicitly edited.
  if (!additions.length) return text;
  return [text.replace(/[\s,;]+$/g, ''), additions.join(', ')].filter(Boolean).join(', ');
}

export function searchSkills(query: string, selectedText: string): Skill[] {
  const selected = new Set(parseSkills(selectedText).map(skillKey));
  const term = key(query);
  return SKILLS.filter(skill => !selected.has(skillKey(skill.name)) &&
    [skill.name, ...skill.aliases, skill.category].some(value => key(value).includes(term)));
}

export function suggestSkills(text: string, limit = 8): { name: string; basedOn: string[] }[] {
  const selected = new Set(parseSkills(text).map(skillKey));
  const candidates = new Map<string, Set<string>>();
  for (const id of selected) {
    const source = byAlias.get(id);
    if (!source) continue;
    for (const name of source.related) {
      if (selected.has(skillKey(name))) continue;
      if (!candidates.has(name)) candidates.set(name, new Set());
      candidates.get(name)!.add(source.name);
    }
  }
  return [...candidates].map(([name, sources]) => ({ name, basedOn: [...sources] }))
    .sort((a, b) => b.basedOn.length - a.basedOn.length || a.name.localeCompare(b.name, 'ru'))
    .slice(0, limit);
}
