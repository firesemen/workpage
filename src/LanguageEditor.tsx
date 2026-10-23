import { useState } from 'react';
import { LANGUAGES, LANGUAGE_LEVELS, parseLanguages, serializeLanguages, type LanguageEntry } from './languages';

type Row = LanguageEntry & { id: string; custom: boolean };
const isListed = (language: string) => LANGUAGES.some(name => name === language);
const rowsFrom = (value: string): Row[] => parseLanguages(value).map(entry => ({
  ...entry, id: crypto.randomUUID(), custom: !isListed(entry.language),
}));

export default function LanguageEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [state, setState] = useState(() => ({ value, rows: rowsFrom(value) }));
  // Importing JSON or loading an example can replace the value while mounted.
  if (state.value !== value) setState({ value, rows: rowsFrom(value) });
  function commit(rows: Row[]) {
    const next = serializeLanguages(rows);
    setState({ value: next, rows });
    onChange(next);
  }
  function update(id: string, patch: Partial<Row>) {
    commit(state.rows.map(row => row.id === id ? { ...row, ...patch, original: undefined } : row));
  }
  return <div className="language-editor" role="group" aria-labelledby="languages-heading">
    <h2 id="languages-heading" className="field-label">Языки</h2>
    <p className="hint">В списке сначала самые распространённые языки мира — ориентировочно по общему числу говорящих, включая второй язык.</p>
    {state.rows.map((row, index) => <div className="entry-card" key={row.id}>
      <div className="entry-header">
        <h3>Язык {index + 1}</h3>
        <button type="button" className="button ghost" aria-label={`Удалить язык ${index + 1}`} onClick={() => commit(state.rows.filter(item => item.id !== row.id))}>Удалить</button>
      </div>
      <div className="field-grid">
        <label className="field"><span className="field-label">Язык</span>
          <select className="input" aria-label={`Язык ${index + 1}`} value={row.custom ? '__custom' : row.language} onChange={event => {
            const custom = event.target.value === '__custom';
            update(row.id, { custom, language: custom ? '' : event.target.value });
          }}>
            <option value="" disabled>Выберите язык</option>
            {LANGUAGES.map(language => <option key={language} value={language}>{language}</option>)}
            <option value="__custom">Другой язык…</option>
          </select>
        </label>
        <label className="field"><span className="field-label">Уровень владения</span>
          <select className="input" aria-label={`Уровень языка ${index + 1}`} value={row.level} onChange={event => update(row.id, { level: event.target.value })}>
            {!LANGUAGE_LEVELS.some(level => level.value === row.level) && <option value={row.level}>{row.level} (из резюме)</option>}
            {LANGUAGE_LEVELS.map(level => <option key={level.value} value={level.value}>{level.label}</option>)}
          </select>
        </label>
      </div>
      {row.custom && <label className="field"><span className="field-label">Название языка</span>
        <input className="input" aria-label={`Название языка ${index + 1}`} maxLength={100} value={row.language} placeholder="Например, татарский" onChange={event => update(row.id, { language: event.target.value.replace(/[\r\n]/g, '') })}/>
      </label>}
    </div>)}
    <button type="button" className="button secondary" onClick={() => commit([...state.rows, { id: crypto.randomUUID(), language: '', level: '', custom: false }])}>+ Добавить язык</button>
    <p className="hint language-level-hint">A1–A2 — базовое общение, B1–B2 — самостоятельное владение, C1–C2 — свободное владение в сложных ситуациях.</p>
  </div>;
}
