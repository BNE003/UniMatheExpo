/**
 * Geometrie für die Grafiken. Alle Funktionen sind Worklets und laufen bei der Animation
 * auf dem UI-Thread (Reanimated); auf dem JS-Thread werden damit die Pfade der Ruhezustände
 * vorberechnet. Die Formeln entsprechen den SwiftUI-Shapes in Views/LessonVectorVisuals.swift.
 */
import type { FnTable, PlaneWindow, Pt, RegionShape, SceneEl, Transform } from './scene';

type XY = [number, number];

/** PlaneWindow.point(_:in:) */
export function toPx(p: Pt, w: PlaneWindow, width: number, height: number): XY {
  'worklet';
  return [((p[0] - w.xMin) / (w.xMax - w.xMin)) * width, height - ((p[1] - w.yMin) / (w.yMax - w.yMin)) * height];
}

function diagonal(w: PlaneWindow) {
  'worklet';
  return Math.sqrt((w.xMax - w.xMin) ** 2 + (w.yMax - w.yMin) ** 2);
}

const f = (n: number) => {
  'worklet';
  return Math.round(n * 100) / 100;
};

function lerp(a: number, b: number, t: number) {
  'worklet';
  return a + (b - a) * t;
}

export function lerpPt(a: Pt, b: Pt, t: number): XY {
  'worklet';
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
}

// ---------------------------------------------------------------------------
// Zeitverlauf

/** Kubische Bézier-Kurve wie CSS/SwiftUI (Startpunkt 0,0, Endpunkt 1,1). */
function bezier(x1: number, y1: number, x2: number, y2: number, x: number) {
  'worklet';
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  let u = x;
  for (let i = 0; i < 8; i++) {
    const xu = ((ax * u + bx) * u + cx) * u - x;
    const d = (3 * ax * u + 2 * bx) * u + cx;
    if (Math.abs(xu) < 1e-5 || Math.abs(d) < 1e-6) break;
    u -= xu / d;
  }
  u = Math.min(1, Math.max(0, u));
  return ((ay * u + by) * u + cy) * u;
}

export function ease(kind: string | undefined, x: number) {
  'worklet';
  switch (kind) {
    case 'linear':
      return Math.min(1, Math.max(0, x));
    case 'easeIn':
      return bezier(0.42, 0, 1, 1, x);
    case 'easeOut':
      return bezier(0, 0, 0.58, 1, x);
    default:
      return bezier(0.42, 0, 0.58, 1, x);
  }
}

// ---------------------------------------------------------------------------
// Grundformen

/** VectorArrowShape: Linie plus zwei Spitzenstriche (Länge ≤ 11 px, Winkel π/7). */
function arrowPx(a: XY, b: XY, fixedHead?: number): string {
  'worklet';
  let d = `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length <= (fixedHead ? 0.01 : 2)) return d;
  const bx = -dx / length;
  const by = -dy / length;
  const head = fixedHead ?? Math.min(11, length * 0.45);
  for (const angle of [Math.PI / 7, -Math.PI / 7]) {
    const rx = bx * Math.cos(angle) - by * Math.sin(angle);
    const ry = bx * Math.sin(angle) + by * Math.cos(angle);
    d += `M${f(b[0])} ${f(b[1])}L${f(b[0] + head * rx)} ${f(b[1] + head * ry)}`;
  }
  return d;
}

export function arrowPath(from: Pt, to: Pt, w: PlaneWindow, width: number, height: number, head?: number): string {
  'worklet';
  return arrowPx(toPx(from, w, width, height), toPx(to, w, width, height), head);
}

/** PlaneLineShape: Gerade, die über das Fenster hinausreicht. */
export function linePath(through: Pt, dir: Pt, w: PlaneWindow, width: number, height: number, extent = 1): string {
  'worklet';
  const norm = Math.sqrt(dir[0] * dir[0] + dir[1] * dir[1]);
  if (norm <= 0) return '';
  const t = ((diagonal(w) * 1.5) / norm) * extent;
  const s = toPx([through[0] - t * dir[0], through[1] - t * dir[1]], w, width, height);
  const e = toPx([through[0] + t * dir[0], through[1] + t * dir[1]], w, width, height);
  return `M${f(s[0])} ${f(s[1])}L${f(e[0])} ${f(e[1])}`;
}

/** SkewGridShape: Linien durch k·a in Richtung b und durch k·b in Richtung a, k = −8…8. */
export function gridPath(a: Pt, b: Pt, w: PlaneWindow, width: number, height: number): string {
  'worklet';
  let d = '';
  for (let k = -8; k <= 8; k++) {
    d += linePath([k * a[0], k * a[1]], b, w, width, height);
    d += linePath([k * b[0], k * b[1]], a, w, width, height);
  }
  return d;
}

/** Drehung (im Uhrzeigersinn auf dem Bildschirm) und Spiegelung um `pivot` in px. */
function transformPx(p: XY, rotate: number, scaleX: number, pivot: XY): XY {
  'worklet';
  const a = (rotate * Math.PI) / 180;
  const dx = p[0] - pivot[0];
  const dy = p[1] - pivot[1];
  const rx = dx * Math.cos(a) - dy * Math.sin(a);
  const ry = dx * Math.sin(a) + dy * Math.cos(a);
  return [pivot[0] + rx * scaleX, pivot[1] + ry];
}

function pointsPath(pts: XY[], closed: boolean): string {
  'worklet';
  let d = '';
  for (let i = 0; i < pts.length; i++) d += `${i === 0 ? 'M' : 'L'}${f(pts[i][0])} ${f(pts[i][1])}`;
  return closed && pts.length > 2 ? d + 'Z' : d;
}

function subpathsPath(
  subpaths: readonly (readonly Pt[])[],
  closed: boolean,
  tf: Transform | undefined,
  endArrow: number | undefined,
  w: PlaneWindow,
  width: number,
  height: number,
): string {
  'worklet';
  const rotate = tf?.rotate ?? 0;
  const scaleX = tf?.scaleX ?? 1;
  const hasTf = rotate !== 0 || scaleX !== 1;
  const pivot = hasTf ? toPx(tf?.pivot ?? [0, 0], w, width, height) : ([0, 0] as XY);
  let d = '';
  let last: XY[] = [];
  for (const sub of subpaths) {
    const pts: XY[] = [];
    for (const p of sub) {
      const q = toPx(p, w, width, height);
      pts.push(hasTf ? transformPx(q, rotate, scaleX, pivot) : q);
    }
    d += pointsPath(pts, closed);
    last = pts;
  }
  if (endArrow && last.length >= 2) {
    const tip = last[last.length - 1];
    const before = last[last.length - 2];
    const head = arrowPx(before, tip, endArrow);
    d += head.slice(head.indexOf('M', 1));
  }
  return d;
}

/** Abgerundetes Rechteck als Polygon (damit es sich drehen lässt). */
function rectPoints(cx: number, cy: number, w: number, h: number, r: number): XY[] {
  'worklet';
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const y0 = cy - h / 2;
  const y1 = cy + h / 2;
  const rr = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
  if (rr < 0.5) {
    return [
      [x0, y0],
      [x1, y0],
      [x1, y1],
      [x0, y1],
    ];
  }
  const pts: XY[] = [];
  const corners: [number, number, number][] = [
    [x1 - rr, y0 + rr, -Math.PI / 2],
    [x1 - rr, y1 - rr, 0],
    [x0 + rr, y1 - rr, Math.PI / 2],
    [x0 + rr, y0 + rr, Math.PI],
  ];
  for (const [ccx, ccy, start] of corners) {
    for (let k = 0; k <= 6; k++) {
      const a = start + (k / 6) * (Math.PI / 2);
      pts.push([ccx + rr * Math.cos(a), ccy + rr * Math.sin(a)]);
    }
  }
  return pts;
}

export function rectPath(
  center: Pt,
  w: number,
  h: number,
  wPx: number,
  hPx: number,
  radius: number,
  tf: Transform | undefined,
  win: PlaneWindow,
  width: number,
  height: number,
): string {
  'worklet';
  const c = toPx(center, win, width, height);
  const sx = width / (win.xMax - win.xMin);
  const sy = height / (win.yMax - win.yMin);
  const pw = Math.abs(w) * sx + wPx;
  const ph = Math.abs(h) * sy + hPx;
  if (pw <= 0 && ph <= 0) return '';
  let pts = rectPoints(c[0], c[1], pw, ph, radius);
  const rotate = tf?.rotate ?? 0;
  const scaleX = tf?.scaleX ?? 1;
  if (rotate !== 0 || scaleX !== 1) {
    const pivot = tf?.pivot ? toPx(tf.pivot, win, width, height) : c;
    pts = pts.map((p) => transformPx(p, rotate, scaleX, pivot));
  }
  return pointsPath(pts, true);
}

export function ellipsePath(center: Pt, rx: number, ry: number, rxPx: number, ryPx: number, win: PlaneWindow, width: number, height: number): string {
  'worklet';
  const c = toPx(center, win, width, height);
  const a = Math.abs(rx) * (width / (win.xMax - win.xMin)) + rxPx;
  const b = Math.abs(ry) * (height / (win.yMax - win.yMin)) + ryPx;
  if (a <= 0.01 || b <= 0.01) return '';
  return `M${f(c[0] - a)} ${f(c[1])}A${f(a)} ${f(b)} 0 1 0 ${f(c[0] + a)} ${f(c[1])}A${f(a)} ${f(b)} 0 1 0 ${f(c[0] - a)} ${f(c[1])}Z`;
}

export function dotsPath(points: readonly Pt[], r: number, win: PlaneWindow, width: number, height: number): string {
  'worklet';
  let d = '';
  for (const p of points) d += ellipsePath(p, 0, 0, r, r, win, width, height);
  return d;
}

/** Funktionswert aus der Tabelle (linear interpoliert); NaN außerhalb oder an Lücken. */
export function tableValue(t: FnTable, x: number): number {
  'worklet';
  const u = (x - t.x0) / t.dx;
  const n = t.ys.length;
  if (u < -1e-9 || u > n - 1 + 1e-9) return NaN;
  const i = Math.min(Math.max(Math.floor(u), 0), n - 2);
  const s = u - i;
  return t.ys[i] + (t.ys[i + 1] - t.ys[i]) * s;
}

/** FunctionGraphShape (Lücken bei Polstellen) bzw. AreaUnderGraphShape. */
export function fnPath(t: FnTable, from: number, to: number, mode: string, samples: number, w: PlaneWindow, width: number, height: number): string {
  'worklet';
  const span = w.yMax - w.yMin;
  let d = '';
  if (mode === 'area') {
    if (to <= from) return '';
    const s = toPx([from, 0], w, width, height);
    d = `M${f(s[0])} ${f(s[1])}`;
    for (let i = 0; i <= samples; i++) {
      const x = from + ((to - from) * i) / samples;
      const y = tableValue(t, x);
      const p = toPx([x, Number.isFinite(y) ? y : 0], w, width, height);
      d += `L${f(p[0])} ${f(p[1])}`;
    }
    const e = toPx([to, 0], w, width, height);
    return d + `L${f(e[0])} ${f(e[1])}Z`;
  }
  let pen = false;
  for (let i = 0; i <= samples; i++) {
    const x = from + ((to - from) * i) / samples;
    const y = tableValue(t, x);
    if (!Number.isFinite(y) || y > w.yMax + span || y < w.yMin - span) {
      pen = false;
      continue;
    }
    const p = toPx([x, y], w, width, height);
    d += `${pen ? 'L' : 'M'}${f(p[0])} ${f(p[1])}`;
    pen = true;
  }
  return d;
}

/** Achsen und Gitterlinien bei ganzzahligen Koordinaten (CoordinateGrid). */
export function coordinateGridPaths(w: PlaneWindow, width: number, height: number) {
  let grid = '';
  for (let x = Math.ceil(w.xMin); x <= Math.floor(w.xMax); x++) {
    const a = toPx([x, w.yMin], w, width, height);
    const b = toPx([x, w.yMax], w, width, height);
    grid += `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`;
  }
  for (let y = Math.ceil(w.yMin); y <= Math.floor(w.yMax); y++) {
    const a = toPx([w.xMin, y], w, width, height);
    const b = toPx([w.xMax, y], w, width, height);
    grid += `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`;
  }
  const x0 = toPx([w.xMin, 0], w, width, height);
  const x1 = toPx([w.xMax, 0], w, width, height);
  const y0 = toPx([0, w.yMin], w, width, height);
  const y1 = toPx([0, w.yMax], w, width, height);
  const axes = `M${f(x0[0])} ${f(x0[1])}L${f(x1[0])} ${f(x1[1])}M${f(y0[0])} ${f(y0[1])}L${f(y1[0])} ${f(y1[1])}`;
  return { grid, axes };
}

/** Feste Fläche einer Mengenoperation (nur JS-Thread). */
export function regionPath(shapes: readonly RegionShape[], w: PlaneWindow, width: number, height: number): string {
  let d = '';
  for (const s of shapes) {
    if (s.kind === 'ellipse') d += ellipsePath(s.center, s.rx, s.ry, 0, 0, w, width, height);
    else if (s.kind === 'rect') {
      d += rectPath([(s.x0 + s.x1) / 2, (s.y0 + s.y1) / 2], s.x1 - s.x0, s.y1 - s.y0, 0, 0, s.radius ?? 0, undefined, w, width, height);
    } else d += subpathsPath([s.points], true, undefined, undefined, w, width, height);
  }
  return d;
}

// ---------------------------------------------------------------------------
// Interpolation zwischen zwei Phasen

function lerpTf(a: Transform | undefined, b: Transform | undefined, t: number): Transform | undefined {
  'worklet';
  if (!a && !b) return undefined;
  const pa = a?.pivot ?? b?.pivot ?? [0, 0];
  const pb = b?.pivot ?? a?.pivot ?? [0, 0];
  return {
    rotate: lerp(a?.rotate ?? 0, b?.rotate ?? 0, t),
    scaleX: lerp(a?.scaleX ?? 1, b?.scaleX ?? 1, t),
    pivot: a?.pivot || b?.pivot ? lerpPt(pa, pb, t) : undefined,
  };
}

function sameShape(a: readonly (readonly Pt[])[], b: readonly (readonly Pt[])[]) {
  'worklet';
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i].length !== b[i].length) return false;
  return true;
}

/** Pfad eines Elements beim Fortschritt t zwischen Zustand `a` und `b` (gleiches Element in zwei Phasen). */
export function elementPath(a: SceneEl, b: SceneEl, t: number, w: PlaneWindow, width: number, height: number): string {
  'worklet';
  if (a.kind === 'arrow' && b.kind === 'arrow') {
    return arrowPath(lerpPt(a.from, b.from, t), lerpPt(a.to, b.to, t), w, width, height, b.head);
  }
  if (a.kind === 'line' && b.kind === 'line') {
    return linePath(lerpPt(a.through, b.through, t), lerpPt(a.dir, b.dir, t), w, width, height, lerp(a.extent ?? 1, b.extent ?? 1, t));
  }
  if (a.kind === 'grid' && b.kind === 'grid') {
    return gridPath(lerpPt(a.a, b.a, t), lerpPt(a.b, b.b, t), w, width, height);
  }
  if (a.kind === 'path' && b.kind === 'path') {
    if (!sameShape(a.subpaths, b.subpaths)) {
      // Nicht interpolierbar (andere Punktzahl): wie SwiftUI sofort den Zielzustand zeichnen.
      return subpathsPath(b.subpaths, !!b.closed, b.transform, b.endArrow, w, width, height);
    }
    const subs: XY[][] = [];
    for (let i = 0; i < a.subpaths.length; i++) {
      const sa = a.subpaths[i];
      const sb = b.subpaths[i];
      const pts: XY[] = [];
      for (let k = 0; k < sa.length; k++) pts.push(lerpPt(sa[k], sb[k], t));
      subs.push(pts);
    }
    return subpathsPath(subs, !!b.closed, lerpTf(a.transform, b.transform, t), b.endArrow, w, width, height);
  }
  if (a.kind === 'rect' && b.kind === 'rect') {
    return rectPath(
      lerpPt(a.center, b.center, t),
      lerp(a.w, b.w, t),
      lerp(a.h, b.h, t),
      lerp(a.wPx ?? 0, b.wPx ?? 0, t),
      lerp(a.hPx ?? 0, b.hPx ?? 0, t),
      lerp(a.radius ?? 0, b.radius ?? 0, t),
      lerpTf(a.transform, b.transform, t),
      w,
      width,
      height,
    );
  }
  if (a.kind === 'ellipse' && b.kind === 'ellipse') {
    let c = lerpPt(a.center, b.center, t);
    const table = b.onFn ?? a.onFn;
    if (table) c = [c[0], tableValue(table, c[0])];
    return ellipsePath(
      c,
      lerp(a.rx, b.rx, t),
      lerp(a.ry, b.ry, t),
      lerp(a.rxPx ?? 0, b.rxPx ?? 0, t),
      lerp(a.ryPx ?? 0, b.ryPx ?? 0, t),
      w,
      width,
      height,
    );
  }
  if (a.kind === 'dots' && b.kind === 'dots') {
    const r = lerp(a.r, b.r, t);
    if (a.points.length !== b.points.length) return dotsPath(b.points, r, w, width, height);
    const pts: XY[] = [];
    for (let i = 0; i < a.points.length; i++) pts.push(lerpPt(a.points[i], b.points[i], t));
    return dotsPath(pts, r, w, width, height);
  }
  if (a.kind === 'fn' && b.kind === 'fn') {
    return fnPath(b.table, lerp(a.from, b.from, t), lerp(a.to, b.to, t), b.mode, b.samples ?? 160, w, width, height);
  }
  return '';
}

/** Position eines Textes (ohne Pixelversatz) beim Fortschritt t. */
export function labelPoint(
  a: { at: Pt; transform?: Transform },
  b: { at: Pt; transform?: Transform },
  t: number,
  w: PlaneWindow,
  width: number,
  height: number,
): XY {
  'worklet';
  const p = toPx(lerpPt(a.at, b.at, t), w, width, height);
  const tf = lerpTf(a.transform, b.transform, t);
  if (!tf || ((tf.rotate ?? 0) === 0 && (tf.scaleX ?? 1) === 1)) return p;
  const pivot = toPx(tf.pivot ?? [0, 0], w, width, height);
  return transformPx(p, tf.rotate ?? 0, tf.scaleX ?? 1, pivot);
}

export { lerp };
