/**
 * Logik des Onboardings ohne UI (Views/OnboardingScreens.swift):
 * Prüfungsauswahl, Lernplan-Zeitraum und Themen je Prüfung.
 */
import type { ExamEntry, Lang } from '@/content/types';

export interface ExamOption {
  key: string;
  title: string;
  subtitle: string;
  /** SF-Symbol-Name (iconName(for:)) */
  icon: string;
}

/** Schwierigkeits- und Klausur-Suffixe entfernen (canonicalExamKey). */
export const canonicalExamKey = (key: string) =>
  key.replace(/_(klausur|exam)_\d+$/, '').replace(/_(anfaenger|fortgeschritten|experte|beginner|intermediate|advanced|expert)$/, '');

const EXCLUDED = new Set(['differentialgleichungen']);
const PINNED = ['mathematik_1', 'mathematik_2', 'statistik', 'numerische_mathematik'];

const TITLES: Record<string, { de: string; en: string }> = {
  mathematik_1: { de: 'Mathematik I', en: 'Mathematics I' },
  mathematik_2: { de: 'Mathematik II', en: 'Mathematics II' },
  analysis_1: { de: 'Analysis I', en: 'Analysis I' },
  analysis_2: { de: 'Analysis II', en: 'Analysis II' },
  lineare_algebra_1: { de: 'Lineare Algebra I', en: 'Linear Algebra I' },
  lineare_algebra: { de: 'Lineare Algebra', en: 'Linear Algebra' },
  statistik: { de: 'Statistik I', en: 'Statistics I' },
  numerische_mathematik: { de: 'Numerik', en: 'Numerics' },
};

const SUBTITLES: Record<string, { de: string; en: string }> = {
  mathematik_1: { de: 'Grundlagen und Einstieg', en: 'Fundamentals and first concepts' },
  mathematik_2: { de: 'Aufbau und Vertiefung', en: 'Intermediate core concepts' },
  analysis_1: { de: 'Grenzwerte und Ableitungen', en: 'Limits and derivatives' },
  analysis_2: { de: 'Integrale und Reihen', en: 'Integrals and series' },
  lineare_algebra_1: { de: 'Matrizen und Vektorräume', en: 'Matrices and vector spaces' },
  lineare_algebra: { de: 'Matrizen und lineare Abbildungen', en: 'Matrices and linear maps' },
  statistik: { de: 'Daten, Wahrscheinlichkeiten, Verteilungen', en: 'Data, probability, distributions' },
  numerische_mathematik: { de: 'Algorithmen und Näherungsverfahren', en: 'Approximation and numerical methods' },
};

const ICONS: Record<string, string> = {
  mathematik_1: 'function',
  mathematik_2: 'sum',
  analysis_1: 'chart.line.uptrend.xyaxis',
  analysis_2: 'waveform.path.ecg',
  lineare_algebra_1: 'tablecells',
  lineare_algebra: 'square.grid.3x3',
  statistik: 'chart.bar.xaxis',
  numerische_mathematik: 'number',
};

export const DEFAULT_EXAM_KEY = 'mathematik_1';

/** prettyTitle(from:) */
function prettyTitle(key: string) {
  return key
    .split('_')
    .map((t) => ({ '1': 'I', '2': 'II', '3': 'III' })[t] ?? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())
    .join(' ');
}

export const examTitle = (key: string, lang: Lang) => TITLES[key]?.[lang] ?? prettyTitle(key);

/** loadExamOptions(): eine Option je Fach, feste Reihenfolge für die wichtigsten. */
export function examOptions(exams: readonly ExamEntry[], lang: Lang): ExamOption[] {
  const keys: string[] = [];
  for (const exam of exams) {
    const key = canonicalExamKey(exam.key);
    if (!EXCLUDED.has(key) && !keys.includes(key)) keys.push(key);
  }
  const rank = (k: string) => (PINNED.includes(k) ? PINNED.indexOf(k) : PINNED.length + keys.indexOf(k));
  return [...keys]
    .sort((a, b) => rank(a) - rank(b))
    .map((key) => ({
      key,
      title: examTitle(key, lang),
      subtitle: SUBTITLES[key]?.[lang] ?? (lang === 'en' ? "We'll tailor the plan to this subject" : 'Passender Lernplan für dieses Fach'),
      icon: ICONS[key] ?? 'book.closed',
    }));
}

// ---------------------------------------------------------------------------
// Lernplan (PersonalizedPlanOnboardingView)

/** Tage bis zur Prüfung (mindestens 1); ohne Datum 21. `examDay` als `YYYY-MM-DD`. */
export function daysUntilExam(examDay: string | null, today = new Date()): number {
  if (!examDay) return 21;
  const [y, m, d] = examDay.split('-').map(Number);
  if (!y || !m || !d) return 21;
  const target = Date.UTC(y, m - 1, d);
  const start = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(1, Math.round((target - start) / 86_400_000));
}

/** Drei Abschnitte: ~20 % Theorie, bis ~70 % Aufgaben, Rest Klausuren (timelineRanges). */
export function timelineRanges(days: number): [number, number][] {
  const total = Math.max(days, 3);
  const firstEnd = Math.min(Math.max(1, Math.round(total * 0.2)), total - 2);
  const secondEnd = Math.min(Math.max(firstEnd + 1, Math.round(total * 0.7)), total - 1);
  return [
    [1, firstEnd],
    [firstEnd + 1, secondEnd],
    [secondEnd + 1, total],
  ];
}

export function dayRangeLabel([start, end]: [number, number], lang: Lang) {
  const word = lang === 'en' ? 'DAY' : 'TAG';
  return start === end ? `${word} ${start}` : `${word} ${start}-${end}`;
}

/** theoryMainTopics */
export function theoryTopics(key: string, lang: Lang): string[] {
  const topics: Record<string, { de: string[]; en: string[] }> = {
    lineare_algebra_1: {
      de: ['Vektorräume', 'Matrizenrechnung', 'Eigenwerte und Eigenvektoren'],
      en: ['Vector spaces', 'Matrix operations', 'Eigenvalues and eigenvectors'],
    },
    statistik: {
      de: ['Wahrscheinlichkeitsrechnung', 'Verteilungen', 'Hypothesentests'],
      en: ['Probability theory', 'Distributions', 'Hypothesis tests'],
    },
    analysis_1: { de: ['Grenzwerte', 'Ableitungsregeln', 'Kurvendiskussion'], en: ['Limits', 'Derivative rules', 'Curve analysis'] },
    analysis_2: {
      de: ['Integralrechnung', 'Reihen', 'Mehrdimensionale Analysis'],
      en: ['Integral calculus', 'Series', 'Multivariable analysis'],
    },
    numerische_mathematik: {
      de: ['Fehlerrechnung', 'Newton-Verfahren', 'Lineare Gleichungssysteme'],
      en: ['Error analysis', "Newton's method", 'Linear equation systems'],
    },
    mathematik_2: {
      de: ['Integralrechnung', 'Folgen und Reihen', 'Differentialgleichungen'],
      en: ['Integral calculus', 'Sequences and series', 'Differential equations'],
    },
    mathematik_1: {
      de: ['Komplexe Zahlen', 'Gruppen, Ringe und Körper', 'Lineare Abbildungen', 'Gauss-Verfahren'],
      en: ['Complex numbers', 'Groups, rings, and fields', 'Linear maps', 'Gaussian elimination'],
    },
  };
  topics.lineare_algebra = topics.lineare_algebra_1;
  const known = topics[key]?.[lang];
  if (known) return known;
  const title = examTitle(key, lang);
  return lang === 'en'
    ? [`${title}: fundamentals`, `${title}: core methods`, `${title}: typical exam tasks`]
    : [`${title}: Grundlagen`, `${title}: zentrale Methoden`, `${title}: typische Klausuraufgaben`];
}

/** `Date` → `YYYY-MM-DD` in Ortszeit */
export const isoDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
