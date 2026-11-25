/**
 * Logik des Matrixrechners, portiert aus Views/MatrixCalculatorView.swift:
 * Gauß / Gauß-Jordan mit Zwischenschritten, Lösung des LGS (RREF), Multiplikation, Determinante.
 * Reine Funktionen ohne UI – siehe tests/matrix.test.ts.
 */
import type { Lang } from '@/content/types';

export type Matrix = number[][];
export type Algorithm = 'gauss' | 'gaussJordan';
export type RowOperation =
  | { type: 'swap'; targetRow: number; sourceRow: number }
  | { type: 'scale'; targetRow: number; factor: number }
  | { type: 'add'; targetRow: number; sourceRow: number; factor: number };

export interface GaussStep {
  description: string;
  matrix: Matrix;
  operation: RowOperation | null;
}

export type SolutionStatus = 'none' | 'unique' | 'infinite' | 'inconsistent';

export interface SolutionOutput {
  status: SolutionStatus;
  /** LaTeX-Zeilen */
  steps: string[];
  results: string[];
  vectorLines: string[];
}

const EPS = 1e-9;
const loc = (lang: Lang, de: string, en: string) => (lang === 'en' ? en : de);
const clone = (m: Matrix): Matrix => m.map((row) => [...row]);

// ---------------------------------------------------------------------------
// Zahlen

/**
 * Eingabe → Zahl (MatrixCalculatorView.parseNumber). Leer → 0, Komma oder Punkt als Dezimaltrenner.
 * Zusätzlich zu iOS werden Brüche wie „1/2“ oder „-3/4“ erkannt (iOS wertet sie als 0).
 */
export function parseNumber(value: string): number {
  const trimmed = value.trim().replaceAll(',', '.');
  if (trimmed === '') return 0;
  const fraction = /^([+-]?\d+(?:\.\d+)?)\s*\/\s*([+-]?\d+(?:\.\d+)?)$/.exec(trimmed);
  if (fraction) {
    const den = Number(fraction[2]);
    return den === 0 ? 0 : Number(fraction[1]) / den;
  }
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : 0;
}

/** formatNumber (NumberFormatter .decimal, 0…max Nachkommastellen, Sprache der App). */
export function formatNumber(value: number, lang: Lang, maximumFractionDigits = 3): string {
  const adjusted = Math.abs(value) < EPS ? 0 : value;
  return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'de-DE', {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(adjusted);
}

/** Zahl für LaTeX; im Deutschen wird das Dezimalkomma als `{,}` gesetzt (sonst setzt TeX ein Leerzeichen dahinter). */
export function texNumber(value: number, lang: Lang, maximumFractionDigits = 4): string {
  return formatNumber(value, lang, maximumFractionDigits).replaceAll(',', '{,}');
}

// ---------------------------------------------------------------------------
// Grundoperationen

export const emptyInput = (n: number): string[][] => Array.from({ length: n }, () => Array<string>(n).fill(''));
export const emptyRhs = (n: number): string[] => Array<string>(n).fill('0');
export const zeroMatrix = (rows: number, cols: number): Matrix => Array.from({ length: rows }, () => Array<number>(cols).fill(0));

export const parseMatrix = (input: string[][]): Matrix => input.map((row) => row.map(parseNumber));

export function buildAugmented(matrix: Matrix, rhs: number[]): Matrix {
  return matrix.map((row, i) => [...row, i < rhs.length ? rhs[i] : 0]);
}

export function multiply(left: Matrix, right: Matrix): Matrix {
  const n = left.length;
  const result = zeroMatrix(n, n);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) sum += left[i][k] * right[k][j];
      result[i][j] = sum;
    }
  return result;
}

/** Determinante über Gauß mit Spaltenpivotsuche. */
export function determinant(input: Matrix): number {
  const m = clone(input);
  const n = m.length;
  let sign = 1;
  for (let i = 0; i < n; i++) {
    let pivotRow = i;
    let pivotValue = Math.abs(m[i][i]);
    for (let row = i + 1; row < n; row++) {
      if (Math.abs(m[row][i]) > pivotValue) {
        pivotValue = Math.abs(m[row][i]);
        pivotRow = row;
      }
    }
    if (pivotValue < EPS) return 0;
    if (pivotRow !== i) {
      [m[i], m[pivotRow]] = [m[pivotRow], m[i]];
      sign *= -1;
    }
    const pivot = m[i][i];
    for (let row = i + 1; row < n; row++) {
      const factor = m[row][i] / pivot;
      if (Math.abs(factor) < EPS) continue;
      for (let col = i; col < n; col++) m[row][col] -= factor * m[i][col];
    }
  }
  let det = sign;
  for (let i = 0; i < n; i++) det *= m[i][i];
  return det;
}

// ---------------------------------------------------------------------------
// Gauß / Gauß-Jordan mit Zwischenschritten (gaussStepsFor)

export function gaussSteps(input: Matrix, rhs: number[], algorithm: Algorithm, lang: Lang): { steps: GaussStep[]; result: Matrix } {
  const m = buildAugmented(input, rhs);
  const n = input.length;
  const cols = n + 1;
  const fmt = (v: number) => formatNumber(v, lang);
  const steps: GaussStep[] = [{ description: loc(lang, 'Startmatrix', 'Start matrix'), matrix: clone(m), operation: null }];

  for (let i = 0; i < n; i++) {
    let pivotRow = i;
    let pivotValue = Math.abs(m[i][i]);
    for (let row = i + 1; row < n; row++) {
      if (Math.abs(m[row][i]) > pivotValue) {
        pivotValue = Math.abs(m[row][i]);
        pivotRow = row;
      }
    }

    if (pivotValue < EPS) {
      steps.push({
        description: loc(lang, `Pivot in Spalte ${i + 1} ist 0, Spalte übersprungen.`, `Pivot in column ${i + 1} is 0, column skipped.`),
        matrix: clone(m),
        operation: null,
      });
      continue;
    }

    if (pivotRow !== i) {
      [m[i], m[pivotRow]] = [m[pivotRow], m[i]];
      steps.push({
        description: `R${i + 1} <-> R${pivotRow + 1}`,
        matrix: clone(m),
        operation: { type: 'swap', targetRow: i, sourceRow: pivotRow },
      });
    }

    if (algorithm === 'gaussJordan') {
      const pivot = m[i][i];
      if (Math.abs(pivot - 1) > EPS) {
        for (let j = i; j < cols; j++) m[i][j] /= pivot;
        steps.push({
          description: `R${i + 1} = R${i + 1} / ${fmt(pivot)}`,
          matrix: clone(m),
          operation: { type: 'scale', targetRow: i, factor: pivot },
        });
      }
    }

    for (let row = 0; row < n; row++) {
      if (row === i) continue;
      if (algorithm === 'gauss' && row < i) continue;
      const pivot = m[i][i];
      if (Math.abs(pivot) < EPS) continue;
      const factor = algorithm === 'gauss' ? m[row][i] / pivot : m[row][i];
      if (Math.abs(factor) < EPS) continue;
      for (let col = i; col < cols; col++) m[row][col] -= factor * m[i][col];
      steps.push({
        description: `R${row + 1} = R${row + 1} - ${fmt(factor)} * R${i + 1}`,
        matrix: clone(m),
        operation: { type: 'add', targetRow: row, sourceRow: i, factor },
      });
    }
  }
  return { steps, result: m };
}

/** Zeilen, die ein Schritt verändert (highlightRows). */
export function highlightRows(op: RowOperation | null): number[] {
  if (!op) return [];
  return op.type === 'scale' ? [op.targetRow] : [op.targetRow, op.sourceRow];
}

// ---------------------------------------------------------------------------
// Lösung des LGS

/** Reduzierte Zeilenstufenform der erweiterten Matrix (rrefAugmented). */
export function rrefAugmented(input: Matrix): Matrix {
  const result = clone(input);
  const rowCount = result.length;
  const colCount = result[0]?.length ?? 0;
  const varCount = Math.max(colCount - 1, 0);
  let lead = 0;
  for (let r = 0; r < rowCount; r++) {
    if (lead >= varCount) break;
    let i = r;
    while (Math.abs(result[i][lead]) < EPS) {
      i += 1;
      if (i === rowCount) {
        i = r;
        lead += 1;
        if (lead >= varCount) return result;
      }
    }
    if (i !== r) [result[i], result[r]] = [result[r], result[i]];
    const pivot = result[r][lead];
    if (Math.abs(pivot) > EPS) for (let j = 0; j < colCount; j++) result[r][j] /= pivot;
    for (let row = 0; row < rowCount; row++) {
      if (row === r) continue;
      const factor = result[row][lead];
      if (Math.abs(factor) < EPS) continue;
      for (let col = 0; col < colCount; col++) result[row][col] -= factor * result[r][col];
    }
    lead += 1;
  }
  return result;
}

function expressionLatex(constant: number, terms: [number, string][], lang: Lang): string {
  const parts: string[] = [];
  if (Math.abs(constant) > EPS) parts.push(texNumber(constant, lang));
  for (const [coeff, name] of terms) {
    if (Math.abs(coeff) < EPS) continue;
    const abs = Math.abs(coeff);
    const coeffText = Math.abs(abs - 1) < EPS ? '' : `${texNumber(abs, lang)} `;
    const term = `${coeffText}${name}`;
    if (parts.length === 0) parts.push(coeff < 0 ? `-${term}` : term);
    else parts.push(`${coeff < 0 ? '-' : '+'} ${term}`);
  }
  return parts.length ? parts.join(' ') : '0';
}

const latexVector = (values: string[]) => `\\begin{pmatrix} ${values.join(' \\\\ ')} \\end{pmatrix}`;

/** Lösung aus der RREF (solveFromRref). */
export function solveFromRref(rref: Matrix, lang: Lang): SolutionOutput {
  const rowCount = rref.length;
  const colCount = rref[0]?.length ?? 0;
  const varCount = Math.max(colCount - 1, 0);
  if (rowCount === 0 || varCount === 0) return { status: 'none', steps: [], results: [], vectorLines: [] };

  const pivotCols: number[] = [];
  const rowForPivot = new Map<number, number>();
  for (let row = 0; row < rowCount; row++) {
    let first: number | undefined;
    for (let col = 0; col < varCount; col++) {
      if (Math.abs(rref[row][col]) > EPS) {
        first = col;
        break;
      }
    }
    if (first === undefined) {
      if (Math.abs(rref[row][varCount]) > EPS) return { status: 'inconsistent', steps: [], results: [], vectorLines: [] };
      continue;
    }
    pivotCols.push(first);
    rowForPivot.set(first, row);
  }

  const freeCols = [...Array(varCount).keys()].filter((c) => !pivotCols.includes(c));
  const parameter = new Map<number, string>();
  if (freeCols.length === 1) parameter.set(freeCols[0], `x_{${freeCols[0] + 1}}`);
  else freeCols.forEach((col, index) => parameter.set(col, `t_{${index + 1}}`));

  const steps: string[] = [];
  const resultsByVar = new Map<number, string>();
  for (const col of freeCols) {
    const name = parameter.get(col) ?? 't';
    steps.push(`\\text{${loc(lang, 'Setze freie Variable', 'Set free variable')} } x_{${col + 1}} = ${name}.`);
    resultsByVar.set(col, `x_{${col + 1}} = ${name}`);
  }
  for (let col = 0; col < varCount; col++) {
    const row = rowForPivot.get(col);
    if (row === undefined) continue;
    const terms: [number, string][] = [];
    for (const free of freeCols) {
      const coeff = -rref[row][free];
      if (Math.abs(coeff) < EPS) continue;
      terms.push([coeff, parameter.get(free) ?? 't']);
    }
    const expression = expressionLatex(rref[row][varCount], terms, lang);
    steps.push(`\\text{${loc(lang, `Aus Zeile ${row + 1} folgt`, `From row ${row + 1}:`)} } x_{${col + 1}} = ${expression}.`);
    resultsByVar.set(col, `x_{${col + 1}} = ${expression}`);
  }
  const results = [...Array(varCount).keys()].flatMap((c) => (resultsByVar.has(c) ? [resultsByVar.get(c)!] : []));

  if (freeCols.length === 0) {
    const values = [...Array(varCount).keys()].map((col) => {
      const row = rowForPivot.get(col);
      return row === undefined ? '0' : texNumber(rref[row][varCount], lang);
    });
    return { status: 'unique', steps, results, vectorLines: [`x = ${latexVector(values)}`] };
  }

  const particular = [...Array(varCount).keys()].map((col) => {
    const row = rowForPivot.get(col);
    return row === undefined ? 0 : rref[row][varCount];
  });
  let general = `x = ${latexVector(particular.map((v) => texNumber(v, lang)))}`;
  freeCols.forEach((free, index) => {
    const vector = Array<number>(varCount).fill(0);
    vector[free] = 1;
    for (let pivotCol = 0; pivotCol < varCount; pivotCol++) {
      const row = rowForPivot.get(pivotCol);
      if (row === undefined) continue;
      const coeff = -rref[row][free];
      vector[pivotCol] = Math.abs(coeff) < EPS ? 0 : coeff;
    }
    const name = parameter.get(free) ?? `t_{${index + 1}}`;
    general += ` + ${name} \\cdot ${latexVector(vector.map((v) => texNumber(v, lang)))}`;
  });
  return { status: 'infinite', steps, results, vectorLines: [general] };
}

export function solveLinearSystem(matrix: Matrix, rhs: number[], lang: Lang): SolutionOutput {
  return solveFromRref(rrefAugmented(buildAugmented(matrix, rhs)), lang);
}

/** Gleichungen der (umgeformten) erweiterten Matrix als LaTeX (buildEquationLines). */
export function equationLines(augmented: Matrix, lang: Lang): string[] {
  return augmented
    .filter((row) => row.length > 0)
    .map((row) => {
      const rhs = row[row.length - 1];
      const parts: string[] = [];
      row.slice(0, -1).forEach((coeff, index) => {
        if (Math.abs(coeff) < EPS) return;
        const abs = Math.abs(coeff);
        const coeffText = Math.abs(abs - 1) < EPS ? '' : `${texNumber(abs, lang, 3)} `;
        const term = `${coeffText}x_{${index + 1}}`;
        if (parts.length === 0) parts.push(coeff < 0 ? `-${term}` : term);
        else parts.push(`${coeff < 0 ? '-' : '+'} ${term}`);
      });
      if (parts.length === 0) parts.push('0');
      return `${parts.join(' ')} &= ${texNumber(rhs, lang)}`;
    });
}

/** HTML für die Lösungskarte (solutionLatexContent). */
export function solutionHtml(equations: string[], solution: SolutionOutput, lang: Lang): string {
  let html = `<h2>${loc(lang, 'Lösung des Gleichungssystems', 'Solution of the system')}</h2>`;
  if (equations.length) {
    html += `<h3>${loc(lang, 'Gleichungssystem', 'System')}</h3>`;
    html += `<div class="math-block">$$\\begin{aligned} ${equations.join(' \\\\ ')} \\end{aligned}$$</div>`;
  }
  if (solution.status === 'inconsistent') {
    html += `<div class="math-block">$$\\text{${loc(lang, 'Keine Lösung (inkonsistentes System).', 'No solution (inconsistent system).')}}$$</div>`;
    return html;
  }
  const section = (title: string, lines: string[]) => {
    if (!lines.length) return;
    html += `<h3>${title}</h3>`;
    for (const line of lines) html += `<div class="math-block">$$${line}$$</div>`;
  };
  section(loc(lang, 'Rechenweg', 'Derivation'), solution.steps);
  section(loc(lang, 'Ergebnis', 'Result'), solution.results);
  section(loc(lang, 'Allgemeine Lösung', 'General solution'), solution.vectorLines);
  return html;
}
