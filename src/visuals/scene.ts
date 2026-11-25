/**
 * Datenmodell der erklärenden Grafiken (Port von Views/LessonVectorVisuals.swift).
 *
 * Eine Grafik ist eine reine Funktion `phase → Szene`. Jede Phase liefert dieselben Elemente
 * (gleiche Schlüssel, gleiche Reihenfolge); der Renderer interpoliert zwischen zwei Phasen so,
 * wie SwiftUI die Werte zwischen zwei Zuständen animiert: Koordinaten, Farben, Linienbreiten,
 * Drehwinkel und Deckkraft. Sichtbarkeit wird – wie in Swift mit `.opacity(show(...))` – über
 * `opacity` gesteuert. Alle Elemente sind reine Daten, damit sie auf dem UI-Thread (Worklet)
 * interpoliert werden können.
 */

export type Pt = readonly [number, number];

/**
 * Farben: die Rollen aus `VisualColor` (LessonVectorVisuals.swift:370) und die SwiftUI-Systemfarben,
 * die in den Grafiken vorkommen.
 */
export type ColorName =
  | 'first'
  | 'second'
  | 'result'
  | 'warning'
  | 'extra'
  | 'primary'
  | 'secondary'
  | 'surface'
  | 'surfaceStrong'
  | 'white';
/** Alter Name, von den ersten portierten Grafiken verwendet. */
export type ColorRole = ColorName;

export interface Paint {
  color: ColorName;
  /** SwiftUI `.opacity(x)` an der Farbe */
  alpha?: number;
}

export interface Stroke extends Paint {
  width: number;
  dash?: readonly number[];
  cap?: 'butt' | 'round';
  join?: 'miter' | 'round';
}

/** Mathematisches Koordinatenfenster (`PlaneWindow`). */
export interface PlaneWindow {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

/**
 * Zeitverhalten des Übergangs in die Phase dieses Elements.
 * Standard wie `withAnimation(.easeInOut(duration: 0.9))`.
 */
export interface Timing {
  /** Millisekunden */
  delay?: number;
  /** Millisekunden */
  duration?: number;
  easing?: 'easeInOut' | 'easeIn' | 'easeOut' | 'linear';
}

/**
 * Drehung und Spiegelung um `pivot` (mathematische Koordinaten), angewandt in Bildschirmpixeln:
 * erst `rotate` (Grad, im Uhrzeigersinn wie SwiftUI `rotationEffect`), dann `scaleX`.
 */
export interface Transform {
  rotate?: number;
  scaleX?: number;
  pivot?: Pt;
}

interface Base extends Timing {
  key: string;
  /** 0…1, Standard 1 */
  opacity?: number;
}

export interface ArrowEl extends Base {
  kind: 'arrow';
  from: Pt;
  to: Pt;
  color: ColorName;
  alpha?: number;
  /** Standard 3 (Swift `Arrow.width`) */
  width?: number;
  dashed?: boolean;
  /** Feste Länge der Spitze in px (Pfeildiagramme); sonst min(11, 0,45 · Länge) */
  head?: number;
}

/** Unendliche Gerade durch `through` mit Richtung `dir` (`PlaneLineShape`). */
export interface LineEl extends Base {
  kind: 'line';
  through: Pt;
  dir: Pt;
  color: ColorName;
  alpha?: number;
  width?: number;
  dash?: readonly number[];
  /** Anteil der Länge (SwiftUI `.trim` symmetrisch um `through`), Standard 1 */
  extent?: number;
}

/** Schiefes Gitter aus ganzzahligen Kombinationen von a und b (`SkewGridShape`). */
export interface GridEl extends Base {
  kind: 'grid';
  a: Pt;
  b: Pt;
  color: ColorName;
  alpha?: number;
  width?: number;
}

/** Linienzug(e) oder Polygon(e) in mathematischen Koordinaten. */
export interface PathEl extends Base {
  kind: 'path';
  subpaths: readonly (readonly Pt[])[];
  closed?: boolean;
  fill?: Paint;
  stroke?: Stroke;
  transform?: Transform;
  /** Pfeilspitze (px) am Ende des letzten Teilpfads */
  endArrow?: number;
}

/** Rechteck um `center`; Größe in mathematischen Einheiten plus optional feste Pixel. */
export interface RectEl extends Base {
  kind: 'rect';
  center: Pt;
  w: number;
  h: number;
  wPx?: number;
  hPx?: number;
  /** Eckenradius in px (wird auf die halbe kürzere Seite begrenzt) */
  radius?: number;
  fill?: Paint;
  stroke?: Stroke;
  /** Drehpunkt Standard: Mittelpunkt */
  transform?: Transform;
}

/** Tabelle einer Funktion für Animationen auf dem UI-Thread (gleichabständige Stützstellen). */
export interface FnTable {
  x0: number;
  dx: number;
  ys: readonly number[];
}

/** Ellipse/Kreis; Radien in mathematischen Einheiten plus optional feste Pixel (Punkte). */
export interface EllipseEl extends Base {
  kind: 'ellipse';
  center: Pt;
  rx: number;
  ry: number;
  rxPx?: number;
  ryPx?: number;
  fill?: Paint;
  stroke?: Stroke;
  /** Punkt läuft beim Animieren auf dem Graphen (`PointOnGraphShape`): y = f(center.x). */
  onFn?: FnTable;
}

/** Viele gleich große Punkte (feste Pixelradien) in einem Pfad, z. B. Folgenglieder. */
export interface DotsEl extends Base {
  kind: 'dots';
  points: readonly Pt[];
  /** Radius in px */
  r: number;
  fill?: Paint;
  stroke?: Stroke;
}

/** Graph oder Fläche unter dem Graphen mit animierbaren Grenzen (`AreaUnderGraphShape`). */
export interface FnEl extends Base {
  kind: 'fn';
  table: FnTable;
  from: number;
  to: number;
  mode: 'line' | 'area';
  samples?: number;
  fill?: Paint;
  stroke?: Stroke;
}

export type RegionShape =
  | { kind: 'ellipse'; center: Pt; rx: number; ry: number }
  | { kind: 'rect'; x0: number; y0: number; x1: number; y1: number; radius?: number }
  | { kind: 'poly'; points: readonly Pt[] };

/**
 * Fläche aus Mengenoperationen (Venn-Diagramme): `shapes` mit Füllregel, optional beschnitten
 * durch `clip`. Schnitt = A mit clip B, Vereinigung = [A, B], Differenz A \ B = [A, B] evenodd mit clip A.
 * Die Geometrie ist fest; animiert wird nur die Deckkraft.
 */
export interface RegionEl extends Base {
  kind: 'region';
  shapes: readonly RegionShape[];
  rule?: 'nonzero' | 'evenodd';
  clip?: { shapes: readonly RegionShape[]; rule?: 'nonzero' | 'evenodd' };
  fill: Paint;
}

export interface Chip {
  shape: 'circle' | 'capsule' | 'rounded' | 'rect';
  /** feste Größe in px; sonst Textgröße plus Innenabstand */
  w?: number;
  h?: number;
  padX?: number;
  padY?: number;
  radius?: number;
  fill?: Paint;
  stroke?: Stroke;
}

/**
 * Text an einer Stelle, zentriert bei `at` plus Pixelversatz `offset`.
 * `style: 'math'` (Standard) entspricht `MathLabel` (Serifenschrift kursiv, 13 pt, halbtransparente Unterlage),
 * `style: 'plain'` entspricht `FigureText`/`SetText`.
 */
export interface LabelEl extends Base {
  kind: 'label';
  text: string;
  at: Pt;
  color: ColorName;
  alpha?: number;
  /** Standard [12, -10] bei 'math', [0, 0] bei 'plain' */
  offset?: readonly [number, number];
  style?: 'math' | 'plain';
  font?: 'rounded' | 'serif' | 'mono';
  size?: number;
  weight?: 'regular' | 'semibold' | 'bold';
  italic?: boolean;
  chip?: Chip;
  /** SwiftUI `.scaleEffect` */
  scale?: number;
  /** 'left': `at` ist der linke Rand des Textes (z. B. `.frame(alignment: .leading)`) */
  anchor?: 'center' | 'left';
  /** Positions-Transformation (z. B. mitgedrehte Ecken) */
  transform?: Transform;
}

export type ShapeEl = ArrowEl | LineEl | GridEl | PathEl | RectEl | EllipseEl | DotsEl | FnEl;
export type SceneEl = ShapeEl | RegionEl | LabelEl;
export type Scene = readonly SceneEl[];

/** Szenen dürfen verschachtelte Listen liefern; sie werden flach gemacht. */
export type SceneInput = readonly (SceneEl | SceneInput)[];

export interface FigureSpec {
  window: PlaneWindow;
  /** Koordinatengitter und Achsen anzeigen (Standard: ja). */
  showGrid?: boolean;
  /** Breite / Höhe (Standard 1). */
  aspectRatio?: number;
  /**
   * Texte mit der Zeichenfläche skalieren: Bei dieser Breite (px) gelten die angegebenen Schriftgrößen.
   * Für Stack-Layouts (Ziffernreihen, Matrizen), deren Abstände in Punkten festgelegt sind.
   */
  textReferenceWidth?: number;
  /** Szene für Phase 0 … (Anzahl Bildunterschriften − 1). */
  scene: (phase: number) => SceneInput;
}

/** Swift: `show(_ condition: Bool) -> Double` */
export const show = (condition: boolean) => (condition ? 1 : 0);

export const ORIGIN: Pt = [0, 0];

/** Parallelogramm 0, a, a+b, b */
export const parallelogram = (a: Pt, b: Pt): Pt[] => [ORIGIN, a, [a[0] + b[0], a[1] + b[1]], b];

export function flattenScene(input: SceneInput): SceneEl[] {
  const out: SceneEl[] = [];
  const walk = (items: SceneInput) => {
    for (const item of items) {
      if (Array.isArray(item)) walk(item as SceneInput);
      else out.push(item as SceneEl);
    }
  };
  walk(input);
  return out;
}

/** Element `k` in allen Phasen; prüft, dass jede Phase dieselben Elemente liefert. */
export function figureTracks(spec: FigureSpec, phases: number): SceneEl[][] {
  const scenes = Array.from({ length: phases }, (_, i) => flattenScene(spec.scene(i)));
  const keys = scenes[0].map((e) => e.key);
  if (new Set(keys).size !== keys.length) throw new Error(`Grafik: doppelte Schlüssel (${keys.join(',')})`);
  scenes.forEach((s, i) => {
    const k = s.map((e) => `${e.key}:${e.kind}`);
    const k0 = scenes[0].map((e) => `${e.key}:${e.kind}`);
    if (k.join('|') !== k0.join('|')) {
      throw new Error(`Grafik: Phase ${i} liefert andere Elemente als Phase 0`);
    }
  });
  return keys.map((_, k) => scenes.map((s) => s[k]));
}
