/**
 * Grafiken zu Induktion, Grundlagen, Gruppen, Restklassen und komplexen Zahlen.
 * Quelle: Views/LessonVectorVisuals.swift (Abschnitte 28–32, Dreieckssymmetrien, ClockVisual, komplexe Zahlen).
 */
import type { Lang } from '@/content/types';

import { arcPoints, arrow, circle, dot, fade, mathLabel, path, polygon, polyline, rect, rectXY, segment, text, timed } from '../dsl';
import { ORIGIN, show, type ColorName, type FigureSpec, type PlaneWindow, type Pt, type SceneEl } from '../scene';
import { setAspect, setWindow } from './sets';

// ---------------------------------------------------------------------------
// 28. Dominoeffekt

const dominoes = (lang: Lang): FigureSpec => {
  const count = 10;
  const x = (i: number, phase: number) => 1.0 + i * 1.25 + (phase === 5 && i >= 5 ? 1.0 : 0);
  const fallen = (i: number, phase: number) => (phase === 1 || phase === 2 ? i === 0 : phase === 3 ? true : phase === 5 ? i < 5 : false);
  return {
    window: setWindow,
    showGrid: false,
    aspectRatio: setAspect,
    scene: (phase) => [
      segment('ground', [0.2, 2.4], [13.8, 2.4], { color: 'secondary', alpha: 0.5, width: 2 }),
      Array.from({ length: count }, (_, i) => {
        const isPair = phase === 2 && (i === 3 || i === 4);
        const color: ColorName = isPair ? 'second' : fallen(i, phase) ? 'result' : 'first';
        const cx = x(i, phase);
        return [
          // `.animation(.easeIn(duration: 0.3).delay(phase == 3 ? i · 0.18 : 0))`
          timed(
            { easing: 'easeIn', duration: 300, delay: phase === 3 ? i * 180 : 0 },
            rect(`domino${i}`, [cx, 3.9], 0.38, 3.0, {
              radius: 3,
              fill: { color },
              transform: { rotate: fallen(i, phase) ? 62 : 0, pivot: [cx + 0.19, 2.4] },
            }),
          ),
          text(`n${i}`, i === count - 1 ? '…' : `${i + 1}`, [cx, 1.6], { color: 'secondary', size: 14 }),
        ];
      }),
      text('k', 'k', [x(3, phase), 6.6], { color: 'second', size: 17, italic: true, opacity: show(phase === 2) }),
      text('k1', 'k + 1', [x(4, phase) + 0.4, 6.6], { color: 'second', size: 17, italic: true, opacity: show(phase === 2) }),
      text('gap', lang === 'en' ? 'Gap!' : 'Lücke!', [x(5, phase) - 0.9, 6.4], { color: 'warning', size: 16, opacity: show(phase === 5) }),
    ],
  };
};

// ---------------------------------------------------------------------------
// 29. Gaußsche Summenformel

const gaussSum: FigureSpec = (() => {
  /** Kästchen (Spalte, von, bis) mit 1,5 px Abstand zum Rand */
  const cells = (key: string, columns: [number, number, number][], color: ColorName, alpha: number, opacity: number): SceneEl[] =>
    columns.flatMap(([col, from, to]) =>
      Array.from({ length: to - from }, (_, k) =>
        rect(`${key}${col}.${from + k}`, [col + 0.5, from + k + 0.5], 1, 1, { wPx: -3, hPx: -3, fill: { color, alpha }, opacity }),
      ),
    );
  return {
    window: { xMin: -0.5, xMax: 5.7, yMin: -0.5, yMax: 5.7 },
    scene: (phase) => [
      cells('blue', [[0, 0, 1], [1, 0, 2], [2, 0, 3], [3, 0, 4]], 'first', 0.75, 1),
      cells('orange', [[0, 1, 5], [1, 2, 5], [2, 3, 5], [3, 4, 5]], 'second', 0.7, show(phase === 1 || phase === 2)),
      cells('green', [[4, 0, 5]], 'result', 0.8, show(phase === 3)),
      rectXY('outline', 0, 0, 4, 5, { stroke: { color: 'extra', width: 3 }, opacity: show(phase === 2) }),
      mathLabel('n', 'n = 4', [2, 0], 'first', [0, 14]),
      mathLabel('n1', 'n + 1 = 5', [0, 2.5], 'extra', [-2, 0], { opacity: show(phase === 2) }),
      mathLabel('plus', '+5', [4.5, 5], 'result', [0, -14], { opacity: show(phase === 3) }),
    ],
  };
})();

// ---------------------------------------------------------------------------
// 30.–32. Binomische Formeln, Euklid

const binomialSquare: FigureSpec = {
  window: { xMin: -0.8, xMax: 4.6, yMin: -0.8, yMax: 4.6 },
  scene: (phase) => [
    rectXY('aa', 0, 0, 3, 3, { fill: { color: 'first', alpha: 0.45 }, opacity: show(phase >= 1) }),
    rectXY('ab1', 3, 0, 4, 3, { fill: { color: 'second', alpha: 0.5 }, opacity: show(phase >= 2) }),
    rectXY('ab2', 0, 3, 3, 4, { fill: { color: 'second', alpha: 0.5 }, opacity: show(phase >= 2) }),
    rectXY('bb', 3, 3, 4, 4, { fill: { color: 'result', alpha: 0.55 }, opacity: show(phase >= 3) }),
    rectXY('outline', 0, 0, 4, 4, { stroke: { color: 'primary', alpha: 0.7, width: 2 } }),
    mathLabel('a1', 'a', [1.5, 0], 'first', [0, 14]),
    mathLabel('b1', 'b', [3.5, 0], 'second', [0, 14]),
    mathLabel('a2', 'a', [0, 1.5], 'first', [-14, 0]),
    mathLabel('b2', 'b', [0, 3.5], 'second', [-14, 0]),
    mathLabel('aaL', 'a²', [1.5, 1.5], 'primary', [0, 0], { opacity: show(phase >= 1) }),
    mathLabel('ab1L', 'ab', [3.5, 1.5], 'primary', [0, 0], { opacity: show(phase >= 2) }),
    mathLabel('ab2L', 'ab', [1.5, 3.5], 'primary', [0, 0], { opacity: show(phase >= 2) }),
    mathLabel('bbL', 'b²', [3.5, 3.5], 'primary', [0, 0], { opacity: show(phase >= 3) }),
  ],
};

const binomialDifference: FigureSpec = {
  window: { xMin: -0.8, xMax: 4.6, yMin: -0.8, yMax: 4.6 },
  scene: (phase) => [
    rectXY('square', 0, 0, 3, 3, { fill: { color: 'first', alpha: 0.4 }, opacity: show(phase === 0) }),
    rectXY('base', 0, 0, 3, 2, { fill: { color: 'first', alpha: 0.45 }, opacity: show(phase >= 1) }),
    rectXY('cut', 2, 2, 3, 3, { stroke: { color: 'warning', width: 2, dash: [5, 4] }, opacity: show(phase >= 1 && phase <= 2) }),
    rect('strip', phase >= 3 ? [3.5, 1] : [1, 2.5], 2, 1, {
      radius: 2,
      fill: { color: 'second', alpha: phase >= 2 ? 0.6 : 0.45 },
      stroke: { color: 'second', alpha: phase >= 2 ? 1 : 0, width: 2 },
      transform: { rotate: phase >= 3 ? 90 : 0 },
      opacity: show(phase >= 1),
    }),
    rectXY('result', 0, 0, 4, 2, { stroke: { color: 'result', width: 3 }, opacity: show(phase >= 3) }),
    mathLabel('a', 'a', [1.5, 0], 'first', [0, 14], { opacity: show(phase <= 2) }),
    mathLabel('apb', 'a + b', [2, 0], 'result', [0, 14], { opacity: show(phase >= 3) }),
    mathLabel('amb', 'a − b', [0, 1], 'first', [-22, 0], { opacity: show(phase >= 2) }),
    mathLabel('bb', 'b²', [2.5, 2.5], 'warning', [0, 0], { opacity: show(phase === 1 || phase === 2) }),
  ],
};

const euclidRectangle: FigureSpec = {
  window: { xMin: -0.6, xMax: 12.6, yMin: -2.2, yMax: 11.0 },
  showGrid: false,
  scene: (phase) => [
    rectXY('big', 0, 0, 9, 9, { fill: { color: 'first', alpha: 0.35 }, opacity: show(phase >= 1) }),
    [0, 1, 2].map((k) =>
      rectXY(`small${k}`, 9, 3 * k, 12, 3 * k + 3, {
        fill: { color: 'second', alpha: 0.45 },
        stroke: { color: 'second', width: 2 },
        opacity: show(phase >= 2),
      }),
    ),
    path(
      'tiles',
      [
        ...[3, 6, 9].map((xx): Pt[] => [
          [xx, 0],
          [xx, 9],
        ]),
        ...[3, 6].map((yy): Pt[] => [
          [0, yy],
          [9, yy],
        ]),
      ],
      { stroke: { color: 'result', width: 2 }, opacity: show(phase >= 3) },
    ),
    rectXY('outline', 0, 0, 12, 9, { stroke: { color: 'primary', alpha: 0.7, width: 2 } }),
    rectXY('bigOutline', 0, 0, 9, 9, { stroke: { color: 'first', width: 2.5 }, opacity: show(phase >= 1) }),
    mathLabel('w', '12', [6, 0], 'primary', [0, 14]),
    mathLabel('h', '9', [0, 4.5], 'primary', [-12, 0]),
    mathLabel('nine', '9 × 9', [4.5, 4.5], 'first', [0, 0], { opacity: show(phase >= 1 && phase < 3) }),
    mathLabel('three', '3', [10.5, 9], 'second', [0, -14], { opacity: show(phase >= 1) }),
  ],
};

// ---------------------------------------------------------------------------
// Symmetrien des Dreiecks

const triangleSymmetries: FigureSpec = (() => {
  /** erst Drehung um `angle` (gegen den Uhrzeigersinn), dann evtl. Spiegelung an der senkrechten Achse */
  const states: [boolean, number][] = [
    [false, 0],
    [false, 120],
    [true, 120],
    [true, 0],
    [true, -120],
  ];
  const colors: ColorName[] = ['first', 'second', 'result'];
  const vertex = (k: number, radius: number): Pt => {
    const theta = ((90 + 120 * k) * Math.PI) / 180;
    return [radius * Math.cos(theta), radius * Math.sin(theta)];
  };
  const triangle = [0, 1, 2].map((k) => vertex(k, 1.05));
  return {
    window: { xMin: -1.6, xMax: 1.6, yMin: -1.6, yMax: 1.6 },
    showGrid: false,
    scene: (phase) => {
      const [mirrored, angle] = states[Math.min(phase, states.length - 1)];
      // Figur: `.rotationEffect(-angle).scaleEffect(x: mirrored ? -1 : 1)` um die Bildmitte
      const transform = { rotate: -angle, scaleX: mirrored ? -1 : 1, pivot: ORIGIN };
      return [
        segment('axis', [0, -1.5], [0, 1.5], { color: 'extra', alpha: 0.6, width: 1.5, dash: [5, 4] }),
        mathLabel('s', 's', [0.12, 1.45], 'extra', [0, 0]),
        [0, 1, 2].map((k) =>
          text(`ghost${k}`, ['3', '2', '1'][k], vertex(k, 1.38), { color: 'secondary', alpha: 0.6, weight: 'bold', opacity: show(phase === 4) }),
        ),
        polygon('fill', triangle, { fill: { color: 'first', alpha: 0.18 }, transform }),
        polygon('outline', triangle, { stroke: { color: 'first', width: 2.5 }, transform }),
        [0, 1, 2].map((k) =>
          text(`v${k}`, `${k + 1}`, vertex(k, 1.05), {
            color: 'white',
            weight: 'bold',
            chip: { shape: 'circle', w: 26, h: 26, fill: { color: colors[k] } },
            transform,
          }),
        ),
      ];
    },
  };
})();

// ---------------------------------------------------------------------------
// Restklassen auf der Uhr

interface ClockArc {
  from: number;
  steps: number;
  color?: ColorName;
}
interface ClockFrame {
  arcs?: ClockArc[];
  marks?: [number, ColorName][];
}

function clock(n: number, frames: ClockFrame[]): FigureSpec {
  /** Winkel der Zahl k: 0 oben, im Uhrzeigersinn. */
  const point = (k: number, radius: number): Pt => {
    const a = ((90 - (360 * k) / n) * Math.PI) / 180;
    return [radius * Math.cos(a), radius * Math.sin(a)];
  };
  const frameElements = (f: ClockFrame, idx: number): SceneEl[] => [
    ...(f.arcs ?? []).map((arc, i) => {
      const radius = 0.72 - (i % 3) * 0.06;
      const count = Math.max(arc.steps * 12, 12);
      const pts = Array.from({ length: count + 1 }, (_, t) => point(arc.from + (arc.steps * t) / count, radius));
      return polyline(`f${idx}.arc${i}`, pts, { color: arc.color ?? 'first', width: 2.5, cap: 'round', join: 'round' }, { endArrow: 9 });
    }),
    ...Array.from({ length: n }, (_, k) => {
      const mark = f.marks?.find(([v]) => v === k)?.[1];
      return text(`f${idx}.n${k}`, `${k}`, point(k, 1.0), {
        weight: 'bold',
        color: mark ? 'white' : 'primary',
        chip: {
          shape: 'circle',
          w: 30,
          h: 30,
          fill: { color: mark ?? 'surfaceStrong' },
          stroke: mark ? { color: mark, width: 1.5 } : { color: 'secondary', alpha: 0.5, width: 1.5 },
        },
      });
    }),
  ];
  return {
    window: { xMin: -1.5, xMax: 1.5, yMin: -1.5, yMax: 1.5 },
    showGrid: false,
    scene: (phase) => [
      circle('dial', ORIGIN, 1, { stroke: { color: 'secondary', alpha: 0.4, width: 2 } }),
      frames.map((f, k) => fade(show(Math.min(phase, frames.length - 1) === k), frameElements(f, k))),
    ],
  };
}

const clockFigures = {
  clockZ12: clock(12, [
    {},
    { arcs: [{ from: 9, steps: 5 }], marks: [[9, 'first'], [2, 'result']] },
    { marks: [[0, 'result']] },
    { arcs: [{ from: 5, steps: 7, color: 'second' }], marks: [[5, 'first'], [0, 'result']] },
    {
      arcs: [
        { from: 0, steps: 4, color: 'extra' },
        { from: 4, steps: 4, color: 'extra' },
        { from: 8, steps: 4, color: 'extra' },
      ],
      marks: [[0, 'extra'], [4, 'extra'], [8, 'extra']],
    },
  ]),
  clockZ6: clock(6, [
    {},
    {
      arcs: [
        { from: 0, steps: 3 },
        { from: 3, steps: 3 },
      ],
      marks: [[3, 'second'], [0, 'warning']],
    },
    {
      arcs: [
        { from: 0, steps: 2, color: 'second' },
        { from: 2, steps: 2, color: 'second' },
        { from: 4, steps: 2, color: 'second' },
      ],
      marks: [[0, 'second'], [2, 'second'], [4, 'second'], [1, 'warning']],
    },
    { marks: [[5, 'result'], [1, 'result']] },
  ]),
  clockF5: clock(5, [
    {},
    {
      arcs: [
        { from: 0, steps: 2, color: 'second' },
        { from: 2, steps: 2, color: 'second' },
        { from: 4, steps: 2, color: 'second' },
        { from: 1, steps: 2, color: 'second' },
        { from: 3, steps: 2, color: 'second' },
      ],
      marks: [[0, 'second'], [2, 'second'], [4, 'second'], [1, 'result'], [3, 'second']],
    },
    { marks: [[1, 'result'], [2, 'result'], [3, 'result'], [4, 'result']] },
  ]),
} satisfies Record<string, FigureSpec>;

// ---------------------------------------------------------------------------
// Komplexe Zahlen

const complexOperations: FigureSpec = {
  window: { xMin: -2, xMax: 4, yMin: -2, yMax: 4 },
  scene: (phase) => {
    const z: Pt = [2, 1];
    const w: Pt = [1, 2];
    return [
      arrow('z', ORIGIN, z, 'first', { width: 3.5 }),
      mathLabel('zL', 'z', z, 'first', [12, 6]),
      arrow('w', ORIGIN, w, 'second', { width: 3.5, opacity: show(phase <= 1) }),
      mathLabel('wL', 'w', w, 'second', [-12, -6], { opacity: show(phase <= 1) }),
      arrow('wShift', z, [3, 3], 'second', { dashed: true, opacity: show(phase === 1) }),
      arrow('sum', ORIGIN, [3, 3], 'result', { width: 3.5, opacity: show(phase === 1) }),
      mathLabel('sumL', 'z + w', [3, 3], 'result', [18, -10], { opacity: show(phase === 1) }),
      arrow('conj', ORIGIN, [2, -1], 'extra', { width: 3.5, opacity: show(phase === 2) }),
      mathLabel('conjL', 'z̄', [2, -1], 'extra', [12, 8], { opacity: show(phase === 2) }),
      arrow('iz', ORIGIN, phase >= 3 ? [-1, 2] : z, 'result', { width: 3.5, opacity: show(phase >= 3) }),
      mathLabel('izL', 'i·z', [-1, 2], 'result', [-12, -10], { opacity: show(phase >= 3) }),
    ];
  },
};

const complexMultiplication: FigureSpec = {
  window: { xMin: -1.6, xMax: 3.0, yMin: -0.8, yMax: 3.8 },
  scene: (phase) => {
    const z: Pt = [1, 1];
    const w: Pt = [1, Math.sqrt(3)];
    const zw: Pt = [1 - Math.sqrt(3), 1 + Math.sqrt(3)];
    return [
      polyline('arcZ', arcPoints(0, 45, 0.45), { color: 'first', width: 2 }),
      arrow('z', ORIGIN, z, 'first', { width: 3.5 }),
      mathLabel('zL', 'z', z, 'first', [12, 4]),
      polyline('arcW', arcPoints(0, 60, 0.7), { color: 'second', width: 2 }, { opacity: show(phase >= 1) }),
      arrow('w', ORIGIN, w, 'second', { width: 3.5, opacity: show(phase >= 1) }),
      mathLabel('wL', 'w', w, 'second', [12, -4], { opacity: show(phase >= 1) }),
      polyline('arcZW', arcPoints(0, 105, 1.0), { color: 'result', width: 2, dash: [4, 3] }, { opacity: show(phase >= 2) }),
      arrow('zw', ORIGIN, phase >= 2 ? zw : z, 'result', { width: 3.5, opacity: show(phase >= 2) }),
      mathLabel('zwL', 'z·w', zw, 'result', [-16, -10], { opacity: show(phase >= 2) }),
      dot('zwDot', zw, 'result', { opacity: show(phase >= 3) }),
    ];
  },
};

const rootsOfUnity: FigureSpec = (() => {
  const root = (k: number): Pt => [Math.cos((k * Math.PI) / 3), Math.sin((k * Math.PI) / 3)];
  const window: PlaneWindow = { xMin: -1.6, xMax: 1.6, yMin: -1.6, yMax: 1.6 };
  return {
    window,
    scene: (phase) => [
      circle('unit', ORIGIN, 1, { stroke: { color: 'first', alpha: 0.5, width: 2 } }),
      polyline(
        'hexagon',
        Array.from({ length: 7 }, (_, k) => root(k % 6)),
        { color: 'result', width: 2.5 },
        { opacity: show(phase >= 3) },
      ),
      Array.from({ length: 6 }, (_, k) => {
        const visible = phase >= 2 || (phase === 1 && (k === 1 || k === 0));
        const r = root(k);
        return [
          dot(`root${k}`, r, k === 0 ? 'second' : 'result', { opacity: show(visible) }),
          mathLabel(`rootL${k}`, k === 0 ? '1' : k === 1 ? 'ζ' : `ζ${['', '', '²', '³', '⁴', '⁵'][k]}`, r, 'result', [r[0] * 22, -r[1] * 22], {
            opacity: show(visible),
          }),
        ];
      }),
      polyline('arc', arcPoints(0, 60, 0.35), { color: 'second', width: 2 }, { opacity: show(phase >= 1) }),
      arrow('zeta', ORIGIN, root(1), 'second', { width: 2.5, opacity: show(phase === 1) }),
    ],
  };
})();

export const algebraFigures = (lang: Lang): Record<string, FigureSpec> => ({
  dominoes: dominoes(lang),
  gaussSum,
  binomialSquare,
  binomialDifference,
  euclidRectangle,
  triangleSymmetries,
  ...clockFigures,
  complexOperations,
  complexMultiplication,
  rootsOfUnity,
});
