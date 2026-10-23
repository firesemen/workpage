import { Document, Font, Image, Link, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer';
import type { ReactNode } from 'react';
import type { Resume } from './model';
import { dateLabel, safeLink } from './model';

// These fonts are shipped with the application. No résumé data or font request
// needs to leave the device when a PDF is generated.
Font.register({ family: 'Noto Sans', fonts: [
  { src: '/fonts/NotoSans-Regular.ttf', fontWeight: 400 },
  { src: '/fonts/NotoSans-Bold.ttf', fontWeight: 700 },
] });
// Preserve ordinary words; exceptionally long tokens (including pasted URLs)
// receive safe break opportunities instead of extending beyond the page.
Font.registerHyphenationCallback(word => word.length > 40 ? word.match(/.{1,20}/gu) || [word] : [word]);

const styles = StyleSheet.create({
  page: { fontFamily: 'Noto Sans', color: '#26332f', fontSize: 10, lineHeight: 1.5, paddingHorizontal: 43, paddingTop: 39, paddingBottom: 72 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  identity: { flexGrow: 1, flexShrink: 1 },
  name: { fontSize: 25, lineHeight: 1.2, fontWeight: 700, marginBottom: 6 },
  role: { fontSize: 12.5, marginBottom: 7 },
  contact: { fontSize: 9, color: '#56645e', marginBottom: 1 },
  contactLink: { color: '#56645e', textDecoration: 'none' },
  photo: { width: 68, height: 82, objectFit: 'cover', marginLeft: 18, borderRadius: 4 },
  heading: { fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', paddingBottom: 5, borderBottomWidth: 0.6, marginTop: 12, marginBottom: 7 },
  text: { marginBottom: 4 },
  entry: { marginBottom: 6 },
  entryTitle: { fontSize: 11, fontWeight: 700, lineHeight: 1.4 },
  entrySubtitle: { fontSize: 10, marginTop: 1 },
  dates: { fontSize: 8.5, color: '#67736e', marginTop: 2, marginBottom: 3 },
  bullet: { marginBottom: 3, paddingLeft: 9, textIndent: -9 },
  footer: { position: 'absolute', top: 780, left: 43, width: 509, fontSize: 8, color: '#7b8580', textAlign: 'right' },
});

function Paragraphs({ text, bullets = false }: { text: string; bullets?: boolean }) {
  return <>{text.split('\n').map((line, i) => line.trim() ? <Text key={i} style={bullets ? styles.bullet : styles.text} orphans={2} widows={2}>{bullets ? `• ${line.trim().replace(/^[•\-]\s*/, '')}` : /^https?:\/\//i.test(line.trim()) && safeLink(line.trim()) ? <Link style={{ color: '#285c4f', textDecoration: 'none' }} src={safeLink(line.trim())}>{line.trim()}</Link> : line.trim()}</Text> : null)}</>;
}

function Projects({ text, keepTogether }: { text: string; keepTogether: ReadonlySet<string> }) {
  // Blank lines separate projects, while a single newline stays inside a project.
  // Normalize pasted Windows line endings and whitespace-only separator lines.
  const projects = text.replace(/\r\n?/g, '\n').trim().split(/\n(?:[ \t]*\n)+/);
  return <>{projects.map((project, projectIndex) => {
    const lines = project.split('\n').map(line => line.trim()).filter(Boolean);
    const id = `keep-project-${projectIndex}`;
    return <View key={projectIndex} id={id} wrap={!keepTogether.has(id)} style={{ marginTop: projectIndex ? 10 : 0 }}>
      {lines.map((value, lineIndex) => {
        const link = /^(https?:\/\/|www\.)/i.test(value) ? safeLink(value) : '';
        const title = lineIndex === 0;
        return <Text key={lineIndex}
          style={[styles.text, title && !link ? styles.entryTitle : {}]}
          minPresenceAhead={title && lines.length > 1 ? 28 : 0}
          orphans={2} widows={2}>
          {link ? <Link style={{ color: '#285c4f', textDecoration: 'none' }} src={link}>{value}</Link> : value}
        </Text>;
      })}
    </View>;
  })}</>;
}

function displayPhone(value: string) {
  const digits = value.replace(/\D/g, '').replace(/^8/, '7').replace(/^7/, '').slice(0, 10);
  return digits.length === 10 ? `+7 ${digits.slice(0, 3)} ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}` : value;
}

type DocumentOptions = {
  resume: Resume;
  keepTogether?: ReadonlySet<string>;
  measure?: boolean;
  onRender?: (result: unknown) => void;
};

export default function ResumeDocument({ resume: r, keepTogether = new Set<string>(), measure = false, onRender }: DocumentOptions) {
  const accent = r.template === 'modern' ? '#285c4f' : '#252b29';
  const visible = (key: string) => !r.hidden.includes(key);
  const hasExperience = r.experience.some(e => e.role.trim() || e.company.trim() || e.description.trim());
  const hasEducation = r.education.some(e => e.school.trim() || e.degree.trim() || e.year.trim());
  const heading = (title: string) => <Text style={[styles.heading, { color: accent, borderBottomColor: r.template === 'modern' ? '#b6cec3' : '#b6bab8', letterSpacing: r.template === 'modern' ? 1.2 : 0.5, textAlign: 'left' }]} wrap={false} minPresenceAhead={90}>{title}</Text>;
  const section = (key: string, title: string, children: ReactNode, lead?: ReactNode) => {
    const id = `keep-section-${key}`;
    return visible(key) ? <View id={id} wrap={!keepTogether.has(id)}>{lead ? <View wrap={false}>{heading(title)}{lead}</View> : heading(title)}{children}</View> : null;
  };
  const educationEntries = r.education.filter(e => e.school.trim() || e.degree.trim() || e.year.trim());
  const educationEntry = (e: Resume['education'][number]) => <View key={e.id} style={styles.entry}>
    <Text style={styles.entryTitle}>{e.school.trim()}</Text>
    {e.degree.trim() && <Text style={styles.entrySubtitle}>{e.degree.trim()}</Text>}
    {e.year.trim() && <Text style={styles.dates}>{e.year.trim()}</Text>}
  </View>;
  const url = safeLink(r.link);
  return <Document onRender={onRender} title={`${r.name.trim() || 'Резюме'}${r.title.trim() ? ` — ${r.title.trim()}` : ''}`} author={r.name} subject="Резюме" language="ru-RU" creator="Лист — редактор резюме">
    <Page size="A4" wrap={!measure} style={[styles.page, r.density === 'compact' ? { fontSize: 9.5, lineHeight: 1.4, paddingHorizontal: 38, paddingTop: 32 } : {}]}>
      <View style={styles.header}>
        <View style={styles.identity}>
          <Text style={[styles.name, { color: accent }]}>{r.name.trim() || 'Резюме'}</Text>
          {r.title.trim() && <Text style={styles.role}>{r.title.trim()}</Text>}
          {(r.city.trim() || r.workFormat.trim()) && <Text style={styles.contact}>{[r.city.trim(), r.workFormat.trim()].filter(Boolean).join(' · ')}</Text>}
          {(r.email.trim() || r.phone.trim()) && <Text style={styles.contact}>{r.email.trim() && <Link style={styles.contactLink} src={`mailto:${r.email.trim()}`}>{r.email.trim()}</Link>}{r.email.trim() && r.phone.trim() ? ' · ' : ''}{r.phone.trim() && <Link style={styles.contactLink} src={`tel:${r.phone.replace(/[^\d+]/g, '')}`}>{displayPhone(r.phone)}</Link>}</Text>}
          {r.link.trim() && <Text style={styles.contact}>{url ? <Link style={styles.contactLink} src={url}>{r.link.trim()}</Link> : r.link.trim()}</Text>}
          {r.salary.trim() && <Text style={styles.contact}>{r.salary.trim()}</Text>}
        </View>
        {r.photo && /^data:image\/(png|jpeg);base64,/.test(r.photo) && <Image src={r.photo} style={styles.photo} />}
      </View>
      {r.summary.trim() && section('summary', 'О себе', <Paragraphs text={r.summary} />)}
      {hasExperience && section('experience', 'Опыт работы', <>{r.experience.filter(e => e.role.trim() || e.company.trim() || e.description.trim()).map(e => <View key={e.id} style={styles.entry}>
        <View wrap={false} minPresenceAhead={e.description.trim() ? 28 : 0}>
          {e.role.trim() && <Text style={styles.entryTitle}>{e.role.trim()}</Text>}
          {e.company.trim() && <Text style={styles.entrySubtitle}>{e.company.trim()}</Text>}
          {(e.start || e.end || e.current) && <Text style={styles.dates}>{[dateLabel(e.start), e.current ? 'по настоящее время' : dateLabel(e.end)].filter(Boolean).join(' — ')}</Text>}
        </View>
        <Paragraphs text={e.description} bullets />
      </View>)}</>)}
      {hasEducation && section('education', 'Образование', <>{educationEntries.slice(1).map(educationEntry)}</>, educationEntries[0] && educationEntry(educationEntries[0]))}
      {r.skills.trim() && section('skills', 'Навыки', <Paragraphs text={r.skills} />)}
      {r.languages.trim() && section('languages', 'Языки', <Paragraphs text={r.languages} />)}
      {r.projects.trim() && section('projects', 'Проекты и ссылки', <Projects text={r.projects} keepTogether={keepTogether} />)}
      {!measure && <Text fixed wrap={false} style={styles.footer} render={({pageNumber,totalPages})=>`${pageNumber} / ${totalPages}`}/>}
    </Page>
  </Document>;
}

// Measure with the same font metrics and width as the final document. Character
// counts cannot reliably predict height (URLs, photos, font size and wrapping).
// react-pdf supplies this layout in its onRender event; isolate the internal
// payload here and validate it so a dependency change cannot silently clip text.
type LayoutNode = {
  props?: { id?: string };
  box?: { height?: number; marginTop?: number; marginBottom?: number };
  children?: LayoutNode[];
};

export async function createResumePdf(resume: Resume): Promise<Blob> {
  let layout: LayoutNode | undefined;
  await pdf(<ResumeDocument resume={resume} measure onRender={result => {
    layout = (result as { _INTERNAL__LAYOUT__DATA_?: LayoutNode })._INTERNAL__LAYOUT__DATA_;
  }} />).toBlob();
  if (!layout?.children?.length) throw new Error('Не удалось измерить разделы PDF.');
  const availableHeight = 841.89 - (resume.density === 'compact' ? 32 : 39) - 72;
  const keepTogether = new Set<string>();
  function visit(node: LayoutNode) {
    if (node.props?.id?.startsWith('keep-')) {
      const height = node.box?.height;
      if (height === undefined || !Number.isFinite(height)) throw new Error('Не удалось измерить высоту раздела PDF.');
      const outerHeight = height + (node.box?.marginTop || 0) + (node.box?.marginBottom || 0);
      if (outerHeight <= availableHeight - 1) keepTogether.add(node.props.id);
    }
    node.children?.forEach(visit);
  }
  visit(layout);
  return pdf(<ResumeDocument resume={resume} keepTogether={keepTogether} />).toBlob();
}

/** Browser-only download; object URLs are revoked after the browser starts it. */
export async function downloadResumePdf(resume: Resume) {
  const blob = await createResumePdf(resume);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${resume.name.trim().replace(/[^\p{L}\p{N}\s_-]/gu, '').slice(0, 80) || 'Резюме'}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}
