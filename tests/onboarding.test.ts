import assert from 'node:assert/strict';
import { test } from 'node:test';

import manifest from '../assets/content/manifest.json';
import type { ExamEntry } from '../src/content/types';
import { canonicalExamKey, dayRangeLabel, daysUntilExam, examOptions, theoryTopics, timelineRanges } from '../src/features/onboarding/plan';

test('Prüfungsauswahl: ein Eintrag je Fach, wichtigste zuerst, ohne DGL', () => {
  assert.equal(canonicalExamKey('mathematik_1_klausur_2'), 'mathematik_1');
  assert.equal(canonicalExamKey('analysis_1_anfaenger'), 'analysis_1');
  const options = examOptions(manifest.exams as ExamEntry[], 'de');
  const keys = options.map((o) => o.key);
  assert.deepEqual(keys.slice(0, 4), ['mathematik_1', 'mathematik_2', 'statistik', 'numerische_mathematik']);
  assert.equal(new Set(keys).size, keys.length);
  assert.ok(!keys.includes('differentialgleichungen'));
  assert.equal(options.find((o) => o.key === 'numerische_mathematik')?.title, 'Numerik');
  assert.equal(examOptions(manifest.exams as ExamEntry[], 'en')[0].title, 'Mathematics I');
});

test('Lernplan: Tage bis zur Prüfung und drei Abschnitte wie in iOS', () => {
  const today = new Date(2026, 10, 25);
  assert.equal(daysUntilExam(null, today), 21);
  assert.equal(daysUntilExam('2026-12-05', today), 10);
  assert.equal(daysUntilExam('2026-11-25', today), 1);
  assert.deepEqual(timelineRanges(21), [
    [1, 4],
    [5, 15],
    [16, 21],
  ]);
  assert.deepEqual(timelineRanges(1), [
    [1, 1],
    [2, 2],
    [3, 3],
  ]);
  assert.equal(dayRangeLabel([5, 15], 'de'), 'TAG 5-15');
  assert.equal(dayRangeLabel([3, 3], 'en'), 'DAY 3');
  assert.equal(theoryTopics('mathematik_1', 'de').length, 4);
  assert.deepEqual(theoryTopics('lineare_algebra', 'en'), ['Vector spaces', 'Matrix operations', 'Eigenvalues and eigenvectors']);
});
