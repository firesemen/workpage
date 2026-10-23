import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { uid, type Resume, type Experience, type Education } from "./model";

type Props = { resume: Resume; onChange: (r: Resume) => void; section: string };
const titles: Record<string, [string, string, string]> = {
  basics: [
    "01 / ЗНАКОМСТВО",
    "Начнём с главного",
    "Расскажите, как вас зовут, чем вы занимаетесь и как с вами связаться.",
  ],
  summary: [
    "02 / О ВАС",
    "Несколько слов о себе",
    "Кратко опишите свой опыт, сильные стороны и то, какую пользу вы приносите команде.",
  ],
  experience: [
    "03 / ОПЫТ",
    "Ваш профессиональный путь",
    "Начните с последнего места работы. Покажите результаты, а не только обязанности.",
  ],
  education: [
    "04 / ОБРАЗОВАНИЕ",
    "Знания и развитие",
    "Добавьте основное образование, значимые курсы или профессиональную переподготовку.",
  ],
  skills: [
    "05 / НАВЫКИ",
    "То, что вы умеете",
    "Выберите навыки, которые важны для желаемой работы. Укажите языки и уровень владения.",
  ],
  projects: [
    "06 / ПРОЕКТЫ",
    "Работы, которыми вы гордитесь",
    "Учебные, личные и волонтёрские проекты тоже показывают ваш опыт.",
  ],
};
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </label>
  );
}
function reorder<T>(items: T[], index: number, delta: number) {
  const next = [...items];
  const other = index + delta;
  if (other < 0 || other >= next.length) return next;
  [next[index], next[other]] = [next[other], next[index]];
  return next;
}
export default function Editor({ resume, onChange, section }: Props) {
  const [photoError, setPhotoError] = useState("");
  const photoRequest = useRef(0);
  const currentResume = useRef(resume);
  currentResume.current = resume;
  const key = titles[section] ? section : "basics";
  const [eyebrow, title, description] = titles[key];
  const set = <K extends keyof Resume>(field: K, value: Resume[K]) =>
    onChange({ ...resume, [field]: value });
  const input = (
    field: "name" | "title" | "email" | "phone" | "city" | "link" | "salary",
    placeholder: string,
    type = "text",
  ) => (
    <input
      className="input"
      type={type}
      value={resume[field]}
      placeholder={placeholder}
      maxLength={field === "link" ? 500 : 200}
      autoComplete={
        field === "name"
          ? "name"
          : field === "email"
            ? "email"
            : field === "phone"
              ? "tel"
              : "off"
      }
      onChange={(e) => set(field, e.target.value)}
    />
  );
  const updateExperience = (id: string, patch: Partial<Experience>) =>
    set(
      "experience",
      resume.experience.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    );
  const updateEducation = (id: string, patch: Partial<Education>) =>
    set(
      "education",
      resume.education.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    );
  const moveButtons = (
    kind: "experience" | "education",
    index: number,
    label: string,
  ) => (
    <div className="entry-actions">
      <button
        type="button"
        className="icon-button"
        aria-label={`Поднять ${label}`}
        disabled={index === 0}
        onClick={() =>
          kind === "experience"
            ? set("experience", reorder(resume.experience, index, -1))
            : set("education", reorder(resume.education, index, -1))
        }
      >
        ↑
      </button>
      <button
        type="button"
        className="icon-button"
        aria-label={`Опустить ${label}`}
        disabled={index === resume[kind].length - 1}
        onClick={() =>
          kind === "experience"
            ? set("experience", reorder(resume.experience, index, 1))
            : set("education", reorder(resume.education, index, 1))
        }
      >
        ↓
      </button>
      <button
        type="button"
        className="button ghost"
        aria-label={`Удалить ${label}`}
        onClick={() =>
          kind === "experience"
            ? set(
                "experience",
                resume.experience.filter((_, i) => i !== index),
              )
            : set(
                "education",
                resume.education.filter((_, i) => i !== index),
              )
        }
      >
        Удалить
      </button>
    </div>
  );
  async function uploadPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const request = ++photoRequest.current;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoError("Выберите изображение JPG, PNG или WebP.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError("Фото должно быть не больше 2 МБ.");
      return;
    }
    setPhotoError("");
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result);
      const image = new Image();
      image.onload = () => {
        if (request !== photoRequest.current) return;
        try {
          const scale = Math.min(
            1,
            800 / Math.max(image.naturalWidth, image.naturalHeight),
          );
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Canvas unavailable");
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          const photo = canvas.toDataURL("image/jpeg", 0.88);
          if (request === photoRequest.current)
            onChange({ ...currentResume.current, photo });
        } catch {
          setPhotoError(
            "Не удалось обработать изображение. Выберите другое фото.",
          );
        }
      };
      image.onerror = () => {
        if (request === photoRequest.current)
          setPhotoError(
            "Не удалось прочитать изображение. Выберите другой файл.",
          );
      };
      image.src = src;
    };
    reader.onerror = () =>
      setPhotoError("Не удалось загрузить файл. Попробуйте ещё раз.");
    reader.readAsDataURL(file);
  }
  return (
    <section className="editor-section" aria-labelledby="editor-title">
      <div className="section-heading">
        <span className="eyebrow">{eyebrow}</span>
        <h1 id="editor-title">{title}</h1>
        <p className="section-description">{description}</p>
      </div>
      {key !== "basics" && (
        <label className="visibility-toggle">
          <input
            type="checkbox"
            checked={!resume.hidden.includes(key)}
            onChange={(e) =>
              set(
                "hidden",
                e.target.checked
                  ? resume.hidden.filter((s) => s !== key)
                  : [...resume.hidden, key],
              )
            }
          />{" "}
          Показывать раздел в резюме
        </label>
      )}
      {key === "basics" && (
        <>
          <div className="field-grid">
            <Field label="Имя и фамилия">
              {input("name", "Александра Морозова")}
            </Field>
            <Field label="Желаемая должность">
              {input("title", "Продуктовый дизайнер")}
            </Field>
          </div>
          <div className="field-grid">
            <Field label="Город">{input("city", "Санкт-Петербург")}</Field>
            <Field label="Формат работы">
              <select
                className="input"
                value={resume.workFormat}
                onChange={(e) => set("workFormat", e.target.value)}
              >
                <option value="">Не указывать</option>
                {["В офисе", "Удалённо", "Гибрид", "Готов(а) к переезду"].map(
                  (v) => (
                    <option key={v}>{v}</option>
                  ),
                )}
              </select>
            </Field>
          </div>
          <div className="field-grid">
            <Field label="Электронная почта">
              {input("email", "name@example.com", "email")}
            </Field>
            <Field label="Телефон">
              {input("phone", "+7 900 123-45-67", "tel")}
            </Field>
          </div>
          {resume.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resume.email) && (
            <p className="hint" role="status">
              Проверьте адрес электронной почты.
            </p>
          )}
          <Field
            label="Сайт или портфолио"
            hint="Необязательно. Например, ссылка на портфолио или профиль GitHub."
          >
            {input("link", "portfolio.example.com")}
          </Field>
          <Field
            label="Желаемая зарплата"
            hint="Необязательно. Укажите валюту и сумму, если считаете это важным."
          >
            {input("salary", "От 150 000 ₽ на руки")}
          </Field>
          <div className="photo-field">
            <div>
              <span className="field-label">Фото · необязательно</span>
              <p className="hint">
                JPG, PNG или WebP, до 2 МБ. Нейтральный фон и хорошее освещение.
              </p>
            </div>
            {resume.photo && (
              <img
                src={resume.photo}
                alt="Фото для резюме"
                width={64}
                height={64}
                style={{ objectFit: "cover", borderRadius: 12 }}
              />
            )}
            <label className="button secondary">
              {resume.photo ? "Заменить фото" : "Добавить фото"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                aria-label="Загрузить фото"
                onChange={uploadPhoto}
                style={{
                  position: "absolute",
                  width: 1,
                  height: 1,
                  overflow: "hidden",
                  clipPath: "inset(50%)",
                }}
              />
            </label>
            {resume.photo && (
              <button
                className="button ghost"
                type="button"
                onClick={() => {
                  photoRequest.current++;
                  set("photo", "");
                }}
              >
                Убрать фото
              </button>
            )}
            {photoError && (
              <p role="alert" className="hint">
                {photoError}
              </p>
            )}
          </div>
        </>
      )}
      {key === "summary" && (
        <>
          <Field
            label="О себе"
            hint="Ориентир — 3–5 предложений. Избегайте общих слов: лучше один конкретный результат."
          >
            <textarea
              className="textarea"
              rows={9}
              maxLength={5000}
              value={resume.summary}
              placeholder="Какой у вас опыт? Какие задачи вы решаете особенно хорошо? Чем хотите заниматься дальше?"
              onChange={(e) => set("summary", e.target.value)}
            />
          </Field>
          <p className="hint">
            {resume.summary.length} символов
            {resume.summary.length > 700
              ? " · Текст получится легче читать, если немного его сократить."
              : ""}
          </p>
        </>
      )}
      {key === "experience" && (
        <>
          {resume.experience.length === 0 && (
            <p className="hint">
              Нет опыта работы? Добавьте стажировку, практику или перейдите к
              проектам.
            </p>
          )}
          {resume.experience.map((exp, i) => (
            <article className="entry-card" key={exp.id}>
              <div className="entry-header">
                <h3>Место работы {i + 1}</h3>
                {moveButtons("experience", i, `место работы ${i + 1}`)}
              </div>
              <Field label="Компания">
                <input
                  className="input"
                  value={exp.company}
                  maxLength={300}
                  placeholder="Название компании"
                  onChange={(e) =>
                    updateExperience(exp.id, { company: e.target.value })
                  }
                />
              </Field>
              <Field label="Должность">
                <input
                  className="input"
                  value={exp.role}
                  maxLength={300}
                  placeholder="Ваша должность"
                  onChange={(e) =>
                    updateExperience(exp.id, { role: e.target.value })
                  }
                />
              </Field>
              <div className="field-grid">
                <Field label="Начало работы">
                  <input
                    className="input"
                    type="month"
                    value={exp.start}
                    onChange={(e) =>
                      updateExperience(exp.id, { start: e.target.value })
                    }
                  />
                </Field>
                <Field label="Окончание работы">
                  <input
                    className="input"
                    type="month"
                    value={exp.end}
                    disabled={exp.current}
                    min={exp.start || undefined}
                    onChange={(e) =>
                      updateExperience(exp.id, { end: e.target.value })
                    }
                  />
                </Field>
              </div>
              <label className="visibility-toggle">
                <input
                  type="checkbox"
                  checked={exp.current}
                  onChange={(e) =>
                    updateExperience(exp.id, { current: e.target.checked })
                  }
                />{" "}
                Работаю здесь сейчас
              </label>
              {!exp.current && exp.start && exp.end && exp.end < exp.start && (
                <p className="hint" role="alert">
                  Окончание работы не может быть раньше её начала.
                </p>
              )}
              <Field
                label="Задачи и достижения"
                hint="Каждый пункт — с новой строки. По возможности добавьте измеримый результат."
              >
                <textarea
                  className="textarea"
                  rows={5}
                  maxLength={10000}
                  value={exp.description}
                  placeholder={
                    "Сократил(а) время обработки заявок на 25%.\nЗапустил(а) новый продукт вместе с командой."
                  }
                  onChange={(e) =>
                    updateExperience(exp.id, { description: e.target.value })
                  }
                />
              </Field>
            </article>
          ))}
          <button
            type="button"
            className="button secondary"
            onClick={() =>
              set("experience", [
                ...resume.experience,
                {
                  id: uid(),
                  company: "",
                  role: "",
                  start: "",
                  end: "",
                  current: false,
                  description: "",
                },
              ])
            }
          >
            + Добавить место работы
          </button>
        </>
      )}
      {key === "education" && (
        <>
          {resume.education.map((edu, i) => (
            <article className="entry-card" key={edu.id}>
              <div className="entry-header">
                <h3>Образование {i + 1}</h3>
                {moveButtons("education", i, `образование ${i + 1}`)}
              </div>
              <Field label="Учебное заведение">
                <input
                  className="input"
                  maxLength={500}
                  value={edu.school}
                  placeholder="Университет или образовательная платформа"
                  onChange={(e) =>
                    updateEducation(edu.id, { school: e.target.value })
                  }
                />
              </Field>
              <Field label="Специальность или программа">
                <input
                  className="input"
                  maxLength={500}
                  value={edu.degree}
                  placeholder="Направление и уровень образования"
                  onChange={(e) =>
                    updateEducation(edu.id, { degree: e.target.value })
                  }
                />
              </Field>
              <Field
                label="Год окончания"
                hint="Если ещё учитесь, укажите ожидаемый год."
              >
                <input
                  className="input"
                  inputMode="numeric"
                  maxLength={4}
                  value={edu.year}
                  placeholder="2024"
                  onChange={(e) =>
                    updateEducation(edu.id, {
                      year: e.target.value.replace(/\D/g, "").slice(0, 4),
                    })
                  }
                />
              </Field>
            </article>
          ))}
          <button
            type="button"
            className="button secondary"
            onClick={() =>
              set("education", [
                ...resume.education,
                { id: uid(), school: "", degree: "", year: "" },
              ])
            }
          >
            + Добавить образование
          </button>
        </>
      )}
      {key === "skills" && (
        <>
          <Field
            label="Профессиональные навыки"
            hint="Перечислите через запятую: инструменты, технологии, методы работы."
          >
            <textarea
              className="textarea"
              rows={5}
              maxLength={5000}
              value={resume.skills}
              placeholder="Figma, Прототипирование, UX-исследования"
              onChange={(e) => set("skills", e.target.value)}
            />
          </Field>
          <Field
            label="Языки"
            hint="Один язык на строку. Укажите уровень: A1–C2 или понятное описание."
          >
            <textarea
              className="textarea"
              rows={4}
              maxLength={3000}
              value={resume.languages}
              placeholder={"Русский — родной\nАнглийский — B2"}
              onChange={(e) => set("languages", e.target.value)}
            />
          </Field>
          <label className="visibility-toggle">
            <input
              type="checkbox"
              checked={!resume.hidden.includes("languages")}
              onChange={(e) =>
                set(
                  "hidden",
                  e.target.checked
                    ? resume.hidden.filter((s) => s !== "languages")
                    : [...resume.hidden, "languages"],
                )
              }
            />{" "}
            Показывать языки в резюме
          </label>
        </>
      )}
      {key === "projects" && (
        <Field
          label="Проекты и ссылки"
          hint="Первая строка — название проекта: оно будет выделено полужирным. Далее — описание и ссылка. Пустая строка отделяет следующий проект."
        >
          <textarea
            className="textarea"
            rows={12}
            maxLength={10000}
            value={resume.projects}
            placeholder={
              "Название проекта\nРазработал(а) сервис для… Результат: …\nhttps://example.com"
            }
            onChange={(e) => set("projects", e.target.value)}
          />
        </Field>
      )}
    </section>
  );
}
