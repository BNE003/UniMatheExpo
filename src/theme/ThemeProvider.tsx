import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { palettes, webColors, type ColorSchemeName, type Palette } from './tokens';

/** iOS: SettingsModel.isDarkModeEnabled. Android folgt standardmäßig dem System. */
export type AppearancePreference = 'system' | ColorSchemeName;

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
  // TODO(M5): Einstellung dauerhaft speichern, sobald die Speicherschicht steht.
  const [preference, setPreference] = useState<AppearancePreference>('system');
  const scheme: ColorSchemeName = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo<ThemeValue>(
    () => ({ scheme, colors: palettes[scheme], web: webColors[scheme], preference, setPreference }),
    [scheme, preference],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme außerhalb von ThemeProvider');
  return value;
}
