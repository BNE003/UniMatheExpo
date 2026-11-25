/**
 * Ablauf des Onboardings (OnboardingCoordinator.swift, OnboardingManager.swift).
 * Neun Schritte; die iOS-Schritte „3 Tage gratis“, „Erinnerung vor Ablauf“ und die Kaufseite
 * sind durch „100 % kostenlos“ ersetzt. Seitenwechsel bewusst ruhig: kurzes Einblenden mit
 * kleiner Verschiebung, ohne Federeffekt.
 * Die Android-Zurück-Taste geht einen Schritt zurück.
 */
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState, type ComponentType } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import Animated, { Easing, withTiming, type EntryExitAnimationFunction } from 'react-native-reanimated';

import { useLang } from '@/i18n';
import { completeOnboarding, loadOnboardingScreen, saveOnboardingScreen } from '@/storage/onboarding';
import { ForcedScheme } from '@/theme/ThemeProvider';

import { ob, type ScreenProps } from './kit';
import { ExamSelectScreen } from './screens/exam';
import { DiagnosisScreen, ExamPreviewScreen, FeelingScreen, WelcomeScreen } from './screens/intro';
import { FreeScreen, PlanScreen, StepByStepScreen, TopicsScreen } from './screens/showcase';

const SCREENS: [string, ComponentType<ScreenProps>][] = [
  ['welcome', WelcomeScreen],
  ['problemActivation', FeelingScreen],
  ['examSelection', ExamSelectScreen],
  ['examPreview', ExamPreviewScreen],
  ['miniDiagnosis', DiagnosisScreen],
  ['topicsShowcase', TopicsScreen],
  ['stepByStep', StepByStepScreen],
  ['personalizedPlan', PlanScreen],
  ['free', FreeScreen],
];

/** Sanfter Seitenwechsel: neue Seite blendet ein und gleitet 24 pt nach, alte blendet aus. */
const SHIFT = 24;

const enter: EntryExitAnimationFunction = () => {
  'worklet';
  const EASE_OUT = Easing.out(Easing.cubic);
  return {
    initialValues: { opacity: 0, transform: [{ translateX: SHIFT }] },
    animations: {
      opacity: withTiming(1, { duration: 320, easing: EASE_OUT }),
      transform: [{ translateX: withTiming(0, { duration: 320, easing: EASE_OUT }) }],
    },
  };
};

const exit: EntryExitAnimationFunction = () => {
  'worklet';
  const EASE_OUT = Easing.out(Easing.cubic);
  return {
    initialValues: { opacity: 1, transform: [{ translateX: 0 }] },
    animations: {
      opacity: withTiming(0, { duration: 200, easing: EASE_OUT }),
      transform: [{ translateX: withTiming(-SHIFT / 2, { duration: 200, easing: EASE_OUT }) }],
    },
  };
};

export function OnboardingFlow({ onDone }: { onDone: () => void }) {
  const lang = useLang();
  const [index, setIndex] = useState(() => {
    const saved = loadOnboardingScreen();
    const i = SCREENS.findIndex(([id]) => id === saved);
    return i >= 0 ? i : 0;
  });

  const go = useCallback((i: number) => {
    setIndex(i);
    saveOnboardingScreen(SCREENS[i][0]);
  }, []);

  const next = useCallback(() => {
    if (index + 1 < SCREENS.length) go(index + 1);
    else {
      completeOnboarding();
      onDone();
    }
  }, [index, go, onDone]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (index === 0) return false;
      go(index - 1);
      return true;
    });
    return () => sub.remove();
  }, [index, go]);

  const Screen = SCREENS[index][1];
  return (
    <ForcedScheme scheme="light">
      <StatusBar style="dark" />
      <View style={styles.root}>
        <Animated.View key={SCREENS[index][0]} entering={enter} exiting={exit} style={StyleSheet.absoluteFill}>
          <Screen lang={lang} step={index + 1} total={SCREENS.length} next={next} />
        </Animated.View>
      </View>
    </ForcedScheme>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ob.canvas, overflow: 'hidden' },
});
