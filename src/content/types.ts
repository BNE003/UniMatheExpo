/**
 * Datentypen der Kursinhalte.
 *
 * Die Inhaltsdateien werden mit `npm run import-content` aus dem SwiftUI-Projekt übernommen
 * (siehe tools/import-content.ts). Die Felder entsprechen den Swift-Modellen:
 * - Lektion:  `InteractiveExample` / `InteractiveExampleStep` (ContentView.swift)
 * - Übung:    `Exercise` (Models/Exercise.swift)
 * - Klausur:  `Exam` / `ExamInfo` / `ExamExercise` (Models/Exam.swift)
 * - Zusammenfassung: `MathTopic.markdownContent` (Models/MathTopic.swift)
 */

export type Lang = 'de' | 'en';
export const LANGS: readonly Lang[] = ['de', 'en'];

export type Localized<T = string> = Record<Lang, T>;

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface LessonStep {
  id: string;
  text: string;
  formula?: string;
  explanation?: string;
  /** Kapitelzeile, z. B. "Kapitel 3 · Geometrische Beispiele". Gleiche Werte hintereinander bilden ein Kapitel. */
  section?: string;
  /** Name einer erklärenden Grafik (siehe src/visuals). */
  visual?: string;
  /** Hervorgehobene Kernaussage ("Merke"). */
  insight?: string;
}

export interface Lesson {
  id?: string;
  topic: string;
  steps: LessonStep[];
}

export interface Exercise {
  /** Eindeutig nur innerhalb eines Themas. Stabiler Schlüssel: `ex:<themen-id>:<id>`. */
  id: number;
  topic: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  points: number;
  solutionSteps: string[];
}

export interface ExerciseFile {
  exercises: Exercise[];
}

export interface Summary {
  title: string;
  description: string;
  /** HTML mit Formeln in `$$…$$` bzw. `$…$`. */
  html: string | null;
}

export interface ExamInfo {
  title: string;
  subtitle: string;
  duration: number;
  totalPoints: number;
  difficulty: string;
  language: string;
  instructions: string;
}

export interface ExamExercise {
  id: number;
  topic: string;
  title: string;
  description: string;
  difficulty: string;
  points: number;
  solutionSteps: string[];
}

export interface Exam {
  exam: ExamInfo;
  exercises: ExamExercise[];
}

export interface TopicStats {
  lessonSteps: Localized<number>;
  lessonVisuals: Localized<number>;
  exercises: Record<Difficulty, number>;
}

export interface TopicEntry {
  /** Stabile Themen-ID aus lerninhalt/<lang>/index.json, z. B. "3.3". */
  id: string;
  courseId: string;
  /** Position im Kurs (1-basiert). */
  position: number;
  title: Localized;
  description: Localized;
  /** SF-Symbol-Name aus den iOS-Daten; Android bildet ihn in src/content/icons.ts ab. */
  icon: string;
  stats: TopicStats;
}

export interface CourseEntry {
  id: string;
  title: Localized;
  description: Localized;
  icon: string;
  topics: TopicEntry[];
}

export interface ExamEntry {
  /** Stabiler Schlüssel = deutscher Dateistamm, z. B. "lineare_algebra_1_anfaenger". */
  key: string;
  title: Localized;
  subtitle: Localized;
  durationMinutes: number;
  questions: number;
  icon: string;
  /** Kartenfarbe aus ÜbungsklausurenView.swift als Hex. */
  color: string;
}

export interface ContentManifest {
  schemaVersion: 1;
  source: {
    /** Commit des SwiftUI-Repos, aus dem importiert wurde. */
    commit: string;
    /** true, wenn die Inhaltsordner beim Import nicht committete Änderungen hatten. */
    dirty: boolean;
    /** SHA-256 über alle importierten Quelldateien. */
    contentHash: string;
  };
  courses: CourseEntry[];
  exams: ExamEntry[];
}
