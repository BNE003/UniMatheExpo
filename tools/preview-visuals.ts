/**
 * Erzeugt .preview/visuals.html: zeichnet jede erklärende Grafik in jeder Phase (und optional die
 * Mitte jedes Übergangs) als statisches SVG – mit derselben Geometrie wie die App.
 * Dient zur Sichtprüfung gegen die iOS-App ohne Gerät.
 *
 *   npm run preview-visuals -- [lang] [name …]     (Standard: de, alle Grafiken)
 *   python3 -m http.server 8791 --bind 127.0.0.1   # dann http://127.0.0.1:8791/.preview/visuals.html
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import type { Lang } from '../src/content/types';
import { palettes, withAlpha, type Palette } from '../src/theme/tokens';
import { coordinateGridPaths, elementPath, labelPoint, regionPath } from '../src/visuals/geometry';
import { figureNames, resolveFigure } from '../src/visuals/registry';
import { figureTracks, type ColorName, type LabelEl, type Paint, type SceneEl, type ShapeEl } from '../src/visuals/scene';

(globalThis as { __DEV__?: boolean }).__DEV__ = false;

const ROOT = resolve(__dirname, '..');
const [langArg = 'de', ...only] = process.argv.slice(2);
const lang = langArg as Lang;
const colors: Palette = palettes.light;
const WIDTH = Number(process.env.PREVIEW_WIDTH ?? 300);

const named = (name: ColorName): string =>
  ({
    first: colors.accent,
    second: colors.orange,
    result: colors.difficulty.easy,
    warning: colors.difficulty.hard,
    extra: colors.purple,
    primary: colors.text,
    secondary: colors.textSecondary,
    surface: colors.surface,
    surfaceStrong: colors.surfaceStrong,
    white: '#FFFFFF',
  })[name];
const paint = (p?: Paint) => (p ? withAlpha(named(p.color), p.alpha ?? 1) : 'none');
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function shapeSvg(a: ShapeEl, b: ShapeEl, t: number, w: number, h: number, window: Parameters<typeof elementPath>[3]): string {
  const el = t < 0.5 ? a : b;
  const d = elementPath(a, b, t, window, w, h);
  const opacity = (a.opacity ?? 1) + ((b.opacity ?? 1) - (a.opacity ?? 1)) * t;
  if (!d || opacity <= 0.001) return '';
  let stroke = 'none';
  let fill = 'none';
  let width = 0;
  let dash: readonly number[] | undefined;
  let cap = 'butt';
  if (el.kind === 'arrow') {
    stroke = withAlpha(named(el.color), el.alpha ?? 1);
    width = el.width ?? 3;
    dash = el.dashed ? [5, 5] : undefined;
    cap = 'round';
  } else if (el.kind === 'line' || el.kind === 'grid') {
    stroke = withAlpha(named(el.color), el.alpha ?? 1);
    width = el.width ?? 1;
    dash = el.kind === 'line' ? el.dash : undefined;
  } else {
    stroke = paint(el.stroke);
    fill = paint(el.fill);
    width = el.stroke?.width ?? 0;
    dash = el.stroke?.dash;
    cap = el.stroke?.cap ?? 'butt';
  }
  return `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="${cap}" stroke-linejoin="${cap === 'round' ? 'round' : 'miter'}"${
    dash ? ` stroke-dasharray="${dash.join(' ')}"` : ''
  } opacity="${opacity.toFixed(3)}"/>`;
}

function labelSvg(a: LabelEl, b: LabelEl, t: number, w: number, h: number, window: Parameters<typeof elementPath>[3], textScale: number): string {
  const el = t < 0.5 ? a : b;
  const opacity = (a.opacity ?? 1) + ((b.opacity ?? 1) - (a.opacity ?? 1)) * t;
  if (opacity <= 0.001 || !el.text) return '';
  const p = labelPoint(a, b, t, window, w, h);
  const math = (el.style ?? 'math') === 'math';
  const offA = a.offset ?? (math ? [12, -10] : [0, 0]);
  const offB = b.offset ?? (math ? [12, -10] : [0, 0]);
  const x = p[0] + offA[0] + (offB[0] - offA[0]) * t;
  const y = p[1] + offA[1] + (offB[1] - offA[1]) * t;
  const size = (el.size ?? (math ? 13 : 15)) * (el.scale ?? 1) * textScale;
  const family = math || el.italic || el.font === 'serif' ? 'Georgia, serif' : el.font === 'mono' ? 'Menlo, monospace' : 'Inter, -apple-system, sans-serif';
  const style = math || el.italic ? 'italic' : 'normal';
  const weight = { regular: 400, semibold: 600, bold: 700 }[el.weight ?? 'semibold'];
  const anchor = el.anchor === 'left' ? 'start' : 'middle';
  const chip = el.chip ?? (math ? { shape: 'rounded' as const, radius: 4, padX: 3, fill: { color: 'surfaceStrong' as const, alpha: 0.75 } } : undefined);
  let bg = '';
  if (chip) {
    const tw = [...el.text].length * size * 0.58;
    const cw = chip.w ?? tw + 2 * (chip.padX ?? 0);
    const ch = chip.h ?? size * 1.25 + 2 * (chip.padY ?? 0);
    const rx = chip.shape === 'circle' ? cw / 2 : chip.shape === 'capsule' ? ch / 2 : chip.shape === 'rect' ? 0 : (chip.radius ?? 6);
    const cx = anchor === 'start' ? x : x - cw / 2;
    bg = `<rect x="${cx}" y="${y - ch / 2}" width="${cw}" height="${ch}" rx="${rx}" fill="${paint(chip.fill)}" stroke="${paint(chip.stroke)}" stroke-width="${chip.stroke?.width ?? 0}"/>`;
  }
  const color = withAlpha(named(el.color), el.alpha ?? 1);
  return `<g opacity="${opacity.toFixed(3)}">${bg}<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="central" font-family="${family}" font-style="${style}" font-weight="${weight}" font-size="${size}" fill="${color}">${esc(el.text)}</text></g>`;
}

function frameSvg(tracks: SceneEl[][], a: number, b: number, t: number, spec: NonNullable<ReturnType<typeof resolveFigure>>['spec'], id: string) {
  const w = WIDTH;
  const h = w / (spec.aspectRatio ?? 1);
  const parts: string[] = [];
  if (spec.showGrid !== false) {
    const g = coordinateGridPaths(spec.window, w, h);
    parts.push(`<path d="${g.grid}" stroke="${colors.textSecondary}" stroke-opacity="0.25" stroke-width="0.5"/>`);
    parts.push(`<path d="${g.axes}" stroke="${colors.textSecondary}" stroke-opacity="0.9" stroke-width="1"/>`);
  }
  const labels: string[] = [];
  tracks.forEach((track, k) => {
    const ea = track[a];
    const eb = track[b];
    if (ea.kind === 'label' && eb.kind === 'label') labels.push(labelSvg(ea, eb, t, w, h, spec.window, spec.textReferenceWidth ? w / spec.textReferenceWidth : 1));
    else if (ea.kind === 'region' && eb.kind === 'region') {
      const el = t < 0.5 ? ea : eb;
      const opacity = (ea.opacity ?? 1) + ((eb.opacity ?? 1) - (ea.opacity ?? 1)) * t;
      if (opacity <= 0.001) return;
      const clipId = `${id}c${k}`;
      const clip = el.clip
        ? `<clipPath id="${clipId}"><path d="${regionPath(el.clip.shapes, spec.window, w, h)}" clip-rule="${el.clip.rule ?? 'nonzero'}"/></clipPath>`
        : '';
      parts.push(
        `<g opacity="${opacity}">${clip}<path d="${regionPath(el.shapes, spec.window, w, h)}" fill="${paint(el.fill)}" fill-rule="${el.rule ?? 'nonzero'}"${
          el.clip ? ` clip-path="url(#${clipId})"` : ''
        }/></g>`,
      );
    } else parts.push(shapeSvg(ea as ShapeEl, eb as ShapeEl, t, w, h, spec.window));
  });
  return `<svg width="${w}" height="${h.toFixed(1)}" viewBox="0 0 ${w} ${h.toFixed(1)}">${parts.join('')}${labels.join('')}</svg>`;
}

const names = only.length ? only : figureNames(lang);
const sections = names.map((name) => {
  const figure = resolveFigure(name, lang);
  if (!figure) return `<section><h2>${name}</h2><p>fehlt</p></section>`;
  const tracks = figureTracks(figure.spec, figure.captions.length);
  const cells = figure.captions.map((caption, i) => {
    const mid = i > 0 ? `<div class="mid">${frameSvg(tracks, i - 1, i, 0.5, figure.spec, `${name}m${i}`)}<small>Übergang ${i - 1}→${i}</small></div>` : '';
    return `${mid}<figure>${frameSvg(tracks, i, i, 1, figure.spec, `${name}p${i}`)}<figcaption><b>${i}</b> ${esc(caption)}</figcaption></figure>`;
  });
  return `<section id="${name}"><h2>${name}</h2><div class="row">${cells.join('')}</div></section>`;
});

const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>Grafiken – Vorschau</title>
<style>
body{font-family:-apple-system,Inter,sans-serif;background:${colors.backgroundSecondary};margin:16px;color:${colors.text}}
h2{font-size:15px;margin:18px 0 6px}
.row{display:flex;gap:10px;overflow-x:auto;padding-bottom:6px}
figure,.mid{margin:0;background:${colors.surfaceStrong};border-radius:12px;padding:8px;flex:0 0 auto;width:${WIDTH}px}
.mid{display:none;background:#fff8e6}
body.mids .mid{display:block}
figcaption,small{font-size:11px;line-height:1.35;color:#444;display:block;margin-top:4px}
nav{position:sticky;top:0;background:${colors.backgroundSecondary};padding:6px 0;font-size:12px}
</style></head><body${process.env.PREVIEW_MIDS ? ' class="mids"' : ''}>
<nav><label><input type="checkbox" onchange="document.body.classList.toggle('mids',this.checked)"> Übergänge (Mitte) zeigen</label> · ${names.length} Grafiken</nav>
${sections.join('\n')}
</body></html>`;

const out = join(ROOT, '.preview');
mkdirSync(out, { recursive: true });
const file = process.env.PREVIEW_OUT ?? 'visuals.html';
writeFileSync(join(out, file), html);
console.log(`.preview/${file}: ${names.length} Grafiken (${lang})`);
