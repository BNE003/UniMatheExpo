/**
 * Sprache der App (iOS: SettingsModel.language, Standard nach Gerätesprache).
 * UI-Texte liegen in ./ui.ts; Inhalte kommen sprachweise aus assets/content/<lang>/.
 */
import { getLocales } from 'expo-localization';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { Lang } from '@/content/types';

import { ui, type UiKey } from './ui';

function deviceLanguage(): Lang {
  const code = getLocales()[0]?.languageCode;
  return code === 'de' ? 'de' : 'en';
}

interface LangValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LangContext = createContext<LangValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Dauerhafte Speicherung folgt mit der Speicherschicht (Meilenstein M5).
  const [lang, setLang] = useState<Lang>(deviceLanguage);
  const value = useMemo(() => ({ lang, setLang }), [lang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

function useLangContext(): LangValue {
  const value = useContext(LangContext);
  if (!value) throw new Error('useLang außerhalb von LanguageProvider');
  return value;
}

export const useLang = (): Lang => useLangContext().lang;
export const useSetLang = () => useLangContext().setLang;

/** Übersetzungsfunktion mit `{name}`-Platzhaltern. */
export function useT() {
  const lang = useLang();
  return (key: UiKey, params?: Record<string, string | number>) => {
    let text: string = ui[lang][key];
    if (params) for (const [k, v] of Object.entries(params)) text = text.replaceAll(`{${k}}`, String(v));
    return text;
  };
}
