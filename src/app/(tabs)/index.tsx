/** Startseite mit Kursliste (ContentView.swift). */
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CourseCard } from '@/components/TopicCards';
import { PressableScale, ScreenBackground } from '@/components/ui';
import { manifest } from '@/content/load';
import { useLang, useT } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { displayFont, withAlpha } from '@/theme/tokens';

export default function HomeScreen() {
  const { colors, scheme } = useTheme();
  const lang = useLang();
  const t = useT();
  const insets = useSafeAreaInsets();
  const titleColor = scheme === 'dark' ? '#FFFFFF' : colors.accent;
  const titleStyle = [
    displayFont(42),
    styles.title,
    {
      color: titleColor,
      textShadowColor: withAlpha(scheme === 'dark' ? '#FFFFFF' : colors.accent, 0.15),
    },
  ];

  return (
    <View style={styles.flex}>
      <ScreenBackground />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}>
        <View style={styles.header}>
          <Text style={titleStyle}>{t('home.title1')}</Text>
          <Text style={titleStyle}>{t('home.title2')}</Text>
        </View>
        {/* LearningPlanProgressCard folgt mit dem Lernplan (Meilenstein M5/M10). */}
        <View style={styles.list}>
          {manifest.courses.map((course) => (
            <PressableScale
              key={course.id}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/course/[courseId]', params: { courseId: course.id } })}>
              <CourseCard id={course.id} icon={course.icon} title={course.title[lang]} description={course.description[lang]} />
            </PressableScale>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: 32 },
  header: { paddingHorizontal: 24, paddingBottom: 8 },
  title: { textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4, lineHeight: 50 },
  list: { padding: 16, gap: 16 },
});
