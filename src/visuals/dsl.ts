/**
 * Bausteine zum Beschreiben der Grafiken, benannt nach den SwiftUI-Bausteinen in
 * Views/LessonVectorVisuals.swift (Arrow, MathLabel, Dot, HollowDot, FigureText, LabeledBlock,
 * FunctionGraphShape, AreaUnderGraphShape, SlopeLineShape …).
 */
import type {
  ArrowEl,
  ColorName,
  DotsEl,
  EllipseEl,
  FnEl,
  FnTable,
  LabelEl,
  LineEl,
  Paint,
  PathEl,
  PlaneWindow,
  Pt,
  RectEl,
  RegionEl,
  RegionShape,
  SceneEl,
  SceneInput,
  Stroke,
  Timing,
  Transform,
} from './scene';

export type Opts<T> = Partial<Omit<T, 'key' | 'kind'>>;

/** Multipliziert die Deckkraft aller Elemente (SwiftUI `.opacity(x)` an einer Gruppe). */
export function fade(opacity: number, ...items: SceneInput): SceneEl[] {
  const out: SceneEl[] = [];
  const walk = (list: SceneInput) => {
    for (const item of list) {
      if (Array.isArray(item)) walk(item as SceneInput);
      else {
        const el = item as SceneEl;
        out.push({ ...el, opacity: (el.opacity ?? 1) * opacity });
      }
    }
  };
  walk(items);
  return out;
}

/** Setzt Zeitverhalten für alle Elemente. */
export function timed(timing: Timing, ...items: SceneInput): SceneEl[] {
  return fade(1, ...items).map((el) => ({ ...el, ...timing }));
}

// ---------------------------------------------------------------------------
// Pfeile, Geraden

export const arrow = (key: string, from: Pt, to: Pt, color: ColorName, opts: Opts<ArrowEl> = {}): ArrowEl => ({
  key,
  kind: 'arrow',
  from,
  to,
  color,
  ...opts,
});

export const line = (key: string, through: Pt, dir: Pt, color: ColorName, opts: Opts<LineEl> = {}): LineEl => ({
  key,
  kind: 'line',
  through,
  dir,
  color,
  ...opts,
});

export const stroke = (color: ColorName, width: number, opts: Partial<Stroke> = {}): Stroke => ({ color, width, ...opts });

/** `graphStroke` aus Swift: runde Enden, gestrichelt [6, 4]. */
export const graphStroke = (color: ColorName, width = 2.5, dashed = false, alpha?: number): Stroke => ({
  color,
  width,
  alpha,
  cap: 'round',
  join: 'round',
  dash: dashed ? [6, 4] : undefined,
});

export const path = (key: string, subpaths: readonly (readonly Pt[])[], opts: Opts<PathEl> = {}): PathEl => ({
  key,
  kind: 'path',
  subpaths,
  ...opts,
});

export const polyline = (key: string, points: readonly Pt[], s: Stroke, opts: Opts<PathEl> = {}): PathEl =>
  path(key, [points], { stroke: s, ...opts });

export const segment = (key: string, a: Pt, b: Pt, s: Stroke, opts: Opts<PathEl> = {}): PathEl => path(key, [[a, b]], { stroke: s, ...opts });

export const polygon = (key: string, points: readonly Pt[], opts: Opts<PathEl> = {}): PathEl => path(key, [points], { closed: true, ...opts });

// ---------------------------------------------------------------------------
// Rechtecke, Kreise, Punkte

/** Rechteck aus Eckkoordinaten (`unitRect`/`windowRect`). */
export const rectXY = (key: string, x0: number, y0: number, x1: number, y1: number, opts: Opts<RectEl> = {}): RectEl => ({
  key,
  kind: 'rect',
  center: [(x0 + x1) / 2, (y0 + y1) / 2],
  w: x1 - x0,
  h: y1 - y0,
  ...opts,
});

export const rect = (key: string, center: Pt, w: number, h: number, opts: Opts<RectEl> = {}): RectEl => ({
  key,
  kind: 'rect',
  center,
  w,
  h,
  ...opts,
});

export const ellipse = (key: string, center: Pt, rx: number, ry: number, opts: Opts<EllipseEl> = {}): EllipseEl => ({
  key,
  kind: 'ellipse',
  center,
  rx,
  ry,
  ...opts,
});

export const circle = (key: string, center: Pt, r: number, opts: Opts<EllipseEl> = {}): EllipseEl => ellipse(key, center, r, r, opts);

/** Kreis mit festem Pixelradius (z. B. `Circle().frame(width: 8)` → r = 4). */
export const disc = (key: string, at: Pt, r: number, opts: Opts<EllipseEl> = {}): EllipseEl =>
  ellipse(key, at, 0, 0, { rxPx: r, ryPx: r, ...opts });

/** Viele Punkte mit festem Pixelradius in einem Element. */
export const dots = (key: string, points: readonly Pt[], r: number, color: ColorName, opts: Opts<DotsEl> = {}): DotsEl => ({
  key,
  kind: 'dots',
  points,
  r,
  fill: { color },
  ...opts,
});

/** `Dot`: gefüllter Punkt, Durchmesser 10. */
export const dot = (key: string, at: Pt, color: ColorName, opts: Opts<EllipseEl> = {}): EllipseEl =>
  disc(key, at, 5, { fill: { color }, ...opts });

/** `Dot(hollow: true)`: gestrichelter Ring. */
export const dashedDot = (key: string, at: Pt, color: ColorName, opts: Opts<EllipseEl> = {}): EllipseEl =>
  disc(key, at, 5, { stroke: { color, width: 2, dash: [3, 3] }, ...opts });

/** `HollowDot`: Ring mit Hintergrundfüllung, Durchmesser 11, Linie 2,5. */
export const hollowDot = (key: string, at: Pt, color: ColorName, opts: Opts<EllipseEl> = {}): EllipseEl =>
  disc(key, at, 5.5, { fill: { color: 'surface' }, stroke: { color, width: 2.5 }, ...opts });

// ---------------------------------------------------------------------------
// Texte

/** `MathLabel`: kursiv, 13 pt, Unterlage, Standardversatz (12, −10). */
export const mathLabel = (
  key: string,
  text: string,
  at: Pt,
  color: ColorName,
  offset: readonly [number, number] = [12, -10],
  opts: Opts<LabelEl> = {},
): LabelEl => ({ key, kind: 'label', text, at, color, offset, ...opts });

export interface TextOpts extends Opts<LabelEl> {
  color?: ColorName;
}

/** `FigureText` / `SetText`: frei positionierter Text (Standard 15 pt, halbfett). */
export const text = (key: string, value: string, at: Pt, opts: TextOpts = {}): LabelEl => ({
  key,
  kind: 'label',
  style: 'plain',
  text: value,
  at,
  color: 'primary',
  ...opts,
});

/** `LabeledBlock`: Kästchen mit Füllung 25 %, Rand 2 und fettem Serifentext. */
export function block(key: string, value: string, center: Pt, w: number, h: number, color: ColorName, opts: { opacity?: number } = {}): SceneEl[] {
  return [
    rect(`${key}.box`, center, w, h, { radius: 6, fill: { color, alpha: 0.25 }, stroke: { color, width: 2 }, ...opts }),
    text(`${key}.text`, value, center, { font: 'serif', size: 16, weight: 'bold', ...opts }),
  ];
}

// ---------------------------------------------------------------------------
// Funktionsgraphen

type Fn = (x: number) => number;

/** `FunctionGraphShape`: Graph mit Lücken, wo f(x) weit außerhalb des Fensters liegt. */
export function graphPoints(window: PlaneWindow, fn: Fn, from: number, to: number, samples = 300): Pt[][] {
  const span = window.yMax - window.yMin;
  const subs: Pt[][] = [];
  let current: Pt[] | null = null;
  for (let i = 0; i <= samples; i++) {
    const x = from + ((to - from) * i) / samples;
    const y = fn(x);
    if (!Number.isFinite(y) || y > window.yMax + span || y < window.yMin - span) {
      current = null;
      continue;
    }
    if (!current) {
      current = [];
      subs.push(current);
    }
    current.push([x, y]);
  }
  return subs;
}

export const graph = (key: string, window: PlaneWindow, fn: Fn, from: number, to: number, s: Stroke, opts: Opts<PathEl> & { samples?: number } = {}): PathEl => {
  const { samples, ...rest } = opts;
  return path(key, graphPoints(window, fn, from, to, samples), { stroke: s, ...rest });
};

/** `AreaUnderGraphShape` mit festen Grenzen. */
export function area(key: string, fn: Fn, from: number, to: number, fill: Paint, opts: Opts<PathEl> = {}): PathEl {
  const pts: Pt[] = [[from, 0]];
  for (let i = 0; i <= 160; i++) {
    const x = from + ((to - from) * i) / 160;
    pts.push([x, fn(x)]);
  }
  pts.push([to, 0]);
  return polygon(key, pts, { fill, ...opts });
}

/** Funktionstabelle für Animationen auf dem UI-Thread. */
export function fnTable(fn: Fn, x0: number, x1: number, n = 800): FnTable {
  const dx = (x1 - x0) / n;
  return { x0, dx, ys: Array.from({ length: n + 1 }, (_, i) => fn(x0 + i * dx)) };
}

/** Fläche bzw. Graph mit animierbaren Grenzen. */
export const fnShape = (key: string, table: FnTable, from: number, to: number, mode: 'line' | 'area', opts: Opts<FnEl> = {}): FnEl => ({
  key,
  kind: 'fn',
  table,
  from,
  to,
  mode,
  ...opts,
});

/** `SlopeLineShape`: Gerade durch (x0, y0) mit Steigung m über das ganze Fenster. */
export const slopeLine = (key: string, window: PlaneWindow, x0: number, y0: number, m: number, s: Stroke, opts: Opts<PathEl> = {}): PathEl =>
  segment(key, [window.xMin, y0 + m * (window.xMin - x0)], [window.xMax, y0 + m * (window.xMax - x0)], s, opts);

/** Kreisbogen um den Ursprung (Grad, gegen den Uhrzeigersinn) – `AngleArcShape`. */
export function arcPoints(from: number, to: number, radius: number, center: Pt = [0, 0], count = 40): Pt[] {
  return Array.from({ length: count + 1 }, (_, i) => {
    const a = ((from + ((to - from) * i) / count) * Math.PI) / 180;
    return [center[0] + radius * Math.cos(a), center[1] + radius * Math.sin(a)] as Pt;
  });
}

/** Ellipse als Punktliste (`ellipsePath` mit 120 Schritten). */
export function ellipsePoints(rx: number, ry: number, center: Pt = [0, 0], count = 120): Pt[] {
  return Array.from({ length: count + 1 }, (_, i) => {
    const t = (2 * Math.PI * i) / count;
    return [center[0] + rx * Math.cos(t), center[1] + ry * Math.sin(t)] as Pt;
  });
}

// ---------------------------------------------------------------------------
// Mengenflächen

export const regionCircle = (center: Pt, r: number): RegionShape => ({ kind: 'ellipse', center, rx: r, ry: r });
export const regionRect = (x0: number, y0: number, x1: number, y1: number, radius = 0): RegionShape => ({ kind: 'rect', x0, y0, x1, y1, radius });

export const region = (key: string, shapes: readonly RegionShape[], fill: Paint, opts: Opts<RegionEl> = {}): RegionEl => ({
  key,
  kind: 'region',
  shapes,
  fill,
  ...opts,
});

// ---------------------------------------------------------------------------
// Zahlengerade

/** `NumberLineAxis`: Achse von `from` bis `to` mit Strichen und Zahlen. */
export function numberLineAxis(key: string, from: number, to: number): SceneEl[] {
  const subs: Pt[][] = [
    [
      [from - 0.4, 0],
      [to + 0.4, 0],
    ],
  ];
  const labels: SceneEl[] = [];
  for (let k = from; k <= to; k++) {
    subs.push([
      [k, -0.12],
      [k, 0.12],
    ]);
    labels.push(text(`${key}.n${k}`, k < 0 ? `−${-k}` : `${k}`, [k, -0.55], { color: 'secondary', size: 12, weight: 'regular' }));
  }
  return [path(`${key}.axis`, subs, { stroke: { color: 'secondary', alpha: 0.7, width: 1.5 } }), ...labels];
}

/** Dezimalzahl in der Schreibweise der Sprache (`dec` in Swift). */
export const dec = (lang: 'de' | 'en', value: string) => (lang === 'en' ? value : value.replace(/\./g, ','));

export type { Transform };
