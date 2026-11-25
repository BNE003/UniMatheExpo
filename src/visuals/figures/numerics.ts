/**
 * Grafiken zur Numerik (Kapitel 4).
 * Quelle: Views/LessonVectorVisuals.swift („Numerik“-Abschnitte). Die Layout-Grafiken
 * (Ziffernreihen, Matrizen, IEEE-Wort) verwenden ein Fenster in Punkten (340 pt Breite),
 * damit Abstände und Schriftgrößen denen der SwiftUI-Stacks entsprechen.
 */
import type { Lang } from '@/content/types';

import {
  arrow,
  circle,
  dec,
  disc,
  dot,
  dots,
  ellipse,
  fade,
  graph,
  graphStroke,
  mathLabel,
  path,
  polygon,
  polyline,
  rect,
  rectXY,
  region,
  regionCircle,
  regionRect,
  segment,
  text,
  type TextOpts,
} from '../dsl';
import { ORIGIN, show, type ColorName, type FigureSpec, type LabelEl, type PlaneWindow, type Pt, type SceneEl } from '../scene';

const W = (xMin: number, xMax: number, yMin: number, yMax: number): PlaneWindow => ({ xMin, xMax, yMin, yMax });
const bk = (lang: Lang, de: string, en: string) => (lang === 'en' ? en : de);

/** Fenster in Punkten für Stack-Layouts: 340 pt breit, y nach oben. */
const PT_WIDTH = 340;
const ptWindow = (aspect: number): PlaneWindow => W(0, PT_WIDTH, 0, PT_WIDTH / aspect);

const mono = (key: string, value: string, at: Pt, size: number, opts: TextOpts = {}): LabelEl =>
  text(key, value, at, { font: 'mono', size, ...opts });

/** `MatrixBracket` links und rechts um ein Rechteck (Punkte). */
function brackets(key: string, x0: number, x1: number, yBottom: number, yTop: number): SceneEl {
  const w = 6;
  return path(
    key,
    [
      [
        [x0 + w, yTop],
        [x0, yTop],
        [x0, yBottom],
        [x0 + w, yBottom],
      ],
      [
        [x1 - w, yTop],
        [x1, yTop],
        [x1, yBottom],
        [x1 - w, yBottom],
      ],
    ],
    { stroke: { color: 'secondary', width: 1.5 } },
  );
}

// ---------------------------------------------------------------------------
// 4.1 Gleitkomma-Zahlenstrahl, Auslöschung, IEEE-Aufbau

const floatNumberLine = (lang: Lang): FigureSpec => {
  const groups = [[1, 1.25, 1.5, 1.75], [2, 2.5, 3, 3.5], [4, 5, 6, 7], [8]];
  const gaps = ['0.25', '0.5', '1'];
  const colors: ColorName[] = ['first', 'second', 'extra', 'result'];
  return {
    window: W(0.6, 8.4, -1.6, 1.6),
    showGrid: false,
    aspectRatio: 2.1,
    scene: (phase) => [
      path(
        'axis',
        [
          [
            [0.7, 0],
            [8.3, 0],
          ],
          ...Array.from({ length: 8 }, (_, i): Pt[] => [
            [i + 1, -0.12],
            [i + 1, 0.12],
          ]),
        ],
        { stroke: { color: 'secondary', alpha: 0.7, width: 1.5 } },
      ),
      Array.from({ length: 8 }, (_, i) => text(`n${i + 1}`, `${i + 1}`, [i + 1, -0.55], { color: 'secondary', size: 12, weight: 'regular' })),
      groups.map((g, k) =>
        dots(
          `g${k}`,
          g.map((x): Pt => [x, 0]),
          4,
          colors[k],
          { opacity: show(phase >= k || phase === 3) },
        ),
      ),
      [0, 1, 2].map((k) => {
        const [x0, x1] = [groups[k][0], groups[k][1]];
        const visible = show(phase === k || phase === 3);
        return [
          polyline(
            `gap${k}`,
            [
              [x0, 0.35],
              [x0, 0.45],
              [x1, 0.45],
              [x1, 0.35],
            ],
            { color: colors[k], width: 1.6 },
            { opacity: visible },
          ),
          text(`gapL${k}`, dec(lang, gaps[k]), [(x0 + x1) / 2, 0.95], { color: colors[k], size: 13, weight: 'bold', opacity: visible }),
        ];
      }),
    ],
  };
};

const cancellationDigits = (lang: Lang): FigureSpec => {
  const window = ptWindow(1.9);
  const left = 96;
  const digitX = (i: number) => left + 30 + 8.5 + 17 * i;
  const rowY = [149, 107, 55];
  const row = (key: string, sign: string, digits: string, y: number, color: (i: number) => ColorName, alpha: (i: number) => number, opacity = 1) => [
    mono(`${key}.sign`, sign, [left + 15, y], 26, { color: 'secondary', opacity }),
    [...digits].map((d, i) => mono(`${key}.${i}`, d, [digitX(i), y], 28, { color: color(i), alpha: alpha(i), opacity })),
  ];
  return {
    window,
    showGrid: false,
    aspectRatio: 1.9,
    textReferenceWidth: PT_WIDTH,
    scene: (phase) => {
      const same: ColorName = phase >= 1 ? 'second' : 'first';
      const top = (i: number): ColorName => (i < 6 ? same : 'first');
      return [
        row('a', '', dec(lang, '1.23457'), rowY[0], top, () => 1),
        row('b', '−', dec(lang, '1.23451'), rowY[1], top, () => 1),
        rect('rule', [left + 74.5, 81], 149, 2, { fill: { color: 'secondary', alpha: 0.6 } }),
        row(
          'r',
          '=',
          dec(lang, '0.00006'),
          rowY[2],
          (i) => (i < 6 ? 'secondary' : 'result'),
          (i) => (i < 6 ? 0.5 : 1),
          show(phase >= 2),
        ),
        text('valid', bk(lang, 'Gültige Ziffern: 6 → 1', 'Valid digits: 6 → 1'), [left, 21.5], {
          anchor: 'left',
          size: 14,
          weight: 'bold',
          color: phase >= 3 ? 'warning' : 'secondary',
          opacity: show(phase >= 2),
        }),
      ];
    },
  };
};

const ieeeLayout = (lang: Lang): FigureSpec => {
  const window = ptWindow(1.7);
  const segments: { symbol: string; bits: string; x: number; w: number; color: ColorName; phase: number; value: string }[] = [
    { symbol: 's', bits: '1 Bit', x: 8, w: 28, color: 'warning', phase: 1, value: '1' },
    { symbol: 'E', bits: '11 Bit', x: 36, w: 80, color: 'second', phase: 2, value: '10000000001' },
    { symbol: 'f', bits: '52 Bit', x: 116, w: 216, color: 'first', phase: 3, value: '1010000000…0' },
  ];
  const formula = (phase: number) =>
    phase === 4
      ? `x = (−1)¹ · (${dec(lang, '1.101')})₂ · 2^(1025 − 1023) = ${dec(lang, '−6.5')}`
      : `x = (−1)ˢ · (${lang === 'en' ? '1.f' : '1,f'})₂ · 2^(E − 1023)`;
  return {
    window,
    showGrid: false,
    aspectRatio: 1.7,
    textReferenceWidth: PT_WIDTH,
    scene: (phase) => [
      segments.map((seg, i) => {
        const active = phase === seg.phase || phase === 4;
        const cx = seg.x + seg.w / 2;
        return [
          rect(`box${i}`, [cx, 145], seg.w, 46, {
            fill: active ? { color: seg.color, alpha: 0.3 } : { color: 'secondary', alpha: 0.12 },
            stroke: active ? { color: seg.color, width: 1.5 } : { color: 'secondary', alpha: 0.5, width: 1.5 },
          }),
          text(`sym${i}`, seg.symbol, [cx, 145], { size: 18, weight: 'bold', italic: true, color: active ? seg.color : 'secondary' }),
          text(`bits${i}`, seg.bits, [cx, 100.5], {
            size: 12,
            color: phase >= seg.phase ? seg.color : 'secondary',
            alpha: phase >= seg.phase ? 1 : 0.4,
          }),
          mono(`val${i}`, seg.value, [cx, 71], i === 1 ? 11 : 13, { weight: 'semibold', color: seg.color, opacity: show(phase === 4) }),
        ];
      }),
      // Swift: `.minimumScaleFactor(0.6)` – die lange Beispielzeile wird kleiner gesetzt
      text('formula', formula(phase), [PT_WIDTH / 2, 40.5], { font: 'serif', size: phase === 4 ? 10 : 13, opacity: show(phase >= 3) }),
    ],
  };
};

const swallowedSummand = (lang: Lang): FigureSpec => {
  const window = ptWindow(1.5);
  const sep = lang === 'en' ? '.' : ',';
  const left = 47;
  const cellX = (i: number) => left + 30 + 13 + 26 * i;
  const rowA = ['1', sep, '0', '0', '', ''];
  const rowB0 = ['4', sep, '0', '0', '', ''];
  const rowB1 = ['0', sep, '0', '0', '4', ''];
  const rowS = ['1', sep, '0', '0', '4', ''];
  const rowR = ['1', sep, '0', '0', '', ''];
  const digitRow = (key: string, sign: string, digits: string[], exp: string, highlight: number, color: ColorName, y: number, opacity = 1) => [
    mono(`${key}.sign`, sign, [left + 15, y], 22, { color: 'secondary', opacity }),
    digits.map((d, i) => mono(`${key}.${i}`, d, [cellX(i), y], 24, { color: i === highlight ? 'warning' : color, opacity })),
    text(`${key}.exp`, `· 10${exp}`, [left + 30 + 156, y], { anchor: 'left', font: 'serif', size: 18, color: 'secondary', opacity }),
  ];
  return {
    window,
    showGrid: false,
    aspectRatio: 1.5,
    textReferenceWidth: PT_WIDTH,
    scene: (phase) => [
      rect('box', [129, 130.5], 110, 174, { radius: 6, stroke: { color: 'first', width: 2, dash: [5, 4] } }),
      digitRow('a', ' ', rowA, '³', -1, 'primary', 194.5),
      digitRow('b', '+', phase >= 1 ? rowB1 : rowB0, phase >= 1 ? '³' : '⁰', phase >= 1 ? 4 : 0, 'second', 146.5),
      rect('rule', [left + 123, 116.5], 246, 2, { fill: { color: 'secondary', alpha: 0.6 } }),
      digitRow('s', '=', phase >= 3 ? rowR : rowS, '³', phase === 2 ? 4 : -1, 'result', 86.5, show(phase >= 2)),
      text(
        'note',
        phase >= 3 ? bk(lang, 'Ergebnis: 1000 – die 4 ist verloren', 'Result: 1000 – the 4 is lost') : bk(lang, 'Platz für 3 Ziffern', 'room for 3 digits'),
        [left, 21.5],
        { anchor: 'left', size: 13, weight: 'bold', color: phase >= 3 ? 'warning' : 'first' },
      ),
    ],
  };
};

// ---------------------------------------------------------------------------
// 4.2 Kondition, Differenzenquotient, Subtraktion, Rekursion

const conditionAmplifier: FigureSpec = (() => {
  const window = W(-1.2, 2.4, -0.8, 2.8);
  const u0 = 0.6;
  const delta = 0.25;
  const hBand = (key: string, center: number, eps: number, color: ColorName, opacity: number) =>
    rectXY(key, window.xMin, center - eps, window.xMax, center + eps, { fill: { color, alpha: 0.15 }, opacity });
  return {
    window,
    scene: (phase) => [
      rectXY('input', u0 - delta, window.yMin, u0 + delta, window.yMax, { fill: { color: 'first', alpha: 0.13 } }),
      graph('sqrt', window, (x) => 0.5 * x, -1.2, 2.4, graphStroke('result'), { opacity: show(phase === 1 || phase === 3) }),
      graph('cube', window, (x) => 3 * x, -1.2, 2.4, graphStroke('warning'), { opacity: show(phase === 2 || phase === 3) }),
      hBand('outSqrt', 0.5 * u0, 0.5 * delta, 'result', show(phase === 1)),
      hBand('outCube', 3 * u0, 3 * delta, 'warning', show(phase === 2)),
      text('kHalf', 'κ = ½', [1.9, 1.15], { color: 'result', size: 14, weight: 'bold', opacity: show(phase === 1 || phase === 3) }),
      text('kThree', 'κ = 3', [0.9, 2.45], { color: 'warning', size: 14, weight: 'bold', opacity: show(phase === 2 || phase === 3) }),
      text('lnx', 'ln x', [2.1, -0.35], { color: 'secondary', size: 12, weight: 'regular', italic: true }),
      text('lnf', 'ln f', [-0.8, 2.55], { color: 'secondary', size: 12, weight: 'regular', italic: true }),
    ],
  };
})();

const differenceQuotientError = (lang: Lang): FigureSpec => {
  const window = W(-16.5, 0.5, -10.5, 0.5);
  return {
    window,
    scene: (phase) => [
      graph('trunc', window, (t) => Math.log10(1.36 * 10 ** t), -16.5, 0, graphStroke('second', 2.5, phase >= 2)),
      graph('round', window, (t) => Math.log10(3e-16 * 10 ** -t), -16.5, 0, graphStroke('warning', 2.5, phase >= 2), { opacity: show(phase >= 1) }),
      graph('total', window, (t) => Math.log10(1.36 * 10 ** t + 3e-16 * 10 ** -t), -16.5, 0, graphStroke('first', 3.5), { opacity: show(phase >= 2) }),
      dot('min', [-7.8, -7.4], 'result', { opacity: show(phase >= 2) }),
      text('minL', 'h ≈ 10⁻⁸', [-7.8, -8.6], { color: 'result', size: 13, weight: 'bold', opacity: show(phase >= 2) }),
      text('truncL', bk(lang, 'Verfahren', 'truncation'), [-3.0, -1.6], { color: 'second', size: 12, weight: 'bold' }),
      text('roundL', bk(lang, 'Rundung', 'rounding'), [-13.2, -2.3], { color: 'warning', size: 12, weight: 'bold', opacity: show(phase >= 1) }),
      text('axis', 'log h', [-1.6, -9.8], { color: 'secondary', size: 12, weight: 'regular', italic: true }),
    ],
  };
};

const subtractionZoom = (lang: Lang): FigureSpec => {
  const topY = 0.7;
  const botY = 0.26;
  const topX = (v: number) => 0.06 + (0.88 * v) / 1.1;
  const botX = (v: number) => 0.06 + (0.88 * v) / 0.025;
  const axis = (key: string, y: number, ticks: number[], xOf: (v: number) => number): SceneEl[] => [
    path(
      `${key}.line`,
      [
        [
          [0.04, y],
          [0.96, y],
        ],
        ...ticks.map((v): Pt[] => [
          [xOf(v), y - 0.025],
          [xOf(v), y + 0.025],
        ]),
      ],
      { stroke: { color: 'secondary', alpha: 0.7, width: 1.5 } },
    ),
    ...ticks.map((v, i) => text(`${key}.t${i}`, dec(lang, String(v)), [xOf(v), y - 0.08], { color: 'secondary', size: 12, weight: 'regular' })),
  ];
  return {
    window: W(0, 1, 0, 1),
    showGrid: false,
    aspectRatio: 1.5,
    scene: (phase) => [
      axis('top', topY, [0, 0.5, 1], topX),
      dot('x', [topX(1.01), topY], 'first'),
      dot('xt', [topX(1.0201), topY], 'second', { opacity: 0.85 }),
      text('gap', bk(lang, 'Abstand ≈ 1 % der Zahl', 'gap ≈ 1 % of the number'), [0.62, topY + 0.12], {
        color: 'second',
        size: 13,
        weight: 'bold',
        opacity: show(phase >= 1),
      }),
      fade(
        show(phase >= 2),
        axis('bot', botY, [0, 0.01, 0.02], botX),
        segment('result', [botX(0), botY + 0.07], [botX(0.01), botY + 0.07], { color: 'first', width: 4, cap: 'round' }, { opacity: show(phase >= 3) }),
        segment('dist', [botX(0.01), botY + 0.13], [botX(0.0201), botY + 0.13], { color: 'warning', width: 4, cap: 'round' }, { opacity: show(phase >= 3) }),
        text('resultL', bk(lang, 'Ergebnis', 'result'), [botX(0.005), botY + 0.13], { color: 'first', size: 12, weight: 'bold', opacity: show(phase >= 3) }),
        text('distL', bk(lang, 'Abstand', 'gap'), [botX(0.015), botY + 0.19], { color: 'warning', size: 12, weight: 'bold', opacity: show(phase >= 3) }),
        dot('fx', [botX(0.01), botY], 'first'),
        dot('fxt', [botX(0.0201), botY], 'second'),
        text('minus', '− 1', [0.5, 0.5], { color: 'secondary', size: 16, weight: 'bold' }),
      ),
    ],
  };
};

const recursionBlowup = (lang: Lang): FigureSpec => {
  const exact = [
    0.63212, 0.36788, 0.26424, 0.20728, 0.17089, 0.14553, 0.1268, 0.11238, 0.10093, 0.09161, 0.08388, 0.07735, 0.07177, 0.06695, 0.06273, 0.05902,
    0.05572, 0.05277, 0.05012, 0.04772, 0.04554,
  ];
  const forward = [
    0.63212, 0.36788, 0.26424, 0.20728, 0.17089, 0.14553, 0.1268, 0.11238, 0.10093, 0.09161, 0.08388, 0.07735, 0.07177, 0.06695, 0.06273, 0.05903,
    0.05546, 0.05719, -0.02945, 1.55962, -30.19239,
  ];
  const ring = { color: 'warning' as const, width: 2 };
  return {
    window: W(-1.2, 21.2, -0.22, 0.78),
    scene: (phase) => [
      path(
        'axis',
        [
          [
            [-0.5, 0],
            [20.8, 0],
          ],
          ...[0, 5, 10, 15, 20].map((n): Pt[] => [
            [n, -0.015],
            [n, 0.015],
          ]),
        ],
        { stroke: { color: 'secondary', alpha: 0.6, width: 1.2 } },
      ),
      [0, 5, 10, 15, 20].map((n) => text(`t${n}`, `${n}`, [n, -0.06], { color: 'secondary', size: 11, weight: 'regular' })),
      text('n', 'n', [20.6, 0.05], { color: 'secondary', size: 12, weight: 'regular', italic: true }),
      dots(
        'exact',
        exact.map((y, n): Pt => [n, y]),
        5,
        'first',
      ),
      dots(
        'fwdGood',
        forward.slice(0, 15).map((y, n): Pt => [n, y]),
        7,
        'warning',
        { fill: undefined, stroke: ring, opacity: show(phase >= 1) },
      ),
      dots(
        'fwdBad',
        forward.slice(15, 19).map((y, n): Pt => [n + 15, y]),
        7,
        'warning',
        { fill: undefined, stroke: ring, opacity: show(phase >= 2) },
      ),
      arrow('up', [19, 0.45], [19, 0.74], 'warning', { width: 2.5, opacity: show(phase >= 3) }),
      text('upL', dec(lang, '1.56'), [17.3, 0.68], { color: 'warning', size: 13, weight: 'bold', opacity: show(phase >= 3) }),
      arrow('down', [20, -0.05], [20, -0.21], 'warning', { width: 2.5, opacity: show(phase >= 3) }),
      text('downL', dec(lang, '−30.2'), [17.8, -0.16], { color: 'warning', size: 13, weight: 'bold', opacity: show(phase >= 3) }),
    ],
  };
};

// ---------------------------------------------------------------------------
// 4.3 Elimination, Zeilentausch, Rückwärtseinsetzen

const eliminationSweep = (lang: Lang): FigureSpec => {
  const window = ptWindow(1.9);
  const a = [
    [
      ['2', '1', '1'],
      ['4', '3', '3'],
      ['8', '7', '9'],
    ],
    [
      ['2', '1', '1'],
      ['0', '1', '1'],
      ['0', '3', '5'],
    ],
    [
      ['2', '1', '1'],
      ['0', '1', '1'],
      ['0', '0', '2'],
    ],
  ];
  const l = [
    [
      ['1', '', ''],
      ['', '1', ''],
      ['', '', '1'],
    ],
    [
      ['1', '', ''],
      ['2', '1', ''],
      ['4', '', '1'],
    ],
    [
      ['1', '', ''],
      ['2', '1', ''],
      ['4', '3', '1'],
    ],
  ];
  const rowY = [107, 79, 51];
  const matrix = (key: string, rows: string[][], x0: number, color: (i: number, j: number) => ColorName): SceneEl[] => [
    brackets(`${key}.br`, x0, x0 + 124, 37, 121),
    ...rows.flatMap((row, i) => row.map((v, j) => mono(`${key}.${i}${j}`, v, [x0 + 26 + 36 * j, rowY[i]], 16, { weight: 'semibold', color: color(i, j) }))),
  ];
  return {
    window,
    showGrid: false,
    aspectRatio: 1.9,
    textReferenceWidth: PT_WIDTH,
    scene: (phase) => {
      const p = Math.min(phase, 3);
      const aColor = (i: number, j: number): ColorName => {
        if (p === 1 && j === 0 && i >= 1) return 'result';
        if (p === 2 && i === 2 && j === 1) return 'result';
        if (p === 3 && j >= i) return 'first';
        return 'primary';
      };
      const lColor = (i: number, j: number): ColorName => {
        const factor = (i === 1 && j === 0) || (i === 2 && j === 0) || (i === 2 && j === 1 && p >= 2);
        return p >= 1 && factor ? 'second' : 'secondary';
      };
      return [
        text('aTitle', p >= 2 ? bk(lang, 'R', 'U') : 'A', [84, 133.5], { font: 'serif', size: 14, weight: 'bold', color: 'first' }),
        matrix('a', a[Math.min(p, 2)], 22, aColor),
        text('op', p === 3 ? '=' : '→', [170, 89.5], { size: 20, weight: 'regular', color: 'secondary' }),
        text('lTitle', 'L', [256, 133.5], { font: 'serif', size: 14, weight: 'bold', color: 'second' }),
        matrix('l', l[Math.min(p, 2)], 194, lColor),
      ];
    },
  };
};

const pivotSwap: FigureSpec = (() => {
  const window = ptWindow(1.9);
  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '10'],
  ];
  const factor = (r: number, phase: number) => {
    if (phase === 0) return r === 1 ? 'l = 4' : r === 2 ? 'l = 7' : '';
    if (phase === 3) return r === 1 ? 'l = 4/7' : r === 0 ? 'l = 1/7' : '';
    return '';
  };
  return {
    window,
    showGrid: false,
    aspectRatio: 1.9,
    textReferenceWidth: PT_WIDTH,
    scene: (phase) => {
      const swapped = phase >= 2;
      const position = swapped ? [2, 1, 0] : [0, 1, 2];
      return rows.map((row, r) => {
        const y = 89.5 - (position[r] - 1) * 36;
        const pivotRow = phase >= 1 && r === 2;
        return [
          rect(`bg${r}`, [170, y], 192, 32, { radius: 6, fill: { color: 'result', alpha: pivotRow ? 0.18 : 0 } }),
          row.map((v, c) =>
            mono(`c${r}${c}`, v, [96 + 44 * c, y], 18, {
              weight: 'semibold',
              color: c === 0 ? (pivotRow ? 'result' : 'first') : 'primary',
            }),
          ),
          text(`f${r}`, factor(r, phase), [206, y], {
            anchor: 'left',
            weight: 'bold',
            color: phase === 0 ? 'warning' : 'result',
            opacity: show(phase === 0 || phase === 3) * show(!(r === 2 && phase === 3) && !(r === 0 && phase === 0)),
          }),
        ];
      });
    },
  };
})();

const backSubstitution: FigureSpec = (() => {
  const window = ptWindow(1.8);
  const r = [
    ['2', '1', '1'],
    ['0', '1', '1'],
    ['0', '0', '2'],
  ];
  const b = ['4', '2', '2'];
  const rowY = [122.5, 94.5, 66.5];
  return {
    window,
    showGrid: false,
    aspectRatio: 1.8,
    textReferenceWidth: PT_WIDTH,
    scene: (phase) => {
      const active = phase === 0 ? -1 : 3 - phase;
      return [
        brackets('rBr', 47, 159, 52.5, 136.5),
        r.map((row, i) =>
          row.map((v, j) =>
            mono(`r${i}${j}`, v, [71 + 32 * j, rowY[i]], 16, {
              weight: 'semibold',
              color: j < i ? 'secondary' : i === active ? 'second' : 'primary',
              alpha: j < i ? 0.45 : 1,
            }),
          ),
        ),
        brackets('xBr', 167, 217, 52.5, 136.5),
        [0, 1, 2].map((i) =>
          mono(`x${i}`, phase >= 3 - i ? '1' : `x${['₁', '₂', '₃'][i]}`, [192, rowY[i]], 16, {
            weight: 'semibold',
            color: phase >= 3 - i ? 'result' : 'first',
          }),
        ),
        text('eq', '=', [232, 94.5], { size: 20, weight: 'regular', color: 'secondary' }),
        brackets('bBr', 240, 286, 52.5, 136.5),
        b.map((v, i) => mono(`b${i}`, v, [263, rowY[i]], 16, { weight: 'semibold', color: i === active ? 'second' : 'primary' })),
      ];
    },
  };
})();

// ---------------------------------------------------------------------------
// 4.4 Normen, Kondition linearer Systeme

const normUnitBalls = (lang: Lang): FigureSpec => {
  const diamond: Pt[] = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
  ];
  return {
    window: W(-1.6, 1.6, -1.6, 1.6),
    aspectRatio: 1.15,
    scene: (phase) => [
      polygon('diamond', diamond, {
        fill: { color: 'first', alpha: 0.25 },
        stroke: graphStroke('first', 3),
        opacity: show(phase === 0 || phase === 3),
      }),
      circle('circle', ORIGIN, 1, { fill: { color: 'second', alpha: 0.18 }, stroke: graphStroke('second', 3), opacity: show(phase === 1 || phase === 3) }),
      rectXY('square', -1, -1, 1, 1, { fill: { color: 'extra', alpha: 0.12 }, stroke: graphStroke('extra', 3), opacity: show(phase >= 2) }),
      text('n1', '‖x‖₁ ≤ 1', [0, 0.3], { color: 'first', size: 13, weight: 'bold', opacity: show(phase === 0) }),
      text('n2', '‖x‖₂ ≤ 1', [0, -0.35], { color: 'second', size: 13, weight: 'bold', opacity: show(phase === 1) }),
      text('nInf', '‖x‖∞ ≤ 1', [0, 1.25], { color: 'extra', size: 13, weight: 'bold', opacity: show(phase === 2) }),
      dot('p', [0.6, 0.8], 'warning', { opacity: show(phase === 3) }),
      text('pL', lang === 'en' ? '(0.6, 0.8)' : '(0,6; 0,8)', [0.95, 1.15], { color: 'warning', size: 12, weight: 'bold', opacity: show(phase === 3) }),
    ],
  };
};

const illConditionedLines: FigureSpec = (() => {
  const window = W(-0.5, 2.5, -0.5, 2.5);
  return {
    window,
    scene: (phase) => [
      graph('l1', window, (x) => 2 - x, -0.5, 2.5, graphStroke('first', 3)),
      graph('l2', window, (x) => (2.1 - x) / 1.1, -0.5, 2.5, graphStroke('second', 3), { opacity: show(phase < 2) }),
      graph('l2old', window, (x) => (2.1 - x) / 1.1, -0.5, 2.5, graphStroke('second', 2, true, 0.35), { opacity: show(phase >= 2) }),
      graph('l2new', window, (x) => (2.2 - x) / 1.1, -0.5, 2.5, graphStroke('warning', 3), { opacity: show(phase >= 1) }),
      dot('s', [1, 1], 'result'),
      text('sL', '(1, 1)', [1.0, 0.7], { color: 'result', size: 13, weight: 'bold' }),
      arrow('move', [1, 1], [0.05, 1.95], 'warning', { width: 2.5, dashed: true, opacity: show(phase >= 2) }),
      dot('t', [0, 2], 'warning', { opacity: show(phase >= 2) }),
      text('tL', '(0, 2)', [0.4, 2.2], { color: 'warning', size: 13, weight: 'bold', opacity: show(phase >= 2) }),
    ],
  };
})();

const unitCircleImage = (lang: Lang): FigureSpec => {
  const image = (a: number, b: number, c: number, d: number): Pt[] =>
    Array.from({ length: 121 }, (_, k) => {
      const t = (k / 120) * 2 * Math.PI;
      return [a * Math.cos(t) + b * Math.sin(t), c * Math.cos(t) + d * Math.sin(t)] as Pt;
    });
  const s = 1 / Math.sqrt(2);
  return {
    window: W(-3.2, 3.2, -3.2, 3.2),
    scene: (phase) => [
      polygon('unit', image(1, 0, 0, 1), { stroke: { color: 'first', width: 2.5 } }),
      polygon('good', image(2, 1, 1, 2), { stroke: { color: 'result', width: 3 }, opacity: show(phase >= 1 && phase <= 3) }),
      polygon('bad', image(1, 0.9, 0.9, 1), { stroke: { color: 'warning', width: 3 }, opacity: show(phase === 4) }),
      fade(
        show(phase >= 2 && phase <= 3),
        arrow('major', ORIGIN, [3 * s, 3 * s], 'second'),
        arrow('minor', ORIGIN, [s, -s], 'extra'),
        mathLabel('majorL', '3', [1.6, 1.6], 'second', [-14, -10]),
        mathLabel('minorL', '1', [0.7, -0.7], 'extra', [12, 6]),
      ),
      fade(
        show(phase === 4),
        arrow('major2', ORIGIN, [1.9 * s, 1.9 * s], 'second'),
        arrow('minor2', ORIGIN, [0.1 * s, -0.1 * s], 'extra', { width: 2 }),
        mathLabel('major2L', dec(lang, '1.9'), [1.1, 1.1], 'second', [-18, -10]),
        mathLabel('minor2L', dec(lang, '0.1'), [0.3, -0.3], 'extra', [16, 8]),
      ),
      text('cond3', 'cond₂ = 3', [-1.9, 2.7], { color: 'result', weight: 'bold', opacity: show(phase === 3) }),
      text('cond19', 'cond₂ = 19', [-1.9, 2.7], { color: 'warning', weight: 'bold', opacity: show(phase === 4) }),
    ],
  };
};

// ---------------------------------------------------------------------------
// 4.5 Ausgleichsgerade und Householder

const leastSquaresFit = (lang: Lang): FigureSpec => {
  const window = W(-0.5, 3.6, -0.4, 5.0);
  const pts: Pt[] = [
    [0, 1],
    [1, 2],
    [2, 2],
    [3, 4],
  ];
  const c0s = [2, 2, 1, 0.9];
  const c1s = [0, 0, 0.5, 0.9];
  return {
    window,
    aspectRatio: 1.2,
    scene: (phase) => {
      const k = Math.min(phase, 3);
      const fit = (x: number) => c0s[k] + c1s[k] * x;
      return [
        path(
          'residuals',
          pts.map((p): Pt[] => [p, [p[0], fit(p[0])]]),
          { stroke: { color: 'warning', width: 2.2, dash: [4, 3] }, opacity: show(phase >= 1) },
        ),
        segment('line', [window.xMin, fit(window.xMin)], [window.xMax, fit(window.xMax)], graphStroke(phase === 3 ? 'result' : 'second', 3), {
          opacity: show(phase >= 1),
        }),
        pts.map((p, i) => dot(`p${i}`, p, 'first')),
        text('sum', `Σ r² = ${dec(lang, ['', '5', '2.5', '0.7'][k])}`, [0.8, 4.5], {
          color: phase === 3 ? 'result' : 'warning',
          size: 14,
          weight: 'bold',
          opacity: show(phase >= 1),
        }),
      ];
    },
  };
};

const householderReflection = (lang: Lang): FigureSpec => {
  const window = W(-6.5, 6.5, -3, 5.5);
  return {
    window,
    aspectRatio: 1.5,
    scene: (phase) => [
      graph('mirror', window, (x) => -2 * x, -2.4, 2.8, graphStroke('extra', 2.2, true), { opacity: show(phase >= 1) }),
      text('mirrorL', bk(lang, 'Spiegelachse', 'mirror axis'), [2.5, -2.4], { color: 'extra', size: 12, weight: 'bold', opacity: show(phase >= 1) }),
      arrow('v', ORIGIN, [4, 2], 'warning', { width: 3, opacity: show(phase === 1) }),
      text('vL', 'v', [4.3, 2.5], { color: 'warning', size: 14, weight: 'bold', italic: true, opacity: show(phase === 1) }),
      arrow('x', ORIGIN, phase >= 2 ? [-5, 0] : [3, 4], phase >= 2 ? 'result' : 'first', { width: 3.5 }),
      arrow('xGhost', ORIGIN, [3, 4], 'first', { alpha: 0.35, width: 2, dashed: true, opacity: show(phase >= 2) }),
      text('xL', 'x', [3.4, 4.3], { color: 'first', size: 14, weight: 'bold', italic: true }),
      text('HxL', 'Hx', [-5, 0.6], { color: 'result', size: 14, weight: 'bold', italic: true, opacity: show(phase >= 2) }),
      dot('o', ORIGIN, 'primary'),
    ],
  };
};

// ---------------------------------------------------------------------------
// 4.6 Jacobi und Gauß-Seidel

const jacobiZigzag = (lang: Lang): FigureSpec => {
  const window = W(-0.05, 0.45, -0.05, 0.45);
  const jacobi: Pt[] = [
    [0, 0],
    [0.25, 0.4],
    [0.15, 0.3],
    [0.175, 0.34],
    [0.165, 0.33],
  ];
  const seidel: Pt[] = [
    [0, 0],
    [0.25, 0],
    [0.25, 0.3],
    [0.175, 0.3],
    [0.175, 0.33],
    [0.1675, 0.33],
    [0.1675, 0.333],
  ];
  return {
    window,
    scene: (phase) => {
      const showJacobi = show(phase === 1 || phase === 3);
      return [
        graph('eq1', window, (x) => 1 - 4 * x, -0.05, 0.45, graphStroke('first', 2.5)),
        graph('eq2', window, (x) => (2 - 2 * x) / 5, -0.05, 0.45, graphStroke('extra', 2.5)),
        dot('solution', [1 / 6, 1 / 3], 'result'),
        text('solutionL', 'x*', [0.2, 0.37], { color: 'result', size: 13, weight: 'bold', italic: true }),
        polyline('jacobi', jacobi, { color: 'warning', width: 2, cap: 'round', join: 'round', dash: [5, 3] }, { opacity: showJacobi }),
        dots('jacobiDots', jacobi, 3.5, 'warning', { opacity: showJacobi }),
        polyline('seidel', seidel, { color: 'second', width: 2.4, cap: 'round', join: 'round' }, { opacity: show(phase >= 2) }),
        dots('seidelDots', seidel, 3, 'second', { opacity: show(phase >= 2) }),
        text('jacobiL', 'Jacobi', [0.32, 0.41], { color: 'warning', size: 12, weight: 'bold', opacity: showJacobi }),
        text('seidelL', bk(lang, 'Gauß-Seidel', 'Gauss–Seidel'), [0.34, 0.03], { color: 'second', size: 12, weight: 'bold', opacity: show(phase >= 2) }),
        dot('start', ORIGIN, 'primary'),
      ];
    },
  };
};

// ---------------------------------------------------------------------------
// 4.7 Bisektion und Spinnwebdiagramm

const bisectionInterval = (lang: Lang): FigureSpec => {
  const window = W(0.85, 2.15, -3.6, 4.6);
  const f = (x: number) => x * x * x - x - 2;
  const intervals: [number, number][] = [
    [1, 2],
    [1.5, 2],
    [1.5, 1.75],
    [1.5, 1.625],
  ];
  const mids = [1.5, 1.75, 1.625];
  const fvals = ['−0.125', '1.609', '0.666'];
  return {
    window,
    scene: (phase) => [
      graph('f', window, f, 0.85, 2.15, graphStroke('first')),
      intervals.map(([a, b], k) => {
        const current = k === Math.min(phase, 3);
        const y = -0.9 - 0.7 * k;
        return rectXY(`iv${k}`, a, y - 0.2, b, y + 0.2, {
          fill: current ? { color: 'second', alpha: 0.85 } : { color: 'secondary', alpha: 0.35 },
          opacity: show(phase >= k),
        });
      }),
      mids.map((m, k) => {
        const visible = show(phase === k + 1);
        return [
          segment(`drop${k}`, [m, -3.4], [m, f(m)], { color: 'result', width: 1.5, dash: [4, 3] }, { opacity: visible }),
          dot(`mid${k}`, [m, f(m)], 'result', { opacity: visible }),
          text(`midL${k}`, `f = ${dec(lang, fvals[k])}`, [m + (k === 1 ? -0.25 : 0.22), f(m) + (k === 0 ? -0.5 : 0.6)], {
            color: 'result',
            size: 12,
            weight: 'bold',
            opacity: visible,
          }),
        ];
      }),
      dot('root', [1.5214, 0], 'warning'),
      text('rootL', 'x*', [1.5214, 0.45], { color: 'warning', size: 13, weight: 'bold', italic: true }),
    ],
  };
};

const cobwebFixedPoint: FigureSpec = (() => {
  const window = W(0, 1.3, 0, 1.3);
  const steps = [0, 2, 4, 12];
  const cobweb = (n: number): Pt[] => {
    const pts: Pt[] = [[1, 0]];
    let x = 1;
    for (let i = 0; i < n; i++) {
      const y = Math.cos(x);
      pts.push([x, y], [y, y]);
      x = y;
    }
    return pts;
  };
  return {
    window,
    scene: (phase) => [
      graph('cos', window, Math.cos, 0, 1.3, graphStroke('first')),
      graph('diag', window, (x) => x, 0, 1.3, graphStroke('secondary', 1.8)),
      polyline('web', cobweb(steps[Math.min(phase, 3)]), { color: 'second', width: 1.8, cap: 'round', join: 'round' }),
      dot('fix', [0.739085, 0.739085], 'result'),
      text('fixL', 'x*', [0.8, 0.68], { color: 'result', size: 13, weight: 'bold', italic: true }),
      text('diagL', 'y = x', [1.15, 1.22], { color: 'secondary', size: 12 }),
      text('cosL', 'y = cos x', [0.2, 0.88], { color: 'first', size: 12 }),
      dot('x0', [1, 0], 'second'),
      text('x0L', 'x₀', [1, -0.09], { color: 'second', size: 12, weight: 'bold', italic: true }),
    ],
  };
})();

// ---------------------------------------------------------------------------
// 4.8 Newton im Zweidimensionalen

const newton2D: FigureSpec = (() => {
  const window = W(0, 3.4, 0, 2.7);
  const iterates: Pt[] = [
    [3, 0.2],
    [2.147321, 0.390179],
    [1.949347, 0.501669],
    [1.932045, 0.517445],
    [1.931852, 0.517638],
  ];
  return {
    window,
    aspectRatio: 1.25,
    scene: (phase) => [
      graph('circle', window, (x) => Math.sqrt(Math.max(0, 4 - x * x)), 0, 2, graphStroke('first', 3)),
      graph('hyperbola', window, (x) => 1 / x, 0.35, 3.4, graphStroke('extra', 3)),
      text('circleL', 'x² + y² = 4', [0.75, 2.2], { color: 'first', size: 12, weight: 'bold' }),
      text('hyperbolaL', 'xy = 1', [2.9, 0.65], { color: 'extra', size: 12, weight: 'bold' }),
      graph('tCircle', window, (z) => (13.04 - 6 * z) / 0.4, 0, 3.4, graphStroke('first', 1.6, true, 0.6), { opacity: show(phase >= 1 && phase <= 2) }),
      graph('tHyperbola', window, (z) => (1.6 - 0.2 * z) / 3, 0, 3.4, graphStroke('extra', 1.6, true, 0.6), { opacity: show(phase >= 1 && phase <= 2) }),
      [0, 1, 2, 3].map((k) =>
        arrow(`step${k}`, iterates[k], iterates[k + 1], 'second', { width: 2.2, opacity: show((k === 0 && phase >= 2) || (k >= 1 && phase >= 3)) }),
      ),
      iterates.map((p, k) =>
        dot(`it${k}`, p, k === 0 ? 'primary' : 'second', { opacity: show((k === 0 && phase >= 1) || (k === 1 && phase >= 2) || (k >= 2 && phase >= 3)) }),
      ),
      text('x0', 'x₀', [3.05, 0.42], { size: 13, weight: 'bold', italic: true, opacity: show(phase >= 1) }),
      text('x1', 'x₁', [2.2, 0.18], { color: 'second', size: 13, weight: 'bold', italic: true, opacity: show(phase >= 2) }),
      dot('solution', [1.93185, 0.51764], 'result'),
    ],
  };
})();

// ---------------------------------------------------------------------------
// 4.9 Lagrange-Basis und Runge-Phänomen

const lagrangeEval = (nodes: number[], values: number[], x: number) => {
  let sum = 0;
  nodes.forEach((xi, i) => {
    let l = 1;
    nodes.forEach((xj, j) => {
      if (j !== i) l *= (x - xj) / (xi - xj);
    });
    sum += values[i] * l;
  });
  return sum;
};

const lagrangeBasis: FigureSpec = (() => {
  const window = W(-0.5, 2.5, -1.6, 4.2);
  const nodes = [0, 1, 2];
  const values = [1, 3, 2];
  const colors: ColorName[] = ['first', 'second', 'extra'];
  return {
    window,
    scene: (phase) => [
      nodes.map((_, i) =>
        graph(
          `L${i}`,
          window,
          (x) => {
            let l = 1;
            nodes.forEach((xj, j) => {
              if (j !== i) l *= (x - xj) / (nodes[i] - xj);
            });
            return values[i] * l;
          },
          -0.5,
          2.5,
          graphStroke(colors[i], 2, true),
          { opacity: show(phase >= i + 1) * (phase === 4 ? 0.45 : 1) },
        ),
      ),
      graph('p', window, (x) => 1 + 3.5 * x - 1.5 * x * x, -0.5, 2.5, graphStroke('result', 3.5), { opacity: show(phase === 4) }),
      nodes.map((x, i) => dot(`node${i}`, [x, values[i]], 'primary')),
    ],
  };
})();

const rungePhenomenon = (lang: Lang): FigureSpec => {
  const window = W(-1.05, 1.05, -0.7, 1.7);
  const runge = (x: number) => 1 / (1 + 25 * x * x);
  const equidistant = (n: number) => Array.from({ length: n + 1 }, (_, i) => -1 + (2 * i) / n);
  const chebyshev = (n: number) => Array.from({ length: n + 1 }, (_, i) => Math.cos(((2 * i + 1) * Math.PI) / (2 * n + 2)));
  const variants = [equidistant(4), equidistant(8), equidistant(14), chebyshev(14)];
  return {
    window,
    aspectRatio: 1.3,
    scene: (phase) => {
      const current = Math.min(phase, 3);
      return [
        graph('f', window, runge, -1, 1, graphStroke('first', 2.5), { samples: 400 }),
        // `.id(phase)`: Polynom und Knoten werden beim Wechsel überblendet.
        variants.map((nodes, k) => {
          const values = nodes.map(runge);
          return fade(
            show(current === k),
            graph(`p${k}`, window, (x) => lagrangeEval(nodes, values, x), -1, 1, graphStroke(k === 3 ? 'result' : 'warning', 2.2), { samples: 400 }),
            dots(
              `nodes${k}`,
              nodes.map((x, i): Pt => [x, values[i]]),
              2.5,
              'primary',
            ),
          );
        }),
        text('label', current === 3 ? bk(lang, 'Tschebyscheff, n = 14', 'Chebyshev, n = 14') : `n = ${[4, 8, 14][current]}`, [0, 1.55], {
          color: current === 3 ? 'result' : 'warning',
          size: 13,
          weight: 'bold',
        }),
      ];
    },
  };
};

// ---------------------------------------------------------------------------
// 4.10 Splines

const splinePieces: FigureSpec = (() => {
  const window = W(-0.3, 3.3, -0.6, 1.7);
  const ys = [0, 1, 0, 1];
  const ms = [0, -4, 4, 0];
  const piece = (i: number, x: number) => {
    const t = x - i;
    const b = ys[i + 1] - ys[i] - (2 * ms[i] + ms[i + 1]) / 6;
    return ys[i] + b * t + (ms[i] / 2) * t * t + ((ms[i + 1] - ms[i]) / 6) * t * t * t;
  };
  const interp = (x: number) => x - x * (x - 1) + ((x * (x - 1) * (x - 2)) * 2) / 3;
  const colors: ColorName[] = ['first', 'second', 'extra'];
  const pts: Pt[] = [
    [0, 0],
    [1, 1],
    [2, 0],
    [3, 1],
  ];
  return {
    window,
    aspectRatio: 1.6,
    scene: (phase) => [
      [0, 1, 2].map((i) => graph(`s${i}`, window, (x) => piece(i, x), i, i + 1, graphStroke(colors[i], 3.5), { opacity: show(phase >= i + 1) })),
      graph('poly', window, interp, 0, 3, graphStroke('secondary', 2, true), { opacity: show(phase === 4) }),
      pts.map((p, i) => dot(`p${i}`, p, 'primary')),
      [1, 2].map((k) => segment(`knot${k}`, [k, -0.45], [k, pts[k][1]], { color: 'secondary', alpha: 0.4, width: 1, dash: [3, 3] }, { opacity: show(phase >= 3) })),
    ],
  };
})();

// ---------------------------------------------------------------------------
// 4.11 Trapez gegen Simpson

const trapezoidVsSimpson = (lang: Lang): FigureSpec => {
  const window = W(-0.1, 1.1, -0.2, 3.1);
  const e = Math.E;
  const parabola = (x: number) => 2 * (x - 0.5) * (x - 1) + Math.exp(0.5) * (-4 * x * (x - 1)) + e * (2 * x * (x - 0.5));
  const sliver: Pt[] = [[0, 1], [1, e], ...Array.from({ length: 101 }, (_, i): Pt => [(100 - i) / 100, Math.exp((100 - i) / 100)])];
  const parabolaArea: Pt[] = [[0, 0], ...Array.from({ length: 161 }, (_, i): Pt => [i / 160, parabola(i / 160)]), [1, 0]];
  return {
    window,
    scene: (phase) => [
      polygon(
        'trapezoid',
        [
          [0, 0],
          [0, 1],
          [1, e],
          [1, 0],
        ],
        { fill: { color: 'second', alpha: 0.3 }, opacity: show(phase === 1) },
      ),
      polygon('sliver', sliver, { fill: { color: 'warning', alpha: 0.6 }, opacity: show(phase === 1) }),
      polygon('simpsonArea', parabolaArea, { fill: { color: 'result', alpha: 0.28 }, opacity: show(phase >= 2) }),
      graph('exp', window, Math.exp, -0.1, 1.1, graphStroke('first', 3)),
      segment('chord', [0, 1], [1, e], graphStroke('warning', 2.2), { opacity: show(phase === 1) }),
      graph('parabola', window, parabola, 0, 1, graphStroke('result', 2.2, true), { opacity: show(phase >= 2) }),
      dot('a', [0, 1], 'primary'),
      dot('b', [1, e], 'primary'),
      dot('m', [0.5, Math.exp(0.5)], 'result', { opacity: show(phase >= 2) }),
      text('T', `T = ${dec(lang, '1.8591')}`, [0.3, 2.6], { color: 'warning', size: 14, weight: 'bold', opacity: show(phase === 1) }),
      text('S', `S = ${dec(lang, '1.7189')}`, [0.3, 2.6], { color: 'result', size: 14, weight: 'bold', opacity: show(phase >= 2) }),
    ],
  };
};

// ---------------------------------------------------------------------------
// 4.12 Gerschgorin-Kreise

const gershgorinDiscs: FigureSpec = (() => {
  const discs: [number, number][] = [
    [2, 1],
    [2, 2],
    [4, 1],
  ];
  const eigenvalues: Pt[] = [
    [3.5437, 0],
    [2.2282, 1.1151],
    [2.2282, -1.1151],
  ];
  const colors: ColorName[] = ['first', 'second', 'extra'];
  return {
    window: W(-0.6, 6.2, -3.1, 3.1),
    aspectRatio: 1.05,
    scene: (phase) => [
      discs.map(([c, r], i) => [
        ellipse(`disc${i}`, [c, 0], r, r, { fill: { color: colors[i], alpha: 0.16 }, stroke: graphStroke(colors[i], 2.5), opacity: show(phase >= i + 1) }),
        dot(`center${i}`, [c, 0], colors[i], { opacity: show(phase >= i + 1) }),
      ]),
      eigenvalues.map((p, k) =>
        disc(`eig${k}`, p, 5.5, { fill: { color: 'result' }, stroke: { color: 'white', alpha: 0.9, width: 1.5 }, opacity: show(phase >= 4) }),
      ),
      text('re', 'Re', [5.8, -0.4], { color: 'secondary', size: 12, weight: 'regular', italic: true }),
      text('im', 'Im', [0.2, 2.8], { color: 'secondary', size: 12, weight: 'regular', italic: true }),
    ],
  };
})();

// ---------------------------------------------------------------------------
// 4.13 Euler-Polygon und Runge-Kutta

const eulerSteps = (lang: Lang): FigureSpec => {
  const window = W(-0.05, 1.1, 0.7, 3.0);
  const stepSizes = [0.5, 0.25, 0.1];
  const endValues = ['2.25', '2.441', '2.594'];
  const polygonFor = (h: number): Pt[] => Array.from({ length: Math.round(1 / h) + 1 }, (_, k) => [k * h, (1 + h) ** k] as Pt);
  return {
    window,
    aspectRatio: 1.25,
    scene: (phase) => [
      graph('exact', window, Math.exp, -0.05, 1.1, graphStroke('first', 3)),
      // `if phase >= 1 { … .id(phase) }`: Polygonzug je Schrittweite, überblendet
      stepSizes.map((h, k) =>
        fade(
          show(phase === k + 1),
          polyline(`poly${k}`, polygonFor(h), { color: 'second', width: 2.4, cap: 'round', join: 'round' }),
          dots(`dots${k}`, polygonFor(h), 3.5, 'second'),
          text(`end${k}`, `y(1) ≈ ${dec(lang, endValues[k])}`, [0.55, 2.65], { color: 'second', size: 14, weight: 'bold' }),
        ),
      ),
      dot('start', [0, 1], 'primary'),
      dot('e', [1, Math.E], 'result'),
      text('eL', 'e', [1.05, Math.E], { color: 'result', size: 13, weight: 'bold', italic: true }),
    ],
  };
};

const rungeKuttaStages: FigureSpec = (() => {
  const window = W(-0.1, 0.65, 0.8, 1.9);
  const slopes = [1, 1.25, 1.3125, 1.65625];
  const points: Pt[] = [
    [0, 1],
    [0.25, 1.25],
    [0.25, 1.3125],
    [0.5, 1.65625],
  ];
  const colors: ColorName[] = ['first', 'second', 'extra', 'warning'];
  const labelOffset: Pt[] = [
    [-0.04, 0.1],
    [-0.04, -0.09],
    [-0.04, 0.1],
    [0.02, 0.1],
  ];
  return {
    window,
    aspectRatio: 1.2,
    scene: (phase) => [
      graph('exact', window, Math.exp, -0.1, 0.65, graphStroke('first', 3, false, 0.7)),
      points.map((p, i) => {
        const half = 0.1;
        const visible = show(phase >= i + 1);
        return [
          segment(`k${i}`, [p[0] - half, p[1] - half * slopes[i]], [p[0] + half, p[1] + half * slopes[i]], { color: colors[i], width: 3, cap: 'round' }, { opacity: visible }),
          dot(`p${i}`, p, colors[i], { opacity: visible }),
          text(`kL${i}`, `k${['₁', '₂', '₃', '₄'][i]}`, [p[0] + labelOffset[i][0], p[1] + labelOffset[i][1]], {
            color: colors[i],
            size: 13,
            weight: 'bold',
            opacity: visible,
          }),
        ];
      }),
      segment('step', [0, 1], [0.5, 1 + 0.5 * 1.296875], { color: 'result', width: 3.5, cap: 'round' }, { opacity: show(phase === 5) }),
      dot('y1', [0.5, 1.6484375], 'result', { opacity: show(phase === 5) }),
      dot('start', [0, 1], 'primary'),
    ],
  };
})();

// ---------------------------------------------------------------------------
// 4.14 Steife Gleichung und Stabilitätsgebiete

const stiffExplosion = (lang: Lang): FigureSpec => {
  const window = W(-0.03, 0.5, -8, 8);
  const h = 0.05;
  const explicit = Array.from({ length: 10 }, (_, k): Pt => [k * h, (-1.5) ** k]);
  const implicit = Array.from({ length: 10 }, (_, k): Pt => [k * h, (1 / 3.5) ** k]);
  return {
    window,
    aspectRatio: 1.35,
    scene: (phase) => [
      graph('exact', window, (t) => Math.exp(-50 * t), 0, 0.5, graphStroke('first', 3), { samples: 400 }),
      polyline('explicit', explicit, { color: 'warning', width: 2, cap: 'round', join: 'round', dash: [5, 3] }, { opacity: show(phase === 1) }),
      dots('explicitDots', explicit, 4, 'warning', { opacity: show(phase === 1) }),
      polyline('implicit', implicit, { color: 'result', width: 2.4, cap: 'round', join: 'round' }, { opacity: show(phase >= 2) }),
      dots('implicitDots', implicit, 4, 'result', { opacity: show(phase >= 2) }),
      text('explicitL', bk(lang, 'explizit Euler', 'explicit Euler'), [0.34, 6.3], { color: 'warning', size: 12, weight: 'bold', opacity: show(phase === 1) }),
      text('implicitL', bk(lang, 'implizit Euler', 'implicit Euler'), [0.34, 1.6], { color: 'result', size: 12, weight: 'bold', opacity: show(phase >= 2) }),
      text('exactL', bk(lang, 'exakt', 'exact'), [0.1, -1.4], { color: 'first', size: 12, weight: 'bold' }),
    ],
  };
};

const stabilityRegions = (lang: Lang): FigureSpec => {
  const window = W(-4.5, 3.3, -3.2, 3.2);
  return {
    window,
    aspectRatio: 1.2,
    scene: (phase) => [
      circle('explicit', [-1, 0], 1, { fill: { color: 'first', alpha: phase >= 3 ? 0.07 : 0.28 }, stroke: graphStroke('first', 2.5, phase >= 3) }),
      region('implicit', [regionRect(window.xMin, window.yMin, window.xMax, window.yMax), regionCircle([1, 0], 1)], { color: 'result', alpha: 0.2 }, {
        rule: 'evenodd',
        opacity: show(phase >= 3),
      }),
      circle('implicitDisc', [1, 0], 1, { stroke: graphStroke('result', 2.5), opacity: show(phase >= 3) }),
      text('explicitL', bk(lang, 'explizit: stabil', 'explicit: stable'), [-1, 1.35], { color: 'first', size: 12, weight: 'bold', opacity: show(phase <= 2) }),
      text('implicitL', bk(lang, 'implizit: alles außerhalb', 'implicit: everything outside'), [-1.7, 2.6], {
        color: 'result',
        size: 12,
        weight: 'bold',
        opacity: show(phase >= 3),
      }),
      text('discL', bk(lang, 'Kreis um +1: instabil', 'disc at +1: unstable'), [1.2, -1.4], { color: 'result', size: 11, weight: 'bold', opacity: show(phase >= 3) }),
      dot('z1', [-0.5, 0], 'result', { opacity: show(phase >= 1 && phase <= 2) }),
      text('z1L', `z = ${dec(lang, '−0.5')}`, [-0.5, -0.5], { color: 'result', size: 12, weight: 'bold', opacity: show(phase >= 1 && phase <= 2) }),
      dot('z2', [-2.5, 0], phase === 3 ? 'result' : 'warning', { opacity: show(phase >= 2) }),
      text('z2L', `z = ${dec(lang, '−2.5')}`, [-2.5, 0.5], { color: phase === 3 ? 'result' : 'warning', size: 12, weight: 'bold', opacity: show(phase >= 2) }),
      text('re', 'Re z', [2.9, -0.4], { color: 'secondary', size: 12, weight: 'regular', italic: true }),
      text('im', 'Im z', [0.5, 2.9], { color: 'secondary', size: 12, weight: 'regular', italic: true }),
    ],
  };
};

export const numericsFigures = (lang: Lang): Record<string, FigureSpec> => ({
  floatNumberLine: floatNumberLine(lang),
  cancellationDigits: cancellationDigits(lang),
  conditionAmplifier,
  differenceQuotientError: differenceQuotientError(lang),
  eliminationSweep: eliminationSweep(lang),
  pivotSwap,
  bisectionInterval: bisectionInterval(lang),
  cobwebFixedPoint,
  lagrangeBasis,
  rungePhenomenon: rungePhenomenon(lang),
  trapezoidVsSimpson: trapezoidVsSimpson(lang),
  eulerSteps: eulerSteps(lang),
  rungeKuttaStages,
  normUnitBalls: normUnitBalls(lang),
  illConditionedLines,
  leastSquaresFit: leastSquaresFit(lang),
  householderReflection: householderReflection(lang),
  jacobiZigzag: jacobiZigzag(lang),
  newton2D,
  splinePieces,
  gershgorinDiscs,
  stiffExplosion: stiffExplosion(lang),
  stabilityRegions: stabilityRegions(lang),
  ieeeLayout: ieeeLayout(lang),
  swallowedSummand: swallowedSummand(lang),
  subtractionZoom: subtractionZoom(lang),
  recursionBlowup: recursionBlowup(lang),
  backSubstitution,
  unitCircleImage: unitCircleImage(lang),
});
