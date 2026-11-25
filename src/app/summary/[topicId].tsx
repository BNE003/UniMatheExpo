/** Zusammenfassung eines Themas (TopicDetailView, ContentView.swift:1903). */
import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { findTopic, loadSummary } from '@/content/load';
import { useLang } from '@/i18n';
import { MathView } from '@/math/MathView';
import { summaryHtml } from '@/math/templates';
import { useTheme } from '@/theme/ThemeProvider';
import { appFont } from '@/theme/tokens';

export default function SummaryScreen() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const { colors } = useTheme();
  const lang = useLang();
  const insets = useSafeAreaInsets();
  const summary = loadSummary(lang, topicId);
  const title = findTopic(topicId)?.topic.title[lang] ?? summary?.title ?? '';

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        {summary?.html ? (
          <MathView html={summaryHtml(summary.html)} estimatedHeight={800} />
        ) : (
          <Text style={[appFont(16), { color: colors.text }]}>{summary?.description}</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 8 },
});
