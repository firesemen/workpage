import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { emptyResume } from '../src/model';

async function actions(page: Page, name: string) {
  await page.getByRole('button', { name: 'Действия с резюме' }).click();
  await page.getByRole('button', { name, exact: true }).click();
}
async function sample(page: Page) {
  await actions(page, 'Заполнить примером');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Текущее резюме будет заменено');
  await dialog.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await expect(page.getByLabel('Имя и фамилия', { exact: true })).toHaveValue('Александра Морозова');
}

test('starts empty, autosaves identity and restores the same data after reload', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByLabel('Имя и фамилия', { exact: true })).toHaveValue('');
  await page.getByLabel('Имя и фамилия', { exact: true }).fill('Мария Иванова');
  await page.getByLabel('Желаемая должность', { exact: true }).fill('Аналитик');
  await page.getByLabel('Электронная почта', { exact: true }).fill('maria@example.com');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('list-resume-v1') || '{}').name)).toBe('Мария Иванова');
  await page.reload();
  await expect(page.getByLabel('Имя и фамилия', { exact: true })).toHaveValue('Мария Иванова');
  await expect(page.getByLabel('Желаемая должность', { exact: true })).toHaveValue('Аналитик');
  await expect(page.getByLabel('Электронная почта', { exact: true })).toHaveValue('maria@example.com');
});

test('sample data, design selection and browser-generated PDF preserve Cyrillic text', async ({ page }) => {
  await page.goto('/');
  await sample(page);
  await page.locator('.sidebar').getByRole('button', { name: 'Оформление', exact: true }).click();
  await page.getByRole('button', { name: 'Строгий Классическая типографика' }).click();
  await expect(page.getByRole('button', { name: 'Строгий Классическая типографика' })).toHaveClass(/chosen/);
  await page.getByLabel('Плотность текста').selectOption('compact');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('list-resume-v1') || '{}').template)).toBe('classic');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Скачать PDF', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('Александра Морозова.pdf');
  const file = await download.path();
  expect(file).toBeTruthy();
  const bytes = await readFile(file!);
  expect(bytes.subarray(0, 4).toString()).toBe('%PDF');
  const task = getDocument({ data: new Uint8Array(bytes) });
  const doc = await task.promise;
  expect(doc.numPages).toBe(1);
  const pdfPage = await doc.getPage(1);
  const content = await pdfPage.getTextContent();
  const text = content.items.map(item => 'str' in item ? item.str : '').join(' ');
  expect(text).toContain('Александра Морозова');
  expect(text).toContain('Продуктовый дизайнер');
  expect(text).toContain('Студия «Среда»');
  expect(text).toContain('Английский');
  await task.destroy();
});

test('JSON backup round trip requires replacement confirmation and rejects corrupt input', async ({ page }) => {
  await page.goto('/');
  await sample(page);
  const downloadPromise = page.waitForEvent('download');
  await actions(page, 'Сохранить JSON');
  const download = await downloadPromise;
  const bytes = await readFile((await download.path())!);
  const backup = JSON.parse(bytes.toString());
  expect(backup.name).toBe('Александра Морозова');
  expect(backup.experience).toHaveLength(2);
  await page.getByLabel('Имя и фамилия', { exact: true }).fill('Другая версия');
  const jsonInput = page.locator('input[type=file][accept="application/json,.json"]');
  await jsonInput.setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{"version":1}') });
  await expect(page.getByRole('alert')).toContainText('Не удалось открыть файл');
  await expect(page.getByLabel('Имя и фамилия', { exact: true })).toHaveValue('Другая версия');
  await jsonInput.setInputFiles({ name: 'resume.json', mimeType: 'application/json', buffer: bytes });
  await expect(page.getByRole('dialog')).toContainText('Открыть резюме из файла?');
  await page.getByRole('dialog').getByRole('button', { name: 'Отмена' }).click();
  await expect(page.getByLabel('Имя и фамилия', { exact: true })).toHaveValue('Другая версия');
  await jsonInput.setInputFiles({ name: 'resume.json', mimeType: 'application/json', buffer: bytes });
  await page.getByRole('dialog').getByRole('button', { name: 'Продолжить', exact: true }).click();
  await expect(page.getByLabel('Имя и фамилия', { exact: true })).toHaveValue('Александра Морозова');
});

test('experience can be created, reordered and deleted without losing the other entry', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Разделы резюме' }).getByRole('button', { name: 'Опыт работы' }).click();
  await page.getByRole('button', { name: '+ Добавить место работы', exact: true }).click();
  await page.getByLabel('Компания', { exact: true }).fill('Первая компания');
  await page.getByRole('button', { name: '+ Добавить место работы', exact: true }).click();
  await page.getByLabel('Компания', { exact: true }).nth(1).fill('Вторая компания');
  await page.getByRole('button', { name: 'Поднять место работы 2', exact: true }).click();
  await expect(page.getByLabel('Компания', { exact: true }).first()).toHaveValue('Вторая компания');
  await page.getByRole('button', { name: 'Удалить место работы 1', exact: true }).click();
  await expect(page.getByLabel('Компания', { exact: true })).toHaveValue('Первая компания');
  await expect(page.getByLabel('Компания', { exact: true })).toHaveCount(1);
});

test('mobile editor and rendered PDF preview fit within the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByLabel('Имя и фамилия', { exact: true }).fill('Мария Иванова');
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  await expect.poll(overflow).toBe(false);
  await page.getByRole('button', { name: 'Предпросмотр PDF', exact: true }).click();
  await expect(page.getByRole('img', { name: 'Страница 1 резюме', exact: true })).toBeVisible();
  await expect.poll(overflow).toBe(false);
  await page.getByRole('button', { name: 'К редактору', exact: true }).click();
  await expect(page.getByLabel('Имя и фамилия', { exact: true })).toBeVisible();
});

async function webpPhoto(page: Page) {
  return page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 80; canvas.height = 100;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#c8ded6'; ctx.fillRect(0, 0, 80, 100);
    ctx.fillStyle = '#214e45'; ctx.fillRect(20, 20, 40, 60);
    return canvas.toDataURL('image/webp');
  });
}

async function expectPdfWithPhoto(page: Page) {
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Скачать PDF', exact: true }).click();
  const download = await downloadPromise;
  const bytes = await readFile((await download.path())!);
  expect(bytes.subarray(0, 4).toString()).toBe('%PDF');
  const task = getDocument({ data: new Uint8Array(bytes) });
  const doc = await task.promise;
  const pdfPage = await doc.getPage(1);
  const operators = await pdfPage.getOperatorList();
  expect(operators.fnArray.some(op => [OPS.paintImageXObject, OPS.paintInlineImageXObject, OPS.paintImageXObjectRepeat].includes(op))).toBe(true);
  expect(bytes.toString('latin1')).toMatch(/\/Subtype\s*\/Image/);
  await task.destroy();
}

test('WEBP photo upload normalizes to JPEG and exports an embedded PDF image without external requests', async ({ page }) => {
  const externalRequests: string[] = [];
  page.on('request', request => {
    const url = new URL(request.url());
    if (['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol) && !['127.0.0.1', 'localhost'].includes(url.hostname)) externalRequests.push(request.url());
  });
  await page.goto('/');
  await page.getByLabel('Имя и фамилия', { exact: true }).fill('Мария с фото');
  const photo = await webpPhoto(page);
  expect(photo).toMatch(/^data:image\/webp;base64,/);
  await page.getByLabel('Загрузить фото', { exact: true }).setInputFiles({
    name: 'portrait.webp', mimeType: 'image/webp', buffer: Buffer.from(photo.split(',')[1], 'base64'),
  });
  const image = page.getByRole('img', { name: 'Фото для резюме', exact: true });
  await expect(image).toHaveAttribute('src', /^data:image\/jpeg;base64,/);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('list-resume-v1') || '{}').photo?.startsWith('data:image/jpeg;base64,'))).toBe(true);
  await expectPdfWithPhoto(page);
  expect(externalRequests).toEqual([]);
});

test('JSON import with WEBP keeps the photo through normalization, confirmation, reload and PDF export', async ({ page }) => {
  await page.goto('/');
  const photo = await webpPhoto(page);
  const backup = { ...emptyResume(), name: 'Резюме с импортированным фото', photo };
  await page.locator('input[type=file][accept="application/json,.json"]').setInputFiles({
    name: 'webp-resume.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)),
  });
  await expect(page.getByRole('dialog')).toContainText('Открыть резюме из файла?');
  await page.getByRole('dialog').getByRole('button', { name: 'Продолжить', exact: true }).click();
  await expect(page.getByLabel('Имя и фамилия', { exact: true })).toHaveValue(backup.name);
  await expect(page.getByRole('img', { name: 'Фото для резюме', exact: true })).toHaveAttribute('src', /^data:image\/jpeg;base64,/);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('list-resume-v1') || '{}').photo?.startsWith('data:image/jpeg;base64,'))).toBe(true);
  await page.reload();
  await expect(page.getByRole('img', { name: 'Фото для резюме', exact: true })).toHaveAttribute('src', /^data:image\/jpeg;base64,/);
  await expectPdfWithPhoto(page);
});
