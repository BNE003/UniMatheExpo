/**
 * Zugriff auf die importierten Inhalte – ausschließlich über stabile IDs.
 */
import { contentFiles, manifest } from './generated/registry';
import type { CourseEntry, Exam, ExerciseFile, Lang, Lesson, Summary, TopicEntry } from './types';

export { manifest };

function file<T>(key: string): T | undefined {
  const load = contentFiles[key];
  return load ? (load() as T) : undefined;
}

export const loadLesson = (lang: Lang, topicId: string) => file<Lesson>(`${lang}/${topicId}/lesson`);
export const loadExercises = (lang: Lang, topicId: string) => file<ExerciseFile>(`${lang}/${topicId}/exercises`);
/** Zusammenfassung eines Themas oder eines ganzen Kurses (ID "3" bzw. "3.3"). */
export const loadSummary = (lang: Lang, id: string) => file<Summary>(`${lang}/${id}/summary`);
export const loadExam = (lang: Lang, examKey: string) => file<Exam>(`${lang}/exams/${examKey}`);

export function findCourse(courseId: string): CourseEntry | undefined {
  return manifest.courses.find((c) => c.id === courseId);
}

export function findTopic(topicId: string): { course: CourseEntry; topic: TopicEntry } | undefined {
  for (const course of manifest.courses) {
    const topic = course.topics.find((t) => t.id === topicId);
    if (topic) return { course, topic };
  }
  return undefined;
}
