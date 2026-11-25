/**
 * Zustand des Onboardings (OnboardingManager.swift, UserDefaults-Schlüssel ExamSelection/MiniDiagnosis).
 * Das Onboarding erscheint nur, solange es nicht abgeschlossen wurde – also beim ersten Öffnen.
 * Wer es mittendrin verlässt, landet beim nächsten Start wieder auf dem zuletzt gezeigten Schritt.
 */
import Storage from 'expo-sqlite/kv-store';

const KEYS = {
  flowState: 'onboarding.flowState',
  currentScreen: 'onboarding.currentScreen',
  examKey: 'onboarding.examKey',
  examDate: 'onboarding.examDate',
  diagnosis: 'onboarding.diagnosis',
} as const;

type FlowState = 'notStarted' | 'inProgress' | 'completed';

function read(key: string): string | null {
  try {
    return Storage.getItemSync(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) Storage.removeItemSync(key);
    else Storage.setItemSync(key, value);
  } catch {
    // Speichern ist Komfort; ein Fehler darf das Onboarding nicht blockieren.
  }
}

const flowState = (): FlowState => {
  const value = read(KEYS.flowState);
  return value === 'inProgress' || value === 'completed' ? value : 'notStarted';
};

export const isOnboardingComplete = () => flowState() === 'completed';

export function completeOnboarding() {
  write(KEYS.flowState, 'completed');
  write(KEYS.currentScreen, null);
}

/** Zuletzt gezeigter Schritt (nur während eines laufenden Onboardings). */
export const loadOnboardingScreen = (): string | null => (flowState() === 'inProgress' ? read(KEYS.currentScreen) : null);

export function saveOnboardingScreen(screen: string) {
  write(KEYS.flowState, 'inProgress');
  write(KEYS.currentScreen, screen);
}

export const loadExamKey = () => read(KEYS.examKey);
export const saveExamKey = (key: string) => write(KEYS.examKey, key);

/** Prüfungsdatum als `YYYY-MM-DD` oder null (übersprungen). */
export const loadExamDate = () => read(KEYS.examDate);
export const saveExamDate = (isoDay: string | null) => write(KEYS.examDate, isoDay);

export function loadDiagnosis(): string[] {
  try {
    const parsed = JSON.parse(read(KEYS.diagnosis) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}
export const saveDiagnosis = (ids: string[]) => write(KEYS.diagnosis, JSON.stringify(ids));

/** Nur zum Testen: Onboarding beim nächsten Anzeigen wieder ab Schritt 1 zeigen. */
export function resetOnboarding() {
  write(KEYS.flowState, 'notStarted');
  write(KEYS.currentScreen, null);
}
