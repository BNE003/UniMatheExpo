/** Klausurliste (ÜbungsklausurenView.swift). Alle Klausuren sind frei zugänglich. */
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, PressableScale, ScreenBackground } from '@/components/ui';
import { icons, topicIcon } from '@/content/icons';
import { manifest } from '@/content/load';
import type { ExamEntry } from '@/content/types';
import { useLang, useT } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { appFont, displayFont, withAlpha } from '@/theme/tokens';

function ExamCard({ exam }: { exam: ExamEntry }) {
  const { colors, scheme } = useTheme();
  const lang = useLang();
  const t = useT();
  const dark = scheme === 'dark';
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: dark ? 'rgb(54, 61, 74)' : colors.surface,
          borderColor: dark ? 'rgba(255,255,255,0.08)' : colors.border,
          shadowColor: exam.color,
        },
      ]}>
      <View style={[styles.iconCircle, { backgroundColor: withAlpha(exam.color, 0.12) }]}>
        <Icon name={topicIcon(exam.icon)} size={24} color={exam.color} />
      </View>
      <View style={styles.titles}>
        <Text style={[appFont(18, 'bold'), { color: colors.text }]}>{exam.title[lang]}</Text>
        <Text style={[appFont(13, 'medium'), { color: colors.textSecondary }]} numberOfLines={2}>
          {exam.subtitle[lang]}
        </Text>
      </View>
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Icon name={icons.clock} size={13} color={exam.color} />
          <Text style={[appFont(12, 'medium'), { color: colors.textSecondary }]}>{exam.durationMinutes} min</Text>
        </View>
        <View style={styles.stat}>
          <Icon name={icons.question} size={13} color={exam.color} />
          <Text style={[appFont(12, 'medium'), { color: colors.textSecondary }]}>{exam.questions}</Text>
        </View>
      </View>
      <View style={styles.startRow}>
        <Text style={[appFont(13, 'semibold'), { color: exam.color }]}>{t('exams.start')}</Text>
        <Icon name={icons.startCircle} size={16} color={exam.color} />
      </View>
    </View>
  );
}

export default function ExamsScreen() {
  const { colors, scheme } = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.flex}>
      <ScreenBackground />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]} showsVerticalScrollIndicator={false}>
        <Text
          style={[
            displayFont(42),
            styles.title,
            { color: scheme === 'dark' ? '#FFFFFF' : colors.accent, textShadowColor: withAlpha(colors.accent, 0.15) },
          ]}>
          {t('exams.title')}
        </Text>
        {manifest.exams.map((exam, index) => (
          <Animated.View key={exam.key} entering={FadeInDown.delay(index * 80).springify().damping(16)}>
            <PressableScale
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/exam/[examKey]', params: { examKey: exam.key } })}>
              <ExamCard exam={exam} />
            </PressableScale>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 120, gap: 24 },
  title: { textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4, lineHeight: 50 },
  card: {
    padding: 22,
    gap: 18,
    borderRadius: 18,
    borderWidth: 1,
    elevation: 4,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  iconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  titles: { gap: 6 },
  stats: { flexDirection: 'row', gap: 24 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  startRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 6 },
});
