/**
 * Grafiken zur Analysis: Folgen und Reihen, Grenzwerte, Differential- und Integralrechnung,
 * mehrdimensionale Analysis. Quelle: Views/LessonVectorVisuals.swift („Analysis“-Abschnitte).
 */
import type { Lang } from '@/content/types';

import {
  area,
  arrow,
  circle,
  dec,
  disc,
  dot,
  dots,
  ellipse,
  fade,
  fnShape,
  fnTable,
  graph,
  graphStroke,
  hollowDot,
  line,
  mathLabel,
  path,
  polygon,
  rectXY,
  segment,
  slopeLine,
} from '../dsl';
import { ORIGIN, show, type ColorName, type FigureSpec, type PlaneWindow, type Pt, type SceneEl } from '../scene';

const W = (xMin: number, xMax: number, yMin: number, yMax: number): PlaneWindow => ({ xMin, xMax, yMin, yMax });
const sq = (x: number) => x * x;

// ---------------------------------------------------------------------------
// Folgen und Reihen

const sequenceConvergence = (lang: Lang): FigureSpec => {
  const window = W(-0.5, 15.5, -0.2, 2.2);
  const a = (n: number) => 1 + (n % 2 === 0 ? 1 : -1) / n;
  return {
    window,
    scene: (phase) => {
      const eps = phase >= 2 ? 0.1 : 0.25;
      const startN = phase >= 2 ? 11 : 5;
      return [
        rectXY('band', window.xMin, 1 - eps, window.xMax, 1 + eps, { fill: { color: 'result', alpha: 0.15 }, opacity: show(phase >= 1) }),
        segment('limit', [window.xMin, 1], [window.xMax, 1], graphStroke('result', 1.5, true)),
        Array.from({ length: 15 }, (_, k) => {
          const n = k + 1;
          return dot(`a${n}`, [n, a(n)], phase >= 1 && n >= startN ? 'result' : 'first');
        }),
        mathLabel('N', `N = ${startN}`, [startN, 0.15], 'result', [0, 0], { opacity: show(phase >= 1) }),
        mathLabel('eps', `ε = ${dec(lang, phase >= 2 ? '0.1' : '0.25')}`, [13.2, 1.55], 'result', [0, 0], { opacity: show(phase >= 1) }),
      ];
    },
  };
};

const geometricSeries: FigureSpec = (() => {
  /** Rechteck des k-ten Summanden beim abwechselnden Halbieren des Einheitsquadrats. */
  const piece = (k: number): [number, number, number, number] => {
    let x0 = 0;
    let y0 = 0;
    const x1 = 1;
    const y1 = 1;
    let result: [number, number, number, number] = [x0, y0, x1, y1];
    for (let i = 0; i <= k; i++) {
      if (i % 2 === 0) {
        const mid = (x0 + x1) / 2;
        result = [x0, y0, mid, y1];
        x0 = mid;
      } else {
        const mid = (y0 + y1) / 2;
        result = [x0, y0, x1, mid];
        y0 = mid;
      }
    }
    return result;
  };
  const colors: ColorName[] = ['first', 'second', 'result', 'extra'];
  return {
    window: W(-0.1, 1.1, -0.1, 1.1),
    showGrid: false,
    scene: (phase) => {
      const count = [1, 2, 4, 10][Math.min(phase, 3)];
      return [
        rectXY('unit', 0, 0, 1, 1, { stroke: { color: 'primary', alpha: 0.6, width: 2 } }),
        Array.from({ length: 10 }, (_, k) => {
          const [x0, y0, x1, y1] = piece(k);
          return rectXY(`piece${k}`, x0, y0, x1, y1, {
            fill: { color: colors[k % 4], alpha: 0.55 },
            stroke: { color: 'surface', width: 1.5 },
            opacity: show(k < count),
          });
        }),
        mathLabel('half', '½', [0.25, 0.5], 'primary', [0, 0]),
        mathLabel('quarter', '¼', [0.75, 0.25], 'primary', [0, 0], { opacity: show(phase >= 1) }),
        mathLabel('eighth', '⅛', [0.625, 0.75], 'primary', [0, 0], { opacity: show(phase >= 2) }),
      ];
    },
  };
})();

const seriesComparison: FigureSpec = (() => {
  const window = W(-1, 41, -0.3, 4.6);
  const harmonic: Pt[] = [];
  const basel: Pt[] = [];
  let h = 0;
  let b = 0;
  for (let n = 1; n <= 40; n++) {
    h += 1 / n;
    b += 1 / (n * n);
    harmonic.push([n, h]);
    basel.push([n, b]);
  }
  const limit = (Math.PI * Math.PI) / 6;
  return {
    window,
    scene: (phase) => [
      segment('limit', [window.xMin, limit], [window.xMax, limit], graphStroke('second', 1.5, true), { opacity: show(phase >= 1) }),
      dots('basel', basel, 3, 'second'),
      dots('harmonicStart', harmonic.slice(0, 12), 3, 'first', { opacity: show(phase >= 2) }),
      dots('harmonicRest', harmonic.slice(12), 3, 'first', { opacity: show(phase >= 3) }),
      mathLabel('limitL', 'π²/6', [36, 1.645], 'second', [0, 14], { opacity: show(phase >= 1) }),
    ],
  };
})();

// ---------------------------------------------------------------------------
// Grenzwerte

const removableHole = (lang: Lang): FigureSpec => {
  const window = W(-1, 3, -0.5, 3.5);
  const xs = [0.2, 0.6, 0.85, 0.95];
  return {
    window,
    scene: (phase) => [
      graph('f', window, (x) => x + 1, -1, 3, graphStroke('first')),
      hollowDot('hole', [1, 2], 'first'),
      xs.map((x, i) => [
        dot(`left${i}`, [x, x + 1], 'second', { opacity: show(phase >= 1) }),
        dot(`right${i}`, [2 - x, 3 - x], 'extra', { opacity: show(phase >= 2) }),
      ]),
      arrow('limit', [1, 0], [1, 1.85], 'result', { width: 1.5, dashed: true, opacity: show(phase >= 3) }),
      mathLabel('limitL', lang === 'en' ? 'limit 2' : 'Grenzwert 2', [1, 2], 'result', [-48, -14], { opacity: show(phase >= 3) }),
    ],
  };
};

const squeeze: FigureSpec = (() => {
  const window = W(-0.6, 0.6, -0.6, 0.6);
  return {
    window,
    scene: (phase) => [
      graph('f', window, (x) => (Math.abs(x) < 0.0005 ? 0 : x * Math.sin(1 / x)), -0.6, 0.6, graphStroke('first', 1.8), { samples: 1400 }),
      graph('upper', window, (x) => Math.abs(x), -0.6, 0.6, graphStroke('second', 2, true), { opacity: show(phase >= 1) }),
      graph('lower', window, (x) => -Math.abs(x), -0.6, 0.6, graphStroke('second', 2, true), { opacity: show(phase >= 1) }),
      dot('zero', ORIGIN, 'result', { opacity: show(phase >= 2) }),
    ],
  };
})();

const continuityTypes: FigureSpec = (() => {
  const window = W(-2, 2, -2, 2);
  return {
    window,
    scene: (phase) => [
      graph('square', window, sq, -2, 2, graphStroke('first'), { opacity: show(phase === 0) }),
      fade(
        show(phase === 1),
        graph('signL', window, () => -1, -2, -0.02, graphStroke('second')),
        graph('signR', window, () => 1, 0.02, 2, graphStroke('second')),
        hollowDot('holeL', [0, -1], 'second'),
        hollowDot('holeR', [0, 1], 'second'),
        dot('zero', ORIGIN, 'second'),
      ),
      fade(
        show(phase === 2),
        graph('poleL', window, (x) => 1 / x, -2, -0.01, graphStroke('warning')),
        graph('poleR', window, (x) => 1 / x, 0.01, 2, graphStroke('warning')),
      ),
      graph('osc', window, (x) => (Math.abs(x) < 0.003 ? NaN : Math.sin(1 / x)), -2, 2, graphStroke('extra', 1.5), {
        samples: 2400,
        opacity: show(phase === 3),
      }),
    ],
  };
})();

// ---------------------------------------------------------------------------
// Differentialrechnung

const secantToTangent: FigureSpec = (() => {
  const window = W(-0.5, 3.5, -1, 7);
  const hs = [2, 1, 0.5, 0.1, 0.0001];
  const table = fnTable(sq, window.xMin, window.xMax);
  return {
    window,
    scene: (phase) => {
      const h = hs[Math.min(phase, hs.length - 1)];
      return [
        graph('f', window, sq, -0.5, 3.5, graphStroke('first')),
        slopeLine('secant', window, 1, 1, 2 + h, graphStroke(phase >= 4 ? 'result' : 'second', 2)),
        disc('Q', [1 + h, sq(1 + h)], 5, { fill: { color: 'second' }, onFn: table, opacity: show(phase < 4) }),
        dot('P', [1, 1], 'result'),
        mathLabel('PL', 'P', [1, 1], 'result', [-12, -12]),
      ];
    },
  };
})();

const derivativeGraph: FigureSpec = (() => {
  const window = W(-2.5, 2.5, -3.5, 6);
  const f = (x: number) => x * x * x - 3 * x;
  return {
    window,
    scene: (phase) => [
      graph('f', window, f, -2.5, 2.5, graphStroke('first')),
      [-2, -1, 0, 1, 2].map((x, i) =>
        slopeLine(`tangent${i}`, window, x, f(x), 3 * x * x - 3, graphStroke('result', 1.5, false, 0.7), { opacity: show(phase === 1) }),
      ),
      graph('fPrime', window, (x) => 3 * x * x - 3, -2.5, 2.5, graphStroke('second'), { opacity: show(phase >= 2) }),
      dot('max', [-1, 2], 'warning', { opacity: show(phase >= 3) }),
      dot('min', [1, -2], 'warning', { opacity: show(phase >= 3) }),
      dot('root1', [-1, 0], 'second', { opacity: show(phase >= 3) }),
      dot('root2', [1, 0], 'second', { opacity: show(phase >= 3) }),
      mathLabel('fL', 'f', [2.2, f(2.2)], 'first', [12, 0]),
      mathLabel('fPrimeL', 'f′', [1.9, 3 * 1.9 * 1.9 - 3], 'second', [-16, 0], { opacity: show(phase >= 2) }),
    ],
  };
})();

const meanValue: FigureSpec = (() => {
  const window = W(-0.5, 3, -0.5, 4.5);
  return {
    window,
    scene: (phase) => [
      graph('f', window, sq, -0.5, 2.2, graphStroke('first')),
      arrow('secant', ORIGIN, [2, 4], 'second', { width: 2.5, opacity: show(phase >= 1) }),
      slopeLine('tangent', window, 1, 1, 2, graphStroke('result', 2, true), { opacity: show(phase >= 2) }),
      dot('xi', [1, 1], 'result', { opacity: show(phase >= 2) }),
      mathLabel('xiL', 'ξ = 1', [1, 1], 'result', [26, 8], { opacity: show(phase >= 2) }),
    ],
  };
})();

const newton: FigureSpec = (() => {
  const window = W(0.8, 2.3, -1.2, 2.6);
  const iterates = [2, 1.5, 1.416667];
  return {
    window,
    scene: (phase) => [
      graph('f', window, (x) => x * x - 2, 0.8, 2.3, graphStroke('first')),
      [0, 1].map((k) => {
        const x = iterates[k];
        return [
          slopeLine(`tangent${k}`, window, x, x * x - 2, 2 * x, graphStroke('second', 1.8), { opacity: show(phase === k + 1 || phase === 3) }),
          segment(`drop${k}`, [x, 0], [x, x * x - 2], { color: 'secondary', width: 1, dash: [3, 3] }, { opacity: show(phase >= k + 1) }),
        ];
      }),
      [0, 1, 2].map((k) => [
        dot(`x${k}`, [iterates[k], 0], k === 2 ? 'result' : 'second', { opacity: show(phase >= k) }),
        mathLabel(`x${k}L`, ['x₀', 'x₁', 'x₂'][k], [iterates[k], 0], 'second', [k === 2 ? -12 : 0, 16], { opacity: show(phase >= k) }),
      ]),
    ],
  };
})();

const taylorSine: FigureSpec = (() => {
  const window = W(-6.5, 6.5, -3, 3);
  const taylor = (x: number, terms: number) => {
    let sum = 0;
    let term = x;
    for (let k = 0; k < terms; k++) {
      sum += term;
      const n = 2 * k + 2;
      term = (-term * x * x) / (n * (n + 1));
    }
    return sum;
  };
  const termCounts = [1, 2, 3, 5];
  return {
    window,
    scene: (phase) => [
      graph('sin', window, Math.sin, -6.5, 6.5, graphStroke('first', 3)),
      // `.id(terms).transition(.opacity)`: alte und neue Näherung werden überblendet.
      termCounts.map((terms, k) =>
        graph(`T${terms}`, window, (x) => taylor(x, terms), -6.5, 6.5, graphStroke('second', 2.2), { opacity: show(Math.min(phase, 3) === k) }),
      ),
    ],
  };
})();

// ---------------------------------------------------------------------------
// Integralrechnung

const riemannSums = (lang: Lang): FigureSpec => {
  const window = W(-0.2, 2.3, -0.3, 4.5);
  const counts = [4, 8, 16, 64];
  const sums = ['1.75', '2.19', '2.42', '2.60'];
  const bars = (n: number): Pt[][] => {
    const w = 2 / n;
    return Array.from({ length: n }, (_, k) => {
      const x = k * w;
      return [
        [x, 0],
        [x + w, 0],
        [x + w, x * x],
        [x, x * x],
      ];
    });
  };
  return {
    window,
    scene: (phase) => [
      counts.map((n, k) => {
        const opacity = show(Math.min(phase, 3) === k);
        return [
          path(`fill${n}`, bars(n), { closed: true, fill: { color: 'second', alpha: 0.4 }, opacity }),
          path(`stroke${n}`, bars(n), { closed: true, stroke: { color: 'second', width: n > 20 ? 0.5 : 1.2 }, opacity }),
        ];
      }),
      graph('f', window, sq, 0, 2.1, graphStroke('first')),
      mathLabel('sum', `≈ ${dec(lang, sums[Math.min(phase, 3)])}`, [0.6, 3.6], 'second', [0, 0]),
    ],
  };
};

const fundamentalTheorem: FigureSpec = (() => {
  const window = W(-0.3, 4.4, -0.3, 4.4);
  const f = (t: number) => 1 + t / 2;
  const table = fnTable(f, window.xMin, window.xMax);
  const xs = [1, 2, 3, 3];
  return {
    window,
    scene: (phase) => {
      const x = xs[Math.min(phase, 3)];
      return [
        fnShape('area', table, 0, x, 'area', { fill: { color: 'first', alpha: 0.3 } }),
        rectXY('strip', 3, 0, 3.35, f(3), { fill: { color: 'second', alpha: 0.7 }, opacity: show(phase >= 3) }),
        graph('f', window, f, 0, 4.2, graphStroke('first')),
        mathLabel('A', 'A(x)', [x / 2, 0.6], 'first', [0, 0]),
        mathLabel('x', 'x', [x, 0], 'primary', [0, 14]),
        mathLabel('h', 'h', [3.175, 0], 'second', [6, 14], { opacity: show(phase >= 3) }),
        mathLabel('fx', 'f(x)', [3.35, f(3) / 2], 'second', [20, 0], { opacity: show(phase >= 3) }),
      ];
    },
  };
})();

const signedArea: FigureSpec = (() => {
  const window = W(-0.4, 6.8, -1.6, 1.6);
  return {
    window,
    scene: (phase) => [
      area('plus', Math.sin, 0, Math.PI, { color: 'result', alpha: 0.4 }, { opacity: show(phase >= 1) }),
      area('minus', Math.sin, Math.PI, 2 * Math.PI, { color: 'warning', alpha: 0.35 }, { opacity: show(phase >= 2) }),
      graph('sin', window, Math.sin, -0.4, 6.8, graphStroke('first')),
      mathLabel('plusL', '+2', [1.57, 0.45], 'result', [0, 0], { opacity: show(phase >= 1) }),
      mathLabel('minusL', '−2', [4.71, -0.45], 'warning', [0, 0], { opacity: show(phase >= 2) }),
    ],
  };
})();

const improperIntegral: FigureSpec = (() => {
  const window = W(-0.3, 10.5, -0.15, 1.3);
  const f = (x: number) => 1 / (x * x);
  const table = fnTable(f, 0.8, 10.6);
  const bs = [2, 5, 10, 10];
  return {
    window,
    scene: (phase) => {
      const b = bs[Math.min(phase, 3)];
      return [
        fnShape('area', table, 1, b, 'area', { fill: { color: 'first', alpha: 0.35 } }),
        graph('f', window, f, 0.85, 10.5, graphStroke('first')),
        graph('g', window, (x) => 1 / x, 0.8, 10.5, graphStroke('second', 2, true), { opacity: show(phase >= 3) }),
        mathLabel('b', 'b', [b, 0], 'primary', [0, 12]),
      ];
    },
  };
})();

// ---------------------------------------------------------------------------
// Mehrdimensionale Analysis

const contourGradient: FigureSpec = (() => {
  const points: Pt[] = [
    [1.2, 0.6],
    [-1.5, 0.3],
    [0.3, -1.0],
    [-0.8, -0.9],
  ];
  const levels = [0.5, 1, 2, 3, 4];
  return {
    window: W(-2.6, 2.6, -2.6, 2.6),
    scene: (phase) => [
      levels.map((c, i) => ellipse(`level${i}`, ORIGIN, Math.sqrt(c), Math.sqrt(c / 2), { stroke: { color: 'first', alpha: 0.35 + 0.1 * i, width: 1.8 } })),
      points.map((p, i) => {
        const g: Pt = [2 * p[0], 4 * p[1]];
        const len = Math.hypot(g[0], g[1]);
        const k = phase >= 2 ? 0.25 : 0.55 / len;
        return [
          arrow(`grad${i}`, p, [p[0] + k * g[0], p[1] + k * g[1]], 'second', { width: 2.5, opacity: show(phase >= 1) }),
          dot(`p${i}`, p, 'second', { opacity: show(phase >= 1) }),
        ];
      }),
      dot('min', ORIGIN, 'result', { opacity: show(phase >= 3) }),
    ],
  };
})();

const criticalPoints: FigureSpec = (() => {
  const hyperbola = (c: number, branch: number): Pt[] =>
    Array.from({ length: 81 }, (_, i) => {
      const t = -2.2 + (4.4 * i) / 80;
      const sign = branch === 0 ? 1 : -1;
      return c > 0 ? ([Math.sqrt(c + t * t) * sign, t] as Pt) : ([t, Math.sqrt(-c + t * t) * sign] as Pt);
    });
  const cs = [0.5, 1.5, 3.0];
  return {
    window: W(-2.2, 2.2, -2.2, 2.2),
    scene: (phase) => [
      fade(
        show(phase <= 1),
        [1, 2, 3, 4].map((k) => circle(`circle${k}`, ORIGIN, 0.5 * k, { stroke: { color: phase === 0 ? 'second' : 'first', alpha: 0.3 + 0.15 * k, width: 2 } })),
      ),
      fade(
        show(phase === 2),
        path('rising', cs.flatMap((c) => [hyperbola(c, 0), hyperbola(c, 1)]), { stroke: { color: 'second', alpha: 0.7, width: 2 } }),
        path('falling', cs.flatMap((c) => [hyperbola(-c, 0), hyperbola(-c, 1)]), { stroke: { color: 'first', alpha: 0.7, width: 2 } }),
      ),
      dot('origin', ORIGIN, 'result'),
    ],
  };
})();

const lagrange: FigureSpec = {
  window: W(-2, 2, -2, 2),
  scene: (phase) => {
    const p: Pt = [0.7071, 0.7071];
    return [
      circle('constraint', ORIGIN, 1, { stroke: { color: 'first', width: 3 } }),
      [-1, 0, 1, 1.414].map((c, i) =>
        line(`level${i}`, [c / 2, c / 2], [1, -1], i === 3 ? 'result' : 'second', {
          alpha: i === 3 ? 1 : 0.6,
          width: i === 3 ? 2.5 : 1.8,
          dash: i === 3 ? undefined : [6, 4],
          opacity: show(i < 3 ? phase >= 1 : phase >= 2),
        }),
      ),
      dot('touch', p, 'result', { opacity: show(phase >= 2) }),
      arrow('gradF', p, [p[0] + 0.55, p[1] + 0.55], 'second', { width: 3, opacity: show(phase >= 3) }),
      arrow('gradG', p, [p[0] + 0.4, p[1] + 0.4], 'extra', { width: 2, opacity: show(phase >= 3) }),
      mathLabel('parallel', '∇f ∥ ∇g', [1.25, 1.4], 'second', [0, -8], { opacity: show(phase >= 3) }),
    ];
  },
};

const polarArea: FigureSpec = (() => {
  const sector = (r0: number, r1: number, a0: number, a1: number): Pt[] => {
    const outer = Array.from({ length: 25 }, (_, i) => {
      const a = a0 + ((a1 - a0) * i) / 24;
      return [r1 * Math.cos(a), r1 * Math.sin(a)] as Pt;
    });
    const inner = Array.from({ length: 25 }, (_, i) => {
      const a = a0 + ((a1 - a0) * (24 - i)) / 24;
      return [r0 * Math.cos(a), r0 * Math.sin(a)] as Pt;
    });
    return [...outer, ...inner];
  };
  const rays: Pt[][] = Array.from({ length: 12 }, (_, k) => {
    const a = (k * Math.PI) / 6;
    return [ORIGIN, [2 * Math.cos(a), 2 * Math.sin(a)]];
  });
  const grey = { color: 'secondary' as const, alpha: 0.4, width: 1.2 };
  return {
    window: W(-2.2, 2.2, -2.2, 2.2),
    showGrid: false,
    scene: (phase): SceneEl[] => [
      ...[1, 2, 3, 4].map((k) => circle(`ring${k}`, ORIGIN, 0.5 * k, { stroke: grey })),
      path('rays', rays, { stroke: grey }),
      polygon('inner', sector(0.5, 1.0, Math.PI / 6, Math.PI / 3), { fill: { color: 'first', alpha: 0.5 }, opacity: show(phase >= 1) }),
      polygon('outer', sector(1.5, 2.0, Math.PI / 6, Math.PI / 3), { fill: { color: 'second', alpha: 0.5 }, opacity: show(phase >= 2) }),
      mathLabel('arc', 'r·Δφ', [1.95 * Math.cos(Math.PI / 4), 1.95 * Math.sin(Math.PI / 4)], 'second', [18, -10], { opacity: show(phase >= 2) }),
      mathLabel('dr', 'Δr', [1.75 * Math.cos(Math.PI / 3), 1.75 * Math.sin(Math.PI / 3)], 'second', [-16, -4], { opacity: show(phase >= 2) }),
    ],
  };
})();

export const analysisFigures = (lang: Lang): Record<string, FigureSpec> => ({
  sequenceConvergence: sequenceConvergence(lang),
  geometricSeries,
  seriesComparison,
  removableHole: removableHole(lang),
  squeeze,
  continuityTypes,
  secantToTangent,
  derivativeGraph,
  meanValue,
  newton,
  taylorSine,
  riemannSums: riemannSums(lang),
  fundamentalTheorem,
  signedArea,
  improperIntegral,
  contourGradient,
  criticalPoints,
  lagrange,
  polarArea,
});
