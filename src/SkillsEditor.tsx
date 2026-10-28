import { useId, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { addSkills, parseSkills, searchSkills, suggestSkills, groupSkills, skillKey, SKILL_GROUPS, type SkillGroupAssignments } from './skills';

export default function SkillsEditor({ value, onChange, assignments = {}, onGroupsChange }: {
  value: string; onChange: (value: string) => void;
  assignments?: SkillGroupAssignments; onGroupsChange: (groups: SkillGroupAssignments) => void;
}) {
  const id = useId();
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const selected = parseSkills(value);
  const matches = searchSkills(query, value);
  const suggestions = suggestSkills(value);
  const categories = [...new Set(matches.map(skill => skill.category))];
  const groups = groupSkills(value, assignments);

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
    {selected.length > 0 && <>
      <div className="selected-skill-groups" role="list" aria-label="Добавленные навыки">
        {groups.map(group => <section className="selected-skill-group" key={group.name}>
          <h3>{group.name}</h3><div className="skill-tags">
            {group.skills.map((skill, index) => <div className="skill-tag" role="listitem" key={`${index}-${skill}`}>
              <span>{skill}</span>
              <button type="button" aria-label={`Удалить навык ${skill}`} onClick={() => {
                const removeAt = selected.indexOf(skill);
                onChange(selected.filter((_, i) => i !== removeAt).join(', '));
                setNotice(`Удалён навык: ${skill}`);
              }}><X size={14}/></button>
            </div>)}
          </div>
        </section>)}
      </div>
      <details className="skill-group-settings"><summary>Изменить группы навыков</summary>
        <p className="hint">Группы предложены автоматически. В PDF они расположены в две колонки.</p>
        {groups.flatMap(group => group.skills.map((skill, index) => <label className="field" key={`${group.name}-${index}`}>
          <span className="field-label">{skill}</span>
          <select className="input" aria-label={`Группа навыка ${skill}`} value={group.name}
            onChange={event => onGroupsChange({ ...assignments, [skillKey(skill)]: event.target.value })}>
            {!SKILL_GROUPS.some(name => name === group.name) && <option>{group.name}</option>}
            {SKILL_GROUPS.map(name => <option key={name}>{name}</option>)}
          </select>
        </label>))}
      </details>
    </>}
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
