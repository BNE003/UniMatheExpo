/** Themenraster eines Kurses (SubTopicsView.swift). */
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { SubTopicCard } from '@/components/TopicCards';
import { PressableScale, ScreenBackground } from '@/components/ui';
import { findCourse } from '@/content/load';
import { useLang, useT } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { appFont } from '@/theme/tokens';

export default function CourseScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const course = findCourse(courseId);
  const { colors } = useTheme();
  const lang = useLang();
  const t = useT();

  if (!course) return <Text style={{ color: colors.text, padding: 24 }}>{t('common.loadError')}</Text>;

  // Zwei Spalten wie LazyVGrid mit zwei flexiblen Spalten
  const rows: (typeof course.topics)[] = [];
  for (let i = 0; i < course.topics.length; i += 2) rows.push(course.topics.slice(i, i + 2));

  return (
    <View style={styles.flex}>
      <Stack.Screen options={{ title: course.title[lang], headerTransparent: false }} />
      <ScreenBackground variant="subtopics" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[appFont(22, 'bold'), styles.heading, { color: colors.text }]}>{t('subtopics.heading')}</Text>
        {rows.map((row) => (
          <View key={row[0].id} style={styles.row}>
            {row.map((topic) => (
              <PressableScale
                key={topic.id}
                style={styles.cell}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/topic/[topicId]', params: { topicId: topic.id } })}>
                <SubTopicCard id={topic.id} icon={topic.icon} title={topic.title[lang]} />
              </PressableScale>
            ))}
            {row.length === 1 && <View style={styles.cell} />}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 16 },
  heading: { marginBottom: 0 },
  row: { flexDirection: 'row', gap: 16 },
  cell: { flex: 1 },
});
