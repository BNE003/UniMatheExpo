/**
 * Grafiken zu linearen Abbildungen (Thema 3.3 und verwandte Themen).
 * Quelle: Views/LessonVectorVisuals.swift – Struktur, Koordinaten und Phasen sind 1:1 übernommen.
 */
import { dot } from '../dsl';
import { ORIGIN, parallelogram, show, type FigureSpec, type PlaneWindow, type Pt, type Scene } from '../scene';

/** GridMapVisual (LessonVectorVisuals.swift:1160): e₁, e₂, Gitter und ein Beispielvektor unter f. */
function gridMap(opts: { window?: PlaneWindow; image1: Pt; image2: Pt; sample: Pt; mirror?: Pt }): FigureSpec {
  const window = opts.window ?? { xMin: -1, xMax: 4, yMin: -1, yMax: 4 };
  const { image1, image2, sample, mirror } = opts;
  return {
    window,
    scene: (phase): Scene => {
      const e1: Pt = [1, 0];
      const e2: Pt = [0, 1];
      const col1 = phase >= 1 ? image1 : e1;
      const col2 = phase >= 2 ? image2 : e2;
      const gridA = phase >= 3 ? image1 : e1;
      const gridB = phase >= 3 ? image2 : e2;
      const sampleImage: Pt = [
        sample[0] * image1[0] + sample[1] * image2[0],
        sample[0] * image1[1] + sample[1] * image2[1],
      ];
      const x = phase >= 4 ? sampleImage : sample;
      return [
        ...(mirror
          ? [{ key: 'mirror', kind: 'line', through: ORIGIN, dir: mirror, color: 'extra', width: 2, dash: [5, 4], opacity: show(phase >= 3) } as const]
          : []),
        { key: 'grid', kind: 'grid', a: gridA, b: gridB, color: 'first', alpha: 0.35, width: 1 },
        { key: 'cell', kind: 'path', closed: true, subpaths: [parallelogram(gridA, gridB)], fill: { color: 'first', alpha: 0.18 } },
        { key: 'x', kind: 'arrow', from: ORIGIN, to: x, color: 'result' },
        { key: 'xLabel', kind: 'label', text: phase >= 4 ? 'f(x)' : 'x', at: x, color: 'result', offset: [18, -10] },
        { key: 'c1', kind: 'arrow', from: ORIGIN, to: col1, color: 'first', width: 4 },
        { key: 'c1Label', kind: 'label', text: phase >= 1 ? 'f(e₁)' : 'e₁', at: col1, color: 'first', offset: [4, 16] },
        { key: 'c2', kind: 'arrow', from: ORIGIN, to: col2, color: 'second', width: 4 },
        { key: 'c2Label', kind: 'label', text: phase >= 2 ? 'f(e₂)' : 'e₂', at: col2, color: 'second', offset: [-24, -8] },
      ];
    },
  };
}

/** LinearityCheckVisual (:1061): f(u + v) = f(u) + f(v) für f(x, y) = (2x + y, y). */
const linearityCheck: FigureSpec = {
  window: { xMin: -1, xMax: 5, yMin: -1, yMax: 5 },
  scene: (phase) => {
    const vStart: Pt = phase >= 1 ? [1, 0] : ORIGIN;
    const vEnd: Pt = [vStart[0], vStart[1] + 2];
    return [
      { key: 'sum', kind: 'arrow', from: ORIGIN, to: [1, 2], color: 'result', opacity: show(phase >= 1) },
      { key: 'sumL', kind: 'label', text: 'u+v', at: [1, 2], color: 'result', offset: [-20, -8], opacity: show(phase >= 1) },
      { key: 'u', kind: 'arrow', from: ORIGIN, to: [1, 0], color: 'first' },
      { key: 'uL', kind: 'label', text: 'u', at: [1, 0], color: 'first', offset: [0, 14] },
      { key: 'v', kind: 'arrow', from: vStart, to: vEnd, color: 'second' },
      { key: 'vL', kind: 'label', text: 'v', at: vEnd, color: 'second', offset: [-12, 0] },
      { key: 'fSum', kind: 'arrow', from: ORIGIN, to: phase >= 2 ? [4, 2] : [1, 2], color: 'extra', width: 4, opacity: show(phase >= 2) },
      { key: 'fSumL', kind: 'label', text: 'f(u+v)', at: [4, 2], color: 'extra', offset: [22, -10], opacity: show(phase >= 2) },
      { key: 'fu', kind: 'arrow', from: ORIGIN, to: [2, 0], color: 'first', dashed: true, opacity: show(phase >= 3) },
      { key: 'fuL', kind: 'label', text: 'f(u)', at: [2, 0], color: 'first', offset: [0, 14], opacity: show(phase >= 3) },
      {
        key: 'fv',
        kind: 'arrow',
        from: phase >= 3 ? [2, 0] : ORIGIN,
        to: phase >= 3 ? [4, 2] : [2, 2],
        color: 'second',
        dashed: true,
        opacity: show(phase >= 3),
      },
      { key: 'fvL', kind: 'label', text: 'f(v)', at: [3, 1], color: 'second', offset: [16, 8], opacity: show(phase >= 3) },
    ];
  },
};

/** KernelImageVisual (:1105): Kern und Bild von f(x, y) = (x + y, x + y). */
const kernelImage = (labels: { kernel: string; image: string }): FigureSpec => ({
  window: { xMin: -3, xMax: 4, yMin: -3, yMax: 4 },
  scene: (phase) => [
    { key: 'kernel', kind: 'line', through: ORIGIN, dir: [1, -1], color: 'warning', alpha: 0.35, width: 6 },
    { key: 'kernelL', kind: 'label', text: labels.kernel, at: [-2, 2], color: 'warning', offset: [-14, -8] },
    { key: 'image', kind: 'line', through: ORIGIN, dir: [1, 1], color: 'result', alpha: 0.35, width: 6, opacity: show(phase >= 2) },
    { key: 'imageL', kind: 'label', text: labels.image, at: [-1.5, -1.5], color: 'result', offset: [16, 8], opacity: show(phase >= 2) },
    { key: 'parallel', kind: 'line', through: [3, 0], dir: [1, -1], color: 'extra', width: 2, dash: [5, 4], opacity: show(phase >= 2) },
    { key: 'p', kind: 'arrow', from: ORIGIN, to: phase >= 1 ? ORIGIN : [2, -2], color: 'first', opacity: show(phase <= 1) },
    { key: 'q', kind: 'arrow', from: ORIGIN, to: phase >= 1 ? ORIGIN : [-1, 1], color: 'second', opacity: show(phase <= 1) },
    { key: 'pL', kind: 'label', text: 'p', at: [2, -2], color: 'first', offset: [12, 8], opacity: show(phase === 0) },
    { key: 'qL', kind: 'label', text: 'q', at: [-1, 1], color: 'second', offset: [-12, -4], opacity: show(phase === 0) },
    { key: 'pq0', kind: 'label', text: 'f(p) = f(q) = 0', at: ORIGIN, color: 'warning', offset: [50, 16], opacity: show(phase === 1) },
    { key: 'r', kind: 'arrow', from: ORIGIN, to: phase >= 3 ? [3, 3] : [3, 0], color: 'first', opacity: show(phase >= 2) },
    { key: 's', kind: 'arrow', from: ORIGIN, to: phase >= 3 ? [3, 3] : [0, 3], color: 'second', opacity: show(phase >= 2) },
    {
      key: 'rL',
      kind: 'label',
      text: phase >= 3 ? 'f(r)=f(s)' : 'r',
      at: phase >= 3 ? [3, 3] : [3, 0],
      color: 'first',
      offset: phase >= 3 ? [-34, -8] : [10, 12],
      opacity: show(phase >= 2),
    },
    { key: 'sL', kind: 'label', text: 's', at: [0, 3], color: 'second', offset: [-12, -4], opacity: show(phase === 2) },
    dot('dot', [3, 3], 'result', { opacity: show(phase >= 3) }),
  ],
});

/** MatrixTransformVisual (:938): A = (2 1; 0 1) verformt das Gitter. */
const matrixTransform: FigureSpec = {
  window: { xMin: -1.5, xMax: 5, yMin: -1.5, yMax: 5 },
  scene: (phase) => {
    const col1: Pt = phase >= 1 ? [2, 0] : [1, 0];
    const col2: Pt = phase >= 2 ? [1, 1] : [0, 1];
    const gridA: Pt = phase >= 3 ? [2, 0] : [1, 0];
    const gridB: Pt = phase >= 3 ? [1, 1] : [0, 1];
    const x: Pt = phase >= 4 ? [4, 2] : [1, 2];
    return [
      { key: 'grid', kind: 'grid', a: gridA, b: gridB, color: 'first', alpha: 0.35, width: 1 },
      { key: 'cell', kind: 'path', closed: true, subpaths: [parallelogram(gridA, gridB)], fill: { color: 'first', alpha: 0.18 } },
      { key: 'x', kind: 'arrow', from: ORIGIN, to: x, color: 'result' },
      { key: 'xL', kind: 'label', text: phase >= 4 ? 'A·x' : 'x', at: x, color: 'result', offset: [14, -10] },
      { key: 'c1', kind: 'arrow', from: ORIGIN, to: col1, color: 'first', width: 4 },
      { key: 'c1L', kind: 'label', text: phase >= 1 ? 'A·e₁' : 'e₁', at: col1, color: 'first', offset: [4, 16] },
      { key: 'c2', kind: 'arrow', from: ORIGIN, to: col2, color: 'second', width: 4 },
      { key: 'c2L', kind: 'label', text: phase >= 2 ? 'A·e₂' : 'e₂', at: col2, color: 'second', offset: [-22, -8] },
    ];
  },
};

/** MatrixOrderVisual (:973): R·D ≠ D·R. */
const matrixOrder: FigureSpec = {
  window: { xMin: -3, xMax: 3, yMin: -1.5, yMax: 3 },
  scene: (phase) => {
    const columns: [Pt, Pt] =
      phase === 1
        ? [[2, 0], [0, 1]]
        : phase === 2
          ? [[0, 2], [-1, 0]]
          : phase === 3
            ? [[0, 1], [-1, 0]]
            : phase === 4
              ? [[0, 1], [-2, 0]]
              : [[1, 0], [0, 1]];
    return [
      {
        key: 'rdOutline',
        kind: 'path',
        closed: true,
        subpaths: [parallelogram([0, 2], [-1, 0])],
        stroke: { color: 'extra', width: 2, dash: [5, 4] },
        opacity: show(phase === 4),
      },
      { key: 'rdL', kind: 'label', text: 'R·D', at: [-0.5, 2], color: 'extra', offset: [0, -12], opacity: show(phase === 2 || phase === 4) },
      {
        key: 'shape',
        kind: 'path',
        closed: true,
        subpaths: [parallelogram(columns[0], columns[1])],
        fill: { color: 'first', alpha: 0.25 },
        stroke: { color: 'first', width: 2 },
      },
      { key: 'drL', kind: 'label', text: 'D·R', at: [-1, 1], color: 'first', offset: [0, -14], opacity: show(phase === 4) },
      { key: 'c1', kind: 'arrow', from: ORIGIN, to: columns[0], color: 'first' },
      { key: 'c2', kind: 'arrow', from: ORIGIN, to: columns[1], color: 'second' },
    ];
  },
};

/** BasisChangeVisual (:1204): In der Basis b₁ = (1, 1), b₂ = (1, −1) wird f diagonal. */
const basisChange: FigureSpec = {
  window: { xMin: -2, xMax: 8, yMin: -2, yMax: 8 },
  scene: (phase) => [
    { key: 'grid', kind: 'grid', a: [1, 1], b: [1, -1], color: 'first', alpha: 0.18, width: 1 },
    { key: 'v', kind: 'arrow', from: ORIGIN, to: [3, 1], color: 'extra' },
    { key: 'vL', kind: 'label', text: 'v', at: [3, 1], color: 'extra', offset: [12, 8] },
    { key: 'fb1', kind: 'arrow', from: ORIGIN, to: [3, 3], color: 'first', dashed: true, opacity: show(phase >= 1) },
    { key: 'fb1L', kind: 'label', text: 'f(b₁) = 3·b₁', at: [3, 3], color: 'first', offset: [-38, -10], opacity: show(phase >= 1) },
    { key: 'b1', kind: 'arrow', from: ORIGIN, to: [1, 1], color: 'first', width: 4 },
    { key: 'b1L', kind: 'label', text: 'b₁', at: [1, 1], color: 'first', offset: [-14, -2] },
    { key: 'b2', kind: 'arrow', from: ORIGIN, to: [1, -1], color: 'second', width: 4 },
    { key: 'b2L', kind: 'label', text: phase >= 2 ? 'b₂ = f(b₂)' : 'b₂', at: [1, -1], color: 'second', offset: [24, 8] },
    { key: 'sum1', kind: 'arrow', from: ORIGIN, to: phase >= 3 ? [6, 6] : [3, 1], color: 'first', dashed: true, opacity: show(phase >= 3) },
    { key: 'sum2', kind: 'arrow', from: [6, 6], to: phase >= 3 ? [7, 5] : [6, 6], color: 'second', dashed: true, opacity: show(phase >= 3) },
    { key: 'fv', kind: 'arrow', from: ORIGIN, to: phase >= 3 ? [7, 5] : [3, 1], color: 'result', width: 4, opacity: show(phase >= 3) },
    { key: 'fvL', kind: 'label', text: 'f(v)', at: [7, 5], color: 'result', offset: [16, 0], opacity: show(phase >= 3) },
  ],
};

export const linearMapFigures = (lang: 'de' | 'en'): Record<string, FigureSpec> => ({
  linearityCheck,
  kernelImage: kernelImage(lang === 'en' ? { kernel: 'Kernel', image: 'Image' } : { kernel: 'Kern', image: 'Bild' }),
  shearMap: gridMap({ image1: [1, 0], image2: [1, 1], sample: [1, 2] }),
  reflectionMap: gridMap({ image1: [0, 1], image2: [1, 0], sample: [1, 2], mirror: [1, 1] }),
  detArea: gridMap({ window: { xMin: -1, xMax: 5, yMin: -1, yMax: 5 }, image1: [3, 1], image2: [1, 2], sample: [1, 1] }),
  matrixTransform,
  matrixOrder,
  basisChange,
});
