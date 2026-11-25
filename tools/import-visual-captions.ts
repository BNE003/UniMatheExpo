/**
 * Liest die Bildunterschriften der erklärenden Grafiken aus Views/LessonVectorVisuals.swift
 * und schreibt src/visuals/captions/{de,en}.json.
 *
 * - `bk("de", "en")` liefert beide Sprachen direkt.
 * - Reine deutsche Strings (in iOS auch im englischen Modus deutsch) bekommen ihre englische
 *   Fassung aus tools/visual-captions-en.json. Fehlt dort eine, bricht das Skript ab.
 *
 * Aufruf: npm run import-captions
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const config = JSON.parse(readFileSync(join(here, 'content.config.json'), 'utf8')) as { swiftRepo: string; appDir: string };
const swift = readFileSync(join(config.swiftRepo, config.appDir, 'Views/LessonVectorVisuals.swift'), 'utf8');
const enOverrides = JSON.parse(readFileSync(join(here, 'visual-captions-en.json'), 'utf8')) as Record<string, string[]>;

interface Caption {
  de: string;
  en?: string;
}

/** Swift-Stringliteral ab Position `i` (zeigt auf das öffnende "). */
function readString(src: string, i: number): { value: string; end: number } {
  let value = '';
  let j = i + 1;
  while (j < src.length) {
    const ch = src[j];
    if (ch === '\\') {
      const next = src[j + 1];
      if (next === '(') throw new Error(`String-Interpolation in Bildunterschrift bei Offset ${j}`);
      value += next === 'n' ? '\n' : next === 't' ? '\t' : next;
      j += 2;
      continue;
    }
    if (ch === '"') return { value, end: j + 1 };
    value += ch;
    j++;
  }
  throw new Error('Unbeendetes Stringliteral');
}

const skipSpace = (src: string, i: number) => {
  while (i < src.length && /\s/.test(src[i])) i++;
  return i;
};

/** Ein Element einer Caption-Liste: "…" oder bk("…", "…"). */
function readCaption(src: string, i: number): { caption: Caption; end: number } | null {
  i = skipSpace(src, i);
  if (src[i] === '"') {
    const s = readString(src, i);
    return { caption: { de: s.value }, end: s.end };
  }
  if (src.startsWith('bk(', i)) {
    let j = skipSpace(src, i + 3);
    const de = readString(src, j);
    j = skipSpace(src, de.end);
    if (src[j] !== ',') throw new Error('bk(): Komma erwartet');
    j = skipSpace(src, j + 1);
    const en = readString(src, j);
    j = skipSpace(src, en.end);
    if (src[j] !== ')') throw new Error('bk(): ) erwartet');
    return { caption: { de: de.value, en: en.value }, end: j + 1 };
  }
  return null;
}

/** Liest `[ a, b, … ]` ab der öffnenden Klammer. */
function readCaptionArray(src: string, open: number): Caption[] | null {
  const out: Caption[] = [];
  let i = open + 1;
  for (;;) {
    i = skipSpace(src, i);
    if (src[i] === ']') return out;
    const item = readCaption(src, i);
    if (!item) return null;
    out.push(item.caption);
    i = skipSpace(src, item.end);
    if (src[i] === ',') i++;
  }
}

/** Erste Liste nach `captions:` oder `captions =` im Text. */
function firstCaptionArray(src: string): Caption[] | null {
  const re = /captions\s*(?::|=)\s*\[/g;
  for (let m = re.exec(src); m; m = re.exec(src)) {
    const list = readCaptionArray(src, m.index + m[0].length - 1);
    if (list && list.length) return list;
  }
  return null;
}

/** Alle `caption: …` in Reihenfolge (ClockFrame, DiagramFrame). */
function frameCaptions(src: string): Caption[] {
  const out: Caption[] = [];
  const re = /\bcaption:\s*/g;
  for (let m = re.exec(src); m; m = re.exec(src)) {
    const item = readCaption(src, m.index + m[0].length);
    if (item) out.push(item.caption);
  }
  return out;
}

/** Quelltext des Structs `name` bis zur nächsten Deklaration auf oberster Ebene. */
function structBody(name: string): string {
  const start = swift.search(new RegExp(`^(private |fileprivate )?struct ${name}\\b`, 'm'));
  if (start < 0) throw new Error(`Struct ${name} nicht gefunden`);
  const rest = swift.slice(start + 1);
  const next = rest.search(/^(private |fileprivate )?(struct|func|let|enum) /m);
  return swift.slice(start, next < 0 ? undefined : start + 1 + next);
}

// switch kind { case "name": … }
const switchStart = swift.indexOf('switch kind {');
const switchEnd = swift.indexOf('default: EmptyView()', switchStart);
const switchSrc = swift.slice(switchStart, switchEnd);
const cases = [...switchSrc.matchAll(/case "([A-Za-z0-9]+)":/g)];

const de: Record<string, string[]> = {};
const en: Record<string, string[]> = {};
const missing: string[] = [];
const usedOverrides = new Set<string>();

cases.forEach((m, idx) => {
  const name = m[1];
  const exprStart = m.index! + m[0].length;
  const exprEnd = idx + 1 < cases.length ? cases[idx + 1].index! : switchSrc.length;
  const expr = switchSrc.slice(exprStart, exprEnd);

  let captions: Caption[] | null = null;
  if (/\bcaption:/.test(expr)) captions = frameCaptions(expr);
  else if (/captions:\s*\[/.test(expr)) captions = firstCaptionArray(expr);
  else {
    const struct = /^\s*([A-Za-z0-9]+)\(/.exec(expr)?.[1];
    if (!struct) throw new Error(`${name}: Ausdruck nicht erkannt`);
    captions = firstCaptionArray(structBody(struct));
  }
  if (!captions?.length) throw new Error(`${name}: keine Bildunterschriften gefunden`);

  de[name] = captions.map((c) => c.de);
  const needsOverride = captions.some((c) => c.en === undefined);
  if (needsOverride) {
    const override = enOverrides[name];
    usedOverrides.add(name);
    if (!override) {
      missing.push(name);
      return;
    }
    if (override.length !== captions.length) {
      throw new Error(`${name}: ${captions.length} Bildunterschriften in Swift, ${override.length} in visual-captions-en.json`);
    }
    en[name] = captions.map((c, i) => c.en ?? override[i]);
  } else {
    en[name] = captions.map((c) => c.en!);
  }
});

const unused = Object.keys(enOverrides).filter((k) => !usedOverrides.has(k));
if (unused.length) console.warn(`Nicht verwendete englische Übersetzungen: ${unused.join(', ')}`);
if (missing.length) {
  console.error(`Englische Übersetzung fehlt für: ${missing.join(', ')}`);
  console.error(JSON.stringify(Object.fromEntries(missing.map((k) => [k, de[k]])), null, 2));
  process.exit(1);
}

const sorted = (o: Record<string, string[]>) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(join(root, 'src/visuals/captions/de.json'), JSON.stringify(sorted(de), null, 2) + '\n');
writeFileSync(join(root, 'src/visuals/captions/en.json'), JSON.stringify(sorted(en), null, 2) + '\n');
console.log(`${cases.length} Grafiken, ${Object.values(de).reduce((n, c) => n + c.length, 0)} Bildunterschriften je Sprache.`);
