import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import type { ContentManifest, Lesson } from '../src/content/types';
import { bulletTerm, chapterFill, chapterForStep, lessonChapters, textBlocks } from '../src/domain/lesson';
import { lessonStepSegments } from '../src/math/templates';
import captionsDe from '../src/visuals/captions/de.json';
import captionsEn from '../src/visuals/captions/en.json';
import { linearMapFigures } from '../src/visuals/figures/linearMaps';

const content = (rel: string) => JSON.parse(readFileSync(join(__dirname, '../assets/content', rel), 'utf8'));

test('Kapitel werden aus aufeinanderfolgenden gleichen Abschnitten gebildet (wie LessonChapter.chapters)', () => {
  const steps = ['A', 'A', 'B', 'A', undefined, undefined].map((section, i) => ({ id: String(i), text: '', section }));
  const chapters = lessonChapters(steps);
  assert.deepEqual(
    chapters.map((c) => [c.title, c.startIndex, c.count]),
    [
      ['A', 0, 2],
      ['B', 2, 1],
      ['A', 3, 1],
      [undefined, 4, 2],
    ],
  );
  assert.equal(chapterForStep(chapters, 2)?.title, 'B');
  assert.equal(chapterFill(chapters[0], 0), 0.5);
  assert.equal(chapterFill(chapters[0], 5), 1);
  assert.equal(chapterFill(chapters[1], 0), 0);
});

test('Text wird in Absätze und Aufzählungen zerlegt (wie ExplanationContent.blocks)', () => {
  const blocks = textBlocks('Erster Absatz\nzweite Zeile\n\n• Punkt 1\n- Punkt 2\nDanach Text');
  assert.deepEqual(blocks, [
    { kind: 'paragraph', text: 'Erster Absatz\nzweite Zeile' },
    { kind: 'bullets', items: ['Punkt 1', 'Punkt 2'] },
    { kind: 'paragraph', text: 'Danach Text' },
  ]);
  assert.deepEqual(bulletTerm('Kern: alle v mit f(v) = 0'), { term: 'Kern', rest: 'alle v mit f(v) = 0' });
  assert.equal(bulletTerm('Kern: \\(f(v) = 0\\)'), null);
});

test('Lineare Abbildungen (3.3): Kapitel, Vorlagen und Grafiken passen zusammen', () => {
  const manifest: ContentManifest = content('manifest.json');
  const topic = manifest.courses.flatMap((c) => c.topics).find((t) => t.id === '3.3');
  assert.ok(topic);
  for (const lang of ['de', 'en'] as const) {
    const lesson: Lesson = content(`${lang}/3.3/lesson.json`);
    assert.equal(lesson.steps.length, topic.stats.lessonSteps[lang]);
    const figures = linearMapFigures(lang);
    for (const step of lesson.steps) {
      const seg = lessonStepSegments(step, lang);
      assert.ok(seg.before.length > 0);
      if (step.visual) assert.ok(figures[step.visual], `Grafik ${step.visual} fehlt`);
    }
  }
  assert.equal(lessonChapters(content('de/3.3/lesson.json').steps).length, 8);
});

test('Jede portierte Grafik hat DE- und EN-Texte und in allen Phasen dieselben Elemente', () => {
  for (const lang of ['de', 'en'] as const) {
    const captions: Record<string, string[]> = lang === 'de' ? captionsDe : captionsEn;
    for (const [name, spec] of Object.entries(linearMapFigures(lang))) {
      const phases = captions[name]?.length ?? 0;
      assert.ok(phases > 1, `${lang}: keine Bildunterschriften für ${name}`);
      assert.equal(phases, captionsDe[name as keyof typeof captionsDe].length, `${name}: DE/EN Phasenzahl`);
      const keys = spec.scene(0).map((e) => e.key).join('|');
      for (let p = 1; p < phases; p++) {
        assert.equal(spec.scene(p).map((e) => e.key).join('|'), keys, `${name}: Phase ${p}`);
      }
    }
  }
});
