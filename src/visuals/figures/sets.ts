/**
 * Grafiken zu Mengen, Abbildungen und Logik.
 * Quelle: Views/LessonVectorVisuals.swift (Abschnitte 20–27, Pfeildiagramme aus dem `switch`).
 */
import type { Lang } from '@/content/types';

import { arrow, circle, ellipse, fade, mathLabel, polygon, rect, rectXY, region, regionCircle, regionRect, segment, text, dot, path } from '../dsl';
import { show, type ColorName, type FigureSpec, type PlaneWindow, type Pt, type SceneEl } from '../scene';

/** Zeichenfläche ohne Gitter im Seitenverhältnis 1,4 : 1 (Koordinaten 0…14 × 0…10). */
export const setWindow: PlaneWindow = { xMin: 0, xMax: 14, yMin: 0, yMax: 10 };
export const setAspect = 1.4;

const de = (lang: Lang, deText: string, enText: string) => (lang === 'en' ? enText : deText);

// ---------------------------------------------------------------------------
// 20. Venn-Diagramm

const centerA: Pt = [5.3, 5];
const centerB: Pt = [8.7, 5];
const A = regionCircle(centerA, 3.2);
const B = regionCircle(centerB, 3.2);
const U = regionRect(0.4, 0.4, 13.6, 9.6, 10);

const vennFrame = (): SceneEl[] => [
  rectXY('U', 0.4, 0.4, 13.6, 9.6, { radius: 10, stroke: { color: 'secondary', alpha: 0.5, width: 1.5 } }),
  text('UL', 'U', [1.1, 9], { color: 'secondary', italic: true }),
];

const vennOperations: FigureSpec = (() => {
  const elements: [string, Pt][] = [
    ['1', [3.6, 6.2]],
    ['2', [3.8, 3.8]],
    ['3', [7, 6.1]],
    ['4', [7, 3.9]],
    ['5', [10.2, 6.2]],
    ['6', [10.4, 3.8]],
    ['7', [1.3, 1.3]],
    ['8', [12.7, 8.7]],
  ];
  const highlighted = [[], ['3', '4'], ['1', '2', '3', '4', '5', '6'], ['1', '2'], ['5', '6'], ['5', '6', '7', '8']];
  const fill = { color: 'result' as const, alpha: 0.32 };
  return {
    window: setWindow,
    showGrid: false,
    aspectRatio: setAspect,
    scene: (phase) => {
      const marked = highlighted[Math.min(phase, highlighted.length - 1)];
      return [
        vennFrame(),
        region('r1', [A], fill, { clip: { shapes: [B] }, opacity: show(phase === 1) }),
        region('r2', [A, B], fill, { opacity: show(phase === 2) }),
        region('r3', [A, B], fill, { rule: 'evenodd', clip: { shapes: [A] }, opacity: show(phase === 3) }),
        region('r4', [A, B], fill, { rule: 'evenodd', clip: { shapes: [B] }, opacity: show(phase === 4) }),
        region('r5', [U, A], fill, { rule: 'evenodd', opacity: show(phase === 5) }),
        circle('A', centerA, 3.2, { stroke: { color: 'first', width: 2.5 } }),
        circle('B', centerB, 3.2, { stroke: { color: 'second', width: 2.5 } }),
        text('AL', 'A', [3.2, 8.6], { color: 'first', size: 18, italic: true }),
        text('BL', 'B', [10.8, 8.6], { color: 'second', size: 18, italic: true }),
        elements.map(([name, at]) => {
          const isMarked = marked.includes(name);
          return text(`e${name}`, name, at, { color: isMarked ? 'primary' : 'secondary', size: isMarked ? 19 : 15, weight: isMarked ? 'bold' : 'regular' });
        }),
      ];
    },
  };
})();

/** 21. DeMorganVisual */
const deMorgan: FigureSpec = {
  window: setWindow,
  showGrid: false,
  aspectRatio: setAspect,
  scene: (phase) => [
    region('union', [A, B], { color: 'extra', alpha: 0.28 }, { opacity: show(phase === 0) }),
    region('outside', [U, A], { color: 'result', alpha: 0.4 }, { rule: 'evenodd', clip: { shapes: [U, B], rule: 'evenodd' }, opacity: show(phase === 1 || phase === 4) }),
    region('notA', [U, A], { color: 'first', alpha: 0.22 }, { rule: 'evenodd', opacity: show(phase === 2 || phase === 3) }),
    region('notB', [U, B], { color: 'second', alpha: 0.22 }, { rule: 'evenodd', opacity: show(phase === 3) }),
    vennFrame(),
    circle('A', centerA, 3.2, { stroke: { color: 'first', width: 2.5 } }),
    circle('B', centerB, 3.2, { stroke: { color: 'second', width: 2.5 } }),
    text('AL', 'A', [4, 5], { color: 'first', size: 18, italic: true }),
    text('BL', 'B', [10, 5], { color: 'second', size: 18, italic: true }),
  ],
};

/** 22. PowerSetVisual: Hasse-Diagramm von 𝒫({1, 2, 3}). */
const powerSet: FigureSpec = (() => {
  const nodes: [string, Pt, number][] = [
    ['∅', [7, 1.2], 0],
    ['{1}', [2.8, 4], 1],
    ['{2}', [7, 4], 1],
    ['{3}', [11.2, 4], 1],
    ['{1, 2}', [2.8, 6.6], 2],
    ['{1, 3}', [7, 6.6], 2],
    ['{2, 3}', [11.2, 6.6], 2],
    ['{1, 2, 3}', [7, 9.0], 3],
  ];
  const edges: [number, number][] = [
    [0, 1],
    [0, 2],
    [0, 3],
    [1, 4],
    [1, 5],
    [2, 4],
    [2, 6],
    [3, 5],
    [3, 6],
    [4, 7],
    [5, 7],
    [6, 7],
  ];
  return {
    window: setWindow,
    showGrid: false,
    aspectRatio: setAspect,
    scene: (phase) => [
      edges.map(([a, b], e) =>
        segment(`edge${e}`, [nodes[a][1][0], nodes[a][1][1] + 0.45], [nodes[b][1][0], nodes[b][1][1] - 0.45], { color: 'secondary', alpha: 0.45, width: 1.2 }, {
          opacity: show(nodes[b][2] <= phase),
        }),
      ),
      nodes.map(([name, at, level], i) =>
        text(`node${i}`, name, at, {
          size: 14,
          chip: {
            shape: 'capsule',
            padX: 7,
            padY: 3,
            fill: { color: 'first', alpha: level === 3 ? 0.3 : 0.14 },
            stroke: { color: 'first', alpha: 0.6, width: 1 },
          },
          opacity: show(level <= phase),
        }),
      ),
    ],
  };
})();

/** 23. CartesianProductVisual: A × B und der Graph einer Abbildung. */
const cartesianProduct: FigureSpec = {
  window: { xMin: -0.8, xMax: 3.8, yMin: -0.8, yMax: 3.8 },
  scene: (phase) => {
    const graph = new Set(['1,2', '2,1', '3,2']);
    const els: SceneEl[] = [];
    for (let x = 1; x <= 3; x++) els.push(mathLabel(`x${x}`, `${x}`, [x, 0], 'first', [0, 14]));
    for (let y = 1; y <= 2; y++) els.push(mathLabel(`y${y}`, `${y}`, [0, y], 'second', [-14, 0]));
    for (let x = 1; x <= 3; x++) {
      for (let y = 1; y <= 2; y++) {
        const k = `${x},${y}`;
        const inGraph = graph.has(k);
        const special = phase === 2 && (k === '1,2' || k === '2,1');
        const color: ColorName = phase >= 3 ? (inGraph ? 'result' : 'secondary') : special ? 'extra' : 'first';
        const big = special || (phase >= 3 && inGraph);
        els.push(
          dot(`p${k}`, [x, y], color, { rxPx: big ? 7.5 : 5, ryPx: big ? 7.5 : 5, opacity: phase === 0 ? 0 : phase >= 3 && !inGraph ? 0.3 : 1 }),
          mathLabel(`l${k}`, `(${x}, ${y})`, [x, y], color, [0, -18], { opacity: phase === 0 ? 0 : phase >= 3 && !inGraph ? 0.25 : 1 }),
        );
      }
    }
    return els;
  },
};

// ---------------------------------------------------------------------------
// 24. Pfeildiagramme

interface DiagramArrow {
  from: [number, number];
  to: [number, number];
  color?: ColorName;
}
interface DiagramMark {
  column: number;
  index: number;
  color: ColorName;
}
interface DiagramFrame {
  columns?: string[][];
  arrows: DiagramArrow[];
  marks?: DiagramMark[];
  dimmed?: DiagramArrow[];
}

/** Pfeil von Spalte c₁, Element i nach Spalte c₂, Element j. */
const a = (c1: number, i: number, c2: number, j: number, color?: ColorName): DiagramArrow => ({ from: [c1, i], to: [c2, j], color });
const m = (column: number, index: number, color: ColorName): DiagramMark => ({ column, index, color });

function arrowDiagram(columns: string[][], names: string[], frames: DiagramFrame[]): FigureSpec {
  const columnX = (k: number, n: number) => (n === 2 ? (k === 0 ? 3.6 : 10.4) : (14 * (k + 0.5)) / n);
  const spacing = (count: number) => Math.min(1.55, 6.6 / Math.max(count, 1));
  const position = (k: number, i: number, cols: string[][]): Pt => {
    const count = cols[k].length;
    const sp = spacing(count);
    return [columnX(k, cols.length), 4.6 + ((count - 1) / 2) * sp - i * sp];
  };
  const ends = (ar: DiagramArrow, cols: string[][]): [Pt, Pt] => {
    const p = position(ar.from[0], ar.from[1], cols);
    const q = position(ar.to[0], ar.to[1], cols);
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const len = Math.max(Math.hypot(dx, dy), 0.001);
    return [
      [p[0] + (0.55 * dx) / len, p[1] + (0.55 * dy) / len],
      [q[0] - (0.6 * dx) / len, q[1] - (0.6 * dy) / len],
    ];
  };

  /** Ein komplettes Bild; zwischen den Bildern wird überblendet (`.id(phase).transition(.opacity)`). */
  const frameElements = (f: DiagramFrame, k: number): SceneEl[] => {
    const cols = f.columns ?? columns;
    const els: SceneEl[] = [];
    cols.forEach((col, c) => {
      const height = col.length * spacing(col.length) + 0.9;
      const x = columnX(c, cols.length);
      els.push(
        ellipse(`f${k}.set${c}`, [x, 4.6], 1.15, height / 2, {
          fill: { color: 'secondary', alpha: 0.06 },
          stroke: { color: 'secondary', alpha: 0.5, width: 1.5 },
        }),
        text(`f${k}.name${c}`, names[c], [x, 4.6 + height / 2 + 0.6], { color: 'secondary', size: 17, italic: true }),
      );
    });
    (f.dimmed ?? []).forEach((ar, i) => {
      const [p, q] = ends(ar, cols);
      els.push(arrow(`f${k}.dim${i}`, p, q, ar.color ?? 'first', { alpha: 0.25, width: 2, head: 9 }));
    });
    f.arrows.forEach((ar, i) => {
      const [p, q] = ends(ar, cols);
      els.push(arrow(`f${k}.arrow${i}`, p, q, ar.color ?? 'first', { width: 2.5, head: 9 }));
    });
    cols.forEach((col, c) =>
      col.forEach((label, i) => {
        const mark = f.marks?.find((mk) => mk.column === c && mk.index === i);
        els.push(
          text(`f${k}.node${c}.${i}`, label, position(c, i, cols), {
            chip: {
              shape: 'circle',
              w: 28,
              h: 28,
              fill: mark ? { color: mark.color, alpha: 0.3 } : { color: 'surfaceStrong' },
              stroke: mark ? { color: mark.color, width: 2.5 } : { color: 'secondary', alpha: 0.4, width: 1 },
            },
          }),
        );
      }),
    );
    return els;
  };

  return {
    window: setWindow,
    showGrid: false,
    aspectRatio: setAspect,
    scene: (phase) => frames.map((f, k) => fade(show(Math.min(phase, frames.length - 1) === k), frameElements(f, k))),
  };
}

const diagramFigures = (lang: Lang): Record<string, FigureSpec> => {
  const preF = [a(0, 0, 1, 0), a(0, 1, 1, 1), a(0, 2, 1, 0), a(0, 3, 1, 2)];
  const compF = [a(0, 0, 1, 0), a(0, 1, 1, 2), a(0, 2, 1, 1)];
  const compG = [a(1, 0, 2, 1, 'second'), a(1, 1, 2, 0, 'second'), a(1, 2, 2, 1, 'second')];
  const invF = [a(0, 0, 1, 1), a(0, 1, 1, 2), a(0, 2, 1, 0)];
  const invBack = [a(1, 1, 0, 0, 'result'), a(1, 2, 0, 1, 'result'), a(1, 0, 0, 2, 'result')];
  const invH = [a(0, 0, 1, 0), a(0, 1, 1, 0), a(0, 2, 1, 1)];
  const invHBack = [a(1, 0, 0, 0, 'warning'), a(1, 0, 0, 1, 'warning'), a(1, 1, 0, 2, 'warning')];
  const six = ['1', '2', '3', '4', '5', '6'];
  const five = ['1', '2', '3', '4', '5'];
  return {
    fieldInverses: arrowDiagram([six, six], ['a', 'a⁻¹'], [
      { arrows: [a(0, 0, 1, 0), a(0, 1, 1, 3), a(0, 2, 1, 4), a(0, 3, 1, 1), a(0, 4, 1, 2), a(0, 5, 1, 5)] },
      {
        columns: [five, five],
        arrows: [a(0, 0, 1, 0), a(0, 4, 1, 4)],
        marks: [m(0, 1, 'warning'), m(0, 2, 'warning'), m(0, 3, 'warning')],
      },
    ]),
    quantifierOrder: arrowDiagram([['1', '2', '3'], ['a', 'b', 'c']], [de(lang, 'Schlösser', 'Locks'), de(lang, 'Schlüssel', 'Keys')], [
      { arrows: [] },
      { arrows: [a(0, 0, 1, 0), a(0, 1, 1, 1), a(0, 2, 1, 2)] },
      { arrows: [a(0, 0, 1, 1), a(0, 1, 1, 1), a(0, 2, 1, 1)], marks: [m(1, 1, 'result')] },
      { arrows: [a(0, 0, 1, 0), a(0, 1, 1, 1), a(0, 2, 1, 2)], marks: [m(1, 0, 'warning'), m(1, 1, 'warning'), m(1, 2, 'warning')] },
    ]),
    mapCheck: arrowDiagram([['1', '2', '3'], ['a', 'b', 'c', 'd']], ['A', 'B'], [
      { arrows: [a(0, 0, 1, 1), a(0, 1, 1, 0), a(0, 2, 1, 3)], marks: [m(0, 0, 'result'), m(0, 1, 'result'), m(0, 2, 'result')] },
      { arrows: [a(0, 0, 1, 1), a(0, 1, 1, 0)], marks: [m(0, 2, 'warning')] },
      { arrows: [a(0, 0, 1, 1), a(0, 0, 1, 2), a(0, 1, 1, 0), a(0, 2, 1, 3)], marks: [m(0, 0, 'warning')] },
      { arrows: [a(0, 0, 1, 1), a(0, 1, 1, 1), a(0, 2, 1, 1)], marks: [m(1, 1, 'result')] },
    ]),
    injSurj: arrowDiagram([['1', '2', '3'], ['a', 'b', 'c']], ['A', 'B'], [
      { columns: [['1', '2', '3'], ['a', 'b', 'c', 'd']], arrows: [a(0, 0, 1, 0), a(0, 1, 1, 1), a(0, 2, 1, 3)], marks: [m(1, 2, 'second')] },
      {
        columns: [['1', '2', '3', '4'], ['a', 'b', 'c']],
        arrows: [a(0, 0, 1, 0), a(0, 1, 1, 1), a(0, 2, 1, 2), a(0, 3, 1, 2)],
        marks: [m(1, 2, 'second')],
      },
      { arrows: [a(0, 0, 1, 1), a(0, 1, 1, 2), a(0, 2, 1, 0)], marks: [m(1, 0, 'result'), m(1, 1, 'result'), m(1, 2, 'result')] },
      { arrows: [a(0, 0, 1, 0), a(0, 1, 1, 0), a(0, 2, 1, 2)], marks: [m(1, 0, 'warning'), m(1, 1, 'second')] },
    ]),
    preimage: arrowDiagram([['1', '2', '3', '4'], ['a', 'b', 'c', 'd']], ['A', 'B'], [
      { arrows: preF },
      { arrows: preF, marks: [m(0, 0, 'result'), m(0, 1, 'result'), m(1, 0, 'result'), m(1, 1, 'result')] },
      { arrows: preF, marks: [m(1, 0, 'extra'), m(0, 0, 'extra'), m(0, 2, 'extra')] },
      { arrows: preF, marks: [m(1, 3, 'extra')] },
    ]),
    composition: arrowDiagram([['1', '2', '3'], ['a', 'b', 'c'], ['x', 'y']], ['A', 'B', 'C'], [
      { arrows: compF },
      { arrows: [...compF, ...compG] },
      {
        arrows: [a(0, 0, 1, 0, 'result'), a(1, 0, 2, 1, 'result')],
        marks: [m(0, 0, 'result'), m(2, 1, 'result')],
        dimmed: [...compF, ...compG],
      },
      { arrows: [a(0, 0, 2, 1, 'result'), a(0, 1, 2, 1, 'result'), a(0, 2, 2, 0, 'result')], dimmed: [...compF, ...compG] },
    ]),
    inverseMap: arrowDiagram([['1', '2', '3'], ['a', 'b', 'c']], ['A', 'B'], [
      { arrows: invF },
      { arrows: invBack, dimmed: invF },
      { arrows: invH },
      { arrows: invHBack, marks: [m(1, 0, 'warning'), m(1, 2, 'warning')], dimmed: invH },
    ]),
  };
};

// ---------------------------------------------------------------------------
// 25.–27. Äquivalenzklassen und Logik

const modClasses: FigureSpec = (() => {
  const colors: ColorName[] = ['first', 'second', 'result'];
  const position = (n: number, phase: number): Pt =>
    phase < 2 ? [1.2 + n * 1.45, 7.2] : [2.6 + (n % 3) * 4.4, 4.9 - Math.floor(n / 3) * 1.4];
  return {
    window: setWindow,
    showGrid: false,
    aspectRatio: setAspect,
    scene: (phase) => [
      [0, 1, 2].map((r) => [
        rect(`class${r}`, [2.6 + r * 4.4, 3.5], 3.4, 5, {
          radius: 14,
          fill: { color: colors[r], alpha: phase >= 3 ? 0.14 : 0.06 },
          stroke: { color: colors[r], width: 2 },
          opacity: show(phase >= 2),
        }),
        text(`classL${r}`, `[${r}]`, [2.6 + r * 4.4, 0.6], { color: colors[r], size: 16, opacity: show(phase >= 2) }),
      ]),
      Array.from({ length: 9 }, (_, n) => {
        const colored = phase >= 1;
        return text(`n${n}`, `${n}`, position(n, phase), {
          size: 16,
          weight: 'bold',
          color: colored ? 'white' : 'primary',
          chip: { shape: 'circle', w: 30, h: 30, fill: colored ? { color: colors[n % 3] } : { color: 'secondary', alpha: 0.15 } },
        });
      }),
    ],
  };
})();

/** 26. Wahrheitstafel der Implikation. */
const implicationTable = (lang: Lang): FigureSpec => {
  const T = lang === 'en' ? 'T' : 'w';
  const F = lang === 'en' ? 'F' : 'f';
  const rows: [string, string, string][] = [
    [T, T, T],
    [T, F, F],
    [F, T, T],
    [F, F, T],
  ];
  const columnX = [2.8, 6.2, 10.6];
  const rowY = [6.7, 5.0, 3.3, 1.6];
  const visible = (row: number, phase: number) => (phase === 0 ? false : phase === 1 ? row === 0 : phase === 2 ? row <= 1 : true);
  const highlighted = (row: number, phase: number) => (phase === 1 ? row === 0 : phase === 2 ? row === 1 : phase === 3 ? row >= 2 : false);
  return {
    window: setWindow,
    showGrid: false,
    aspectRatio: setAspect,
    scene: (phase) => [
      rowY.map((y, r) =>
        rect(`hl${r}`, [6.7, y], 12.4, 1.4, { radius: 8, fill: { color: r === 1 ? 'warning' : 'result', alpha: 0.2 }, opacity: show(highlighted(r, phase)) }),
      ),
      path(
        'rules',
        [
          [
            [0.5, 7.75],
            [12.9, 7.75],
          ],
          [
            [8.4, 9.4],
            [8.4, 0.7],
          ],
        ],
        { stroke: { color: 'secondary', alpha: 0.5, width: 1.5 } },
      ),
      text('hA', 'A', [columnX[0], 8.6], { color: 'first', size: 19, italic: true }),
      text('hB', 'B', [columnX[1], 8.6], { color: 'second', size: 19, italic: true }),
      text('hAB', 'A ⇒ B', [columnX[2], 8.6], { size: 19, italic: true }),
      rows.map((row, r) => [
        text(`a${r}`, row[0], [columnX[0], rowY[r]], { size: 18 }),
        text(`b${r}`, row[1], [columnX[1], rowY[r]], { size: 18 }),
        text(`ab${r}`, row[2], [columnX[2], rowY[r]], {
          color: row[2] === F ? 'warning' : 'result',
          size: 20,
          weight: 'bold',
          opacity: show(visible(r, phase)),
        }),
      ]),
    ],
  };
};

/** 27. Implikation als Teilmenge: Kontraposition und Umkehrschluss. */
const implicationSets = (lang: Lang): FigureSpec => ({
  window: setWindow,
  showGrid: false,
  aspectRatio: setAspect,
  scene: (phase) => [
    circle('outer', [7.4, 5], 4.3, { fill: { color: 'second', alpha: 0.1 }, stroke: { color: 'second', width: 2.5 } }),
    circle('inner', [6.2, 5], 2.0, { fill: { color: 'first', alpha: 0.18 }, stroke: { color: 'first', width: 2.5 } }),
    text('outerL', de(lang, 'B: Rechtecke', 'B: rectangles'), [7.4, 8.6], { color: 'second' }),
    text('innerL', de(lang, 'A: Quadrate', 'A: squares'), [6.2, 6.3], { color: 'first', size: 14 }),
    rect('square', [6.2, 4.4], 0, 0, { wPx: 18, hPx: 18, fill: { color: 'first' }, opacity: show(phase >= 1) }),
    // Dreieck: ±11 px breit, 21 px hoch (bei 14 Einheiten Breite ≈ 0,47 bzw. 0,89 Einheiten)
    polygon(
      'triangle',
      [
        [1.6, 2.5],
        [1.13, 1.62],
        [2.07, 1.62],
      ],
      { fill: { color: 'warning' }, opacity: show(phase >= 2) },
    ),
    rect('rectangle', [9.9, 4.6], 0, 0, { wPx: 30, hPx: 20, fill: { color: 'result' }, opacity: show(phase >= 3) }),
  ],
});

export const setFigures = (lang: Lang): Record<string, FigureSpec> => ({
  vennOperations,
  deMorgan,
  powerSet,
  cartesianProduct,
  ...diagramFigures(lang),
  modClasses,
  implicationTable: implicationTable(lang),
  implicationSets: implicationSets(lang),
});
