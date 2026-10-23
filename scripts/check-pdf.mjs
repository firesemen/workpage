// A real renderer + parser check, not a snapshot of React component structure.
import { build } from 'esbuild';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const root = path.resolve(import.meta.dirname, '..');
const work = path.join(root, 'node_modules/.cache/workpage-pdf-check');
await mkdir(work, { recursive: true });
const modulePath = path.join(work, 'renderer.mjs');
await build({
  stdin: {
    resolveDir: root,
    loader: 'tsx',
    contents: `import React from 'react';
      import { Font, renderToBuffer } from '@react-pdf/renderer';
      import ResumeDocument from './src/ResumeDocument';
      import { sampleResume, emptyResume } from './src/model';
      // Component font URLs are web-root URLs. Replace their registered sources
      // with absolute local paths for this Node test, retaining built-in fonts.
      const family = Font.getRegisteredFonts()['Noto Sans'];
      for (const source of family.sources) source.src = ${JSON.stringify(path.join(root, 'public'))} + source.src;
      export { sampleResume, emptyResume };
      export const render = resume => renderToBuffer(<ResumeDocument resume={resume}/>);`,
  },
  bundle: true, platform: 'node', format: 'esm', packages: 'external', outfile: modulePath,
});
const { render, sampleResume, emptyResume } = await import(pathToFileURL(modulePath));

async function inspect(name, resume, expected, minPages = 1, maxPages = 20, absent = []) {
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
await rm(modulePath);
console.log(`PDF artifacts: ${work}`);
