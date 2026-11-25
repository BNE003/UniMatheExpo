/**
 * Schritt-für-Schritt-Lektion (InteractiveLearningView, ContentView.swift:1560).
 * Alle Schritte sind frei zugänglich (iOS: Paywall ab Schritt 9 – entfällt auf Android).
 * Die System-Zurück-Taste schließt die Lektion; einen Schritt zurück geht es über den Zurück-Knopf.
 * Der aktuelle Schritt wird gespeichert: Beim nächsten Öffnen geht es dort weiter, nach „Fertig“ von vorn.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { findTopic, loadLesson } from '@/content/load';
import { lessonChapters } from '@/domain/lesson';
import { ChapterSheet, LessonFooter, ProgressHeader } from '@/features/lesson/LessonChrome';
import { StepContent } from '@/features/lesson/StepContent';
import { useLang, useT } from '@/i18n';
import { loadLessonStep, saveLessonStep } from '@/storage/lessonProgress';
import { useTheme } from '@/theme/ThemeProvider';
import { appFont } from '@/theme/tokens';

export default function LessonScreen() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const { colors } = useTheme();
  const lang = useLang();
  const t = useT();
  const lesson = useMemo(() => loadLesson(lang, topicId), [lang, topicId]);
  const title = findTopic(topicId)?.topic.title[lang] ?? lesson?.topic ?? '';
  const chapters = useMemo(() => (lesson ? lessonChapters(lesson.steps) : []), [lesson]);

  const [step, setStep] = useState(() => (lesson ? loadLessonStep(lang, topicId, lesson.steps.length) : 0));
  const [showProgress, setShowProgress] = useState(false);
  const [chaptersOpen, setChaptersOpen] = useState(false);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  // Fortschrittsbalken nach kurzer Verzögerung einblenden (iOS: .delay(0.3))
  useEffect(() => {
    const timer = setTimeout(() => setShowProgress(true), 300);
    return () => clearTimeout(timer);
  }, []);

  if (!lesson) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[appFont(16), { color: colors.text }]}>{t('common.loadError')}</Text>
      </View>
    );
  }

  const total = lesson.steps.length;
  const goTo = (target: number) => {
    if (target < 0 || target >= total || target === step) return;
    setStep(target);
    saveLessonStep(lang, topicId, target);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };
  const finish = () => {
    saveLessonStep(lang, topicId, 0);
    router.back();
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ProgressHeader
        topicTitle={title}
        chapters={chapters}
        currentStep={step}
        totalSteps={total}
        showProgress={showProgress}
        onClose={() => router.back()}
        onShowChapters={() => setChaptersOpen(true)}
      />
      <ScrollView ref={scrollRef} style={styles.flex} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View key={step} entering={FadeIn.duration(350)} exiting={FadeOut.duration(150)}>
          <StepContent step={lesson.steps[step]} stepNumber={step + 1} />
        </Animated.View>
      </ScrollView>
      <LessonFooter
        currentStep={step}
        totalSteps={total}
        onBack={() => goTo(step - 1)}
        onNext={() => goTo(step + 1)}
        onFinish={finish}
      />
      <ChapterSheet
        visible={chaptersOpen}
        chapters={chapters}
        currentStep={step}
        onSelect={goTo}
        onClose={() => setChaptersOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 40 },
});
