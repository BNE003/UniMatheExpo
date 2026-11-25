import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { maybeAskForReviewOnLaunch } from '@/features/settings/actions';
import { LanguageProvider } from '@/i18n';
import { useAppFonts } from '@/theme/fonts';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { fontFamilies } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { scheme, colors } = useTheme();
  const fontsReady = useAppFonts();
  useEffect(() => {
    if (fontsReady) SplashScreen.hideAsync();
  }, [fontsReady]);
  // Bewertungsabfrage ab dem 2. Start (SettingsModel.trackAppLaunch)
  useEffect(() => {
    maybeAskForReviewOnLaunch();
  }, []);
  if (!fontsReady) return null;
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: fontFamilies.semibold },
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
          // Nur der Pfeil, kein Titel der vorherigen Seite (sonst erscheint „(tabs)“)
          headerBackButtonDisplayMode: 'minimal',
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="course/[courseId]" />
        <Stack.Screen name="topic/[topicId]" options={{ title: '' }} />
        <Stack.Screen name="summary/[topicId]" />
        <Stack.Screen name="exam/[examKey]" />
        <Stack.Screen name="exercises/[topicId]" />
        <Stack.Screen name="exercise/[topicId]/[exerciseId]" />
        {/* Lektion als Vollbild ohne Kopf- und Tab-Leiste (InteractiveLearningView) */}
        <Stack.Screen name="lesson/[topicId]" options={{ headerShown: false, animation: 'fade_from_bottom' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LanguageProvider>
          <ThemeProvider>
            <RootStack />
          </ThemeProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
