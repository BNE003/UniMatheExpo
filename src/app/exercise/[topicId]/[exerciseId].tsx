/**
 * Einzelne Übung (Views/ExerciseDetailView.swift): Aufgabe, „Lösung anzeigen“, dann Schritt für Schritt.
 * Alle Lösungsschritte sind frei (iOS: Paywall ab Schritt 9).
 */
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui';
import { loadExercises } from '@/content/load';
import { useLang, useT } from '@/i18n';
import { MathView } from '@/math/MathView';
import { exerciseDetailHtml, exerciseStepsHtml } from '@/math/templates';
import { useTheme } from '@/theme/ThemeProvider';
import { appFont } from '@/theme/tokens';

export default function ExerciseScreen() {
  const { topicId, exerciseId } = useLocalSearchParams<{ topicId: string; exerciseId: string }>();
  const { colors } = useTheme();
  const lang = useLang();
  const t = useT();
  const exercise = useMemo(
    () => loadExercises(lang, topicId)?.exercises.find((e) => String(e.id) === exerciseId),
    [lang, topicId, exerciseId],
  );
  const [visibleSteps, setVisibleSteps] = useState(0);

  if (!exercise) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[appFont(17, 'semibold'), { color: colors.difficulty.hard }]}>{t('exercises.loadError')}</Text>
      </View>
    );
  }

  const total = exercise.solutionSteps.length;
  const button = (label: string, onPress: () => void) => (
    <PressableScale accessibilityRole="button" onPress={onPress} style={[styles.button, { backgroundColor: colors.accent }]}>
      <Text style={[appFont(17, 'semibold'), { color: '#FFFFFF' }]}>{label}</Text>
    </PressableScale>
  );

  return (
    <ScrollView style={{ backgroundColor: colors.backgroundSecondary }} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: t('exercise.title') }} />
      <MathView html={exerciseDetailHtml(exercise.title, exercise.description)} estimatedHeight={160} />
      {visibleSteps === 0 ? (
        button(t('exercise.showSolution'), () => setVisibleSteps(1))
      ) : (
        <>
          <MathView html={exerciseStepsHtml(exercise.solutionSteps.slice(0, visibleSteps), lang)} estimatedHeight={visibleSteps * 140} />
          {visibleSteps < total && button(t('exercise.nextStep'), () => setVisibleSteps((v) => Math.min(total, v + 1)))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: { padding: 16, gap: 24, paddingBottom: 48 },
  button: { height: 54, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
