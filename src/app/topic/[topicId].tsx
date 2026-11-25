/** Themenseite mit drei Kacheln (ContentSelectionView, SubTopicsView.swift:476). */
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { LearnHeroCard, TopicActionTile } from '@/components/TopicCards';
import { PressableScale } from '@/components/ui';
import { icons } from '@/content/icons';
import { findTopic } from '@/content/load';
import { useLang, useT } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { displayFont, monoFont } from '@/theme/tokens';

export default function TopicScreen() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const found = findTopic(topicId);
  const { colors } = useTheme();
  const lang = useLang();
  const t = useT();

  if (!found) return <Text style={{ color: colors.text, padding: 24 }}>{t('common.loadError')}</Text>;
  const { course, topic } = found;
  const eyebrow = `${course.title[lang].toUpperCase()} / ${String(topic.position).padStart(2, '0')}`;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: colors.textSecondary }]} numberOfLines={1}>
          {eyebrow}
        </Text>
        <Text style={[displayFont(34), styles.title, { color: colors.text }]}>{topic.title[lang]}</Text>
      </View>

      <View style={styles.tiles}>
        <PressableScale
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/lesson/[topicId]', params: { topicId: topic.id } })}>
          <LearnHeroCard />
        </PressableScale>
        <View style={styles.row}>
          <PressableScale
            style={styles.cell}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/summary/[topicId]', params: { topicId: topic.id } })}>
            <TopicActionTile
              icon={icons.summary}
              tint={colors.orange}
              number="02"
              title={t('topic.summary.title')}
              subtitle={t('topic.summary.subtitle')}
            />
          </PressableScale>
          <PressableScale style={styles.cell} accessibilityRole="button" disabled>
            {/* Übungen mit Antwortprüfung: Meilenstein M4 */}
            <TopicActionTile
              icon={icons.exercises}
              tint={colors.accent}
              number="03"
              title={t('topic.exercises.title')}
              subtitle={t('notPorted.title')}
            />
          </PressableScale>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120, gap: 24 },
  header: { gap: 10 },
  eyebrow: { fontFamily: monoFont, fontSize: 12 },
  title: { letterSpacing: -0.5 },
  tiles: { gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  cell: { flex: 1 },
});
