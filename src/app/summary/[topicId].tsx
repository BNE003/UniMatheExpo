/** Zusammenfassung eines Themas (TopicDetailView, ContentView.swift:1903). */
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, PressableScale } from '@/components/ui';
import { icons } from '@/content/icons';
import { findTopic, loadSummary } from '@/content/load';
import { useLang, useT } from '@/i18n';
import { MathView } from '@/math/MathView';
import { summaryHtml } from '@/math/templates';
import { useTheme } from '@/theme/ThemeProvider';
import { appFont } from '@/theme/tokens';

export default function SummaryScreen() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const { colors } = useTheme();
  const lang = useLang();
  const t = useT();
  const insets = useSafeAreaInsets();
  const summary = loadSummary(lang, topicId);
  const title = findTopic(topicId)?.topic.title[lang] ?? summary?.title ?? '';

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title }} />
      <ScrollView contentContainerStyle={styles.content}>
        {summary?.html ? (
          <MathView html={summaryHtml(summary.html)} estimatedHeight={800} />
        ) : (
          <Text style={[appFont(16), { color: colors.text }]}>{summary?.description}</Text>
        )}
      </ScrollView>
      {/* Button „Schritt für Schritt Erklärung“ wie in TopicDetailView */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 10, backgroundColor: colors.surface }]}>
        <PressableScale
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/lesson/[topicId]', params: { topicId } })}
          style={[styles.button, { backgroundColor: colors.accent }]}>
          <Icon name={icons.stepByStep} size={20} color="#FFFFFF" />
          <Text style={[appFont(17, 'semibold'), { color: '#FFFFFF' }]}>{t('summary.stepByStep')}</Text>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 8, paddingBottom: 24 },
  footer: { paddingHorizontal: 16, paddingTop: 10 },
  button: { height: 52, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
