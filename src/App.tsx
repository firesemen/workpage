import { useEffect, useRef, useState, lazy, Suspense } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  FileText,
  GraduationCap,
  Layers,
  LayoutTemplate,
  ListChecks,
  LoaderCircle,
  LockKeyhole,
  MoreHorizontal,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  BriefcaseBusiness,
  X,
} from "lucide-react";
import {
  emptyResume,
  sampleResume,
  validateResume,
  resumeWarnings,
  type Resume,
} from "./model";
import Editor from "./Editor";
const Preview = lazy(() => import("./Preview"));
const KEY = "list-resume-v1";
const sections = [
  { id: "basics", label: "Личные данные", icon: UserRound },
  { id: "summary", label: "О себе", icon: FileText },
  { id: "experience", label: "Опыт работы", icon: BriefcaseBusiness },
  { id: "education", label: "Образование", icon: GraduationCap },
  { id: "skills", label: "Навыки и языки", icon: Sparkles },
  { id: "projects", label: "Проекты и ссылки", icon: Layers },
];
function load(): Resume {
  try {
    const s = localStorage.getItem(KEY);
    return s ? validateResume(JSON.parse(s)) : emptyResume();
  } catch {
    return emptyResume();
  }
}
export default function App() {
  const [resume, setResume] = useState<Resume>(load);
  const [section, setSection] = useState("basics");
  const [tab, setTab] = useState<"content" | "design">("content");
  const [saved, setSaved] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [exporting, setExporting] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState<"clear" | "sample" | "import" | null>(
    null,
  );
  const [incoming, setIncoming] = useState<Resume | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setSaved(false);
    const id = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(resume));
        setSaved(true);
      } catch {
        setError(
          "Не удалось сохранить в браузере. Скачайте резервную копию JSON.",
        );
      }
    }, 450);
    return () => clearTimeout(id);
  }, [resume]);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(id);
  }, [notice]);
  useEffect(() => {
    if (!confirm) return;
    const previous = document.activeElement as HTMLElement | null;
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setConfirm(null);
        return;
      }
      if (e.key === "Tab") {
        const buttons =
          modalRef.current?.querySelectorAll<HTMLButtonElement>("button");
        if (!buttons?.length) return;
        const first = buttons[0],
          last = buttons[buttons.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [confirm]);
  const warnings = resumeWarnings(resume);
  const index = sections.findIndex((s) => s.id === section);
  const completed = [
    !!(resume.name && resume.title && (resume.email || resume.phone)),
    !!resume.summary,
    !!resume.experience.length,
    !!resume.education.length,
    !!resume.skills,
    !!resume.projects,
  ].filter(Boolean).length;
  async function download() {
    setExporting(true);
    setError("");
    try {
      const [{ pdf }, { default: Document }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./ResumeDocument"),
      ]);
      const blob = await pdf(<Document resume={resume} />).toBlob();
      saveBlob(blob, `${resume.name.trim() || "Резюме"}.pdf`);
      setNotice("PDF готов. Файл передан браузеру для скачивания.");
    } catch (e) {
      setError(
        "Не удалось создать PDF. " + (e instanceof Error ? e.message : ""),
      );
    } finally {
      setExporting(false);
    }
  }
  async function importFile(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("Файл больше 5 МБ.");
      const next = validateResume(JSON.parse(await file.text()));
      if (next.photo) next.photo = await normalizePhoto(next.photo);
      setIncoming(next);
      setConfirm("import");
    } catch (e) {
      setError(
        "Не удалось открыть файл. " + (e instanceof Error ? e.message : ""),
      );
    }
    if (fileRef.current) fileRef.current.value = "";
  }
  const change = (r: Resume) => {
    setResume(r);
    setError("");
  };
  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Лист — редактор резюме">
          <span className="brand-mark">
            <FileText size={23} />
          </span>
          лист<span className="brand-dot">.</span>
        </a>
        <span className="topbar-divider" />
        <span className="workspace-label">Моё резюме</span>
        <span className="beta">БЕСПЛАТНО</span>
        <div className="topbar-right">
          <span className="save-status">
            <span className={saved ? "status-dot" : "status-dot saving"} />
            {saved ? "Сохранено на устройстве" : "Сохраняем…"}
          </span>
          <div className="menu-wrap">
            <button
              className="icon-button"
              aria-label="Действия с резюме"
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              <MoreHorizontal size={22} />
            </button>
            {menu && (
              <div className="dropdown">
                <button
                  onClick={() => {
                    saveBlob(
                      new Blob([JSON.stringify(resume, null, 2)], {
                        type: "application/json",
                      }),
                      "resume.json",
                    );
                    setMenu(false);
                  }}
                >
                  <ArrowDownToLine size={16} />
                  Сохранить JSON
                </button>
                <button
                  onClick={() => {
                    fileRef.current?.click();
                    setMenu(false);
                  }}
                >
                  <Upload size={16} />
                  Открыть JSON
                </button>
                <button
                  onClick={() => {
                    setConfirm("sample");
                    setMenu(false);
                  }}
                >
                  <FileText size={16} />
                  Заполнить примером
                </button>
                <button
                  className="danger-text"
                  onClick={() => {
                    setConfirm("clear");
                    setMenu(false);
                  }}
                >
                  <Trash2 size={16} />
                  Удалить данные
                </button>
              </div>
            )}
          </div>
          <button
            className="button primary download-top"
            disabled={exporting}
            onClick={download}
          >
            {exporting ? (
              <LoaderCircle size={17} className="spin" />
            ) : (
              <ArrowDownToLine size={17} />
            )}
            <span>{exporting ? "Готовим PDF…" : "Скачать PDF"}</span>
          </button>
        </div>
      </header>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => importFile(e.target.files?.[0])}
      />
      {error && (
        <div className="alert error" role="alert">
          {error}
          <button aria-label="Закрыть ошибку" onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}
      {notice && (
        <div className="toast" role="status">
          <Check size={18} />
          {notice}
        </div>
      )}
      <main className="workspace">
        <aside className="sidebar">
          <div className="sidebar-title">ВАШЕ РЕЗЮМЕ</div>
          <nav aria-label="Разделы резюме">
            {sections.map((s, i) => (
              <button
                key={s.id}
                className={`nav-item ${section === s.id && tab === "content" ? "active" : ""}`}
                onClick={() => {
                  setSection(s.id);
                  setTab("content");
                  setMobilePreview(false);
                }}
              >
                <s.icon size={18} />
                <span>{s.label}</span>
                <span className="nav-number">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </button>
            ))}
          </nav>
          <div className="sidebar-separator" />
          <button
            className={`nav-item ${tab === "design" ? "active" : ""}`}
            onClick={() => {
              setTab("design");
              setMobilePreview(false);
            }}
          >
            <LayoutTemplate size={18} />
            <span>Оформление</span>
          </button>
          <div className="progress-card">
            <div className="progress-icon">
              <ListChecks size={19} />
            </div>
            <strong>Шаг за шагом</strong>
            <p>
              Хорошее резюме начинается
              <br />с самого важного — с вас.
            </p>
            <div className="progress-track">
              <span style={{ width: `${(completed / 6) * 100}%` }} />
            </div>
            <small>Заполнено разделов: {completed} из 6</small>
          </div>
          <div className="privacy-note">
            <LockKeyhole size={15} />
            <span>
              Только на вашем устройстве.
              <br />
              Без регистрации и отслеживания.
            </span>
          </div>
        </aside>
        <section
          className={`editor-panel ${mobilePreview ? "mobile-hidden" : ""}`}
        >
          <div className="editor-topline">
            <span>КОНСТРУКТОР РЕЗЮМЕ</span>
            <span className="step-counter">
              {tab === "design"
                ? "ВАШ СТИЛЬ"
                : `ШАГ ${String(index + 1).padStart(2, "0")} / 06`}
            </span>
          </div>
          <div className="editor-tabs">
            <button
              className={tab === "content" ? "selected" : ""}
              onClick={() => setTab("content")}
            >
              <FileText size={16} />
              Содержание
            </button>
            <button
              className={tab === "design" ? "selected" : ""}
              onClick={() => setTab("design")}
            >
              <LayoutTemplate size={16} />
              Оформление
            </button>
          </div>
          {tab === "content" && !resume.name && !resume.experience.length && (
            <button
              className="example-button"
              onClick={() => setConfirm("sample")}
            >
              <Sparkles size={14} />
              Посмотреть на примере
              <ArrowRight size={13} />
            </button>
          )}
          {tab === "content" ? (
            <Editor resume={resume} onChange={change} section={section} />
          ) : (
            <div className="editor-section">
              <div className="eyebrow">ПРОСТОТА В ДЕТАЛЯХ</div>
              <h1>Ваше оформление</h1>
              <p className="section-description">
                Сдержанный дизайн, в котором главное — ваш опыт.
              </p>
              <div className="template-options">
                {(["modern", "classic"] as const).map((t) => (
                  <button
                    key={t}
                    className={`template-option ${resume.template === t ? "chosen" : ""}`}
                    onClick={() => change({ ...resume, template: t })}
                  >
                    <div className={`mini-page ${t}`}>
                      <div className="mini-title" />
                      <div className="mini-subtitle" />
                      {[0, 1, 2].map((n) => (
                        <div key={n} className="mini-section">
                          <b />
                          <i />
                          <i />
                          <i />
                        </div>
                      ))}
                    </div>
                    <div>
                      <strong>
                        {t === "modern" ? "Современный" : "Строгий"}
                      </strong>
                      {resume.template === t && <Check size={17} />}
                    </div>
                    <small>
                      {t === "modern"
                        ? "Акцент и ясная структура"
                        : "Классическая типографика"}
                    </small>
                  </button>
                ))}
              </div>
              <label className="field">
                <span>Плотность текста</span>
                <select
                  value={resume.density}
                  onChange={(e) =>
                    change({
                      ...resume,
                      density: e.target.value as Resume["density"],
                    })
                  }
                >
                  <option value="normal">Комфортная — больше воздуха</option>
                  <option value="compact">
                    Компактная — больше на странице
                  </option>
                </select>
              </label>
              <div className="tip-card">
                <Sparkles size={19} />
                <p>
                  Один-два листа обычно достаточно. Выбирайте релевантный опыт и
                  конкретные достижения — читаемость важнее количества.
                </p>
              </div>
            </div>
          )}
          <div className="editor-footer">
            {tab === "content" && (
              <>
                <button
                  className="button ghost"
                  disabled={index === 0}
                  onClick={() => setSection(sections[index - 1].id)}
                >
                  <ArrowLeft size={16} />
                  Назад
                </button>
                <button
                  className="button primary"
                  onClick={() =>
                    index < 5
                      ? setSection(sections[index + 1].id)
                      : setTab("design")
                  }
                >
                  {index < 5 ? "Продолжить" : "К оформлению"}
                  <ArrowRight size={16} />
                </button>
              </>
            )}
          </div>
          <div className="local-note">
            <ShieldCheck size={14} />
            Данные сохраняются только в этом браузере
          </div>
        </section>
        <section
          className={`preview-panel ${!mobilePreview ? "mobile-hidden-preview" : ""}`}
          aria-label="Предпросмотр резюме"
        >
          <div className="preview-toolbar">
            <div>
              <span className="live-dot" />
              Предпросмотр<span className="live-label">В РЕАЛЬНОМ ВРЕМЕНИ</span>
            </div>
            <span className="paper-label">
              A4 <span>·</span> PDF
            </span>
          </div>
          <div className="preview-scroll">
            <Suspense
              fallback={
                <div className="preview-loading">
                  <LoaderCircle className="spin" />
                  Готовим ваш лист…
                </div>
              }
            >
              <Preview resume={resume} />
            </Suspense>
            <div className="preview-caption">
              <ShieldCheck size={14} />
              Текст в PDF можно выделять и копировать
            </div>
          </div>
          <div className="preview-bottom">
            <span>
              <span className="swatch" />
              {resume.template === "modern" ? "Современный" : "Строгий"}
            </span>
            <button
              onClick={() => {
                setTab("design");
                setMobilePreview(false);
              }}
            >
              Изменить оформление
              <ChevronRight size={15} />
            </button>
          </div>
        </section>
      </main>
      <button
        className="mobile-toggle button primary"
        onClick={() => setMobilePreview(!mobilePreview)}
      >
        {mobilePreview ? <FileText size={17} /> : <LayoutTemplate size={17} />}{" "}
        {mobilePreview ? "К редактору" : "Предпросмотр PDF"}
      </button>
      {warnings.length > 0 && (
        <details className="checks">
          <summary>
            <ListChecks size={16} />
            Подсказки перед отправкой <span>{warnings.length}</span>
          </summary>
          <ul>
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </details>
      )}
      {confirm && (
        <div className="modal-backdrop" onClick={() => setConfirm(null)}>
          <div
            ref={modalRef}
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="dialog-title">
              {confirm === "clear"
                ? "Удалить данные резюме?"
                : confirm === "sample"
                  ? "Заполнить примером?"
                  : "Открыть резюме из файла?"}
            </h2>
            <p>
              {confirm === "clear"
                ? "Данные будут удалены из редактора и локального хранилища."
                : "Текущее резюме будет заменено."}{" "}
              Перед этим можно скачать резервную копию через меню вверху.
            </p>
            <div>
              <button
                className="button secondary"
                autoFocus
                onClick={() => setConfirm(null)}
              >
                Отмена
              </button>
              <button
                className="button primary"
                onClick={() => {
                  change(
                    confirm === "clear"
                      ? emptyResume()
                      : confirm === "sample"
                        ? sampleResume()
                        : incoming!,
                  );
                  setConfirm(null);
                  setSection("basics");
                  setNotice(
                    confirm === "clear" ? "Данные удалены." : "Резюме открыто.",
                  );
                }}
              >
                {" "}
                {confirm === "clear" ? "Удалить" : "Продолжить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

async function normalizePhoto(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 800 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.width * scale));
      c.height = Math.max(1, Math.round(img.height * scale));
      const ctx = c.getContext("2d");
      if (!ctx) {
        reject(new Error("Не удалось обработать фото."));
        return;
      }
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.88));
    };
    img.onerror = () => reject(new Error("Повреждённое фото в файле."));
    img.src = src;
  });
}
