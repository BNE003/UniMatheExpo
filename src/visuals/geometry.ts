/**
 * Geometrie für die Grafiken. Alle Funktionen sind Worklets und laufen bei der Animation
 * auf dem UI-Thread (Reanimated). Die Formeln entsprechen den SwiftUI-Shapes in
 * Views/LessonVectorVisuals.swift.
 */
import type { PlaneWindow, Pt, SceneEl } from './scene';

/** PlaneWindow.point(_:in:) */
export function toPx(p: Pt, w: PlaneWindow, width: number, height: number): [number, number] {
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

/** VectorArrowShape: Linie plus zwei Spitzenstriche (Länge ≤ 11 px, Winkel π/7). */
export function arrowPath(from: Pt, to: Pt, w: PlaneWindow, width: number, height: number): string {
  'worklet';
  const a = toPx(from, w, width, height);
  const b = toPx(to, w, width, height);
  let d = `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length <= 2) return d;
  const bx = -dx / length;
  const by = -dy / length;
  const head = Math.min(11, length * 0.45);
  for (const angle of [Math.PI / 7, -Math.PI / 7]) {
    const rx = bx * Math.cos(angle) - by * Math.sin(angle);
    const ry = bx * Math.sin(angle) + by * Math.cos(angle);
    d += `M${f(b[0])} ${f(b[1])}L${f(b[0] + head * rx)} ${f(b[1] + head * ry)}`;
  }
  return d;
}

/** PlaneLineShape: Gerade, die über das Fenster hinausreicht. */
export function linePath(through: Pt, dir: Pt, w: PlaneWindow, width: number, height: number): string {
  'worklet';
  const norm = Math.sqrt(dir[0] * dir[0] + dir[1] * dir[1]);
  if (norm <= 0) return '';
  const t = (diagonal(w) * 1.5) / norm;
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

export function polyPath(points: readonly Pt[], w: PlaneWindow, width: number, height: number): string {
  'worklet';
  let d = '';
  for (let i = 0; i < points.length; i++) {
    const p = toPx(points[i], w, width, height);
    d += `${i === 0 ? 'M' : 'L'}${f(p[0])} ${f(p[1])}`;
  }
  return d + 'Z';
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

// ---------------------------------------------------------------------------
// Interpolation zwischen zwei Phasen

function lerp(a: number, b: number, t: number) {
  'worklet';
  return a + (b - a) * t;
}

export function lerpPt(a: Pt, b: Pt, t: number): Pt {
  'worklet';
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
}

/** Pfad eines Elements beim Fortschritt t zwischen Zustand `a` und `b` (gleiches Element in zwei Phasen). */
export function elementPath(a: SceneEl, b: SceneEl, t: number, w: PlaneWindow, width: number, height: number): string {
  'worklet';
  if (a.kind === 'arrow' && b.kind === 'arrow') {
    return arrowPath(lerpPt(a.from, b.from, t), lerpPt(a.to, b.to, t), w, width, height);
  }
  if (a.kind === 'line' && b.kind === 'line') {
    return linePath(lerpPt(a.through, b.through, t), lerpPt(a.dir, b.dir, t), w, width, height);
  }
  if (a.kind === 'grid' && b.kind === 'grid') {
    return gridPath(lerpPt(a.a, b.a, t), lerpPt(a.b, b.b, t), w, width, height);
  }
  if (a.kind === 'poly' && b.kind === 'poly') {
    if (a.points.length !== b.points.length) return polyPath(t < 0.5 ? a.points : b.points, w, width, height);
    const pts: Pt[] = [];
    for (let i = 0; i < a.points.length; i++) pts.push(lerpPt(a.points[i], b.points[i], t));
    return polyPath(pts, w, width, height);
  }
  if (a.kind === 'dot' && b.kind === 'dot') {
    const p = toPx(lerpPt(a.at, b.at, t), w, width, height);
    // Kreis mit Radius 5 als Pfad
    return `M${f(p[0] - 5)} ${f(p[1])}a5 5 0 1 0 10 0a5 5 0 1 0 -10 0Z`;
  }
  return '';
}

export function elementOpacity(a: SceneEl, b: SceneEl, t: number): number {
  'worklet';
  return lerp(a.opacity ?? 1, b.opacity ?? 1, t);
}
