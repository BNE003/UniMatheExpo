/**
 * Merkt sich den zuletzt angezeigten Schritt jeder Lektion (je Thema und Sprache), damit eine
 * Lektion beim nächsten Öffnen dort weitergeht. Nach „Fertig“ beginnt sie wieder von vorn.
 */
import Storage from 'expo-sqlite/kv-store';

import type { Lang } from '@/content/types';

const key = (lang: Lang, topicId: string) => `lesson.step.${lang}.${topicId}`;

/** Gespeicherter Schritt (0-basiert), begrenzt auf die Schrittzahl der Lektion. */
export function loadLessonStep(lang: Lang, topicId: string, totalSteps: number): number {
  try {
    const value = Number(Storage.getItemSync(key(lang, topicId)));
    return Number.isInteger(value) && value > 0 ? Math.min(value, Math.max(totalSteps - 1, 0)) : 0;
  } catch {
    return 0;
  }
}

export function saveLessonStep(lang: Lang, topicId: string, step: number) {
  try {
    if (step > 0) Storage.setItemSync(key(lang, topicId), String(step));
    else Storage.removeItemSync(key(lang, topicId));
  } catch {
    // Speichern ist Komfort; ein Fehler darf die Lektion nicht blockieren.
  }
}
