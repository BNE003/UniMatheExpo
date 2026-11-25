/**
 * Reine Lektionslogik, portiert aus ContentView.swift.
 */
import type { LessonStep } from '@/content/types';

/** Ein Kapitel = zusammenhängende Schritte mit gleicher `section` (ContentView.swift: LessonChapter.chapters). */
export interface LessonChapter {
  id: number;
  title: string | undefined;
  startIndex: number;
  count: number;
}

export function lessonChapters(steps: readonly LessonStep[]): LessonChapter[] {
  const result: LessonChapter[] = [];
  steps.forEach((step, index) => {
    const last = result[result.length - 1];
    if (last && last.title === step.section) {
      last.count += 1;
    } else {
      result.push({ id: result.length, title: step.section, startIndex: index, count: 1 });
    }
  });
  return result;
}

/** Kapitel, in dem der Schritt liegt (ProgressHeader.currentChapter). */
export function chapterForStep(chapters: readonly LessonChapter[], step: number): LessonChapter | undefined {
  let found: LessonChapter | undefined;
  for (const c of chapters) if (c.startIndex <= step) found = c;
  return found;
}

/** Füllstand eines Kapitelsegments 0…1 (ProgressHeader.fill(for:)). */
export function chapterFill(chapter: LessonChapter, currentStep: number): number {
  if (currentStep >= chapter.startIndex + chapter.count) return 1;
  if (currentStep < chapter.startIndex) return 0;
  return (currentStep - chapter.startIndex + 1) / chapter.count;
}

export type TextBlock = { kind: 'paragraph'; text: string } | { kind: 'bullets'; items: string[] };

/**
 * Haupttext eines Schritts in Absätze und Aufzählungsgruppen zerlegen
 * (ContentView.swift: ExplanationContent.blocks). Zeilen mit „• “ oder „- “ sind Aufzählungspunkte,
 * Leerzeilen trennen Absätze.
 */
export function textBlocks(text: string): TextBlock[] {
  const result: TextBlock[] = [];
  let paragraph: string[] = [];
  let bullets: string[] = [];
  const flushParagraph = () => {
    const joined = paragraph.join('\n').trim();
    if (joined) result.push({ kind: 'paragraph', text: joined });
    paragraph = [];
  };
  const flushBullets = () => {
    if (bullets.length) result.push({ kind: 'bullets', items: bullets });
    bullets = [];
  };
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
      flushParagraph();
      bullets.push(trimmed.slice(2));
    } else if (trimmed === '') {
      flushParagraph();
      flushBullets();
    } else {
      flushBullets();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushBullets();
  return result;
}

/** LessonRichText.containsMath */
export function containsMath(text: string): boolean {
  return text.includes('\\(');
}

/**
 * „Begriff: Erklärung“ in Aufzählungen: Begriff wird fett gesetzt, wenn der Text keine Formel enthält
 * und der Begriff höchstens 32 Zeichen lang ist (LessonBulletTile.termAndRest).
 */
export function bulletTerm(text: string): { term: string; rest: string } | null {
  if (containsMath(text)) return null;
  const i = text.indexOf(': ');
  if (i < 0) return null;
  const term = text.slice(0, i);
  if ([...term].length > 32) return null;
  return { term, rest: text.slice(i + 2) };
}
