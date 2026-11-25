/**
 * Erzeugt die App-Icons und das Splash-Bild aus dem iOS-App-Icon (weißes „i²“ auf Farbverlauf).
 *
 * - assets/images/icon.png                     1024 px, das iOS-Icon unverändert
 * - assets/images/android-icon-background.png  1024 px, rekonstruierter Farbverlauf (ohne Schrift)
 * - assets/images/android-icon-foreground.png  1024 px, freigestelltes „i²“ (transparent)
 * - assets/images/android-icon-monochrome.png  1024 px, „i²“ als weiße Silhouette (Android-Themensymbole)
 * - assets/images/splash-icon.png              512 px, Icon mit abgerundeten Ecken
 *
 * Android schneidet adaptive Icons zu: Sichtbar ist nur das innere 72/108 der Fläche. Vorder- und
 * Hintergrund werden deshalb so skaliert, dass der sichtbare Teil genau dem iOS-Icon entspricht.
 *
 * Aufruf: npx tsx tools/build-icons.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { PNG } from 'pngjs';

const root = join(__dirname, '..');
const config = JSON.parse(readFileSync(join(__dirname, 'content.config.json'), 'utf8')) as { swiftRepo: string; appDir: string };
const iconDir = join(config.swiftRepo, config.appDir, 'Assets.xcassets/AppIcon.appiconset');
const contents = JSON.parse(readFileSync(join(iconDir, 'Contents.json'), 'utf8')) as { images: { filename?: string; appearances?: unknown }[] };
const sourceName = contents.images.find((i) => i.filename && !i.appearances)?.filename;
if (!sourceName) throw new Error('Kein iOS-App-Icon gefunden');
const sourceBuffer = readFileSync(join(iconDir, sourceName));
const src = PNG.sync.read(sourceBuffer);
const N = src.width;
if (src.height !== N) throw new Error('Icon ist nicht quadratisch');

const px = (img: PNG, x: number, y: number) => {
  const i = (y * img.width + x) * 4;
  return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]];
};

// ---------------------------------------------------------------------------
// 1. Farbverlauf als lineares Modell c = a + b·x + c·y je Kanal (kleinste Quadrate)

/** Pixel weit weg von Weiß gehören sicher zum Verlauf. */
const isBackground = (r: number, g: number, b: number) => Math.min(r, g, b) < 200 && !(r > 230 && g > 230 && b > 230);

function solve3(m: number[][], v: number[]): number[] {
  // Gauß-Elimination für 3×3
  const a = m.map((row, i) => [...row, v[i]]);
  for (let col = 0; col < 3; col++) {
    let pivot = col;
    for (let r = col + 1; r < 3; r++) if (Math.abs(a[r][col]) > Math.abs(a[pivot][col])) pivot = r;
    [a[col], a[pivot]] = [a[pivot], a[col]];
    for (let r = 0; r < 3; r++) {
      if (r === col) continue;
      const f = a[r][col] / a[col][col];
      for (let k = col; k < 4; k++) a[r][k] -= f * a[col][k];
    }
  }
  return a.map((row, i) => row[3] / row[i]);
}

const sums = { n: 0, x: 0, y: 0, xx: 0, yy: 0, xy: 0 };
const rhs = [0, 1, 2].map(() => ({ c: 0, cx: 0, cy: 0 }));
for (let y = 0; y < N; y += 2) {
  for (let x = 0; x < N; x += 2) {
    const [r, g, b] = px(src, x, y);
    if (!isBackground(r, g, b)) continue;
    const u = x / (N - 1);
    const v = y / (N - 1);
    sums.n++;
    sums.x += u;
    sums.y += v;
    sums.xx += u * u;
    sums.yy += v * v;
    sums.xy += u * v;
    [r, g, b].forEach((c, k) => {
      rhs[k].c += c;
      rhs[k].cx += c * u;
      rhs[k].cy += c * v;
    });
  }
}
const normal = [
  [sums.n, sums.x, sums.y],
  [sums.x, sums.xx, sums.xy],
  [sums.y, sums.xy, sums.yy],
];
const model = rhs.map((k) => solve3(normal, [k.c, k.cx, k.cy]));
const gradient = (u: number, v: number) => model.map(([a, b, c]) => Math.max(0, Math.min(255, a + b * u + c * v)));

// Güte des Modells
let err = 0;
let count = 0;
for (let y = 0; y < N; y += 8) {
  for (let x = 0; x < N; x += 8) {
    const [r, g, b] = px(src, x, y);
    if (!isBackground(r, g, b)) continue;
    const m = gradient(x / (N - 1), y / (N - 1));
    err += Math.abs(m[0] - r) + Math.abs(m[1] - g) + Math.abs(m[2] - b);
    count += 3;
  }
}
console.log(`Verlauf: mittlere Abweichung ${(err / count).toFixed(2)} (0–255)`);

// ---------------------------------------------------------------------------
// 2. Schrift freistellen: Deckkraft aus dem Abstand zwischen Verlauf und Weiß

const glyph = new Float32Array(N * N);
for (let y = 0; y < N; y++) {
  for (let x = 0; x < N; x++) {
    const [r, g, b] = px(src, x, y);
    const bg = gradient(x / (N - 1), y / (N - 1));
    // Pixel = alpha·Weiß + (1 − alpha)·Verlauf → alpha je Kanal schätzen, mitteln
    let sum = 0;
    let w = 0;
    [r, g, b].forEach((c, k) => {
      const range = 255 - bg[k];
      if (range > 40) {
        sum += ((c - bg[k]) / range) * range;
        w += range;
      }
    });
    const alpha = w > 0 ? sum / w : 0;
    glyph[y * N + x] = Math.max(0, Math.min(1, (alpha - 0.04) / 0.92));
  }
}

// ---------------------------------------------------------------------------
// 3. Bilder schreiben

const OUT = 1024;
/** Sichtbarer Anteil eines adaptiven Icons (72 dp von 108 dp) */
const VISIBLE = 72 / 108;

function write(name: string, img: PNG) {
  writeFileSync(join(root, 'assets/images', name), PNG.sync.write(img));
  console.log(`assets/images/${name}`);
}

/** Bilineares Abtasten der Schriftmaske (Quellkoordinaten in px) */
function sampleGlyph(sx: number, sy: number) {
  if (sx < 0 || sy < 0 || sx > N - 1 || sy > N - 1) return 0;
  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  const x1 = Math.min(x0 + 1, N - 1);
  const y1 = Math.min(y0 + 1, N - 1);
  const fx = sx - x0;
  const fy = sy - y0;
  const top = glyph[y0 * N + x0] * (1 - fx) + glyph[y0 * N + x1] * fx;
  const bottom = glyph[y1 * N + x0] * (1 - fx) + glyph[y1 * N + x1] * fx;
  return top * (1 - fy) + bottom * fy;
}

/** Ausgabekoordinate (0…1) des adaptiven Icons → Koordinate im iOS-Icon (0…1) */
const toSource = (t: number) => (t - 0.5) / VISIBLE + 0.5;

const background = new PNG({ width: OUT, height: OUT });
const foreground = new PNG({ width: OUT, height: OUT });
const monochrome = new PNG({ width: OUT, height: OUT });
for (let y = 0; y < OUT; y++) {
  for (let x = 0; x < OUT; x++) {
    const i = (y * OUT + x) * 4;
    const u = toSource(x / (OUT - 1));
    const v = toSource(y / (OUT - 1));
    const [r, g, b] = gradient(u, v);
    background.data.set([Math.round(r), Math.round(g), Math.round(b), 255], i);
    // 2×2-Überabtastung gegen Treppenkanten
    let a = 0;
    for (const dy of [0.25, 0.75]) {
      for (const dx of [0.25, 0.75]) {
        a += sampleGlyph(toSource((x + dx) / OUT) * (N - 1), toSource((y + dy) / OUT) * (N - 1));
      }
    }
    const alpha = Math.round((a / 4) * 255);
    foreground.data.set([255, 255, 255, alpha], i);
    monochrome.data.set([255, 255, 255, alpha], i);
  }
}

writeFileSync(join(root, 'assets/images/icon.png'), sourceBuffer);
console.log('assets/images/icon.png');
write('android-icon-background.png', background);
write('android-icon-foreground.png', foreground);
write('android-icon-monochrome.png', monochrome);

// Splash: Icon mit abgerundeten Ecken (Radius 22,37 % wie iOS) auf transparentem Grund
const S = 512;
const splash = new PNG({ width: S, height: S });
const radius = S * 0.2237;
const insideRounded = (x: number, y: number) => {
  const cx = Math.min(Math.max(x, radius), S - radius);
  const cy = Math.min(Math.max(y, radius), S - radius);
  return Math.hypot(x - cx, y - cy) <= radius;
};
for (let y = 0; y < S; y++) {
  for (let x = 0; x < S; x++) {
    let cover = 0;
    for (const dy of [0.25, 0.75]) for (const dx of [0.25, 0.75]) if (insideRounded(x + dx, y + dy)) cover++;
    const sx = Math.min(N - 1, Math.round(((x + 0.5) / S) * N));
    const sy = Math.min(N - 1, Math.round(((y + 0.5) / S) * N));
    const [r, g, b] = px(src, sx, sy);
    splash.data.set([r, g, b, Math.round((cover / 4) * 255)], (y * S + x) * 4);
  }
}
write('splash-icon.png', splash);
