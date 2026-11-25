/**
 * Erzeugt .preview/math-preview.html: rendert ausgewählte Lektionsschritte, eine Zusammenfassung und
 * eine Übung mit assets/math/renderer.html im Browser (gleiche Vorlagen wie in der App).
 * Dient zum Prüfen der Formeldarstellung ohne Android-Gerät.
 *
 *   npm run preview-math -- [themen-id] [lang]     (Standard: 3.3 de)
 *   python3 -m http.server 8765   # im Projektordner, dann http://localhost:8765/.preview/math-preview.html
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import type { ExerciseFile, Lang, Lesson, Summary } from '../src/content/types';
import { exerciseTextHtml, lessonStepSegments, summaryHtml } from '../src/math/templates';
import { webColors } from '../src/theme/tokens';

const ROOT = resolve(__dirname, '..');
const [topicId = '3.3', lang = 'de'] = process.argv.slice(2) as [string?, Lang?];
const read = <T>(rel: string): T => JSON.parse(readFileSync(join(ROOT, 'assets/content', lang, topicId, rel), 'utf8'));

const lesson = read<Lesson>('lesson.json');
const summary = read<Summary>('summary.json');
const exercises = read<ExerciseFile>('exercises.json');

const vars = (scheme: 'light' | 'dark') => {
  const c = webColors[scheme];
  return {
    'primary-color': c.primary,
    'text-color': c.text,
    'muted-text-color': c.muted,
    'card-background': c.card,
    'math-block-background': c.mathBlock,
    'border-color': c.border,
    'surface-strong': c.surfaceStrong,
    subtle: c.subtle,
    hairline: c.hairline,
  };
};

interface Item {
  label: string;
  html: string;
}
const items: Item[] = [];
lesson.steps.forEach((step, i) => {
  const seg = lessonStepSegments(step, lang);
  items.push({ label: `Schritt ${i + 1}${step.visual ? ` (vor Grafik ${step.visual})` : ''}`, html: seg.before });
  if (seg.after) items.push({ label: `Schritt ${i + 1} (nach Grafik)`, html: seg.after });
});
if (summary.html) items.push({ label: 'Zusammenfassung', html: summaryHtml(summary.html) });
for (const ex of exercises.exercises.slice(0, 3)) {
  items.push({
    label: `Übung ${ex.id}: Aufgabe + Lösung`,
    html: [ex.description, ...ex.solutionSteps].map(exerciseTextHtml).join(''),
  });
}

const page = `<!DOCTYPE html><html lang="${lang}"><head><meta charset="utf-8"><title>Formel-Vorschau ${topicId}</title>
<style>
body{font-family:system-ui;margin:0;padding:16px;background:#eef1f6}
.row{display:flex;gap:24px;flex-wrap:wrap}
.col{width:390px}
.card{margin:0 0 18px;padding:20px;border-radius:12px}
.light{background:rgb(245,247,252)} .dark{background:rgb(20,23,28);color:#e8ecf4}
h3{font:600 12px system-ui;margin:0 0 8px;color:#888}
iframe{border:0;width:100%;height:40px;display:block}
#summary{position:sticky;top:0;background:#fff;padding:8px;border-radius:8px;margin-bottom:12px;font:13px system-ui}
</style></head><body>
<div id="summary">Rendering …</div>
<div class="row">${(['light', 'dark'] as const)
  .map(
    (scheme) =>
      `<div class="col">${items
        .map(
          (item, i) =>
            `<div class="card ${scheme}"><h3>${item.label}</h3><iframe data-i="${i}" data-scheme="${scheme}" src="../assets/math/renderer.html"></iframe></div>`,
        )
        .join('')}</div>`,
  )
  .join('')}</div>
<script>
const items = ${JSON.stringify(items.map((x) => x.html))};
const vars = ${JSON.stringify({ light: vars('light'), dark: vars('dark') })};
const frames = [...document.querySelectorAll('iframe')];
const stats = { rendered: 0, errors: 0, mathErrors: 0, maxMs: 0, total: frames.length, failed: [] };
window.addEventListener('message', (e) => {
  const frame = frames.find((f) => f.contentWindow === e.source);
  if (!frame) return;
  const msg = JSON.parse(e.data);
  if (msg.type === 'ready') {
    frame.contentWindow.UM.render({ html: items[+frame.dataset.i], vars: vars[frame.dataset.scheme], lang: '${lang}' });
  } else if (msg.type === 'height') {
    frame.style.height = msg.value + 'px';
  } else if (msg.type === 'rendered') {
    stats.rendered++; stats.mathErrors += msg.mathErrors; stats.maxMs = Math.max(stats.maxMs, msg.ms);
    if (msg.mathErrors) stats.failed.push(frame.dataset.i);
  } else if (msg.type === 'error') {
    stats.errors++; stats.failed.push(frame.dataset.i + ': ' + msg.message);
  }
  document.getElementById('summary').textContent = JSON.stringify(stats);
  window.__stats = stats;
});
</script></body></html>`;

mkdirSync(join(ROOT, '.preview'), { recursive: true });
writeFileSync(join(ROOT, '.preview/math-preview.html'), page);
console.log(`.preview/math-preview.html: ${items.length} Blöcke × 2 Farbschemata (${topicId}, ${lang})`);
