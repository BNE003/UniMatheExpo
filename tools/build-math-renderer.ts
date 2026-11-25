/**
 * Baut assets/math/renderer.html: eine einzige, vollständig offline lauffähige HTML-Datei mit
 * MathJax 3.2.2 (tex-svg, gleiche Version wie MathJax.bundle der iOS-App), den Inter-Webschriften
 * und der Renderer-Laufzeit.
 *
 *   npm run build-math
 *
 * Warum SVG statt CHTML (iOS): Die SVG-Ausgabe braucht keine nachgeladenen Schriftdateien und
 * funktioniert deshalb in einer einzelnen Datei ohne Dateizugriffe. Die Formeln sehen gleich aus
 * (gleiche TeX-Schriften).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(__dirname, '..');
const OUT = join(ROOT, 'assets/math/renderer.html');

const mathjaxPackage = JSON.parse(readFileSync(join(ROOT, 'node_modules/mathjax/package.json'), 'utf8'));
if (mathjaxPackage.version !== '3.2.2') {
  throw new Error(`MathJax ${mathjaxPackage.version} gefunden, erwartet 3.2.2 (wie iOS).`);
}
const mathjax = readFileSync(join(ROOT, 'node_modules/mathjax/es5/tex-svg.js'), 'utf8');
const css = readFileSync(join(__dirname, 'math-renderer/renderer.css'), 'utf8');
const runtime = readFileSync(join(__dirname, 'math-renderer/runtime.js'), 'utf8');

/** Wie AppTypography.webFontFaces in iOS: Inter als data-URI, damit keine Dateizugriffe nötig sind. */
const fontFace = (file: string, weight: string) =>
  `@font-face{font-family:'Inter';font-weight:${weight};font-style:normal;src:url(data:font/woff2;base64,${readFileSync(
    join(ROOT, 'assets/fonts/web', file),
  ).toString('base64')}) format('woff2');}`;

/** MathJax-Konfiguration wie LaTeXView.swift (gleiche Pakete und Begrenzer). */
const config = {
  tex: {
    inlineMath: [
      ['$', '$'],
      ['\\(', '\\)'],
    ],
    displayMath: [
      ['$$', '$$'],
      ['\\[', '\\]'],
    ],
    processEscapes: true,
    processEnvironments: true,
    packages: ['base', 'ams', 'noerrors', 'noundefined'],
  },
  options: {
    skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre'],
    ignoreHtmlClass: 'tex2jax_ignore',
    processHtmlClass: 'tex2jax_process',
  },
  svg: { fontCache: 'global' },
  startup: { typeset: false },
};

/** `</script>` darf in eingebettetem JavaScript nicht vorkommen. */
const inlineScript = (code: string) => code.replace(/<\/script/gi, '<\\/script');

const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<!-- Generiert von tools/build-math-renderer.ts – nicht von Hand ändern. MathJax ${mathjaxPackage.version} (Apache-2.0), Inter (SIL OFL 1.1). -->
<style>${fontFace('Inter-Regular.woff2', '400 500')}${fontFace('Inter-SemiBold.woff2', '600 700')}</style>
<style>${css}</style>
<script>window.MathJax = ${JSON.stringify(config)};</script>
<script>${inlineScript(mathjax)}</script>
</head>
<body>
<div id="root"></div>
<script>${inlineScript(runtime)}</script>
</body>
</html>
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, html);
console.log(`renderer.html geschrieben (${(html.length / 1024 / 1024).toFixed(2)} MB)`);
