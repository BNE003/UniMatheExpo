/**
 * Zuordnung `visual`-Name (aus den Lektions-JSONs) → Grafik.
 * Entspricht dem `switch kind` in LessonVisualView (LessonVectorVisuals.swift:15).
 * Noch nicht portierte Grafiken liefern `undefined`; die Lektion bleibt dann ohne Grafik benutzbar.
 */
import type { Lang } from '@/content/types';

import captionsDe from './captions/de.json';
import captionsEn from './captions/en.json';
import { linearMapFigures } from './figures/linearMaps';
import type { FigureSpec } from './scene';

const captions: Record<Lang, Record<string, string[]>> = { de: captionsDe, en: captionsEn };

const figures: Record<Lang, Record<string, FigureSpec>> = {
  de: { ...linearMapFigures('de') },
  en: { ...linearMapFigures('en') },
};

export interface ResolvedFigure {
  spec: FigureSpec;
  captions: string[];
}

export function resolveFigure(name: string, lang: Lang): ResolvedFigure | undefined {
  const spec = figures[lang][name];
  const texts = captions[lang][name] ?? captions.de[name];
  if (!spec || !texts?.length) {
    if (__DEV__) console.warn(`Grafik „${name}“ ist noch nicht portiert.`);
    return undefined;
  }
  return { spec, captions: texts };
}

/** Alle portierten Grafiknamen (für Tests und den Importbericht). */
export const portedFigureNames = (): string[] => Object.keys(figures.de).sort();
