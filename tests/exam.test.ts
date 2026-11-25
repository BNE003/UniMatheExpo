import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import type { ContentManifest, Exam } from '../src/content/types';
import { formatTime, gradingScale } from '../src/domain/exam';

test('Notenschlüssel wie iOS (100 Punkte)', () => {
  const scale = gradingScale(100);
  assert.equal(scale.length, 11);
  assert.deepEqual(scale[0], { grade: '1,0', pointRange: '95 - 100', percentageRange: '95 - 100%', isPassing: true });
  assert.equal(scale.find((g) => g.grade === '4,0')?.pointRange, '50 - 54');
  assert.deepEqual(scale[10], { grade: '5,0', pointRange: '0 - 49', percentageRange: '0 - 49%', isPassing: false });
});

test('Zeitformat', () => {
  assert.equal(formatTime(90 * 60), '1:30:00');
  assert.equal(formatTime(59 * 60 + 5), '59:05');
  assert.equal(formatTime(-3), '00:00');
});

test('Alle 18 Klausuren sind in DE und EN vorhanden und haben Lösungen', () => {
  const manifest: ContentManifest = JSON.parse(readFileSync(join(__dirname, '../assets/content/manifest.json'), 'utf8'));
  assert.equal(manifest.exams.length, 18);
  for (const entry of manifest.exams) {
    for (const lang of ['de', 'en']) {
      const exam: Exam = JSON.parse(readFileSync(join(__dirname, `../assets/content/${lang}/exams/${entry.key}.json`), 'utf8'));
      assert.ok(exam.exercises.length > 0);
      for (const ex of exam.exercises) assert.ok(ex.solutionSteps.length > 0, `${entry.key} #${ex.id}`);
    }
  }
});
