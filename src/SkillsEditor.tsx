import { useId, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { addSkills, parseSkills, searchSkills, suggestSkills } from './skills';

export default function SkillsEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const id = useId();
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const selected = parseSkills(value);
  const matches = searchSkills(query, value);
  const suggestions = suggestSkills(value);
  const categories = [...new Set(matches.map(skill => skill.category))];

  function add(input: string) {
    const next = addSkills(value, input);
    if (next.length > 30000) {
      setNotice('Список слишком длинный. Сократите его перед добавлением навыков.');
      return;
    }
    if (next === value) {
      setNotice('Этот навык уже добавлен.');
      return;
    }
    onChange(next);
    setQuery('');
    setNotice('Навык добавлен.');
  }

  return <section className="skills-picker" aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`} className="field-label">Профессиональные навыки</h2>
    <p className="hint">Выберите из списка или введите свой навык. Несколько навыков можно вставить через запятую.</p>
    {selected.length > 0 && <ul className="skill-tags" aria-label="Добавленные навыки">
      {selected.map((skill, index) => <li key={`${index}-${skill}`}>
        <span>{skill}</span>
        <button type="button" aria-label={`Удалить навык ${skill}`} onClick={() => {
          onChange(selected.filter((_, i) => i !== index).join(', '));
          setNotice(`Удалён навык: ${skill}`);
        }}><X size={14}/></button>
      </li>)}
    </ul>}
    <label className="field"><span className="field-label">Найти или ввести навык</span>
      <input className="input" value={query} maxLength={500} placeholder="Например, Python, React или Figma" onChange={event => setQuery(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Enter' && !event.nativeEvent.isComposing && query.trim()) {
            event.preventDefault(); add(query);
          }
        }}/>
    </label>
    <div className="skill-select-row">
      <label className="field"><span className="field-label">Выбрать навык из списка</span>
        <select className="input" value="" onChange={event => { if (event.target.value) add(event.target.value); }}>
          <option value="" disabled>{matches.length ? 'Выберите навык' : 'Нет совпадений — добавьте свой'}</option>
          {categories.map(category => <optgroup key={category} label={category}>
            {matches.filter(skill => skill.category === category).map(skill => <option key={skill.name} value={skill.name}>{skill.name}</option>)}
          </optgroup>)}
        </select>
      </label>
      <button type="button" className="button secondary" disabled={!query.trim()} onClick={() => add(query)}><Plus size={15}/>Добавить введённое</button>
    </div>
    <p className="hint skill-notice" role="status">{notice}</p>
    {suggestions.length > 0 && <div className="skill-suggestions" role="group" aria-label="Связанные навыки">
      <h3>Возможно, вы также владеете</h3>
      <p className="hint">Связано с вашим стеком. Добавляйте только то, с чем действительно работали.</p>
      <div className="skill-suggestion-list">{suggestions.map(skill => <button type="button" key={skill.name} aria-label={`Добавить навык ${skill.name}`} onClick={() => add(skill.name)}>
        <span><Plus size={14}/><strong>{skill.name}</strong></span>
        <small>Связано с: {skill.basedOn.join(', ')}</small>
      </button>)}</div>
    </div>}
  </section>;
}
