import { StyleSheet, Text, View } from '@react-pdf/renderer';
import { groupSkills, type SkillGroupAssignments } from './skills';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  group: { width: '48%' },
  left: { marginRight: '4%' },
  heading: { fontSize: 10, fontWeight: 700, lineHeight: 1.4, marginBottom: 6 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' },
  tag: { fontSize: 9.5, lineHeight: 1.4, borderWidth: 0.5, borderRadius: 3, paddingVertical: 3, paddingHorizontal: 6, marginRight: 5, marginBottom: 5, maxWidth: '100%' },
});

export default function ResumeSkills({ text, assignments, keepTogether, modern }: {
  text: string; assignments?: SkillGroupAssignments; keepTogether: ReadonlySet<string>; modern: boolean;
}) {
  const groups = groupSkills(text, assignments);
  const rows = Array.from({ length: Math.ceil(groups.length / 2) }, (_, index) => groups.slice(index * 2, index * 2 + 2));
  return <>{rows.map((row, rowIndex) => {
    const rowId = `keep-skills-row-${rowIndex}`;
    return <View key={rowId} id={rowId} wrap={!keepTogether.has(rowId)} style={styles.row}>
      {row.map((group, column) => {
        const groupId = `keep-skills-group-${rowIndex}-${column}`;
        return <View key={groupId} id={groupId} wrap={!keepTogether.has(groupId)} style={[styles.group, column === 0 ? styles.left : {}]}>
          <Text style={[styles.heading, { color: modern ? '#285c4f' : '#26332f' }]} minPresenceAhead={30}>{group.name}</Text>
          <View style={styles.tags}>
            {group.skills.map((skill, index) => <Text key={index} orphans={2} widows={2}
              style={[styles.tag, { backgroundColor: modern ? '#f1f5ee' : '#fafafa', borderColor: modern ? '#cfddcf' : '#d9ddda' }]}>{skill}</Text>)}
          </View>
        </View>;
      })}
    </View>;
  })}</>;
}
