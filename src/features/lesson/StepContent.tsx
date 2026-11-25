/**
 * Inhalt eines Lektionsschritts (ExplanationContent, ContentView.swift:1303):
 * „SCHRITT 01“ → Text → Grafik → Formel → Erklärung → Merke.
 */
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { LessonStep } from '@/content/types';
import { useLang, useT } from '@/i18n';
import { MathView } from '@/math/MathView';
import { lessonStepSegments } from '@/math/templates';
import { useTheme } from '@/theme/ThemeProvider';
import { appFont } from '@/theme/tokens';
import { AnimatedFigure } from '@/visuals/AnimatedFigure';
import { resolveFigure } from '@/visuals/registry';

/** Grobe Startschätzung der Höhe wie in LessonRichText.init, damit wenig springt. */
function estimateHeight(text: string) {
  const lines = text.length / 34 + text.split('\n').length;
  return Math.max(24, lines * 17 * 1.55);
}

export function StepContent({ step, stepNumber }: { step: LessonStep; stepNumber: number }) {
  const { colors } = useTheme();
  const lang = useLang();
  const t = useT();
  const segments = useMemo(() => lessonStepSegments(step, lang), [step, lang]);
  const figure = useMemo(() => (step.visual ? resolveFigure(step.visual, lang) : undefined), [step.visual, lang]);

  return (
    <View style={styles.container}>
      <Text style={[appFont(12, 'bold'), styles.eyebrow, { color: colors.accent }]}>
        {t('lesson.step', { n: String(stepNumber).padStart(2, '0') })}
      </Text>
      <MathView html={segments.before} estimatedHeight={estimateHeight(step.text)} />
      {figure && <AnimatedFigure spec={figure.spec} captions={figure.captions} />}
      {segments.after && <MathView html={segments.after} estimatedHeight={180} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 20 },
  eyebrow: { letterSpacing: 1 },
});
