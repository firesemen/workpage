export type Template = "modern" | "classic";
export type Experience = {
  id: string;
  company: string;
  role: string;
  start: string;
  end: string;
  current: boolean;
  description: string;
};
export type Education = {
  id: string;
  school: string;
  degree: string;
  year: string;
};
export type Resume = {
  version: 1;
  name: string;
  title: string;
  email: string;
  phone: string;
  city: string;
  link: string;
  salary: string;
  workFormat: string;
  photo: string;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string;
  skillGroups?: Record<string, string>;
  languages: string;
  projects: string;
  template: Template;
  density: "normal" | "compact";
  hidden: string[];
};
export const uid = () => crypto.randomUUID();
export const emptyResume = (): Resume => ({
  version: 1,
  name: "",
  title: "",
  email: "",
  phone: "",
  city: "",
  link: "",
  salary: "",
  workFormat: "",
  photo: "",
  summary: "",
  experience: [],
  education: [],
  skills: "",
  skillGroups: {},
  languages: "",
  projects: "",
  template: "modern",
  density: "normal",
  hidden: [],
});
export const sampleResume = (): Resume => ({
  ...emptyResume(),
  name: "Александра Морозова",
  title: "Продуктовый дизайнер",
  city: "Санкт-Петербург",
  email: "alex.morozova@example.com",
  phone: "+7 900 123-45-67",
  link: "portfolio.example.com",
  workFormat: "Удалённо",
  summary:
    "Проектирую цифровые продукты, которые помогают людям решать повседневные задачи. Соединяю исследование, ясную структуру и внимание к деталям.",
  experience: [
    {
      id: "sample-1",
      company: "Студия «Среда»",
      role: "Продуктовый дизайнер",
      start: "2022-09",
      end: "",
      current: true,
      description:
        "Спроектировала личный кабинет для 40 000 пользователей.\nСократила путь оформления заявки с 7 до 4 шагов.\nРазвивала дизайн-систему вместе с командой разработки.",
    },
    {
      id: "sample-2",
      company: "Бюро «Форма»",
      role: "UX/UI-дизайнер",
      start: "2020-06",
      end: "2022-08",
      current: false,
      description:
        "Проводила интервью и тестировала прототипы.\nРазработала интерфейсы трёх веб-сервисов от идеи до запуска.",
    },
  ],
  education: [
    {
      id: "sample-edu",
      school: "Санкт-Петербургский государственный университет",
      degree: "Дизайн среды · Бакалавриат",
      year: "2020",
    },
  ],
  skills:
    "Figma, Прототипирование, UX-исследования, Дизайн-системы, HTML и CSS",
  languages: "Русский — родной\nАнглийский — B2",
});
export function validateResume(value: unknown): Resume {
  if (!value || typeof value !== "object")
    throw new Error("Ожидается файл резюме JSON.");
  const v = value as Record<string, unknown>;
  const base = emptyResume();
  if (v.version !== 1) throw new Error("Неподдерживаемая версия файла.");
  for (const k of [
    "name",
    "title",
    "email",
    "phone",
    "city",
    "link",
    "salary",
    "workFormat",
    "photo",
    "summary",
    "skills",
    "languages",
    "projects",
  ] as const)
    if (
      typeof v[k] !== "string" ||
      (v[k] as string).length > (k === "photo" ? 3000000 : 30000)
    )
      throw new Error("Некорректное поле: " + k);
  if (
    !["modern", "classic"].includes(v.template as string) ||
    !["normal", "compact"].includes(v.density as string)
  )
    throw new Error("Некорректное оформление.");
  if (!Array.isArray(v.hidden) || !v.hidden.every((x) => typeof x === "string"))
    throw new Error("Некорректные разделы.");
  if (v.skillGroups !== undefined && (
    !v.skillGroups || typeof v.skillGroups !== 'object' || Array.isArray(v.skillGroups) ||
    Object.keys(v.skillGroups).length > 1000 ||
    !Object.entries(v.skillGroups).every(([key, value]) => key.length > 0 && key.length <= 30000 && typeof value === 'string' && value.trim().length > 0 && value.length <= 80)
  )) throw new Error('Некорректные группы навыков.');
  if (
    !Array.isArray(v.experience) ||
    v.experience.length > 100 ||
    !v.experience.every(
      (x) =>
        x &&
        ["id", "company", "role", "start", "end", "description"].every(
          (k) => typeof x[k] === "string" && x[k].length < 30000,
        ) &&
        typeof x.current === "boolean",
    )
  )
    throw new Error("Некорректный опыт работы.");
  if (
    !Array.isArray(v.education) ||
    v.education.length > 100 ||
    !v.education.every(
      (x) =>
        x &&
        ["id", "school", "degree", "year"].every(
          (k) => typeof x[k] === "string" && x[k].length < 30000,
        ),
    )
  )
    throw new Error("Некорректное образование.");
  if (
    v.photo &&
    !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(
      v.photo as string,
    )
  )
    throw new Error("Неподдерживаемое фото.");
  return { ...base, ...v } as Resume;
}
export function dateLabel(s: string) {
  if (!s) return "";
  const [y, m] = s.split("-");
  return m
    ? new Date(Number(y), Number(m) - 1)
        .toLocaleDateString("ru-RU", { month: "short", year: "numeric" })
        .replace(" г.", "")
    : y;
}
export function safeLink(s: string) {
  const v = s.trim();
  if (!v || /[\u0000-\u0020\u007f\\]/.test(v) || v.startsWith("//")) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(v) && !/^https?:\/\//i.test(v)) return "";
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : "https://" + v);
    return ["https:", "http:"].includes(u.protocol) &&
      !u.username &&
      !u.password
      ? u.href
      : "";
  } catch {
    return "";
  }
}

export function resumeWarnings(r: Resume) {
  const w: string[] = [];
  if (!r.name.trim()) w.push("Добавьте имя и фамилию.");
  if (!r.title.trim()) w.push("Укажите желаемую должность.");
  if (!r.email.trim() && !r.phone.trim())
    w.push("Добавьте телефон или электронную почту.");
  if (r.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email))
    w.push("Проверьте адрес электронной почты.");
  if (
    r.experience.some((e) => e.start && e.end && !e.current && e.end < e.start)
  )
    w.push("Дата окончания работы раньше даты начала.");
  if (r.summary.length > 700)
    w.push("Попробуйте сократить раздел «О себе» до 3–5 предложений.");
  return w;
}
