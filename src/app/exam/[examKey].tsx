/**
 * Probeklausur (ExamDetailView.swift): Einführung mit Notenschlüssel → Klausur mit Timer und
 * schrittweisen Lösungen. Start und Lösungen sind frei (iOS: nur mit Kauf).
 * Der Timer rechnet mit Zeitstempeln und läuft deshalb auch im Hintergrund korrekt weiter.
 */
import { Stack, router, useLocalSearchParams, usePreventRemove } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon, PressableScale, PrimaryButton } from '@/components/ui';
import { icons, type IconName } from '@/content/icons';
import { loadExam, manifest } from '@/content/load';
import type { Exam, ExamExercise } from '@/content/types';
import { formatTime, gradingScale } from '@/domain/exam';
import { useLang, useT } from '@/i18n';
import { MathView } from '@/math/MathView';
import { examExerciseHtml, examStepsHtml } from '@/math/templates';
import { useTheme } from '@/theme/ThemeProvider';
import { appFont, withAlpha } from '@/theme/tokens';

type Phase = 'intro' | 'running' | 'finished';

export default function ExamScreen() {
  const { examKey } = useLocalSearchParams<{ examKey: string }>();
  const { colors } = useTheme();
  const lang = useLang();
  const t = useT();
  const exam = useMemo(() => loadExam(lang, examKey), [lang, examKey]);
  const entry = manifest.exams.find((e) => e.key === examKey);
  const [phase, setPhase] = useState<Phase>('intro');
  const [endsAt, setEndsAt] = useState(0);

  // Während der Klausur fragt die Zurück-Geste nach (iOS: Alert „Klausur läuft“).
  usePreventRemove(phase === 'running', () => {
    Alert.alert(t('exam.inProgress'), t('exam.confirmEnd'), [
      { text: t('exam.continue'), style: 'cancel' },
      {
        text: t('exam.finish'),
        style: 'destructive',
        // Klausur beenden; der Effekt unten schließt danach die Seite (dann ohne Sperre).
        onPress: () => setPhase('finished'),
      },
    ]);
  });

  // endExam(): Klausur schließen
  useEffect(() => {
    if (phase === 'finished') router.back();
  }, [phase]);

  if (!exam) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Icon name={icons.info} size={48} color={colors.orange} />
        <Text style={[appFont(20, 'semibold'), { color: colors.text }]}>{t('exam.notFound')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: entry?.title[lang] ?? exam.exam.title }} />
      {phase === 'intro' ? (
        <ExamIntro
          exam={exam}
          onStart={() => {
            setEndsAt(Date.now() + exam.exam.duration * 60_000);
            setPhase('running');
          }}
        />
      ) : (
        <ExamPaper exam={exam} endsAt={endsAt} onFinish={() => setPhase('finished')} />
      )}
    </View>
  );
}

function InfoCard({ icon, title, value, color }: { icon: IconName; title: string; value: string; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.infoCard, { backgroundColor: colors.surface, shadowColor: '#000' }]}>
      <Icon name={icon} size={24} color={color} />
      <Text style={[appFont(12), { color: colors.textSecondary }]}>{title}</Text>
      <Text style={[appFont(17, 'semibold'), { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function ExamIntro({ exam, onStart }: { exam: Exam; onStart: () => void }) {
  const { colors, scheme } = useTheme();
  const t = useT();
  const scale = gradingScale(exam.exam.totalPoints);
  return (
    <ScrollView contentContainerStyle={styles.introContent}>
      <View style={styles.introHeader}>
        <Text style={[appFont(34, 'bold'), { color: scheme === 'dark' ? '#FFFFFF' : colors.accent }]}>{exam.exam.title}</Text>
        <Text style={[appFont(18, 'medium'), { color: colors.textSecondary }]}>{exam.exam.subtitle}</Text>
      </View>

      <View style={styles.infoRow}>
        <InfoCard icon={icons.clock} title={t('exam.duration')} value={`${exam.exam.duration} min`} color={colors.accent} />
        <InfoCard icon={icons.star} title={t('exam.points')} value={`${exam.exam.totalPoints}`} color={colors.orange} />
        <InfoCard icon={icons.summary} title={t('exam.questions')} value={`${exam.exercises.length}`} color={colors.difficulty.easy} />
      </View>

      <View style={[styles.panel, { backgroundColor: colors.surface, shadowColor: '#000' }]}>
        <Text style={[appFont(22, 'bold'), { color: colors.text }]}>{t('exam.gradingScale')}</Text>
        <View style={[styles.table, { backgroundColor: colors.surface, borderColor: withAlpha(colors.textSecondary, 0.2) }]}>
          <View style={[styles.tableRow, { backgroundColor: withAlpha(colors.accent, 0.1) }]}>
            <Text style={[appFont(16, 'semibold'), styles.colLeft, { color: colors.text }]}>{t('exam.grade')}</Text>
            <Text style={[appFont(16, 'semibold'), styles.colCenter, { color: colors.text }]}>{t('exam.points')}</Text>
            <Text style={[appFont(16, 'semibold'), styles.colRight, { color: colors.text }]}>{t('exam.percentage')}</Text>
          </View>
          {scale.map((g, i) => (
            <View
              key={g.grade}
              style={[styles.tableRow, i % 2 === 0 && { backgroundColor: withAlpha(colors.textSecondary, 0.05) }]}>
              <Text style={[appFont(16, 'semibold'), styles.colLeft, { color: g.isPassing ? colors.text : colors.difficulty.hard }]}>
                {g.grade}
              </Text>
              <Text style={[appFont(16), styles.colCenter, { color: colors.text }]}>{g.pointRange}</Text>
              <Text style={[appFont(16), styles.colRight, { color: colors.text }]}>{g.percentageRange}</Text>
            </View>
          ))}
        </View>
        <View style={styles.note}>
          <Icon name={icons.info} size={16} color={colors.accent} />
          <Text style={[appFont(12), { color: colors.textSecondary }]}>{t('exam.passNote')}</Text>
        </View>
      </View>

      <View style={[styles.panel, { backgroundColor: colors.surface, shadowColor: '#000' }]}>
        <Text style={[appFont(22, 'bold'), { color: colors.text }]}>{t('exam.instructions')}</Text>
        <Text style={[appFont(16), styles.instructions, { color: colors.text }]}>{exam.exam.instructions}</Text>
      </View>

      <PrimaryButton title={t('exams.start')} icon={icons.play} onPress={onStart} />
    </ScrollView>
  );
}

function useRemainingSeconds(endsAt: number, onElapsed: () => void) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const remaining = Math.max(0, Math.ceil((endsAt - now) / 1000));
  useEffect(() => {
    if (remaining === 0) onElapsed();
  }, [remaining, onElapsed]);
  return remaining;
}

function Pill({ icon, color, text }: { icon: IconName; color: string; text: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.pill, { backgroundColor: colors.surfaceStrong, shadowColor: '#000' }]}>
      <Icon name={icon} size={16} color={color} />
      <Text style={[appFont(18, 'bold'), styles.tabular, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

function ExamPaper({ exam, endsAt, onFinish }: { exam: Exam; endsAt: number; onFinish: () => void }) {
  const { colors } = useTheme();
  const t = useT();
  const remaining = useRemainingSeconds(endsAt, onFinish);
  return (
    <>
      <View style={[styles.paperHeader, { backgroundColor: colors.backgroundSecondary, borderBottomColor: colors.hairline }]}>
        <Pill icon={icons.clock} color={colors.accent} text={formatTime(remaining)} />
        <Pill icon={icons.star} color={colors.orange} text={`${exam.exam.totalPoints} ${t('exam.pts')}`} />
      </View>
      <ScrollView contentContainerStyle={styles.paperContent} showsVerticalScrollIndicator={false}>
        <View style={styles.paperTitle}>
          <Text style={[appFont(28, 'bold'), { color: colors.text }]}>{exam.exam.title}</Text>
          <Text style={[appFont(16, 'medium'), { color: colors.textSecondary }]}>{exam.exam.subtitle}</Text>
          <View style={[styles.divider, { backgroundColor: withAlpha(colors.accent, 0.3) }]} />
        </View>
        {exam.exercises.map((exercise, index) => (
          <ExerciseCard key={exercise.id} exercise={exercise} number={index + 1} />
        ))}
        <PressableScale
          accessibilityRole="button"
          onPress={onFinish}
          style={[styles.finish, { backgroundColor: colors.difficulty.hard, shadowColor: colors.difficulty.hard }]}>
          <Icon name={icons.finish} size={20} color="#FFFFFF" />
          <Text style={[appFont(18, 'bold'), { color: '#FFFFFF' }]}>{t('exam.finish')}</Text>
        </PressableScale>
      </ScrollView>
    </>
  );
}

function ExerciseCard({ exercise, number }: { exercise: ExamExercise; number: number }) {
  const { colors } = useTheme();
  const lang = useLang();
  const t = useT();
  const [showSolution, setShowSolution] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState(1);
  const total = exercise.solutionSteps.length;
  const green = colors.difficulty.easy;

  return (
    <View style={[styles.exercise, { backgroundColor: colors.surface, shadowColor: '#000' }]}>
      <View style={styles.exerciseHead}>
        <Text style={[appFont(22, 'bold'), { color: colors.text }]}>{t('exam.question', { n: number })}</Text>
        <View style={styles.capsules}>
          <Text style={[appFont(12, 'semibold'), styles.capsule, { color: colors.accent, backgroundColor: withAlpha(colors.accent, 0.1) }]}>
            {exercise.topic}
          </Text>
          <Text style={[appFont(12, 'bold'), styles.capsule, { color: colors.orange, backgroundColor: withAlpha(colors.orange, 0.1) }]}>
            {exercise.points} {t('exam.pts')}
          </Text>
        </View>
      </View>
      <View style={[styles.rule, { backgroundColor: colors.hairline }]} />

      <MathView html={examExerciseHtml(exercise.title, exercise.description)} estimatedHeight={120} />

      <PressableScale
        accessibilityRole="button"
        onPress={() => {
          setShowSolution((s) => !s);
          setVisibleSteps(1);
        }}
        style={[styles.solutionButton, { backgroundColor: colors.orange }]}>
        <Icon name={showSolution ? icons.hide : icons.lightbulb} size={16} color="#FFFFFF" />
        <Text style={[appFont(15, 'semibold'), { color: '#FFFFFF' }]}>
          {t(showSolution ? 'exam.hideSolution' : 'exam.showSolution')}
        </Text>
      </PressableScale>

      {showSolution && (
        <View style={[styles.solution, { backgroundColor: colors.surfaceStrong, borderColor: withAlpha(green, 0.28) }]}>
          <View style={styles.solutionHead}>
            <Icon name={icons.lightbulb} size={16} color={green} />
            <Text style={[appFont(17, 'bold'), { color: green }]}>{t('exam.solution')}</Text>
          </View>
          <MathView html={examStepsHtml(exercise.solutionSteps.slice(0, visibleSteps), lang)} estimatedHeight={visibleSteps * 110} />
          {visibleSteps < total && (
            <PressableScale
              accessibilityRole="button"
              onPress={() => setVisibleSteps((v) => Math.min(total, v + 1))}
              style={[styles.nextStep, { backgroundColor: green }]}>
              <Icon name={icons.startCircle} size={16} color="#FFFFFF" />
              <Text style={[appFont(15, 'semibold'), { color: '#FFFFFF' }]}>{t('exam.nextStep')}</Text>
            </PressableScale>
          )}
        </View>
      )}
    </View>
  );
}

const shadow = { elevation: 3, shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } } as const;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  introContent: { padding: 24, gap: 32, paddingBottom: 48 },
  introHeader: { gap: 12 },
  infoRow: { flexDirection: 'row', gap: 12 },
  infoCard: { flex: 1, alignItems: 'center', gap: 8, padding: 16, borderRadius: 12, ...shadow },
  panel: { padding: 20, gap: 16, borderRadius: 16, ...shadow },
  table: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 16 },
  colLeft: { flex: 1, textAlign: 'left' },
  colCenter: { flex: 1, textAlign: 'center' },
  colRight: { flex: 1, textAlign: 'right' },
  note: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  instructions: { lineHeight: 24 },
  paperHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, ...shadow },
  tabular: { fontVariant: ['tabular-nums'] },
  paperContent: { padding: 24, gap: 20, paddingBottom: 120 },
  paperTitle: { gap: 8 },
  divider: { height: 1, marginVertical: 8 },
  exercise: { padding: 20, gap: 16, borderRadius: 16, ...shadow },
  exerciseHead: { gap: 4 },
  capsules: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  capsule: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, overflow: 'hidden', flexShrink: 1 },
  rule: { height: StyleSheet.hairlineWidth },
  solutionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 10 },
  solution: { padding: 16, gap: 12, borderRadius: 12, borderWidth: 1 },
  solutionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nextStep: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 8 },
  finish: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 12,
    elevation: 6,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
});
