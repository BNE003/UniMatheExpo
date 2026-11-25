import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import captionsDe from '../src/visuals/captions/de.json';
import captionsEn from '../src/visuals/captions/en.json';
import { elementPath, labelPoint, regionPath } from '../src/visuals/geometry';
import { figureNames, resolveFigure } from '../src/visuals/registry';
import { figureTracks } from '../src/visuals/scene';

(globalThis as { __DEV__?: boolean }).__DEV__ = false;

const contentDir = join(__dirname, '..', 'assets', 'content');

function visualsUsed(lang: 'de' | 'en'): Set<string> {
  const used = new Set<string>();
  for (const topic of readdirSync(join(contentDir, lang))) {
    let lesson: { steps: { visual?: string }[] };
    try {
      lesson = JSON.parse(readFileSync(join(contentDir, lang, topic, 'lesson.json'), 'utf8'));
    } catch {
      continue;
    }
    for (const step of lesson.steps) if (step.visual) used.add(step.visual);
  }
  return used;
}

test('jede in den Lektionen verwendete Grafik ist vorhanden', () => {
  for (const lang of ['de', 'en'] as const) {
    const missing = [...visualsUsed(lang)].filter((name) => !resolveFigure(name, lang));
    assert.deepEqual(missing, [], `${lang}: fehlende Grafiken`);
  }
});

test('jede Swift-Grafik ist portiert und hat gleich viele Bildunterschriften in DE und EN', () => {
  const swiftNames = Object.keys(captionsDe).sort();
  assert.deepEqual(figureNames('de'), swiftNames);
  for (const name of swiftNames) {
    assert.equal((captionsEn as Record<string, string[]>)[name]?.length, (captionsDe as Record<string, string[]>)[name].length, name);
  }
});

test('alle Phasen liefern dieselben Elemente und gültige Geometrie', () => {
  const size = { width: 340, height: 340 };
  for (const lang of ['de', 'en'] as const) {
    for (const name of figureNames(lang)) {
      const figure = resolveFigure(name, lang)!;
      const { window } = figure.spec;
      const height = size.width / (figure.spec.aspectRatio ?? 1);
      const tracks = figureTracks(figure.spec, figure.captions.length);
      for (const track of tracks) {
        track.forEach((el, i) => {
          const where = `${lang}/${name}/${el.key}/Phase ${i}`;
          if (el.kind === 'label') {
            const p = labelPoint(el, el, 1, window, size.width, height);
            assert.ok(Number.isFinite(p[0]) && Number.isFinite(p[1]), where);
            return;
          }
          if (el.kind === 'region') {
            assert.ok(!regionPath(el.shapes, window, size.width, height).includes('NaN'), where);
            return;
          }
          assert.ok(!elementPath(el, el, 1, window, size.width, height).includes('NaN'), where);
          if (i + 1 < track.length) {
            const mid = elementPath(el, track[i + 1], 0.5, window, size.width, height);
            assert.ok(!mid.includes('NaN'), `${where} → ${i + 1}`);
          }
          assert.ok(Number.isFinite(el.opacity ?? 1), where);
        });
      }
    }
  }
});
