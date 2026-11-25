import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  determinant,
  equationLines,
  formatNumber,
  gaussSteps,
  multiply,
  parseNumber,
  solveLinearSystem,
} from '../src/domain/matrix';

test('Eingaben werden wie in iOS gelesen, zusätzlich Brüche', () => {
  assert.equal(parseNumber(''), 0);
  assert.equal(parseNumber(' 2,5 '), 2.5);
  assert.equal(parseNumber('-3.25'), -3.25);
  assert.equal(parseNumber('1/2'), 0.5);
  assert.equal(parseNumber('-3/4'), -0.75);
  assert.equal(parseNumber('1/0'), 0);
  assert.equal(parseNumber('abc'), 0);
});

test('Zahlenformat folgt der App-Sprache', () => {
  assert.equal(formatNumber(2.5, 'de'), '2,5');
  assert.equal(formatNumber(2.5, 'en'), '2.5');
  assert.equal(formatNumber(1 / 3, 'de'), '0,333');
  assert.equal(formatNumber(-1e-12, 'de'), '0');
});

test('Determinante (mit Zeilentausch und singulär)', () => {
  assert.equal(determinant([[3, 1], [1, 2]]), 5);
  assert.ok(Math.abs(determinant([[0, 1, 2], [1, 0, 3], [4, -3, 8]]) - -2) < 1e-9);
  assert.equal(determinant([[1, 2], [2, 4]]), 0);
});

test('Multiplikation', () => {
  assert.deepEqual(multiply([[1, 2], [3, 4]], [[0, 1], [1, 0]]), [[2, 1], [4, 3]]);
});

test('LGS mit eindeutiger Lösung (Beispiel aus klausuren/de/lineare_algebra_1_anfaenger.json, Aufgabe 2)', () => {
  const A = [[1, 1, 1], [2, -1, 1], [1, 2, -1]];
  const b = [6, 3, 2];
  const solution = solveLinearSystem(A, b, 'de');
  assert.equal(solution.status, 'unique');
  assert.deepEqual(solution.vectorLines, ['x = \\begin{pmatrix} 1 \\\\ 2 \\\\ 3 \\end{pmatrix}']);

  const gauss = gaussSteps(A, b, 'gauss', 'de');
  assert.equal(gauss.steps[0].description, 'Startmatrix');
  // obere Dreiecksform
  for (let i = 0; i < 3; i++) for (let j = 0; j < i; j++) assert.ok(Math.abs(gauss.result[i][j]) < 1e-9);

  const jordan = gaussSteps(A, b, 'gaussJordan', 'en');
  assert.deepEqual(
    jordan.result.map((row) => row.map((v) => Math.round(v * 1e9) / 1e9)),
    [
      [1, 0, 0, 1],
      [0, 1, 0, 2],
      [0, 0, 1, 3],
    ],
  );
});

test('LGS mit unendlich vielen Lösungen und ohne Lösung', () => {
  const infinite = solveLinearSystem([[1, 2], [2, 4]], [3, 6], 'de');
  assert.equal(infinite.status, 'infinite');
  assert.match(infinite.vectorLines[0], /x_\{2\} \\cdot/);
  assert.equal(solveLinearSystem([[1, 2], [2, 4]], [3, 7], 'de').status, 'inconsistent');
});

test('Gleichungen als LaTeX mit Dezimalkomma', () => {
  assert.deepEqual(equationLines([[1, -2.5, 4]], 'de'), ['x_{1} - 2{,}5 x_{2} &= 4']);
});
