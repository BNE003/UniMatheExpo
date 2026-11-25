/**
 * HTML-Bausteine für den Formel-Renderer (assets/math/renderer.html).
 *
 * Nachgebaut aus der iOS-App:
 * - LessonRichText / LessonFormulaView (Views/LessonMathViews.swift)
 * - ExplanationContent, LessonBulletTile (ContentView.swift)
 * - LaTeXView-Inhalte für Zusammenfassungen und Übungen (LaTeXView.swift)
 *
 * Die Vorlagen erzeugen nur den Inhalt; Stile und das Setzen der Formeln übernimmt der Renderer.
 */
import type { Lang, LessonStep } from '@/content/types';
import { bulletTerm, textBlocks } from '@/domain/lesson';

export function escapeHtml(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

/**
 * Verhindert Zeilenumbrüche zwischen Inline-Formel und anschließender Klammer bzw. Satzzeichen
 * (LessonRichText.keepPunctuationWithMath).
 */
export function keepPunctuationWithMath(html: string): string {
  return html.replace(/([(„]?)(\\\(.*?\\\))([.,;:!?)“]*)/g, '<span class="nowrap">$1$2$3</span>');
}

/** Fließtext mit Inline-Formeln \( … \) (LessonRichText). */
export function richText(text: string): string {
  return keepPunctuationWithMath(escapeHtml(text)).replaceAll('\n', '<br>');
}

const labels = {
  de: { keyIdea: 'MERKE', swipe: 'Wischen für mehr' },
  en: { keyIdea: 'KEY IDEA', swipe: 'Swipe to see more' },
} as const;

/** Abgesetzte Formel mit Auto-Verkleinern und eigenem Scrollbalken (LessonFormulaView). */
export function formulaBox(formula: string, lang: Lang): string {
  return [
    '<div class="formula-card">',
    `<div class="fx-scroll"><div class="fx-inner">$$${escapeHtml(formula)}$$</div></div>`,
    '<div class="fx-track"><div class="fx-thumb"></div></div>',
    `<div class="fx-hint">← ${labels[lang].swipe} →</div>`,
    '</div>',
  ].join('');
}

function bulletTile(text: string, index: number): string {
  const split = bulletTerm(text);
  const body = split
    ? `<strong>${escapeHtml(split.term)}</strong> – ${escapeHtml(split.rest)}`
    : richText(text);
  return `<div class="bullet"><span class="bullet-num">${index + 1}</span><div class="bullet-text">${body}</div></div>`;
}

function textBlocksHtml(text: string): string {
  return textBlocks(text)
    .map((block) =>
      block.kind === 'paragraph'
        ? `<div class="lesson-text">${richText(block.text)}</div>`
        : `<div class="bullets">${block.items.map(bulletTile).join('')}</div>`,
    )
    .join('');
}

const LIGHTBULB_SVG =
  '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V17h5v-1.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/></svg>';

function tailHtml(step: LessonStep, lang: Lang): string {
  const parts: string[] = [];
  if (step.formula) parts.push(formulaBox(step.formula, lang));
  if (step.explanation) parts.push(`<div class="explanation lesson-text small">${richText(step.explanation)}</div>`);
  if (step.insight) {
    parts.push(
      `<div class="insight"><div class="insight-head">${LIGHTBULB_SVG}<span>${labels[lang].keyIdea}</span></div>` +
        `<div class="lesson-text small bold">${richText(step.insight)}</div></div>`,
    );
  }
  return parts.join('');
}

/**
 * Inhalt eines Lektionsschritts in der Reihenfolge von ExplanationContent:
 * Text → Grafik → Formel → Erklärung → Merke.
 * Die Grafik ist eine native Komponente; deshalb gibt es bei vorhandener Grafik zwei HTML-Teile.
 */
export function lessonStepSegments(step: LessonStep, lang: Lang): { before: string; after: string | null } {
  const before = textBlocksHtml(step.text);
  const after = tailHtml(step, lang);
  if (step.visual) return { before, after: after || null };
  return { before: before + after, after: null };
}

/** Zusammenfassung (TopicDetailView → LaTeXView mit markdownContent). */
export function summaryHtml(html: string): string {
  return `<div class="content-container summary">${html}</div>`;
}

const lineBreaks = (text: string) => text.replaceAll('\n', '<br>');

/** Titel und Aufgabentext einer Klausuraufgabe (ExamDetailView.optimizedExerciseCard). */
export function examExerciseHtml(title: string, description: string): string {
  return `<div class="content-container exercise"><div class="ex-title">${lineBreaks(title)}</div><div>${lineBreaks(description)}</div></div>`;
}

/** Aufgedeckte Lösungsschritte (ExamDetailView.optimizedSolutionStep). */
export function examStepsHtml(steps: readonly string[], lang: Lang): string {
  const label = lang === 'en' ? 'Step' : 'Schritt';
  return steps
    .map(
      (step, i) =>
        `<div class="exam-step"><div class="exam-step-head"><span>${label} ${i + 1}</span><span class="exam-step-dot"></span></div>` +
        `<div class="content-container">${lineBreaks(step)}</div></div>`,
    )
    .join('');
}

/** Aufgabentext/Lösungsschritt (ExerciseDetailView: addHtmlLineBreaks). */
export function exerciseTextHtml(text: string): string {
  return `<div class="content-container exercise">${text.replaceAll('\n', '<br>')}</div>`;
}

// ---------------------------------------------------------------------------
// Übungen (ContentView.swift: ExercisesView/ExerciseCard, Views/ExerciseDetailView.swift)

const exerciseLabels = {
  de: { points: 'Punkte', start: 'Start', step: 'Schritt', easy: 'Einfach', medium: 'Mittel', hard: 'Schwer' },
  en: { points: 'points', start: 'Start', step: 'Step', easy: 'Easy', medium: 'Medium', hard: 'Hard' },
} as const;

interface ExerciseLike {
  id: number;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
}

/**
 * Alle Aufgaben eines Schwierigkeitsgrads in einem Dokument. Ein Tippen auf eine Karte meldet
 * `open:<id>` (MathView.onAction).
 */
export function exerciseListHtml(exercises: readonly ExerciseLike[], lang: Lang): string {
  const l = exerciseLabels[lang];
  const cards = exercises.map(
    (e) =>
      `<div class="ex-card" data-action="open:${e.id}" role="button">` +
      `<div class="ex-card-head"><div class="ex-card-title">${lineBreaks(e.title)}</div><div class="ex-points">${e.points} ${l.points}</div></div>` +
      `<div class="ex-card-desc">${lineBreaks(e.description)}</div>` +
      `<div class="ex-card-foot"><span class="ex-badge ${e.difficulty}">${l[e.difficulty]}</span><span class="ex-start">${l.start}</span></div>` +
      `</div>`,
  );
  return `<div class="ex-list">${cards.join('')}</div>`;
}

/** Aufgabenkarte der Detailseite. */
export function exerciseDetailHtml(title: string, description: string): string {
  return (
    `<div class="ex-card static"><div class="ex-card-title">${lineBreaks(title)}</div>` +
    `<div class="ex-card-desc">${lineBreaks(description)}</div></div>`
  );
}

/** Aufgedeckte Lösungsschritte (SolutionStepView). */
export function exerciseStepsHtml(steps: readonly string[], lang: Lang): string {
  const label = exerciseLabels[lang].step;
  return steps
    .map((s, i) => `<div class="ex-step"><div class="ex-step-head">${label} ${i + 1}</div><div>${lineBreaks(s)}</div></div>`)
    .join('');
}
