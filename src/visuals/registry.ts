/**
 * Zuordnung `visual`-Name (aus den Lektions-JSONs) → Grafik.
 * Entspricht dem `switch kind` in LessonVisualView (LessonVectorVisuals.swift:15).
 * Die Bildunterschriften kommen aus captions/{de,en}.json (erzeugt mit `npm run import-captions`).
 */
import type { Lang } from '@/content/types';

import captionsDe from './captions/de.json';
import captionsEn from './captions/en.json';
import { algebraFigures } from './figures/algebra';
import { analysisFigures } from './figures/analysis';
import { bridgeFigures } from './figures/bridge';
import { linearMapFigures } from './figures/linearMaps';
import { numericsFigures } from './figures/numerics';
import { setFigures } from './figures/sets';
import { vectorFigures } from './figures/vectors';
import type { FigureSpec } from './scene';

const captions: Record<Lang, Record<string, string[]>> = { de: captionsDe, en: captionsEn };

const build = (lang: Lang): Record<string, FigureSpec> => ({
  ...vectorFigures(lang),
  ...linearMapFigures(lang),
  ...setFigures(lang),
  ...algebraFigures(lang),
  ...analysisFigures(lang),
  ...bridgeFigures(lang),
  ...numericsFigures(lang),
});

const cache: Partial<Record<Lang, Record<string, FigureSpec>>> = {};
const figuresFor = (lang: Lang) => (cache[lang] ??= build(lang));

export interface ResolvedFigure {
  spec: FigureSpec;
  captions: string[];
}

export function resolveFigure(name: string, lang: Lang): ResolvedFigure | undefined {
  const spec = figuresFor(lang)[name];
  const texts = captions[lang][name] ?? captions.de[name];
  if (!spec || !texts?.length) {
    if (__DEV__) console.warn(`Grafik „${name}“ ist nicht vorhanden.`);
    return undefined;
  }
  return { spec, captions: texts };
}

/** Alle Grafiknamen (für Tests). */
export const figureNames = (lang: Lang = 'de'): string[] => Object.keys(figuresFor(lang)).sort();
