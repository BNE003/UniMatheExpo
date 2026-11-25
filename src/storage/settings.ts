/**
 * Dauerhafte Einstellungen (iOS: UserDefaults in SettingsModel.swift).
 * Synchroner Key-Value-Speicher auf SQLite-Basis, damit Sprache und Darstellung schon beim
 * ersten Rendern feststehen.
 */
import Storage from 'expo-sqlite/kv-store';

import type { Lang } from '@/content/types';

export type AppearancePreference = 'system' | 'light' | 'dark';

const KEYS = {
  language: 'settings.language',
  appearance: 'settings.appearance',
  launchCount: 'review.launchCount',
  askedForReview: 'review.asked',
} as const;

function read(key: string): string | null {
  try {
    return Storage.getItemSync(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    Storage.setItemSync(key, value);
  } catch {
    // Speichern ist Komfort; ein Fehler darf die App nicht blockieren.
  }
}

export function loadLanguage(): Lang | null {
  const value = read(KEYS.language);
  return value === 'de' || value === 'en' ? value : null;
}
export const saveLanguage = (lang: Lang) => write(KEYS.language, lang);

export function loadAppearance(): AppearancePreference {
  const value = read(KEYS.appearance);
  return value === 'light' || value === 'dark' ? value : 'system';
}
export const saveAppearance = (value: AppearancePreference) => write(KEYS.appearance, value);

/**
 * SettingsModel.trackAppLaunch: zählt Starts und meldet ab dem 2. Start einmalig,
 * dass nach einer Bewertung gefragt werden soll.
 */
export function registerLaunchAndShouldAskForReview(): boolean {
  if (read(KEYS.askedForReview) === 'true') return false;
  const count = Number(read(KEYS.launchCount) ?? '0') + 1;
  write(KEYS.launchCount, String(count));
  return count >= 2;
}
export const markReviewAsked = () => write(KEYS.askedForReview, 'true');
