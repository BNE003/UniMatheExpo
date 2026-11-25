/**
 * Grafiken zu Vektoren, Matrizen und Eigenwerten.
 * Quelle: Views/LessonVectorVisuals.swift (Abschnitte 1–6, 8, 10 und 15–19) – Koordinaten und Phasen 1:1.
 */
import type { Lang } from '@/content/types';

import { arrow, dashedDot, dot, fade, line, mathLabel, polygon, rectXY } from '../dsl';
import { ORIGIN, parallelogram, show, type ColorName, type FigureSpec, type PlaneWindow, type Pt, type SceneEl } from '../scene';

const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
const scale = (k: number, p: Pt): Pt => [k * p[0], k * p[1]];

/** 1. VectorAdditionVisual */
const vectorAddition: FigureSpec = {
  window: { xMin: -1.5, xMax: 6.5, yMin: -1.5, yMax: 6.5 },
  scene: (phase) => {
    const wStart: Pt = phase >= 1 && phase < 3 ? [2, 1] : ORIGIN;
    const wEnd = add(wStart, [1, 2]);
    return [
      arrow('2v', ORIGIN, phase >= 3 ? [4, 2] : ORIGIN, 'extra', { width: 5, opacity: show(phase >= 3) }),
      mathLabel('2vL', '2·v', [4, 2], 'extra', undefined, { opacity: show(phase >= 3) }),
      arrow('sum', ORIGIN, phase === 2 ? [3, 3] : ORIGIN, 'result', { opacity: show(phase === 2) }),
      mathLabel('sumL', 'v + w', [3, 3], 'result', [-22, -12], { opacity: show(phase === 2) }),
      arrow('v', ORIGIN, [2, 1], 'first'),
      mathLabel('vL', 'v', [2, 1], 'first', [10, 10]),
      arrow('w', wStart, wEnd, 'second', { opacity: show(phase < 3) }),
      mathLabel('wL', 'w', wEnd, 'second', undefined, { opacity: show(phase < 3) }),
    ];
  },
};

/** 2. SubspaceClosureVisual: Gerade durch 0 gegen verschobene Gerade. */
const subspaceClosure: FigureSpec = {
  window: { xMin: -3, xMax: 7, yMin: -3, yMax: 7 },
  scene: (phase) => {
    const onU = phase < 3;
    const vStart: Pt = phase >= 1 ? [2, 1] : ORIGIN;
    const qStart: Pt = phase >= 4 ? [0, 2] : ORIGIN;
    return [
      fade(
        show(onU),
        line('U', ORIGIN, [2, 1], 'first', { alpha: 0.35, width: 6 }),
        mathLabel('UL', 'U', [5.6, 2.8], 'first', [0, 16]),
        arrow('uv', ORIGIN, phase >= 1 ? [5, 2.5] : ORIGIN, 'result', { opacity: show(phase >= 1) }),
        arrow('u', ORIGIN, [2, 1], 'first'),
        mathLabel('uL', 'u', [2, 1], 'first', [-4, -16]),
        arrow('v', vStart, add(vStart, [3, 1.5]), 'second'),
        mathLabel('vL', phase >= 1 ? 'u + v' : 'v', phase >= 1 ? [5, 2.5] : [3, 1.5], phase >= 1 ? 'result' : 'second', [-6, -18]),
        arrow('mu', ORIGIN, phase >= 2 ? [-2, -1] : ORIGIN, 'extra', { opacity: show(phase >= 2) }),
        mathLabel('muL', '(−1)·u', [-2, -1], 'extra', [6, 16], { opacity: show(phase >= 2) }),
      ),
      fade(
        show(!onU),
        line('G', [0, 2], [2, 1], 'warning', { alpha: 0.35, width: 6 }),
        mathLabel('GL', 'G', [5, 4.5], 'warning', [10, 12]),
        arrow('pq', ORIGIN, phase >= 4 ? [2, 5] : ORIGIN, 'result', { opacity: show(phase >= 4) }),
        arrow('p', ORIGIN, [0, 2], 'first'),
        mathLabel('pL', 'p', [0, 2], 'first', [-14, 0]),
        arrow('q', qStart, add(qStart, [2, 3]), 'second'),
        mathLabel('qL', 'q', add(qStart, [2, 3]), 'second', [14, 4], { opacity: show(phase < 4) }),
        dot('pqDot', [2, 5], 'warning', { opacity: show(phase >= 4) }),
        mathLabel('pqL', 'p + q ∉ G', [2, 5], 'warning', [-10, -18], { opacity: show(phase >= 4) }),
      ),
    ];
  },
};

/** 3. LinearCombinationVisual (auch „Matrix mal Vektor“ mit anderen Namen). */
function linearCombination(names: { first: string; second: string; target: string }): FigureSpec {
  return {
    window: { xMin: -1.5, xMax: 6.5, yMin: -1.5, yMax: 6.5 },
    scene: (phase) => {
      const v2Start: Pt = phase >= 2 ? [2, 1] : ORIGIN;
      const length = phase >= 1 ? 2 : 1;
      const v2End = add(v2Start, [length, 2 * length]);
      return [
        dashedDot('targetHollow', [4, 5], 'result', { opacity: show(phase < 3) }),
        dot('target', [4, 5], 'result', { opacity: show(phase >= 3) }),
        mathLabel('targetL', names.target, [4, 5], 'result'),
        arrow('sum', ORIGIN, phase >= 3 ? [4, 5] : ORIGIN, 'result', { width: 4, opacity: show(phase >= 3) }),
        arrow('v1', ORIGIN, [2, 1], 'first'),
        mathLabel('v1L', names.first, [2, 1], 'first', [12, 10]),
        arrow('v2', v2Start, v2End, 'second'),
        mathLabel('v2L', phase >= 1 ? `2·${names.second}` : names.second, v2End, 'second', phase >= 2 ? [-26, 6] : [-16, -6]),
      ];
    },
  };
}

/** 4. SpanGrowthVisual: Gerade → Ebene. */
const spanGrowth: FigureSpec = (() => {
  const window: PlaneWindow = { xMin: -3, xMax: 6, yMin: -3, yMax: 6 };
  const v1: Pt = [2, 1];
  const v2: Pt = [1, 2];
  return {
    window,
    scene: (phase) => [
      rectXY('plane', window.xMin, window.yMin, window.xMax, window.yMax, { fill: { color: 'result', alpha: 0.14 }, opacity: show(phase >= 4) }),
      { key: 'grid', kind: 'grid', a: v1, b: v2, color: 'result', alpha: 0.45, width: 1, opacity: show(phase >= 3) },
      line('span1', ORIGIN, v1, 'first', { alpha: 0.4, width: 5, extent: phase >= 1 ? 1 : 0 }),
      arrow('plus', ORIGIN, phase >= 1 ? [4, 2] : ORIGIN, 'first', { alpha: 0.45, opacity: show(phase >= 1 && phase < 3) }),
      arrow('minus', ORIGIN, phase >= 1 ? [-2, -1] : ORIGIN, 'first', { alpha: 0.45, opacity: show(phase >= 1 && phase < 3) }),
      mathLabel('spanL', 'span(v₁)', [4.6, 2.3], 'first', [-6, 16], { opacity: show(phase >= 1 && phase < 4) }),
      arrow('v1', ORIGIN, v1, 'first'),
      mathLabel('v1L', 'v₁', v1, 'first', [10, 12]),
      arrow('v2', ORIGIN, phase >= 2 ? v2 : ORIGIN, 'second', { opacity: show(phase >= 2) }),
      mathLabel('v2L', 'v₂', v2, 'second', [-14, -6], { opacity: show(phase >= 2) }),
      mathLabel('planeL', 'span(v₁, v₂) = ℝ²', [-2.8, 5.4], 'result', [62, 0], { opacity: show(phase >= 4) }),
    ],
  };
})();

/** 5. LinearDependenceVisual */
const linearDependence: FigureSpec = {
  window: { xMin: -1.5, xMax: 5, yMin: -1.5, yMax: 5 },
  scene: (phase) => {
    const copyStart: Pt = phase >= 1 ? [2, 1] : ORIGIN;
    const v3Color: ColorName = phase === 2 ? 'result' : 'extra';
    return [
      arrow('v3', ORIGIN, [3, 3], v3Color, { width: phase === 2 ? 5 : 3, dashed: phase >= 3, opacity: phase >= 3 ? 0.5 : 1 }),
      mathLabel('v3L', 'v₃', [3, 3], v3Color),
      arrow('v1', ORIGIN, [2, 1], 'first'),
      mathLabel('v1L', 'v₁', [2, 1], 'first', [12, 10]),
      arrow('v2', ORIGIN, [1, 2], 'second'),
      mathLabel('v2L', 'v₂', [1, 2], 'second', [-14, -6]),
      arrow('copy', copyStart, add(copyStart, [1, 2]), 'second', { alpha: 0.7, dashed: true, opacity: show(phase >= 1 && phase < 3) }),
    ];
  },
};

/** 6. BasisCoordinatesVisual */
const basisCoordinates = (lang: Lang): FigureSpec => {
  const v1: Pt = [2, 1];
  const v2: Pt = [1, 2];
  return {
    window: { xMin: -1.5, xMax: 6.5, yMin: -1.5, yMax: 6.5 },
    scene: (phase) => {
      const standard = phase === 0;
      const basisPath = phase >= 2;
      return [
        { key: 'grid', kind: 'grid', a: v1, b: v2, color: 'first', alpha: 0.35, width: 1, opacity: show(!standard) },
        fade(
          show(standard),
          arrow('e1', ORIGIN, [4, 0], 'first'),
          arrow('e2', [4, 0], [4, 5], 'second'),
          mathLabel('e1L', '4·e₁', [2, 0], 'first', [0, 14]),
          mathLabel('e2L', '5·e₂', [4, 2.5], 'second', [24, 0]),
        ),
        fade(
          show(!standard),
          arrow('v1', ORIGIN, v1, 'first', { width: 4 }),
          mathLabel('v1L', 'v₁', v1, 'first', [12, 10]),
          arrow('v2', ORIGIN, v2, 'second', { width: 4, opacity: show(!basisPath) }),
          mathLabel('v2L', 'v₂', v2, 'second', [-14, -6], { opacity: show(!basisPath) }),
          arrow('v2path', basisPath ? v1 : ORIGIN, basisPath ? [4, 5] : v2, 'second', { width: 4, opacity: show(basisPath) }),
          mathLabel('v2pathL', '2·v₂', [3, 3], 'second', [22, 0], { opacity: show(basisPath) }),
        ),
        dot('w', [4, 5], 'result'),
        mathLabel(
          'wL',
          phase >= 3 ? (lang === 'en' ? 'w ≙ (1, 2) w.r.t. B' : 'w ≙ (1, 2) bzgl. B') : standard ? 'w = (4, 5)' : 'w',
          [4, 5],
          'result',
          [-30, -16],
        ),
      ];
    },
  };
};

/** 8. SingularMatrixVisual: A quetscht die Ebene auf eine Gerade. */
const singularMatrix: FigureSpec = {
  window: { xMin: -1.5, xMax: 5, yMin: -1.5, yMax: 5 },
  scene: (phase) => {
    const gridA: Pt = phase >= 1 ? [1, 2] : [1, 0];
    const gridB: Pt = phase >= 1 ? [2, 4] : [0, 1];
    const target: Pt = [2, 4];
    return [
      line('image', ORIGIN, [1, 2], 'warning', { alpha: 0.3, width: 6, opacity: show(phase >= 1) }),
      { key: 'grid', kind: 'grid', a: gridA, b: gridB, color: 'first', alpha: 0.35, width: 1, opacity: phase >= 1 ? 0 : 1 },
      polygon('cell', parallelogram(gridA, gridB), { fill: { color: 'first', alpha: 0.2 } }),
      polygon('cellOutline', parallelogram(gridA, gridB), { stroke: { color: 'first', width: 2 } }),
      arrow('p', ORIGIN, phase >= 3 ? target : [2, 0], 'second', { opacity: show(phase >= 2) }),
      mathLabel('pL', phase >= 3 ? 'A·p' : 'p', phase >= 3 ? target : [2, 0], 'second', [18, 12], { opacity: show(phase >= 2) }),
      arrow('q', ORIGIN, phase >= 3 ? target : [0, 1], 'extra', { opacity: show(phase >= 2) }),
      mathLabel('qL', phase >= 3 ? 'A·q' : 'q', phase >= 3 ? target : [0, 1], 'extra', [-22, -8], { opacity: show(phase >= 2) }),
      dot('target', target, 'warning', { opacity: show(phase >= 3) }),
    ];
  },
};

/** 10. DetRulesVisual: Fläche, Linearität, Scherung, Kollaps. */
const detRules = (lang: Lang): FigureSpec => ({
  window: { xMin: -1, xMax: 6, yMin: -1, yMax: 6 },
  scene: (phase) => {
    const a: Pt = phase >= 1 ? [2, 0] : [1, 0];
    const b: Pt = phase >= 3 ? [3, 0] : phase >= 2 ? [3, 2] : [1, 2];
    const areaText = ['2', '4', '4', '0'][Math.min(phase, 3)];
    const color: ColorName = phase >= 3 ? 'warning' : 'first';
    return [
      polygon('cell', parallelogram(a, b), { fill: { color, alpha: 0.2 } }),
      polygon('cellOutline', parallelogram(a, b), { stroke: { color, width: 2 } }),
      mathLabel('area', `${lang === 'en' ? 'Area' : 'Fläche'} ${areaText}`, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 0.3], color, [0, phase >= 3 ? -16 : 0]),
      arrow('a', ORIGIN, a, 'first', { width: 4 }),
      mathLabel('aL', 'a', a, 'first', [4, 16]),
      arrow('b', ORIGIN, b, 'second', { width: 4 }),
      mathLabel('bL', 'b', b, 'second', [-12, -8]),
    ];
  },
});

/** 15. EigenSearchVisual: Testvektoren für A = (2 1; 1 2). */
const eigenSearch: FigureSpec = (() => {
  const tests: [Pt, Pt][] = [
    [
      [1, 0],
      [2, 1],
    ],
    [
      [0, 1],
      [1, 2],
    ],
    [
      [1, 1],
      [3, 3],
    ],
    [
      [-1, 1],
      [-1, 1],
    ],
  ];
  return {
    window: { xMin: -2.5, xMax: 4, yMin: -1.5, yMax: 5 },
    scene: (phase) => {
      const [u, image] = tests[Math.min(phase, tests.length - 1)];
      const isEigen = phase >= 2;
      const imageColor: ColorName = isEigen ? 'result' : 'warning';
      return [
        line('line', ORIGIN, u, isEigen ? 'result' : 'first', { alpha: isEigen ? 0.6 : 0.5, width: 2, dash: [5, 4] }),
        arrow('image', ORIGIN, image, imageColor, { width: 3 }),
        mathLabel('imageL', 'A·u', image, imageColor, [18, -10]),
        arrow('u', ORIGIN, u, 'first', { width: 4 }),
        mathLabel('uL', 'u', u, 'first', [phase === 3 ? -14 : 12, 14]),
      ];
    },
  };
})();

/** 16. EigenvalueScalingVisual */
const eigenvalueScaling: FigureSpec = (() => {
  const v: Pt = [2, 1];
  const lambdas = [1, 2, 0.5, -1, 0];
  const names = ['λ = 1', 'λ = 2', 'λ = ½', 'λ = −1', 'λ = 0'];
  return {
    window: { xMin: -3, xMax: 5, yMin: -3, yMax: 5 },
    scene: (phase) => {
      const k = Math.min(phase, lambdas.length - 1);
      const image = scale(lambdas[k], v);
      return [
        line('line', ORIGIN, v, 'result', { alpha: 0.5, width: 2, dash: [5, 4] }),
        arrow('v', ORIGIN, v, 'first', { width: 6, opacity: 0.35 }),
        mathLabel('vL', 'v', v, 'first', [4, 16]),
        arrow('image', ORIGIN, image, 'result', { width: 3 }),
        dot('imageDot', image, 'result'),
        mathLabel('imageL', `A·v  (${names[k]})`, image, 'result', [phase === 3 ? 10 : -6, phase === 3 ? 18 : -18]),
      ];
    },
  };
})();

/** 17. CharPolyCollapseVisual: det(A − λI) = 0. */
const charPolyCollapse: FigureSpec = {
  window: { xMin: -2, xMax: 3.5, yMin: -2, yMax: 3.5 },
  scene: (phase) => {
    const lambda = Math.min(phase, 3);
    const a: Pt = [2 - lambda, 1];
    const b: Pt = [1, 2 - lambda];
    const collapsed = phase === 1 || phase === 3;
    const color: ColorName = collapsed ? 'warning' : 'first';
    const detText = ['det = 3', 'det = 0', 'det = −1', 'det = 0'][lambda];
    return [
      polygon('cell', parallelogram(a, b), { fill: { color, alpha: 0.2 } }),
      polygon('cellOutline', parallelogram(a, b), { stroke: { color, width: 2 } }),
      arrow('a', ORIGIN, a, 'first', { width: 4 }),
      arrow('b', ORIGIN, b, 'second', { width: 3 }),
      mathLabel('det', `λ = ${lambda}:  ${detText}`, [0.75, -1.4], color, [0, 0]),
    ];
  },
};

/** 18. EigenMapVisual: Eigengeraden bleiben, ein Vergleichsvektor kippt. */
function eigenMap(opts: {
  window?: PlaneWindow;
  column1: Pt;
  column2: Pt;
  eigen: { vector: Pt; lambda: number; name: string }[];
  sample: Pt;
}): FigureSpec {
  const { column1, column2, eigen, sample } = opts;
  const apply = (p: Pt): Pt => [p[0] * column1[0] + p[1] * column2[0], p[0] * column1[1] + p[1] * column2[1]];
  return {
    window: opts.window ?? { xMin: -2, xMax: 4, yMin: -2, yMax: 4 },
    scene: (phase) => {
      const mapped = phase >= 2;
      const gridA: Pt = mapped ? column1 : [1, 0];
      const gridB: Pt = mapped ? column2 : [0, 1];
      const samplePoint = mapped ? apply(sample) : sample;
      const els: SceneEl[] = [
        { key: 'grid', kind: 'grid', a: gridA, b: gridB, color: 'secondary', alpha: 0.3, width: 1 },
        polygon('cell', parallelogram(gridA, gridB), { fill: { color: 'first', alpha: 0.12 } }),
        ...eigen.map((e, i) => line(`eigenLine${i}`, ORIGIN, e.vector, 'result', { alpha: 0.55, width: 2.5, dash: [6, 4], opacity: show(phase >= 1) })),
        line('sampleLine', ORIGIN, sample, 'warning', { alpha: 0.35, width: 1.5, dash: [3, 4], opacity: show(phase >= 1) }),
        arrow('sample', ORIGIN, samplePoint, 'warning', { width: 3 }),
        mathLabel('sampleL', mapped ? 'A·x' : 'x', samplePoint, 'warning', [16, 10]),
      ];
      eigen.forEach((e, i) => {
        const target = mapped ? scale(e.lambda, e.vector) : e.vector;
        const color: ColorName = i === 0 ? 'first' : 'second';
        els.push(arrow(`eigen${i}`, ORIGIN, target, color, { width: 4 }));
        els.push(mathLabel(`eigen${i}L`, mapped ? `A·${e.name}` : e.name, target, color, i === 0 ? [18, 14] : [-22, -10]));
      });
      return els;
    },
  };
}

/** 19. PowerIterationVisual: Die Richtung läuft zum größten Eigenwert. */
const powerIteration: FigureSpec = (() => {
  const iterates: Pt[] = [
    [1, 0],
    [2, 1],
    [5, 4],
    [14, 13],
  ];
  const scaled = (p: Pt): Pt => {
    const length = Math.hypot(p[0], p[1]);
    return [(3 * p[0]) / length, (3 * p[1]) / length];
  };
  return {
    window: { xMin: -1, xMax: 4, yMin: -1, yMax: 4 },
    scene: (phase) => [
      line('eigen', ORIGIN, [1, 1], 'result', { alpha: 0.6, width: 2.5, dash: [6, 4] }),
      ...iterates.map((p, k) =>
        arrow(`it${k}`, ORIGIN, scaled(p), 'first', { width: k === phase ? 4 : 2, opacity: k > phase ? 0 : k === phase ? 1 : 0.3 }),
      ),
      mathLabel('label', ['x', 'A·x', 'A²·x', 'A³·x'][Math.min(phase, 3)], scaled(iterates[Math.min(phase, 3)]), 'first', [22, 8]),
    ],
  };
})();

export const vectorFigures = (lang: Lang): Record<string, FigureSpec> => ({
  vectorAddition,
  subspaceClosure,
  linearCombination: linearCombination({ first: 'v₁', second: 'v₂', target: 'w' }),
  matrixTimesVector: linearCombination({ first: 'a₁', second: 'a₂', target: 'A·x' }),
  spanGrowth,
  linearDependence,
  basisCoordinates: basisCoordinates(lang),
  singularMatrix,
  detRules: detRules(lang),
  eigenSearch,
  eigenvalueScaling,
  charPolyCollapse,
  eigenMap: eigenMap({
    column1: [2, 1],
    column2: [1, 2],
    eigen: [
      { vector: [1, 1], lambda: 3, name: 'v₁' },
      { vector: [-1, 1], lambda: 1, name: 'v₂' },
    ],
    sample: [1, 0],
  }),
  shearEigen: eigenMap({
    window: { xMin: -1.5, xMax: 2.5, yMin: -1.5, yMax: 2.5 },
    column1: [1, 0],
    column2: [1, 1],
    eigen: [{ vector: [1, 0], lambda: 1, name: 'v' }],
    sample: [0, 1],
  }),
  powerIteration,
});
