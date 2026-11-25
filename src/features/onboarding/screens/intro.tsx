/**
 * Onboarding-Schritte Willkommen, „Mathe-Klausur bald?“, Klausur-Vorschau und Mini-Diagnose
 * (ThemeSelectionOnboardingView, ProblemActivationOnboardingView, ExamPreviewOnboardingView,
 * MiniDiagnosisOnboardingView in Views/OnboardingScreens.swift).
 */
import { useCallback, useMemo, useState } from 'react';
import { Image, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Icon } from '@/components/ui';
import { loadDiagnosis, loadExamKey, saveDiagnosis } from '@/storage/onboarding';
import { withAlpha } from '@/theme/tokens';

import { ContinueButton, GlowCircle, OnboardingPage, PageTitle, cardStyle, icon, ob, obFont, shadow, useLayout, type ScreenProps } from '../kit';
import { DEFAULT_EXAM_KEY, examTitle } from '../plan';

const cont = (lang: string) => (lang === 'en' ? 'Continue' : 'Weiter');

// ---------------------------------------------------------------------------
// 1. Willkommen

export function WelcomeScreen({ lang, step, total, next }: ScreenProps) {
  const { width, height, compact } = useLayout();
  const artWidth = Math.min(width * 0.86, 460);
  return (
    <OnboardingPage
      lang={lang}
      step={step}
      total={total}
      button={<ContinueButton title={cont(lang)} onPress={next} />}
      decoration={
        <>
          <GlowCircle size={width * 0.9} offsetX={width * 0.36} offsetY={-height * 0.28} opacity={0.12} />
          <GlowCircle size={width * 0.58} offsetX={-width * 0.42} offsetY={height * 0.56} opacity={0.08} />
        </>
      }>
      <Animated.View entering={FadeIn.duration(400).delay(80)} style={{ gap: compact ? 10 : 14 }}>
        <Text style={[obFont(compact ? 30 : 34, 'bold'), { color: ob.ink }]}>{lang === 'en' ? 'Welcome to UniMathe' : 'Willkommen bei UniMathe'}</Text>
        <Text style={[obFont(compact ? 14 : 16, 'medium'), { color: ob.grayStrong, lineHeight: (compact ? 14 : 16) + 8 }]}>
          {lang === 'en'
            ? 'Learn mathematics with clarity and structure. You will be ready in just a few steps.'
            : 'Lerne Mathematik klar, strukturiert und effizient. In wenigen Schritten bist du startklar.'}
        </Text>
      </Animated.View>
      <Animated.View entering={FadeIn.duration(500).delay(160)} style={{ alignItems: 'center', marginTop: compact ? 18 : 28 }}>
        <Image
          source={require('@/assets/images/onboarding/welcome.png')}
          style={{ width: artWidth, height: artWidth * (786 / 900) }}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      </Animated.View>
    </OnboardingPage>
  );
}

// ---------------------------------------------------------------------------
// 2. „Mathe-Klausur bald?“ mit Slider

const FEELINGS = {
  de: [
    ['😅', 'Komplett lost'],
    ['🤔', 'So halb vorbereitet'],
    ['😎', 'Ganz entspannt'],
  ],
  en: [
    ['😅', 'Totally lost'],
    ['🤔', 'Half prepared'],
    ['😎', 'Fully relaxed'],
  ],
} as const;

const THUMB = 44;

export function FeelingScreen({ lang, step, total, next }: ScreenProps) {
  const { width, height, compact } = useLayout();
  const options = FEELINGS[lang];
  const [selection, setSelection] = useState(1);
  const [trackWidth, setTrackWidth] = useState(0);
  const progress = useSharedValue(0.5);
  const count = options.length;

  const select = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(count - 1, index));
      setSelection(clamped);
      progress.set(withTiming(clamped / (count - 1), { duration: 220, easing: Easing.out(Easing.cubic) }));
    },
    [count, progress],
  );
  // Ziehen oder Tippen auf der Leiste wählt die nächstgelegene Stufe (DragGesture(minimumDistance: 0)).
  const pan = useMemo(() => {
    const pick = (x: number) => {
      const w = trackWidth;
      if (w > 0) select(Math.round((Math.max(0, Math.min(w, x)) / w) * (count - 1)));
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => pick(e.nativeEvent.locationX),
      onPanResponderMove: (e) => pick(e.nativeEvent.locationX),
    });
  }, [select, count, trackWidth]);

  const fillStyle = useAnimatedStyle(() => ({ width: Math.max(THUMB * 0.5, progress.get() * trackWidth) }));
  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: progress.get() * (trackWidth - THUMB) }] }));

  return (
    <OnboardingPage
      lang={lang}
      step={step}
      total={total}
      button={<ContinueButton title={cont(lang)} onPress={next} />}
      decoration={<GlowCircle size={width * 0.76} offsetY={height * 0.22} opacity={0.11} />}>
      <View style={{ gap: 8, marginTop: 14 }}>
        <Text style={[obFont(compact ? 32 : 36, 'bold'), styles.centerText]}>{lang === 'en' ? 'Math exam soon?' : 'Mathe-Klausur bald?'}</Text>
        <Text style={[obFont(compact ? 22 : 24, 'semibold'), styles.centerText]}>{lang === 'en' ? 'How are you feeling?' : 'Wie fühlst du dich gerade?'}</Text>
        <Text style={[obFont(compact ? 16 : 18, 'medium'), styles.centerText, { color: ob.grayStrong }]}>
          {lang === 'en' ? 'Use the slider to choose what fits you best right now.' : 'Wähle auf dem Slider aus, was gerade am besten passt.'}
        </Text>
      </View>
      <View style={{ alignItems: 'center', gap: 18, marginTop: compact ? 8 : 18, marginBottom: 10 }}>
        <Text style={{ fontSize: compact ? 74 : 82 }}>{options[selection][0]}</Text>
        <Text style={[obFont(compact ? 22 : 24, 'semibold'), styles.centerText]}>{options[selection][1]}</Text>
      </View>
      <View style={{ paddingHorizontal: 10, gap: 12 }}>
          <View
            {...pan.panHandlers}
            style={styles.sliderArea}
            onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
            accessible
            accessibilityRole="adjustable"
            accessibilityValue={{ text: options[selection][1] }}
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={(e) => select(selection + (e.nativeEvent.actionName === 'increment' ? 1 : -1))}>
            <View pointerEvents="none" style={styles.track} />
            <Animated.View pointerEvents="none" style={[styles.fill, fillStyle]} />
            <Animated.View pointerEvents="none" style={[styles.thumb, thumbStyle]} />
          </View>
        <View style={styles.sliderLabels}>
          <Text style={[obFont(compact ? 16 : 18, 'medium'), { color: ob.grayStrong }]}>{options[0][1]}</Text>
          <Text style={[obFont(compact ? 16 : 18, 'medium'), { color: ob.grayStrong }]}>{options[options.length - 1][1]}</Text>
        </View>
      </View>
    </OnboardingPage>
  );
}

// ---------------------------------------------------------------------------
// 4. Klausur-Vorschau

export function ExamPreviewScreen({ lang, step, total, next }: ScreenProps) {
  const { width, height, compact } = useLayout();
  const title = examTitle(loadExamKey() ?? DEFAULT_EXAM_KEY, lang);
  const cards =
    lang === 'en'
      ? [
          ['Exam year 2025 - 90 minutes - 12 questions', 'clock', 'schedule'],
          ['Exam year 2024 - 120 minutes - 15 questions', 'list.bullet.clipboard', 'assignment'],
          ['Exam year 2022 - 105 minutes - 13 questions', 'doc.text', 'description'],
        ]
      : [
          ['Klausurjahr 2025 - 90 Minuten - 12 Aufgaben', 'clock', 'schedule'],
          ['Klausurjahr 2024 - 120 Minuten - 15 Aufgaben', 'list.bullet.clipboard', 'assignment'],
          ['Klausurjahr 2022 - 105 Minuten - 13 Aufgaben', 'doc.text', 'description'],
        ];
  const accents = [ob.blue, withAlpha(ob.ink, 0.8), withAlpha(ob.blue, 0.9)];
  const rotation = [0.9, -0.8, 0.7];
  const shift = [4, -3, 3];
  return (
    <OnboardingPage
      lang={lang}
      step={step}
      total={total}
      button={<ContinueButton title={cont(lang)} onPress={next} />}
      decoration={<GlowCircle size={width * 0.74} offsetY={height * 0.25} />}>
      <PageTitle
        title={lang === 'en' ? `${title}? We got you 👌` : `${title}? Haben wir 👌`}
        subtitle={lang === 'en' ? `We prepared 3 real ${title} exams for you.` : `Wir haben 3 echte ${title}-Klausuren für dich vorbereitet.`}
      />
      <View style={{ marginTop: 4 }}>
        {cards.map(([detail, ios, android], i) => (
          <Animated.View
            key={i}
            entering={FadeIn.duration(400).delay(i * 90)}
            style={[
              styles.previewCard,
              shadow(12, 0.08, 6),
              {
                marginTop: i === 0 ? 0 : -6,
                zIndex: cards.length - i,
                borderColor: withAlpha(accents[i], 0.34),
                transform: [{ rotate: `${rotation[i]}deg` }, { translateX: shift[i] }],
              },
            ]}>
            <View style={[styles.previewIcon, { backgroundColor: withAlpha(ob.blue, 0.14), borderColor: withAlpha(ob.blue, 0.25) }]}>
              <Icon name={icon(ios, android)} size={18} color={accents[i]} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text numberOfLines={1} style={[obFont(compact ? 18 : 19, 'semibold'), { color: ob.ink }]}>
                {title}
              </Text>
              <Text numberOfLines={2} style={[obFont(compact ? 15 : 16, 'medium'), { color: ob.grayStrong }]}>
                {detail}
              </Text>
            </View>
          </Animated.View>
        ))}
      </View>
      <Text style={[obFont(compact ? 15 : 16, 'medium'), { color: ob.grayStrong, marginTop: 8 }]}>
        {lang === 'en'
          ? 'Most learners start with a real exam to check their current level.'
          : 'Die meisten starten mit einer echten Klausur, um ihren aktuellen Stand zu checken.'}
      </Text>
    </OnboardingPage>
  );
}

// ---------------------------------------------------------------------------
// 5. Mini-Diagnose

const DIAGNOSIS = [
  { id: 'theory', de: 'Ich verstehe die Theorie nicht', en: "I don't understand the theory", emoji: '📚' },
  { id: 'tasks', de: 'Ich scheitere an Aufgaben', en: 'I fail on exercises', emoji: '🧩' },
  { id: 'relevant', de: 'Ich weiß nicht, was klausurrelevant ist', en: "I don't know what is exam-relevant", emoji: '🎯' },
  { id: 'procrastination', de: 'Ich prokrastiniere', en: 'I procrastinate', emoji: '⏳' },
] as const;

export function DiagnosisScreen({ lang, step, total, next }: ScreenProps) {
  const { width, height, compact } = useLayout();
  const [selected, setSelected] = useState<string[]>(loadDiagnosis);
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((v) => v !== id) : [...s, id]));
  return (
    <OnboardingPage
      lang={lang}
      step={step}
      total={total}
      button={
        <ContinueButton
          title={cont(lang)}
          onPress={() => {
            saveDiagnosis(selected);
            next();
          }}
        />
      }
      decoration={<GlowCircle size={width * 0.74} offsetY={height * 0.25} />}>
      <PageTitle
        title={lang === 'en' ? "What's your biggest challenge?" : 'Was ist dein größtes Problem?'}
        subtitle={
          lang === 'en'
            ? "Pick what slows you down most. We'll adapt the app to exactly that."
            : 'Wähle aus, was dich am meisten ausbremst. Wir richten die App genau darauf aus.'
        }
      />
      <View style={{ gap: 12, marginTop: 6 }}>
        {DIAGNOSIS.map((option) => {
          const isSelected = selected.includes(option.id);
          return (
            <Pressable
              key={option.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              onPress={() => toggle(option.id)}
              style={[styles.checkRow, cardStyle(16, isSelected)]}>
              <Text style={[obFont(compact ? 16 : 17, 'semibold'), { color: ob.ink, flex: 1 }]}>{`${option.emoji}  ${option[lang]}`}</Text>
              <Icon
                name={isSelected ? icon('checkmark.square.fill', 'check_box') : icon('square', 'check_box_outline_blank')}
                size={22}
                color={isSelected ? ob.blue : withAlpha(ob.gray, 0.6)}
              />
            </Pressable>
          );
        })}
      </View>
      <Text style={[obFont(compact ? 15 : 16, 'medium'), { color: ob.grayStrong, marginTop: 8, lineHeight: (compact ? 15 : 16) * 1.4 }]}>
        {lang === 'en'
          ? 'UniMathe gives you clear next steps, targeted exercises, and focused priorities.'
          : 'UniMathe zeigt dir genau die nächsten Schritte, passende Aufgaben und klare Prioritäten.'}
      </Text>
    </OnboardingPage>
  );
}

const styles = StyleSheet.create({
  centerText: { color: ob.ink, textAlign: 'center' },
  sliderArea: { height: THUMB, justifyContent: 'center' },
  track: { position: 'absolute', left: 0, right: 0, height: 16, borderRadius: 8, backgroundColor: withAlpha(ob.ink, 0.14) },
  fill: { position: 'absolute', left: 0, height: 16, borderRadius: 8, backgroundColor: ob.blue },
  thumb: {
    position: 'absolute',
    left: 0,
    width: THUMB,
    height: THUMB,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    ...shadow(8, 0.12, 4, '#000'),
  },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    minHeight: 98,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.88)',
  },
  previewIcon: { width: 46, height: 46, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
});
