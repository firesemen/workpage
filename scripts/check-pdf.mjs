// A real renderer + parser check, not a snapshot of React component structure.
import { build } from 'esbuild';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { Font } from '@react-pdf/renderer';

const root = path.resolve(import.meta.dirname, '..');
const work = path.join(root, 'node_modules/.cache/workpage-pdf-check');
await mkdir(work, { recursive: true });
const modulePath = path.join(work, 'renderer.mjs');
await build({
  stdin: {
    resolveDir: root,
    loader: 'tsx',
    contents: `import React from 'react';
      import { Font } from '@react-pdf/renderer';
      import { createResumePdf } from './src/ResumeDocument';
      import { sampleResume, emptyResume } from './src/model';
      // Component font URLs are web-root URLs. Replace their registered sources
      // with absolute local paths for this Node test, retaining built-in fonts.
      const family = Font.getRegisteredFonts()['Noto Sans'];
      for (const source of family.sources) source.src = ${JSON.stringify(path.join(root, 'public'))} + source.src;
      export { sampleResume, emptyResume };
      export const render = async resume => Buffer.from(await (await createResumePdf(resume)).arrayBuffer());`,
  },
  bundle: true, platform: 'node', format: 'esm', packages: 'external', outfile: modulePath,
});
const { render, sampleResume, emptyResume } = await import(pathToFileURL(modulePath));
const initialFonts = Font.getRegisteredFontFamilies();

async function inspect(name, resume, expected, minPages = 1, maxPages = 20, absent = [], checkPage = () => {}) {
  const bytes = await render(resume);
  const filename = path.join(work, name + '.pdf');
  await writeFile(filename, bytes);
  const task = getDocument({ data: new Uint8Array(bytes), useSystemFonts: false });
  const doc = await task.promise;
  assert(doc.numPages >= minPages && doc.numPages <= maxPages, `${name}: unexpected page count ${doc.numPages}`);
  let all = '';
  const fontNames = new Set();
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    assert(Math.abs(page.view[2] - 595.28) < 1 && Math.abs(page.view[3] - 841.89) < 1, 'Must be A4');
    const content = await page.getTextContent();
    checkPage(content.items.filter(item => 'str' in item && item.str.trim()), n);
    assert(content.items.length > 0, `${name}: empty page ${n}`);
    for (const item of content.items) {
      if (!('str' in item)) continue;
      all += item.str + ' ';
      if (!item.str.trim()) continue;
      fontNames.add(item.fontName);
      const [, , , , x, y] = item.transform;
      assert(x >= 25 && x + item.width <= page.view[2] - 25, `${name}: text outside horizontal margins on page ${n}: ${item.str}`);
      const isFooter = /^\d+ \/ \d+$/.test(item.str);
      assert(y >= (isFooter ? 15 : 72), `${name}: text overlaps footer on page ${n}: ${item.str}`);
      assert(y <= page.view[3] - 20, `${name}: text outside top margin on page ${n}`);
    }
    assert(content.items.some(item => 'str' in item && item.str === `${n} / ${doc.numPages}`), `${name}: missing page number ${n}`);
    const meaningful = content.items.filter(item => 'str' in item && item.str.trim() && !/^\d+ \/ \d+$/.test(item.str));
    const lastText = meaningful.at(-1)?.str.replace(/\s/g, '');
    assert(!['ОСЕБЕ', 'ОПЫТРАБОТЫ', 'ОБРАЗОВАНИЕ', 'НАВЫКИ', 'ЯЗЫКИ', 'ПРОЕКТЫИССЫЛКИ'].includes(lastText), `${name}: orphan section heading on page ${n}`);
    const annotations = await page.getAnnotations();
    if (n === 1 && resume.email) assert(annotations.some(a => a.url?.startsWith('mailto:')), 'Email must be clickable');
    if (resume.projects?.startsWith('https://') && all.includes('https://example.org')) assert(annotations.some(a => a.url?.startsWith('https://example.org')), 'Project URL must be clickable');
  }
  for (const text of expected) assert(all.includes(text), `${name}: missing selectable text ${text}`);
  for (const text of absent) assert(!all.includes(text), `${name}: hidden section leaked ${text}`);
  const raw = bytes.toString('latin1');
  assert(raw.includes('/FontFile2'), `${name}: TrueType font must be embedded`);
  assert(fontNames.size > 0);
  await task.destroy();
  console.log(`PASS ${name}: ${doc.numPages} A4 page(s), Cyrillic text, embedded fonts, links and bounds`);
  return all;
}

for (const template of ['modern', 'classic']) {
  const normal = { ...sampleResume(), template };
  await inspect(template, normal, ['Александра Морозова', 'Английский', 'Студия «Среда»'], 1, 1);
  const long = { ...normal, experience: [{ ...normal.experience[0], description: Array.from({ length: 100 }, (_, i) => `Достижение ${i + 1}: разработала и проверила интерфейс для большой команды.`).join('\n') }] };
  await inspect(template + '-long', long, ['Достижение 1:', 'Достижение 100:', 'Английский'], 3);
  const hidden = { ...normal, hidden: ['experience', 'education', 'skills', 'languages', 'summary'] };
  await inspect(template + '-hidden', hidden, ['Александра Морозова'], 1, 1, ['Студия «Среда»', 'Figma', 'Английский', 'Соединяю']);
}
await inspect('empty', emptyResume(), ['Резюме'], 1, 1);
const longTokens = { ...emptyResume(), name: 'Проверка длинных строк', link: 'https://example.org/' + 'portfolio'.repeat(24), projects: 'https://example.org/project\n' + 'Сверхдлинноеслово'.repeat(22) };
await inspect('long-tokens', longTokens, ['Проверка длинных строк', 'https://example.org/project'], 1, 2);
// Verify actual PDF spacing, title weights and preserved line breaks, including
// Windows newlines and separator lines containing spaces/tabs.
for (const template of ['modern', 'classic']) {
  const projects = 'Генератор резюме\r\nОписание первого проекта\r\nhttps://example.org/resume\r\n \t\r\nУчастие в конференции\r\nТема: разработка демонстрационных проектов\r\n\r\n\r\nУчебный проект\r\nТема: моделирование космических данных';
  await inspect(`${template}-project-groups`, { ...emptyResume(), template, projects },
    ['Генератор резюме', 'Участие в конференции', 'Учебный проект'], 1, 1, [], items => {
      const item = text => {
        const found = items.find(i => i.str === text);
        assert(found, `Missing project line: ${text}`);
        return found;
      };
      const first = item('Генератор резюме');
      const description = item('Описание первого проекта');
      const url = item('https://example.org/resume');
      const second = item('Участие в конференции');
      const secondBody = item('Тема: разработка демонстрационных проектов');
      const third = item('Учебный проект');
      assert(first.transform[5] > description.transform[5] && description.transform[5] > url.transform[5], 'Single newlines must remain separate lines');
      const normalGap = description.transform[5] - url.transform[5];
      assert(url.transform[5] - second.transform[5] >= normalGap + 8, 'Projects need a visible gap');
      assert(secondBody.transform[5] - third.transform[5] >= normalGap + 8, 'Every blank-line group needs a gap');
      assert(first.fontName !== description.fontName, 'Project titles must use bold type');
      assert(second.fontName === first.fontName && third.fontName === first.fontName, 'Every project needs a title');
    });
}
const manyProjects = Array.from({ length: 20 }, (_, i) => `Проект номер ${i + 1}\nОписание проекта ${i + 1}\nЕщё одна строка описания`).join('\n\n');
await inspect('project-groups-pagination', { ...emptyResume(), projects: manyProjects },
  ['Проект номер 20', 'Описание проекта 20'], 2, 5, [], items => {
    for (const title of items.filter(i => /^Проект номер \d+$/.test(i.str))) {
      const number = title.str.match(/\d+$/)[0];
      assert(items.some(i => i.str === `Описание проекта ${number}`), 'Project title must stay with its description');
    }
  });
// A section which fits a fresh page must move as a whole, not leave its
// heading/first project in the last few lines of the preceding page.
for (const template of ['modern', 'classic']) {
  for (const density of ['normal', 'compact']) {
    const projects = Array.from({ length: 3 }, (_, i) => `Целый проект ${i + 1}\nОписание целого проекта ${i + 1}\nРезультат целого проекта ${i + 1}`).join('\n\n');
    const boundaryResume = {
      ...emptyResume(), template, density,
      summary: Array.from({ length: 28 }, (_, i) => `Подготовительный текст ${i + 1}`).join('\n'),
      projects,
    };
    await inspect(`${template}-${density}-whole-projects`, boundaryResume,
      ['Целый проект 1', 'Результат целого проекта 3'], 2, 2, [], (items, page) => {
        const heading = items.some(i => i.str.replace(/\s/g, '') === 'ПРОЕКТЫИССЫЛКИ');
        const projectLines = items.filter(i => /[Цц]елого? проект|Целый проект/.test(i.str));
        if (page === 1) {
          assert(!heading && projectLines.length === 0, 'The first page must not retain any part of the project section');
        } else {
          assert(heading, 'Moved section needs its heading');
          for (let n = 1; n <= 3; n++) {
            for (const line of [`Целый проект ${n}`, `Описание целого проекта ${n}`, `Результат целого проекта ${n}`]) {
              assert(items.some(i => i.str === line), `Project section lost ${line}`);
            }
          }
        }
      });
  }
}

// The policy applies to other sections too, including the first section after
// a tall header. Oversize sections remain covered by the long-resume cases.
const filler = Array.from({ length: 28 }, (_, i) => `Предыдущий раздел ${i + 1}`).join('\n');
const cases = [
  ['summary', { title: Array(32).fill('Строка шапки').join('\n'), summary: Array(10).fill('Содержимое раздела').join('\n') }, 'ОСЕБЕ'],
  ['experience', { summary: filler, experience: [{ id: 'whole', company: 'Компания', role: 'Должность', start: '', end: '', current: false, description: Array(10).fill('Содержимое раздела').join('\n') }] }, 'ОПЫТРАБОТЫ'],
  ['education', { summary: filler, education: Array.from({length: 5}, (_, i) => ({ id: `whole-${i}`, school: 'Содержимое раздела', degree: 'Образовательная программа', year: '2026' })) }, 'ОБРАЗОВАНИЕ'],
  ['skills', { summary: filler, skills: Array(10).fill('Содержимое раздела').join('\n') }, 'НАВЫКИ'],
  ['languages', { summary: filler, languages: Array(10).fill('Содержимое раздела').join('\n') }, 'ЯЗЫКИ'],
];
for (const [name, data, headingText] of cases) {
  await inspect(`whole-${name}`, { ...emptyResume(), ...data }, ['Содержимое раздела'], 2, 2, [], (items, page) => {
    const hasHeading = items.some(i => i.str.replace(/\s/g, '') === headingText);
    const body = items.filter(i => i.str.includes('Содержимое раздела'));
    if (page === 1) assert(!hasHeading && !body.length, `Section ${name} must move completely`);
    else assert(hasHeading && body.length, `Section ${name} must retain its heading and body`);
  });
}
const groupedSkills = 'Python, C, C++, Golang, Assembler, Docker, Git, Проектирование БД, ООП, promt engineering, R, SQL, Flask, PostgreSQL, pandas, NumPy, Linux, Алгоритмы и структуры данных, Анализ данных, Дообучение ИИ-моделей, PyTorch, Машинное обучение';
for (const template of ['modern', 'classic']) {
  await inspect(`skills-groups-${template}`, { ...emptyResume(), template, skills: groupedSkills },
    groupedSkills.split(', '), 1, 1, [], items => {
      const find = text => {
        const item = items.find(i => i.str === text);
        assert(item, `Missing skill/group: ${text}`);
        return item;
      };
      const left = find('Языки');
      const right = find('Backend и базы данных');
      assert(right.transform[4] - left.transform[4] > 240, 'Skill groups need distinct columns');
      assert(Math.abs(right.transform[5] - left.transform[5]) < 1, 'First pair of group headings must align');
      assert(find('Python').transform[5] < left.transform[5], 'Badges belong below their heading');
      for (const skill of ['Python', 'C', 'C++', 'Golang', 'Assembler', 'R']) {
        const item = find(skill);
        assert(item.transform[4] + item.width < right.transform[4] - 8, 'Left-column skill crossed into right column');
      }
      const ordered = items.map(i => i.str);
      assert(ordered.indexOf('R') < ordered.indexOf('Backend и базы данных'), 'Extraction must finish the left group before the right group');
      assert(ordered.indexOf('PostgreSQL') < ordered.indexOf('Анализ данных'), 'Extraction must finish a row before the next row');
    });
}
const longSkillNames = Array.from({ length: 65 }, (_, i) => `Пользовательский навык номер ${i + 1}`);
const longSkillText = await inspect('skills-oversize-group', {
  ...emptyResume(), skills: [...longSkillNames, 'SQL'].join(', '),
  skillGroups: Object.fromEntries(longSkillNames.map(name => [name.toLowerCase(), 'Языки'])),
}, [...longSkillNames, 'SQL'], 2, 6);
assert.equal((longSkillText.match(/SQL/g) || []).length, 1, 'Short right-column group must not duplicate across pages');
await inspect('skills-long-label', {
  ...emptyResume(), skills: 'Навык с очень длинным названием для проверки переноса внутри метки, ' + 'Длинноеназваниенавыка'.repeat(9),
}, ['Навык с очень длинным'], 1, 2);
// Preview and download can overlap, and each must keep its own glyph mapping.
// Exercise this after different earlier documents have warmed renderer caches.
await Promise.all(['Alpha', 'Beta'].map(name => inspect(`skills-concurrent-${name}`, {
  ...emptyResume(), name, skills: groupedSkills,
  email: `${name}@example.com`, link: `https://example.com/${name}/Python`,
}, [name, ...groupedSkills.split(', '), `${name}@example.com`, `https://example.com/${name}/Python`], 1, 1)));
assert.deepEqual(Font.getRegisteredFontFamilies(), initialFonts, 'Exports must clean up temporary fonts without removing shared fonts');
await rm(modulePath);
console.log(`PDF artifacts: ${work}`);
