/**
 * Inter (SIL OFL, wie Views/AppTypography.swift). Wird beim Start geladen, damit die Schrift auch in
 * Expo Go verfügbar ist; im eigenen Build ist sie zusätzlich eingebettet (expo-font-Plugin in app.json).
 */
import { useFonts } from 'expo-font';

import { fontFamilies } from './tokens';

export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    [fontFamilies.regular]: require('@/assets/fonts/Inter-Regular.ttf'),
    [fontFamilies.medium]: require('@/assets/fonts/Inter-Medium.ttf'),
    [fontFamilies.semibold]: require('@/assets/fonts/Inter-SemiBold.ttf'),
    [fontFamilies.bold]: require('@/assets/fonts/Inter-Bold.ttf'),
    [fontFamilies.display]: require('@/assets/fonts/InterDisplay-Bold.ttf'),
  });
  // Bei einem Ladefehler mit der Systemschrift weitermachen statt hängen zu bleiben.
  return loaded || error != null;
}
