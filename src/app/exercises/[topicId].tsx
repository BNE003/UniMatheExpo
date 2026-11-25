/**
 * Übungen eines Themas nach Schwierigkeit (ExercisesView, ContentView.swift:654).
 * Alle Aufgaben sind frei (iOS: zwei pro Schwierigkeit, der Rest gesperrt).
 * Die Liste wird in einer einzigen WebView gerendert; ein Tippen auf eine Karte öffnet die Aufgabe.
 */
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui';
import { findTopic, loadExercises } from '@/content/load';
import type { Difficulty } from '@/content/types';
import { useLang, useT } from '@/i18n';
import { MathView } from '@/math/MathView';
import { exerciseListHtml } from '@/math/templates';
import { useTheme } from '@/theme/ThemeProvider';
import { appFont } from '@/theme/tokens';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

export default function ExercisesScreen() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const { colors } = useTheme();
  const lang = useLang();
  const t = useT();
  const exercises = useMemo(() => loadExercises(lang, topicId)?.exercises, [lang, topicId]);
  const topicTitle = findTopic(topicId)?.topic.title[lang] ?? '';
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);

  const filtered = useMemo(
    () => (difficulty && exercises ? exercises.filter((e) => e.difficulty === difficulty) : []),
    [difficulty, exercises],
  );
  const html = useMemo(() => exerciseListHtml(filtered, lang), [filtered, lang]);

  return (
    <View style={[styles.flex, { backgroundColor: colors.backgroundSecondary }]}>
      <Stack.Screen options={{ title: t('exercises.title', { topic: topicTitle }) }} />

      {/* Schwierigkeitsauswahl wie iOS: drei farbige Knöpfe */}
      <View style={styles.selector}>
        {DIFFICULTIES.map((d) => {
          const tint = colors.difficulty[d];
          const dimmed = difficulty !== null && difficulty !== d;
          return (
            <PressableScale
              key={d}
              accessibilityRole="button"
              accessibilityState={{ selected: difficulty === d }}
              onPress={() => setDifficulty(d)}
              style={[styles.diffButton, { backgroundColor: tint, shadowColor: tint, opacity: dimmed ? 0.55 : 1 }]}>
              <Text style={[appFont(17, 'semibold'), { color: '#FFFFFF' }]}>{t(`exercises.${d}`)}</Text>
            </PressableScale>
          );
        })}
      </View>

      {!exercises ? (
        <View style={styles.center}>
          <Text style={[appFont(17, 'semibold'), { color: colors.difficulty.hard }]}>{t('exercises.loadError')}</Text>
        </View>
      ) : difficulty === null ? (
        <View style={styles.center}>
          <Text style={[appFont(17, 'semibold'), styles.prompt, { color: colors.textSecondary }]}>{t('exercises.choose')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <MathView
            key={difficulty}
            html={html}
            estimatedHeight={filtered.length * 220}
            onAction={(value) => {
              const id = value.startsWith('open:') ? value.slice(5) : null;
              if (id) router.push({ pathname: '/exercise/[topicId]/[exerciseId]', params: { topicId, exerciseId: id } });
            }}
          />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  selector: { flexDirection: 'row', justifyContent: 'center', gap: 16, padding: 16 },
  diffButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    elevation: 3,
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  prompt: { textAlign: 'center' },
  list: { padding: 16, paddingBottom: 40 },
});
