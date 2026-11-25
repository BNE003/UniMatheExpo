import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { loadAppearance, saveAppearance, type AppearancePreference } from '@/storage/settings';

import { palettes, webColors, type ColorSchemeName, type Palette } from './tokens';

/** iOS: SettingsModel.isDarkModeEnabled. Android folgt standardmäßig dem System. */
export type { AppearancePreference };

interface ThemeValue {
  scheme: ColorSchemeName;
  colors: Palette;
  web: (typeof webColors)[ColorSchemeName];
  preference: AppearancePreference;
  setPreference: (p: AppearancePreference) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<AppearancePreference>(loadAppearance);
  const setPreference = useCallback((next: AppearancePreference) => {
    saveAppearance(next);
    setPreferenceState(next);
  }, []);
  const scheme: ColorSchemeName = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo<ThemeValue>(
    () => ({ scheme, colors: palettes[scheme], web: webColors[scheme], preference, setPreference }),
    [scheme, preference, setPreference],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme außerhalb von ThemeProvider');
  return value;
}

/** Erzwingt ein Farbschema für einen Teilbaum (das Onboarding ist wie in iOS immer hell). */
export function ForcedScheme({ scheme, children }: { scheme: ColorSchemeName; children: ReactNode }) {
  const parent = useTheme();
  const value = useMemo<ThemeValue>(() => ({ ...parent, scheme, colors: palettes[scheme], web: webColors[scheme] }), [parent, scheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
