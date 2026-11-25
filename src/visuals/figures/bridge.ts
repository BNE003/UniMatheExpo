/**
 * Grafiken des Brückenkurses (Zahlbereiche bis Skalarprodukt).
 * Quelle: Views/LessonVectorVisuals.swift („Brückenkurs“-Abschnitte) – Koordinaten und Phasen 1:1.
 */
import type { Lang } from '@/content/types';

import {
  arrow,
  block,
  circle,
  dec,
  disc,
  dot,
  fade,
  graph,
  graphStroke,
  hollowDot,
  mathLabel,
  numberLineAxis,
  path,
  polygon,
  polyline,
  rect,
  rectXY,
  segment,
  slopeLine,
  text,
} from '../dsl';
import { ORIGIN, show, type ColorName, type FigureSpec, type PlaneWindow, type Pt, type SceneEl } from '../scene';
import { setAspect, setWindow } from './sets';

const W = (xMin: number, xMax: number, yMin: number, yMax: number): PlaneWindow => ({ xMin, xMax, yMin, yMax });
const bk = (lang: Lang, de: string, en: string) => (lang === 'en' ? en : de);

// 1. Zahlbereiche ineinander geschachtelt
const numberSets = (lang: Lang): FigureSpec => {
  const boxes: [number, number, number, number][] = [
    [3.3, 3.3, 10.7, 6.7],
    [2.3, 2.3, 11.7, 7.7],
    [1.3, 1.3, 12.7, 8.7],
    [0.3, 0.3, 13.7, 9.7],
  ];
  const names = ['ℕ', 'ℤ', 'ℚ', 'ℝ'];
  const examples = ['1    2    3    …', '−3    −1    0', `½    ${dec(lang, '−0.75')}    ⅔`, '√2    π    e'];
  const labelY = [5.0, 7.2, 8.2, 9.2];
  const colors: ColorName[] = ['first', 'second', 'result', 'extra'];
  return {
    window: setWindow,
    showGrid: false,
    aspectRatio: setAspect,
    scene: (phase) => [
      [3, 2, 1, 0].map((i) => {
        const [x0, y0, x1, y1] = boxes[i];
        return rectXY(`box${i}`, x0, y0, x1, y1, {
          radius: 12,
          fill: { color: colors[i], alpha: 0.1 },
          stroke: { color: colors[i], width: 2 },
          opacity: show(phase >= i),
        });
      }),
      [0, 1, 2, 3].map((i) => [
        text(`name${i}`, names[i], [boxes[i][0] + 0.55, i === 0 ? boxes[i][3] - 0.6 : labelY[i]], {
          color: colors[i],
          size: 18,
          weight: 'bold',
          opacity: show(phase >= i),
        }),
        text(`ex${i}`, examples[i], [7, labelY[i]], { size: i === 0 ? 17 : 14, opacity: show(phase >= i) }),
      ]),
    ],
  };
};

// 2. ½ + ⅓ mit Bruchstreifen
const fractionAddition = (lang: Lang): FigureSpec => {
  const x0 = 1;
  const len = 12;
  const dividers = (y: number, parts: number): Pt[][] =>
    Array.from({ length: parts - 1 }, (_, k) => {
      const x = x0 + (len * (k + 1)) / parts;
      return [
        [x, y],
        [x, y + 1.2],
      ];
    });
  const strong = { color: 'primary' as const, alpha: 0.6, width: 1.5 };
  const dashed = { color: 'primary' as const, alpha: 0.45, width: 1, dash: [4, 3] };
  const row = (key: string, y: number, parts: number, color: ColorName, phase: number): SceneEl[] => [
    rectXY(`${key}.bg`, x0, y, x0 + len, y + 1.2, { fill: { color: 'secondary', alpha: 0.08 } }),
    rectXY(`${key}.part`, x0, y, x0 + len / parts, y + 1.2, { fill: { color, alpha: 0.55 } }),
    rectXY(`${key}.frame`, x0, y, x0 + len, y + 1.2, { stroke: strong }),
    path(`${key}.div`, dividers(y, parts), { stroke: strong }),
    path(`${key}.sixths`, dividers(y, 6), { stroke: dashed, opacity: show(phase >= 1) }),
  ];
  return {
    window: setWindow,
    showGrid: false,
    aspectRatio: setAspect,
    scene: (phase) => [
      row('half', 7.6, 2, 'first', phase),
      text('halfL', '½', [1.4, 9.4], { color: 'first', size: 18, weight: 'bold' }),
      text('halfEq', '= 3⁄6', [3.2, 9.4], { color: 'first', opacity: show(phase >= 1) }),
      row('third', 5.0, 3, 'second', phase),
      text('thirdL', '⅓', [1.4, 6.8], { color: 'second', size: 18, weight: 'bold' }),
      text('thirdEq', '= 2⁄6', [3.2, 6.8], { color: 'second', opacity: show(phase >= 1) }),
      fade(
        show(phase >= 2),
        rectXY('sum.bg', x0, 1.2, x0 + len, 2.4, { fill: { color: 'secondary', alpha: 0.08 } }),
        rectXY('sum.a', x0, 1.2, x0 + len / 2, 2.4, { fill: { color: 'first', alpha: 0.55 } }),
        rectXY('sum.b', x0 + len / 2, 1.2, x0 + (len * 5) / 6, 2.4, { fill: { color: 'second', alpha: 0.55 } }),
        rectXY('sum.frame', x0, 1.2, x0 + len, 2.4, { stroke: strong }),
        path('sum.div', dividers(1.2, 6), { stroke: { color: 'primary', alpha: 0.45, width: 1 } }),
        text('sumL', bk(lang, '½ + ⅓ = 5⁄6', '½ + ⅓ = 5⁄6'), [3.2, 3.2], { color: 'result', size: 16, weight: 'bold' }),
      ),
      fade(
        show(phase >= 3),
        rect('wrong', [x0 + len * 0.4, 1.8], 0, 2.0, { wPx: 3, fill: { color: 'warning' } }),
        text('wrongL', '2⁄5 ?', [x0 + len * 0.4, 0.45], { color: 'warning', size: 14, weight: 'bold' }),
      ),
    ],
  };
};

// 3. Intervalle auf der Zahlengeraden
const intervalLine: FigureSpec = (() => {
  const intervals: [number, number | null, boolean, boolean, string][] = [
    [-1, 3, true, true, '[−1, 3]'],
    [-1, 3, false, false, '(−1, 3)'],
    [-1, 3, true, false, '[−1, 3)'],
    [1, null, true, false, '[1, ∞)'],
  ];
  const endpoint = (key: string, filled: boolean, at: Pt) =>
    disc(key, at, 6.5, { fill: { color: filled ? 'first' : 'surface' }, stroke: { color: 'first', width: 2.5 } });
  return {
    window: W(-3.2, 5.2, -1.6, 2.0),
    showGrid: false,
    aspectRatio: 2.3,
    scene: (phase) => [
      path(
        'axis',
        [
          [
            [-3, 0],
            [5, 0],
          ],
          ...Array.from({ length: 9 }, (_, i): Pt[] => [
            [i - 3, -0.15],
            [i - 3, 0.15],
          ]),
        ],
        { stroke: { color: 'secondary', alpha: 0.7, width: 1.5 } },
      ),
      Array.from({ length: 8 }, (_, i) => {
        const k = i - 3;
        return text(`n${k}`, k < 0 ? `−${-k}` : `${k}`, [k, -0.65], { color: 'secondary', size: 13, weight: 'regular' });
      }),
      intervals.map(([left, right, leftIn, rightIn, notation], i) =>
        fade(
          show(phase === i),
          segment(`iv${i}.bar`, [left, 0], [right ?? 5.1, 0], { color: 'first', width: 6, cap: 'round' }),
          endpoint(`iv${i}.left`, leftIn, [left, 0]),
          right !== null ? [endpoint(`iv${i}.right`, rightIn, [right, 0])] : [],
          text(`iv${i}.text`, notation, [1, 1.25], { color: 'first', size: 22, weight: 'bold' }),
        ),
      ),
    ],
  };
})();

// 4. Potenzgesetz durch Zählen der Faktoren
const powerRules: FigureSpec = (() => {
  const slotX = (i: number) => 1.4 + i * 2.1;
  return {
    window: setWindow,
    showGrid: false,
    aspectRatio: setAspect,
    scene: (phase) => {
      const merged = phase >= 2;
      return [
        [0, 1, 2].map((i) => block(`a${i}`, '2', [slotX(i), 6.5], 1.6, 1.6, 'first')),
        [0, 1].map((i) =>
          block(`b${i}`, '2', merged ? [slotX(3 + i), 6.5] : [slotX(i), 3.2], 1.6, 1.6, 'second', {
            opacity: phase >= 1 ? (phase >= 3 ? 0.3 : 1) : 0,
          }),
        ),
        path(
          'strike',
          [3, 4].map((i): Pt[] => [
            [slotX(i) - 0.9, 5.6],
            [slotX(i) + 0.9, 7.4],
          ]),
          { stroke: { color: 'warning', width: 3 }, opacity: show(phase >= 3) },
        ),
        text('p3', '2³', [slotX(1), 8.4], { color: 'first', size: 20, weight: 'bold', italic: true, opacity: show(phase <= 1 || phase >= 3) }),
        text('p2', '2²', [slotX(0) + 1.05, 1.6], { color: 'second', size: 20, weight: 'bold', italic: true, opacity: show(phase === 1) }),
        text('p5', '2⁵ = 32', [slotX(2), 8.4], { color: 'result', size: 20, weight: 'bold', italic: true, opacity: show(phase === 2) }),
        text('quot', '2⁵ : 2² = 2³', [7, 2.6], { color: 'result', size: 20, weight: 'bold', italic: true, opacity: show(phase >= 3) }),
      ];
    },
  };
})();

// 5. 2ˣ und log₂ x als Spiegelbilder
const logInverse: FigureSpec = (() => {
  const window = W(-2.2, 9.5, -2.2, 9.5);
  return {
    window,
    scene: (phase) => [
      segment('axis', [-2.2, -2.2], [9.5, 9.5], graphStroke('secondary', 1.5, true), { opacity: show(phase >= 1) }),
      graph('exp', window, (x) => 2 ** x, -2.2, 3.25, graphStroke('first')),
      graph('log', window, (x) => Math.log2(x), 0.22, 9.5, graphStroke('second'), { opacity: show(phase >= 2) }),
      segment('mirror', [3, 8], [8, 3], graphStroke('extra', 1.5, true), { opacity: show(phase >= 2) }),
      dot('p', [3, 8], 'first'),
      mathLabel('pL', '(3, 8)', [3, 8], 'first', [-30, -6]),
      dot('q', [8, 3], 'second', { opacity: show(phase >= 2) }),
      mathLabel('qL', '(8, 3)', [8, 3], 'second', [0, 16], { opacity: show(phase >= 2) }),
      mathLabel('expL', 'y = 2ˣ', [1.3, 2.5], 'first', [-34, 0]),
      mathLabel('logL', 'y = log₂ x', [6, 2.6], 'second', [0, -16], { opacity: show(phase >= 2) }),
      mathLabel('axisL', 'y = x', [7.5, 7.5], 'secondary', [22, 6], { opacity: show(phase >= 1) }),
    ],
  };
})();

// 6. (a + b)(c + d) als Fläche
const distributiveArea: FigureSpec = {
  window: W(-1.0, 6.0, -1.0, 6.0),
  scene: (phase) => [
    rectXY('ac', 0, 0, 3, 3, { fill: { color: 'first', alpha: 0.45 }, opacity: show(phase >= 1) }),
    rectXY('ad', 0, 3, 3, 4.6, { fill: { color: 'second', alpha: 0.45 }, opacity: show(phase >= 2) }),
    rectXY('bc', 3, 0, 5, 3, { fill: { color: 'result', alpha: 0.45 }, opacity: show(phase >= 3) }),
    rectXY('bd', 3, 3, 5, 4.6, { fill: { color: 'extra', alpha: 0.45 }, opacity: show(phase >= 4) }),
    rectXY('outline', 0, 0, 5, 4.6, { stroke: { color: 'primary', alpha: 0.7, width: 2 } }),
    path(
      'split',
      [
        [
          [3, 0],
          [3, 4.6],
        ],
        [
          [0, 3],
          [5, 3],
        ],
      ],
      { stroke: { color: 'primary', alpha: 0.4, width: 1.2, dash: [5, 4] } },
    ),
    mathLabel('a', 'a', [1.5, 0], 'primary', [0, 14]),
    mathLabel('b', 'b', [4, 0], 'primary', [0, 14]),
    mathLabel('c', 'c', [0, 1.5], 'primary', [-14, 0]),
    mathLabel('d', 'd', [0, 3.8], 'primary', [-14, 0]),
    mathLabel('acL', 'ac', [1.5, 1.5], 'primary', [0, 0], { opacity: show(phase >= 1) }),
    mathLabel('adL', 'ad', [1.5, 3.8], 'primary', [0, 0], { opacity: show(phase >= 2) }),
    mathLabel('bcL', 'bc', [4, 1.5], 'primary', [0, 0], { opacity: show(phase >= 3) }),
    mathLabel('bdL', 'bd', [4, 3.8], 'primary', [0, 0], { opacity: show(phase >= 4) }),
  ],
};

// 7. Quadratische Ergänzung als Fläche
const completingSquare: FigureSpec = {
  window: W(-1.0, 8.0, -1.0, 8.0),
  scene: (phase) => {
    const strip = { radius: 2, fill: { color: 'second' as const, alpha: 0.5 }, stroke: { color: 'second' as const, width: 2 } };
    return [
      rectXY('x2', 0, 0, 4, 4, { fill: { color: 'first', alpha: 0.45 }, stroke: { color: 'first', width: 2 } }),
      rect('fixed', [4.75, 2], 1.5, 4, strip),
      rect('moving', phase >= 1 ? [2, 4.75] : [6.25, 2], 1.5, 4, { ...strip, transform: { rotate: phase >= 1 ? 90 : 0 } }),
      rectXY('gap', 4, 4, 5.5, 5.5, { stroke: { color: 'warning', width: 2, dash: [5, 4] }, opacity: show(phase === 2) }),
      rectXY('corner', 4, 4, 5.5, 5.5, { fill: { color: 'result', alpha: 0.55 }, opacity: show(phase >= 3) }),
      rectXY('big', 0, 0, 5.5, 5.5, { stroke: { color: 'result', width: 3 }, opacity: show(phase >= 3) }),
      mathLabel('x2L', 'x²', [2, 2], 'primary', [0, 0]),
      mathLabel('6x', '6x', [5.5, 2], 'primary', [0, 0], { opacity: show(phase === 0) }),
      mathLabel('3x1', '3x', [4.75, 2], 'primary', [0, 0], { opacity: show(phase >= 1) }),
      mathLabel('3x2', '3x', [2, 4.75], 'primary', [0, 0], { opacity: show(phase >= 1) }),
      mathLabel('nine', '9', [4.75, 4.75], 'warning', [0, 0], { opacity: show(phase >= 2) }),
      mathLabel('xb', 'x', [2, 0], 'first', [0, 14]),
      mathLabel('xl', 'x', [0, 2], 'first', [-14, 0]),
      mathLabel('three', '3', [4.75, 0], 'second', [0, 14], { opacity: show(phase >= 1) }),
      mathLabel('x3', 'x + 3', [2.75, 5.5], 'result', [0, -16], { opacity: show(phase >= 3) }),
    ];
  },
};

// 8. Summenzeichen abrollen
const sigmaUnroll: FigureSpec = (() => {
  const slotX = (i: number) => 1.6 + i * 2.7;
  const values = [1, 4, 9, 16, 25];
  const appears = (i: number) => (i < 3 ? i + 1 : 4);
  return {
    window: setWindow,
    showGrid: false,
    aspectRatio: setAspect,
    scene: (phase) => [
      text('top', '5', [6.0, 9.3], { color: 'secondary', size: 13 }),
      text('sigma', 'Σ', [6.0, 8.2], { color: 'first', size: 34, weight: 'bold' }),
      text('bottom', 'k = 1', [6.0, 7.0], { color: 'secondary', size: 13 }),
      text('term', 'k²', [7.4, 8.2], { size: 24, weight: 'bold', italic: true }),
      values.map((v, i) => [
        fade(
          show(phase >= appears(i)),
          text(`k${i}`, `k = ${i + 1}`, [slotX(i), 5.6], { color: 'secondary', size: 12 }),
          block(`sq${i}`, `${i + 1}²`, [slotX(i), 4.3], 2.0, 1.5, 'first'),
          text(`v${i}`, `${v}`, [slotX(i), 2.8], { color: 'second', size: 18, weight: 'bold' }),
        ),
        i < 4 ? [text(`plus${i}`, '+', [slotX(i) + 1.35, 4.3], { color: 'secondary', size: 18, opacity: show(phase >= appears(i + 1)) })] : [],
      ]),
      text('result', '= 55', [7, 1.2], { color: 'result', size: 24, weight: 'bold', opacity: show(phase >= 5) }),
    ],
  };
})();

// 9. Teleskopsumme
const telescopeSum: FigureSpec = (() => {
  const centers = [2.0, 5.3, 8.6, 11.9];
  const firsts = ['1', '½', '⅓', '¼'];
  const seconds = ['½', '⅓', '¼', '⅕'];
  const cancelPhase = (k: number) => (k === 0 ? 1 : 2);
  /** Quadratische Bézierkurve (`addQuadCurve`) als Punktliste */
  const quad = (a: Pt, b: Pt, c: Pt): Pt[] =>
    Array.from({ length: 25 }, (_, i) => {
      const t = i / 24;
      const u = 1 - t;
      return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]] as Pt;
    });
  return {
    window: setWindow,
    showGrid: false,
    aspectRatio: setAspect,
    scene: (phase) => [
      centers.map((cx, k) => [
        rect(`box${k}`, [cx, 6], 2.9, 1.8, { radius: 8, stroke: { color: 'secondary', alpha: 0.5, width: 1.5 } }),
        text(`first${k}`, k === 0 ? '1' : `+${firsts[k]}`, [cx - 0.65, 6], {
          color: k === 0 && phase >= 3 ? 'result' : 'primary',
          size: 19,
          weight: 'bold',
          opacity: k > 0 && phase >= cancelPhase(k - 1) ? 0.25 : 1,
        }),
        text(`second${k}`, `−${seconds[k]}`, [cx + 0.65, 6], {
          color: k === 3 && phase >= 3 ? 'result' : 'primary',
          size: 19,
          weight: 'bold',
          opacity: k < 3 && phase >= cancelPhase(k) ? 0.25 : 1,
        }),
        k < 3
          ? [
              text(`plus${k}`, '+', [cx + 1.65, 6], { color: 'secondary', size: 18 }),
              polyline(
                `bow${k}`,
                quad([cx + 0.65, 6.75], [centers[k + 1] - 0.65, 6.75], [(cx + centers[k + 1]) / 2, 8.4]),
                { color: 'warning', width: 2, cap: 'round' },
                { opacity: show(phase >= cancelPhase(k)) },
              ),
              text(`zero${k}`, '0', [(cx + centers[k + 1]) / 2, 8.0], { color: 'warning', size: 14, weight: 'bold', opacity: show(phase >= cancelPhase(k)) }),
            ]
          : [],
      ]),
      text('result', '= 1 − ⅕ = ⅘', [7, 2.8], { color: 'result', size: 24, weight: 'bold', opacity: show(phase >= 3) }),
    ],
  };
})();

// 10. Gleichung als Waage
const balanceScale: FigureSpec = (() => {
  const pivot: Pt = [7, 5.6];
  const half = 5.2;
  const hang = 2.2;
  const tilt = (phase: number) => (phase === 1 ? 9 : 0);
  const end = (side: number, phase: number): Pt => {
    const a = (tilt(phase) * Math.PI) / 180;
    return [pivot[0] + side * half * Math.cos(a), pivot[1] - side * half * Math.sin(a)];
  };
  const leftLabels = (phase: number) => (phase === 0 ? 4 : phase === 3 ? 1 : 3);
  const rightLabel = (phase: number) => (phase <= 1 ? '14' : phase === 2 ? '12' : '4');
  const equation = (phase: number) => (phase === 3 ? 'x = 4' : phase === 0 ? '3x + 2 = 14' : phase === 1 ? '3x ≠ 14' : '3x = 12');
  return {
    window: setWindow,
    showGrid: false,
    aspectRatio: setAspect,
    scene: (phase) => {
      const left = end(-1, phase);
      const right = end(1, phase);
      const n = leftLabels(phase);
      return [
        polygon(
          'stand',
          [
            pivot,
            [pivot[0] - 1.1, 0.6],
            [pivot[0] + 1.1, 0.6],
          ],
          { fill: { color: 'secondary', alpha: 0.35 } },
        ),
        rect('beam', pivot, 2 * half, 0, { hPx: 5, radius: 2.5, fill: { color: 'primary', alpha: 0.75 }, transform: { rotate: tilt(phase) } }),
        disc('pivot', pivot, 4.5, { fill: { color: 'primary' } }),
        [left, right].map((e, s) => [
          rect(`string${s}`, [e[0], e[1] - hang / 2], 0, hang, { wPx: 1.5, fill: { color: 'secondary', alpha: 0.7 } }),
          rect(`pan${s}`, [e[0], e[1] - hang], 4.2, 0, { hPx: 5, radius: 2.5, fill: { color: 'secondary', alpha: 0.8 } }),
        ]),
        [0, 1, 2, 3].map((i) => {
          const visible = i < n;
          const offset = (i - (Math.max(n, 1) - 1) / 2) * 1.0;
          return block(`w${i}`, i < 3 ? 'x' : '2', [left[0] + (visible ? offset : 0), left[1] - hang + 0.5], 0.9, 0.9, i < 3 ? 'first' : 'second', {
            opacity: show(visible),
          });
        }),
        block('right', rightLabel(phase), [right[0], right[1] - hang + 0.55], 1.6, 1.0, 'second'),
        text('equation', equation(phase), [7, 9.2], {
          color: phase === 1 ? 'warning' : phase === 3 ? 'result' : 'primary',
          size: 20,
          weight: 'bold',
          italic: true,
        }),
      ];
    },
  };
})();

// 11. Diskriminante und Schnittpunkte der Parabel
const quadraticRoots: FigureSpec = (() => {
  const window = W(-3.0, 3.0, -2.6, 4.4);
  const shifts = [0, 2, 3.5];
  return {
    window,
    scene: (phase) => {
      const shift = shifts[Math.min(phase, shifts.length - 1)];
      return [
        // `.offset(y:)` verschiebt den Graphen; gleiche Stützstellen, daher fließend interpolierbar
        graph('parabola', window, (x) => x * x - 2 + shift, -3, 3, graphStroke(phase === 2 ? 'warning' : 'first')),
        dot('r1', [-1.4142, 0], 'result', { opacity: show(phase === 0) }),
        dot('r2', [1.4142, 0], 'result', { opacity: show(phase === 0) }),
        dot('r0', ORIGIN, 'result', { opacity: show(phase === 1) }),
        mathLabel('dPos', 'D > 0', [1.9, 3.6], 'result', [0, 0], { opacity: show(phase === 0) }),
        mathLabel('dZero', 'D = 0', [1.9, 3.6], 'result', [0, 0], { opacity: show(phase === 1) }),
        mathLabel('dNeg', 'D < 0', [1.9, 3.6], 'warning', [0, 0], { opacity: show(phase === 2) }),
      ];
    },
  };
})();

// 0.6 Ungleichung dreht sich bei Multiplikation mit −1
const inequalityFlip: FigureSpec = {
  window: W(-5, 5, -1.2, 2.4),
  showGrid: false,
  aspectRatio: 2.4,
  scene: (phase) => {
    const flipped = phase >= 1;
    const ax = flipped ? 2 : -2;
    const bx = flipped ? -3 : 3;
    return [
      numberLineAxis('axis', -4, 4),
      dot('a', [ax, 0], 'first'),
      dot('b', [bx, 0], 'second'),
      text('aL', flipped ? '−a = 2' : 'a = −2', [ax, 0.75], { color: 'first', size: 14 }),
      text('bL', flipped ? '−b = −3' : 'b = 3', [bx, 0.75], { color: 'second', size: 14 }),
      text('rel', phase === 0 ? '−2 < 3' : phase === 1 ? '· (−1)' : '2 > −3', [0, 1.85], {
        color: phase === 2 ? 'result' : 'primary',
        size: 20,
        weight: 'bold',
      }),
    ];
  },
};

// 0.6 |x − 2| < 3 als Abstand
const absDistance: FigureSpec = {
  window: W(-3.4, 7.4, -1.2, 2.6),
  showGrid: false,
  aspectRatio: 2.6,
  scene: (phase) => {
    const outside = phase === 3;
    const arrows = show(phase >= 1 && phase < 3);
    return [
      numberLineAxis('axis', -3, 7),
      segment('inside', [-1, 0], [5, 0], { color: 'first', width: 9, cap: 'round' }, { opacity: show(phase === 2) }),
      path(
        'outside',
        [
          [
            [-3, 0],
            [-1, 0],
          ],
          [
            [5, 0],
            [7, 0],
          ],
        ],
        { stroke: { color: 'warning', width: 9, cap: 'round' }, opacity: show(outside) },
      ),
      arrow('right', [2, 1.0], [5, 1.0], 'second', { opacity: arrows }),
      arrow('left', [2, 1.0], [-1, 1.0], 'second', { opacity: arrows }),
      text('rR', 'r = 3', [3.5, 1.5], { color: 'second', size: 13, opacity: arrows }),
      text('rL', 'r = 3', [0.5, 1.5], { color: 'second', size: 13, opacity: arrows }),
      dot('center', [2, 0], 'result'),
      hollowDot('endL', [-1, 0], outside ? 'warning' : 'first', { opacity: show(phase >= 2) }),
      hollowDot('endR', [5, 0], outside ? 'warning' : 'first', { opacity: show(phase >= 2) }),
      text('rel', outside ? '|x − 2| > 3' : '|x − 2| < 3', [2, 2.15], {
        color: outside ? 'warning' : 'first',
        size: 18,
        weight: 'bold',
        opacity: show(phase >= 1),
      }),
    ];
  },
};

// 0.7 Zwei Geraden – drei mögliche Lagen
const linearSystemLines: FigureSpec = (() => {
  const window = W(-1, 6, -1, 6);
  return {
    window,
    scene: (phase) => [
      graph('l1', window, (x) => 3 - x, -1, 6, graphStroke('first')),
      graph('l2', window, (x) => x - 1, -1, 6, graphStroke('second'), { opacity: show(phase === 1) }),
      graph('l3', window, (x) => 5 - x, -1, 6, graphStroke('warning'), { opacity: show(phase === 2) }),
      graph('l4', window, (x) => 3 - x, -1, 6, graphStroke('extra', 6, true), { opacity: show(phase === 3) }),
      dot('s', [2, 1], 'result', { opacity: show(phase === 1) }),
      mathLabel('sL', '(2, 1)', [2, 1], 'result', [24, 14], { opacity: show(phase === 1) }),
      text('t1', 'x + y = 3', [0.5, 3.7], { color: 'first', size: 13 }),
      text('t2', 'x − y = 1', [5.0, 4.5], { color: 'second', size: 13, opacity: show(phase === 1) }),
      text('t3', 'x + y = 5', [1.2, 4.6], { color: 'warning', size: 13, opacity: show(phase === 2) }),
      text('t4', '2x + 2y = 6', [4.6, 0.4], { color: 'extra', size: 13, opacity: show(phase === 3) }),
    ],
  };
})();

// 0.8 Umkehrfunktion durch Spiegelung
const inverseReflection: FigureSpec = (() => {
  const window = W(-0.6, 5.4, -0.6, 5.4);
  return {
    window,
    scene: (phase) => [
      segment('axis', [-0.6, -0.6], [5.4, 5.4], graphStroke('secondary', 1.5, true), { opacity: show(phase >= 1) }),
      graph('f', window, (x) => x * x, 0, 2.3, graphStroke('first')),
      graph('inv', window, Math.sqrt, 0, 5.4, graphStroke('second'), { opacity: show(phase >= 2) }),
      segment('mirror', [2, 4], [4, 2], graphStroke('extra', 1.5, true), { opacity: show(phase >= 2) }),
      dot('p', [2, 4], 'first'),
      mathLabel('pL', '(2, 4)', [2, 4], 'first', [-28, -8]),
      dot('q', [4, 2], 'second', { opacity: show(phase >= 2) }),
      mathLabel('qL', '(4, 2)', [4, 2], 'second', [0, 16], { opacity: show(phase >= 2) }),
      mathLabel('fL', 'f(x) = x²', [1.2, 1.5], 'first', [-30, 0]),
      mathLabel('invL', 'f⁻¹(x) = √x', [4.8, 2.2], 'second', [-6, -16], { opacity: show(phase >= 2) }),
    ],
  };
})();

// 0.8 Gerade und ungerade Funktionen
const evenOddSymmetry: FigureSpec = (() => {
  const window = W(-2.6, 2.6, -4.2, 4.2);
  const cube = (x: number) => x * x * x;
  return {
    window,
    scene: (phase) => [
      graph('evenR', window, (x) => x * x, 0, 1.95, graphStroke('first'), { opacity: show(phase <= 1) }),
      graph('evenL', window, (x) => x * x, -1.95, 0, graphStroke('second'), { opacity: show(phase === 1) }),
      segment('evenMirror', [-1.5, 2.25], [1.5, 2.25], graphStroke('extra', 1.5, true), { opacity: show(phase === 1) }),
      graph('oddR', window, cube, 0, 1.6, graphStroke('first'), { opacity: show(phase >= 2) }),
      graph('oddL', window, cube, -1.6, 0, graphStroke('second'), { opacity: show(phase === 3) }),
      segment('oddMirror', [-1.2, -1.728], [1.2, 1.728], graphStroke('extra', 1.5, true), { opacity: show(phase === 3) }),
      dot('e1', [1.5, 2.25], 'first', { opacity: show(phase === 1) }),
      dot('e2', [-1.5, 2.25], 'second', { opacity: show(phase === 1) }),
      dot('o1', [1.2, 1.728], 'first', { opacity: show(phase === 3) }),
      dot('o2', [-1.2, -1.728], 'second', { opacity: show(phase === 3) }),
      text('name', phase <= 1 ? 'x²' : 'x³', [1.9, 3.6], { size: 16, weight: 'bold', italic: true }),
    ],
  };
})();

// 0.8 Graphen verschieben, strecken
const functionTransform: FigureSpec = (() => {
  const window = W(-2, 6, -1, 8);
  const vertices: Pt[] = [
    [0, 0],
    [2, 0],
    [2, 0],
    [2, 1],
  ];
  const opacityFor = (k: number, phase: number) => (phase < k ? 0 : phase === k ? 1 : 0.22);
  const fns: [(x: number) => number, ColorName][] = [
    [(x) => x * x, 'first'],
    [(x) => (x - 2) * (x - 2), 'second'],
    [(x) => 2 * (x - 2) * (x - 2), 'extra'],
    [(x) => 2 * (x - 2) * (x - 2) + 1, 'result'],
  ];
  return {
    window,
    scene: (phase) => [
      fns.map(([fn, color], k) => graph(`g${k}`, window, fn, -2, 6, graphStroke(color), { opacity: opacityFor(k, phase) })),
      dot('vertex', vertices[Math.min(phase, 3)], 'primary'),
      text('formula', ['x²', '(x − 2)²', '2(x − 2)²', '2(x − 2)² + 1'][Math.min(phase, 3)], [4.6, 7.2], { size: 16, weight: 'bold', italic: true }),
    ],
  };
})();

// 0.9 Nullstellen und Linearfaktoren
const polynomialRoots: FigureSpec = (() => {
  const window = W(0, 4, -1.6, 1.6);
  return {
    window,
    scene: (phase) => [
      graph('p', window, (x) => (x - 1) * (x - 2) * (x - 3), 0.3, 3.7, graphStroke('first')),
      [1, 2, 3].map((r) => [
        dot(`root${r}`, [r, 0], 'result', { opacity: show(phase >= r) }),
        text(`factor${r}`, `(x − ${r})`, [r, -0.28], { color: 'result', size: 14, weight: 'bold', opacity: show(phase >= r) }),
        text(`x${r}`, `x = ${r}`, [r, 0.25], { color: 'result', size: 12, opacity: show(phase >= r) }),
      ]),
    ],
  };
})();

// 0.9 Polstelle und waagerechte Asymptote
const rationalAsymptotes: FigureSpec = (() => {
  const window = W(-3, 7, -3, 7.5);
  const f = (x: number) => (2 * x) / (x - 1);
  return {
    window,
    scene: (phase) => [
      segment('pole', [1, -3], [1, 7.5], graphStroke('warning', 1.8, true), { opacity: show(phase >= 1) }),
      segment('asymptote', [-3, 2], [7, 2], graphStroke('extra', 1.8, true), { opacity: show(phase >= 2) }),
      graph('left', window, f, -3, 0.9, graphStroke('first')),
      graph('right', window, f, 1.1, 7, graphStroke('first')),
      text('poleL', 'x = 1', [1.7, -2.4], { color: 'warning', size: 13, weight: 'bold', opacity: show(phase >= 1) }),
      text('asymL', 'y = 2', [6.0, 1.4], { color: 'extra', size: 13, weight: 'bold', opacity: show(phase >= 2) }),
      dot('p1', [5, 2.5], 'result', { opacity: show(phase >= 3) }),
      dot('p2', [-2, 4 / 3], 'result', { opacity: show(phase >= 3) }),
    ],
  };
})();

// 0.10 Tangentensteigung bei x = 0 und die Zahl e
const eulerTangent = (lang: Lang): FigureSpec => {
  const window = W(-2.2, 2.2, -0.8, 4);
  const slopes = [0.6931, 1.0, 1.0986];
  return {
    window,
    scene: (phase) => [
      graph('two', window, (x) => 2 ** x, -2.2, 2.2, graphStroke('second'), { opacity: show(phase === 0 || phase === 3) }),
      graph('e', window, Math.exp, -2.2, 2.2, graphStroke('first', phase === 3 ? 3.5 : 2.5), { opacity: show(phase === 1 || phase === 3) }),
      graph('three', window, (x) => 3 ** x, -2.2, 2.2, graphStroke('extra'), { opacity: show(phase === 2 || phase === 3) }),
      slopeLine('t2', window, 0, 1, slopes[0], graphStroke('second', 1.8, true), { opacity: show(phase === 0) }),
      slopeLine('te', window, 0, 1, slopes[1], graphStroke('first', 1.8, true), { opacity: show(phase === 1 || phase === 3) }),
      slopeLine('t3', window, 0, 1, slopes[2], graphStroke('extra', 1.8, true), { opacity: show(phase === 2) }),
      dot('p', [0, 1], 'primary'),
      text('l2', `2ˣ  m ≈ ${dec(lang, '0.69')}`, [-1.3, 2.9], { color: 'second', size: 13, weight: 'bold', opacity: show(phase === 0 || phase === 3) }),
      text('le', 'eˣ  m = 1', [-1.3, 3.4], { color: 'first', size: 13, weight: 'bold', opacity: show(phase === 1 || phase === 3) }),
      text('l3', `3ˣ  m ≈ ${dec(lang, '1.10')}`, [-1.3, 2.4], { color: 'extra', size: 13, weight: 'bold', opacity: show(phase === 2 || phase === 3) }),
    ],
  };
};

// 0.11 Einheitskreis
const unitCircle: FigureSpec = (() => {
  const degrees = [30, 45, 60, 90];
  const labels = ['(√3/2, 1/2)', '(√2/2, √2/2)', '(1/2, √3/2)', '(0, 1)'];
  return {
    window: W(-1.7, 1.7, -1.5, 1.5),
    aspectRatio: 1.13,
    scene: (phase) => {
      const deg = degrees[Math.min(phase, 3)];
      const rad = (deg * Math.PI) / 180;
      const c = Math.cos(rad);
      const s = Math.sin(rad);
      return [
        circle('unit', ORIGIN, 1, { stroke: { color: 'primary', alpha: 0.6, width: 2 } }),
        arrow('radius', ORIGIN, [c, s], 'first', { width: 3 }),
        arrow('cos', ORIGIN, [c, 0], 'second', { width: 3 }),
        arrow('sin', [c, 0], [c, s], 'result', { width: 3 }),
        dot('p', [c, s], 'first'),
        text('cosL', 'cos', [c / 2, -0.14], { color: 'second', size: 12, weight: 'bold' }),
        text('sinL', 'sin', [c + 0.17, s / 2], { color: 'result', size: 12, weight: 'bold' }),
        text('deg', `${deg}°`, [0.3, 0.12], { color: 'first', size: 13, weight: 'bold' }),
        text('coords', labels[Math.min(phase, 3)], [0, 1.3], { size: 17, weight: 'bold' }),
      ];
    },
  };
})();

// 0.11 Sinuskurve aus dem Kreis
const sineUnwrap: FigureSpec = (() => {
  const window = W(-2.2, 7.4, -1.7, 1.7);
  const thetas = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2, 2 * Math.PI];
  const originX = 0.6;
  const cx = -0.9;
  const grey = { color: 'secondary' as const, alpha: 0.55, width: 1.4 };
  return {
    window,
    showGrid: false,
    aspectRatio: 2.8,
    scene: (phase) => {
      const th = thetas[Math.min(phase, 4)];
      const px = cx + Math.cos(th);
      const py = Math.sin(th);
      return [
        circle('circle', [cx, 0], 1, { stroke: grey }),
        path(
          'axes',
          [
            [
              [-2.1, 0],
              [7.2, 0],
            ],
            [
              [originX, -1.4],
              [originX, 1.4],
            ],
          ],
          { stroke: grey },
        ),
        [0, 1, 2, 3].map((k) =>
          graph(`q${k}`, window, (x) => Math.sin(x - 0.6), originX + (k * Math.PI) / 2, originX + ((k + 1) * Math.PI) / 2, graphStroke('second'), {
            opacity: show(phase >= k + 1),
          }),
        ),
        arrow('radius', [cx, 0], [px, py], 'first', { width: 3 }),
        arrow('carry', [px, py], [originX + th, py], 'extra', { width: 1.6, dashed: true }),
        dot('p', [px, py], 'first'),
        dot('q', [originX + th, py], 'second'),
        text('pi', 'π', [originX + Math.PI, -0.28], { color: 'secondary', size: 12 }),
        text('twoPi', '2π', [originX + 2 * Math.PI, -0.28], { color: 'secondary', size: 12 }),
        text('sinx', 'sin x', [6.4, 0.95], { color: 'second', size: 14, weight: 'bold', italic: true }),
      ];
    },
  };
})();

// 0.12 Tangenten an Hochpunkt, Wendepunkt und Tiefpunkt
const curveSketching = (lang: Lang): FigureSpec => {
  const window = W(-2.6, 2.6, -4, 4);
  return {
    window,
    scene: (phase) => [
      graph('f', window, (x) => x * x * x - 3 * x, -2.3, 2.3, graphStroke('first')),
      slopeLine('tMax', window, -1, 2, 0, graphStroke('second', 1.8, true), { opacity: show(phase >= 1) }),
      slopeLine('tInf', window, 0, 0, -3, graphStroke('extra', 1.8, true), { opacity: show(phase >= 2) }),
      slopeLine('tMin', window, 1, -2, 0, graphStroke('second', 1.8, true), { opacity: show(phase >= 3) }),
      dot('max', [-1, 2], 'result', { opacity: show(phase >= 1) }),
      dot('inf', ORIGIN, 'extra', { opacity: show(phase >= 2) }),
      dot('min', [1, -2], 'warning', { opacity: show(phase >= 3) }),
      mathLabel('maxL', bk(lang, 'Hochpunkt', 'Maximum'), [-1, 2], 'result', [-34, -14], { opacity: show(phase >= 1) }),
      mathLabel('infL', bk(lang, 'Wendepunkt', 'Inflection'), ORIGIN, 'extra', [40, -14], { opacity: show(phase >= 2) }),
      mathLabel('minL', bk(lang, 'Tiefpunkt', 'Minimum'), [1, -2], 'warning', [34, 14], { opacity: show(phase >= 3) }),
    ],
  };
};

// 0.14 Skalarprodukt und Projektion
const dotProduct = (lang: Lang): FigureSpec => ({
  window: W(-1, 6, -1, 4),
  scene: (phase) => [
    arrow('a', ORIGIN, [4, 0], 'first', { width: 4 }),
    arrow('b', ORIGIN, [3, 2], 'second', { width: 4 }),
    arrow('drop', [3, 2], [3, 0], 'warning', { width: 1.8, dashed: true, opacity: show(phase >= 1) }),
    arrow('proj', [0, -0.35], [3, -0.35], 'result', { width: 5, opacity: show(phase >= 2) }),
    dot('foot', [3, 0], 'warning', { opacity: show(phase >= 1) }),
    mathLabel('aL', 'a', [4, 0], 'first', [12, -12]),
    mathLabel('bL', 'b', [3, 2], 'second', [12, -10]),
    mathLabel('projL', bk(lang, 'Projektion', 'projection'), [1.5, -0.35], 'result', [0, 14], { opacity: show(phase >= 2) }),
    text('phi', 'φ', [0.9, 0.28], { color: 'extra', size: 16, weight: 'bold', italic: true, opacity: show(phase >= 3) }),
    text('ab', 'a · b = 12', [4.5, 3.3], { color: 'extra', size: 17, weight: 'bold', opacity: show(phase >= 3) }),
  ],
});

export const bridgeFigures = (lang: Lang): Record<string, FigureSpec> => ({
  numberSets: numberSets(lang),
  fractionAddition: fractionAddition(lang),
  intervalLine,
  powerRules,
  logInverse,
  distributiveArea,
  completingSquare,
  sigmaUnroll,
  telescopeSum,
  balanceScale,
  quadraticRoots,
  inequalityFlip,
  absDistance,
  linearSystemLines,
  inverseReflection,
  evenOddSymmetry,
  functionTransform,
  polynomialRoots,
  rationalAsymptotes,
  eulerTangent: eulerTangent(lang),
  unitCircle,
  sineUnwrap,
  curveSketching: curveSketching(lang),
  dotProduct: dotProduct(lang),
});


