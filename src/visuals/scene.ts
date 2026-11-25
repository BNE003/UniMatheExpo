/**
 * Datenmodell der erklärenden Grafiken (Port von Views/LessonVectorVisuals.swift).
 *
 * Eine Grafik ist eine reine Funktion `phase → Szene`. Jede Phase liefert dieselben Elemente
 * (gleiche Schlüssel, gleiche Reihenfolge); der Renderer interpoliert zwischen zwei Phasen so,
 * wie SwiftUI die Werte zwischen zwei Zuständen animiert. Sichtbarkeit wird – wie in Swift mit
 * `.opacity(show(...))` – über `opacity` gesteuert.
 */

export type Pt = readonly [number, number];

/** Farbrollen aus `VisualColor` (LessonVectorVisuals.swift:370). */
export type ColorRole = 'first' | 'second' | 'result' | 'warning' | 'extra';

/** Mathematisches Koordinatenfenster (`PlaneWindow`). */
export interface PlaneWindow {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

interface Base {
  key: string;
  /** 0…1, Standard 1 */
  opacity?: number;
}

export interface ArrowEl extends Base {
  kind: 'arrow';
  from: Pt;
  to: Pt;
  color: ColorRole;
  /** Standard 3 (Swift `Arrow.width`) */
  width?: number;
  dashed?: boolean;
}

/** Unendliche Gerade durch `through` mit Richtung `dir` (`PlaneLineShape`). */
export interface LineEl extends Base {
  kind: 'line';
  through: Pt;
  dir: Pt;
  color: ColorRole;
  alpha?: number;
  width?: number;
  dash?: readonly number[];
}

/** Schiefes Gitter aus ganzzahligen Kombinationen von a und b (`SkewGridShape`). */
export interface GridEl extends Base {
  kind: 'grid';
  a: Pt;
  b: Pt;
  color: ColorRole;
  alpha?: number;
  width?: number;
}

/** Geschlossenes Polygon, z. B. Parallelogramm 0, a, a+b, b (`ParallelogramShape`). */
export interface PolyEl extends Base {
  kind: 'poly';
  points: readonly Pt[];
  fill?: { color: ColorRole; alpha?: number };
  stroke?: { color: ColorRole; alpha?: number; width: number; dash?: readonly number[] };
}

export interface DotEl extends Base {
  kind: 'dot';
  at: Pt;
  color: ColorRole;
  hollow?: boolean;
}

/** Beschriftung (`MathLabel`): zentriert bei `at` plus Pixelversatz `offset`. */
export interface LabelEl extends Base {
  kind: 'label';
  text: string;
  at: Pt;
  color: ColorRole;
  /** Standard [12, -10] wie in Swift */
  offset?: readonly [number, number];
}

export type ShapeEl = ArrowEl | LineEl | GridEl | PolyEl | DotEl;
export type SceneEl = ShapeEl | LabelEl;
export type Scene = readonly SceneEl[];

export interface FigureSpec {
  window: PlaneWindow;
  /** Koordinatengitter und Achsen anzeigen (Standard: ja). */
  showGrid?: boolean;
  /** Breite / Höhe (Standard 1). */
  aspectRatio?: number;
  /** Szene für Phase 0 … (Anzahl Bildunterschriften − 1). */
  scene: (phase: number) => Scene;
}

/** Swift: `show(_ condition: Bool) -> Double` */
export const show = (condition: boolean) => (condition ? 1 : 0);

export const ORIGIN: Pt = [0, 0];

/** Parallelogramm 0, a, a+b, b */
export const parallelogram = (a: Pt, b: Pt): Pt[] => [ORIGIN, a, [a[0] + b[0], a[1] + b[1]], b];
