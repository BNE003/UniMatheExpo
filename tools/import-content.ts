/**
 * Übernimmt die Kursinhalte aus dem SwiftUI-Projekt (nur lesend) nach assets/content/.
 *
 *   npm run import-content
 *   npm run import-content -- --swift-repo /pfad/zu/UniMatheApp
 *   npm run import-content -- --update-ids     # bewusst geänderte Aufgaben-IDs übernehmen
 *
 * Ergebnis:
 *   assets/content/manifest.json                    Kurse, Themen (stabile IDs), Klausuren, Quell-Commit
 *   assets/content/<lang>/<themen-id>/lesson.json    Schritt-für-Schritt-Erklärung (beispiele/)
 *   assets/content/<lang>/<themen-id>/exercises.json Übungen (aufgaben/)
 *   assets/content/<lang>/<id>/summary.json          Zusammenfassung (lerninhalt/), auch für Kurse
 *   assets/content/<lang>/exams/<klausur>.json       Probeklausuren (klausuren/)
 *   src/content/generated/registry.ts                statische require()-Liste für Metro
 *   docs/content-import-report.md                    Prüfbericht
 *   tools/content-ids.lock.json                      Titel je stabiler Aufgaben-ID (ID-Stabilität)
 *
 * Die Zuordnung Thema → Datei bildet genau die Suchlogik der iOS-App nach
 * (ContentView.swift: loadExercises, loadExample, courseFileStem; ÜbungsklausurenView.swift).
 * Die App selbst lädt danach nur noch über Themen-IDs.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { z } from 'zod';

import type {
  ContentManifest,
  CourseEntry,
  Difficulty,
  ExamEntry,
  Lang,
  Localized,
  TopicEntry,
} from '../src/content/types';

// ---------------------------------------------------------------------------
// Konfiguration

const ROOT = resolve(__dirname, '..');
const CONFIG = JSON.parse(readFileSync(join(__dirname, 'content.config.json'), 'utf8')) as {
  swiftRepo: string;
  appDir: string;
};

const args = process.argv.slice(2);
const argValue = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const SWIFT_REPO = resolve(argValue('--swift-repo') ?? CONFIG.swiftRepo);
const UPDATE_IDS = args.includes('--update-ids');
const SRC = join(SWIFT_REPO, CONFIG.appDir);

const OUT = join(ROOT, 'assets/content');
const REGISTRY = join(ROOT, 'src/content/generated/registry.ts');
const REPORT = join(ROOT, 'docs/content-import-report.md');
const ID_LOCK = join(__dirname, 'content-ids.lock.json');
const LANGS: Lang[] = ['de', 'en'];
const CONTENT_DIRS = ['lerninhalt', 'beispiele', 'aufgaben', 'klausuren'];

// ---------------------------------------------------------------------------
// Schemas (entsprechen den Swift-Decodable-Modellen)

/** Swift: decodeIfPresent akzeptiert fehlende Felder und null. */
const undef = <T>(v: T | null | undefined) => v ?? undefined;

const IndexSchema = z.object({
  topics: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      filename: z.string(),
      subTopics: z.array(z.object({ id: z.string(), title: z.string(), filename: z.string() })).nullish().transform(undef),
    }),
  ),
});

interface MathTopicJson {
  id: string;
  title: string;
  icon: string;
  description: string;
  subTopics?: MathTopicJson[];
  markdownContent?: string;
}
const MathTopicSchema: z.ZodType<MathTopicJson, z.ZodTypeDef, unknown> = z.lazy(() =>
  z.object({
    id: z.string(),
    title: z.string(),
    icon: z.string(),
    description: z.string(),
    subTopics: z.array(MathTopicSchema).nullish().transform(undef),
    markdownContent: z.string().nullish().transform(undef),
  }),
);

const LessonSchema = z.object({
  id: z.string().nullish().transform(undef),
  topic: z.string(),
  steps: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        formula: z.string().nullish().transform(undef),
        explanation: z.string().nullish().transform(undef),
        section: z.string().nullish().transform(undef),
        visual: z.string().nullish().transform(undef),
        insight: z.string().nullish().transform(undef),
      }),
    )
    .min(1),
});

const ExerciseSchema = z.object({
  id: z.number().int(),
  topic: z.string(),
  title: z.string(),
  description: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  points: z.number(),
  solutionSteps: z.array(z.string()).min(1),
});
const ExerciseFileSchema = z.object({ exercises: z.array(ExerciseSchema).min(1) });

const ExamSchema = z.object({
  exam: z.object({
    title: z.string(),
    subtitle: z.string(),
    duration: z.number(),
    totalPoints: z.number(),
    difficulty: z.string(),
    language: z.string(),
    instructions: z.string(),
  }),
  exercises: z.array(ExerciseSchema.extend({ difficulty: z.string() })).min(1),
});

// ---------------------------------------------------------------------------
// Dateizuordnung wie in der iOS-App (ContentView.swift)

/** ContentView.swift: normalizedFileName(from:) */
function normalizedFileName(title: string): string {
  return title
    .toLowerCase()
    .replaceAll('ä', 'ae')
    .replaceAll('ö', 'oe')
    .replaceAll('ü', 'ue')
    .replaceAll('ß', 'ss')
    .replaceAll(' ', '_')
    .replace(/[^a-z0-9_]/g, '');
}

/** ContentView.swift: bridgeCourseFileStem(for:) */
const BRIDGE_STEMS: Record<string, string> = {
  'Zahlen & Rechengesetze': 'zahlen_und_rechengesetze',
  'Numbers & Arithmetic': 'zahlen_und_rechengesetze',
  'Potenzen, Wurzeln & Logarithmen': 'potenzen_wurzeln_logarithmen',
  'Powers, Roots & Logarithms': 'potenzen_wurzeln_logarithmen',
  'Terme & Umformungen': 'terme_und_termumformungen',
  'Terms & Manipulation': 'terme_und_termumformungen',
  'Summen- & Produktzeichen': 'summen_und_produktzeichen',
  'Sum & Product Notation': 'summen_und_produktzeichen',
  Gleichungen: 'gleichungen',
  Equations: 'gleichungen',
  'Ungleichungen & Beträge': 'ungleichungen_und_betraege',
  'Inequalities & Absolute Values': 'ungleichungen_und_betraege',
  'Lineare Gleichungssysteme': 'lineare_gleichungssysteme',
  'Systems of Linear Equations': 'lineare_gleichungssysteme',
  'Funktionen: Grundbegriffe': 'funktionen_grundbegriffe',
  'Functions: Basics': 'funktionen_grundbegriffe',
  'Polynome & rationale Funktionen': 'polynome_und_rationale_funktionen',
  'Polynomials & Rational Functions': 'polynome_und_rationale_funktionen',
  'e-Funktion & Logarithmus': 'exponential_und_logarithmusfunktionen',
  'Exponential & Logarithmic Functions': 'exponential_und_logarithmusfunktionen',
  Trigonometrie: 'trigonometrie',
  Trigonometry: 'trigonometrie',
  'Ableitungen & Kurvendiskussion': 'ableitungen_und_kurvendiskussion',
  'Derivatives & Curve Sketching': 'ableitungen_und_kurvendiskussion',
  'Integrale & Stammfunktionen': 'integrale_und_stammfunktionen',
  'Integrals & Antiderivatives': 'integrale_und_stammfunktionen',
  'Vektoren & Geometrie': 'vektoren_und_analytische_geometrie',
  'Vectors & Geometry': 'vektoren_und_analytische_geometrie',
  'Mathematische Sprache & Beweise': 'mathematische_sprache_und_beweise',
  'Mathematical Language & Proofs': 'mathematische_sprache_und_beweise',
};

/** ContentView.swift: numericsFileStem(for:) */
const NUMERICS_STEMS: Record<string, string> = {
  'Gleitkommazahlen & Rundungsfehler': 'gleitkommazahlen_und_rundungsfehler',
  'Floating-Point Numbers & Rounding Errors': 'gleitkommazahlen_und_rundungsfehler',
  'Kondition & Stabilität': 'kondition_und_stabilitaet',
  'Conditioning & Stability': 'kondition_und_stabilitaet',
  'Gauß-Elimination & LR-Zerlegung': 'gauss_elimination_und_lr_zerlegung',
  'Gaussian Elimination & LU Decomposition': 'gauss_elimination_und_lr_zerlegung',
  'Normen & Matrixkondition': 'normen_und_matrixkondition',
  'Norms & Matrix Condition': 'normen_und_matrixkondition',
  'Ausgleichsrechnung & QR-Zerlegung': 'ausgleichsrechnung_und_qr_zerlegung',
  'Least Squares & QR Decomposition': 'ausgleichsrechnung_und_qr_zerlegung',
  'Iterative Löser für LGS': 'iterative_verfahren_fuer_lgs',
  'Iterative Solvers for Linear Systems': 'iterative_verfahren_fuer_lgs',
  Nullstellenverfahren: 'nichtlineare_gleichungen',
  'Root-Finding Methods': 'nichtlineare_gleichungen',
  'Newton-Verfahren für Systeme': 'nichtlineare_gleichungssysteme',
  "Newton's Method for Systems": 'nichtlineare_gleichungssysteme',
  Polynominterpolation: 'polynominterpolation',
  'Polynomial Interpolation': 'polynominterpolation',
  'Spline-Interpolation': 'spline_interpolation',
  'Spline Interpolation': 'spline_interpolation',
  'Numerische Integration': 'numerische_integration',
  'Numerical Integration': 'numerische_integration',
  'Eigenwerte numerisch': 'numerische_eigenwertberechnung',
  'Computing Eigenvalues': 'numerische_eigenwertberechnung',
  'Einschrittverfahren für DGL': 'einschrittverfahren_fuer_dgl',
  'One-Step Methods for ODEs': 'einschrittverfahren_fuer_dgl',
  'Steife DGL & Mehrschrittverfahren': 'steife_dgl_und_mehrschrittverfahren',
  'Stiff ODEs & Multistep Methods': 'steife_dgl_und_mehrschrittverfahren',
};

function courseFileStem(title: string): string | undefined {
  if (BRIDGE_STEMS[title]) return 'brueckenkurs_' + BRIDGE_STEMS[title];
  if (NUMERICS_STEMS[title]) return 'numerik_' + NUMERICS_STEMS[title];
  return undefined;
}

/** ContentView.swift: ExercisesView.loadExercises – switch topic.title */
const EXERCISE_STEMS: Record<string, string> = {
  'Mengen und Abbildungen': 'mengen_und_abbildungen',
  'Sets and Mappings': 'mengen_und_abbildungen',
  Logik: 'logik',
  Logic: 'logik',
  'Vollständige Induktion': 'vollstaendige_induktion',
  'Mathematical Induction': 'vollstaendige_induktion',
  'Binomische Formeln': 'binomische_formeln',
  'Binomial Formulas': 'binomische_formeln',
  'Größter gemeinsamer Teiler': 'groesster_gemeinsamer_teiler',
  'Greatest Common Divisor': 'groesster_gemeinsamer_teiler',
  Gruppen: 'gruppen',
  Groups: 'gruppen',
  Ringe: 'ringe',
  Rings: 'ringe',
  Körper: 'koerper',
  Fields: 'koerper',
  'Komplexe Zahlen': 'komplexe_zahlen',
  'Complex Numbers': 'komplexe_zahlen',
  'Folgen und Reihen': 'folgen_und_reihen',
  'Sequences and Series': 'folgen_und_reihen',
  Grenzwerte: 'grenzwerte',
  Limits: 'grenzwerte',
  Differentialrechnung: 'differentialrechnung',
  'Differential Calculus': 'differentialrechnung',
  Integralrechnung: 'integralrechnung',
  'Integral Calculus': 'integralrechnung',
  'Mehrdimensionale Analysis': 'mehrdimensionale_analysis',
  'Multidimensional Calculus': 'mehrdimensionale_analysis',
  Matrizen: 'matrizen',
  Matrices: 'matrizen',
  Vektorräume: 'vektorraeume',
  'Vector Spaces': 'vektorraeume',
  Determinanten: 'determinanten',
  Determinants: 'determinanten',
  'Lineare Abbildungen': 'lineare_abbildungen',
  'Linear Mappings': 'lineare_abbildungen',
  Eigenwerte: 'eigenwerte',
  Eigenvalues: 'eigenwerte',
  'Eigenwerte und Eigenvektoren': 'eigenwerte',
  'Eigenvalues and Eigenvectors': 'eigenwerte',
};

/** ContentView.swift: InteractiveLearningView.loadExample – englische Titel */
const EN_LESSON_STEMS: Record<string, string> = {
  'Sets and Mappings': 'sets_and_mappings',
  Logic: 'logic',
  'Mathematical Induction': 'mathematical_induction',
  'Binomial Formulas': 'binomial_formulas',
  'Greatest Common Divisor': 'greatest_common_divisor',
  Groups: 'groups',
  Rings: 'rings',
  Fields: 'fields',
  'Complex Numbers': 'complex_numbers',
  'Sequences and Series': 'sequences_and_series',
  Limits: 'limits',
  'Differential Calculus': 'differential_calculus',
  'Integral Calculus': 'integral_calculus',
  'Multidimensional Calculus': 'multidimensional_calculus',
  Matrices: 'matrices',
  'Vector Spaces': 'vector_spaces',
  Determinants: 'determinants',
  'Linear Mappings': 'linear_mappings',
  'Eigenvalues and Eigenvectors': 'eigenvalues_and_eigenvectors',
};

function exerciseStem(title: string): string | undefined {
  return EXERCISE_STEMS[title] ?? courseFileStem(title);
}

function lessonFileCandidates(title: string, lang: Lang): string[] {
  const course = courseFileStem(title);
  let stem: string;
  if (course) stem = lang === 'en' ? course + '_en' : course;
  else if (lang === 'en') stem = EN_LESSON_STEMS[title] ?? normalizedFileName(title);
  else stem = title === 'Determinanten' ? 'determinanten' : normalizedFileName(title);
  const name = stem + '_beispiel';
  const candidates = [`beispiele/${lang}/${name}.json`];
  if (lang === 'en') candidates.push(`beispiele/${lang}/${name}_fixed.json`);
  return candidates;
}

// ---------------------------------------------------------------------------
// Hilfsfunktionen

const sourceFiles = new Set<string>();
const issues: string[] = [];
const errors: string[] = [];

function readJson<T>(relPath: string, schema: z.ZodType<T, z.ZodTypeDef, unknown>): T {
  const abs = join(SRC, relPath);
  sourceFiles.add(relPath);
  const raw = JSON.parse(readFileSync(abs, 'utf8'));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues.slice(0, 3).map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new Error(`Schemafehler in ${relPath}: ${first.join('; ')}`);
  }
  return parsed.data;
}

function firstExisting(candidates: string[]): string | undefined {
  return candidates.find((c) => existsSync(join(SRC, c)));
}

function writeJson(relPath: string, data: unknown) {
  const abs = join(OUT, relPath);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, JSON.stringify(data) + '\n');
}

/** Gleiche Prüfungen wie UniMathe/tools/content_lib.py: check_tex */
const texIssueCounts = new Map<string, number>();
function checkTex(text: string, where: string) {
  const problems: string[] = [];
  if (/[\x07\x08\x0b\x0c]/.test(text)) problems.push('Steuerzeichen');
  if (count(text, '{') !== count(text, '}')) problems.push('{ } unausgeglichen');
  if (count(text, '\\(') !== count(text, '\\)')) problems.push('\\( \\) unausgeglichen');
  if (count(text.replaceAll('\\$', ''), '$') % 2 !== 0) problems.push('$ unausgeglichen');
  for (const p of problems) {
    texIssueCounts.set(p, (texIssueCounts.get(p) ?? 0) + 1);
    if (issues.length < 400) issues.push(`LaTeX (${p}): ${where}`);
  }
}
const count = (s: string, sub: string) => s.split(sub).length - 1;

function swiftColorToHex(r: number, g: number, b: number) {
  const h = (v: number) =>
    Math.round(Math.min(1, Math.max(0, v)) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
}

function git(...gitArgs: string[]) {
  return execFileSync('git', ['-C', SWIFT_REPO, ...gitArgs], { encoding: 'utf8' }).trim();
}

// ---------------------------------------------------------------------------
// Import

function main() {
  if (!existsSync(SRC)) throw new Error(`Swift-Projekt nicht gefunden: ${SRC}`);

  const commit = git('rev-parse', 'HEAD');
  const dirtyFiles = git('status', '--porcelain', '--', ...CONTENT_DIRS.map((d) => join(CONFIG.appDir, d)))
    .split('\n')
    .filter(Boolean);

  rmSync(OUT, { recursive: true, force: true });
  const registry: string[] = [];
  const register = (key: string, rel: string) => registry.push(`  '${key}': () => require('../../../assets/content/${rel}'),`);

  // --- Kurse und Themen -----------------------------------------------------
  const indexes = {
    de: readJson('lerninhalt/de/index.json', IndexSchema),
    en: readJson('lerninhalt/en/index_en.json', IndexSchema),
  };
  const idsOf = (l: Lang) => JSON.stringify(indexes[l].topics.map((t) => [t.id, (t.subTopics ?? []).map((s) => s.id)]));
  if (idsOf('de') !== idsOf('en')) errors.push('Themen-IDs in index.json (DE) und index_en.json (EN) unterscheiden sich.');

  /** ContentView.swift / SubTopicsView.swift: Datei mit Sprachsuffix, sonst ohne. */
  const summaryFile = (lang: Lang, filename: string) => {
    const base = filename.replace(/\.json$/, '');
    const suffix = lang === 'en' ? '_en' : '';
    return firstExisting([`lerninhalt/${lang}/${base}${suffix}.json`, `lerninhalt/${lang}/${base}.json`]);
  };

  const idLock: Record<string, string> = {};
  const courses: CourseEntry[] = [];
  const parityRows: string[] = [];
  const visualsUsed = new Map<string, number>();
  const totals = { topics: 0, lessons: 0, exercises: { de: 0, en: 0 }, steps: { de: 0, en: 0 } };

  for (const [ci, courseIdx] of indexes.de.topics.entries()) {
    const courseLoc = { de: courseIdx, en: indexes.en.topics[ci] };
    const courseJson = {} as Localized<MathTopicJson>;
    for (const lang of LANGS) {
      const file = summaryFile(lang, courseLoc[lang].filename);
      if (!file) throw new Error(`Kursdatei fehlt: ${lang} ${courseLoc[lang].filename}`);
      courseJson[lang] = readJson(file, MathTopicSchema);
      const html = courseJson[lang].markdownContent ?? null;
      if (html) checkTex(html, `${file}`);
      writeJson(`${lang}/${courseIdx.id}/summary.json`, {
        title: courseJson[lang].title,
        description: courseJson[lang].description,
        html,
      });
      register(`${lang}/${courseIdx.id}/summary`, `${lang}/${courseIdx.id}/summary.json`);
    }

    const topics: TopicEntry[] = [];
    for (const [ti, subIdx] of (courseIdx.subTopics ?? []).entries()) {
      const id = subIdx.id;
      const enSubIdx = courseLoc.en.subTopics?.[ti];
      if (!enSubIdx) throw new Error(`EN-Index fehlt Thema ${id}`);
      const subLoc = { de: subIdx, en: enSubIdx };
      const topicJson = {} as Localized<MathTopicJson>;
      const stats: TopicEntry['stats'] = {
        lessonSteps: { de: 0, en: 0 },
        lessonVisuals: { de: 0, en: 0 },
        exercises: { easy: 0, medium: 0, hard: 0 },
      };
      const exerciseIds = {} as Localized<number[]>;

      for (const lang of LANGS) {
        // Zusammenfassung (ContentSelectionView.loadTopicContent)
        const file = summaryFile(lang, subLoc[lang].filename);
        if (!file) throw new Error(`Themendatei fehlt: ${lang} ${subLoc[lang].filename}`);
        const topic = readJson(file, MathTopicSchema);
        topicJson[lang] = topic;
        const html = topic.markdownContent ?? null;
        if (html) checkTex(html, file);
        if (!html) issues.push(`Keine Zusammenfassung: ${lang} ${id}`);
        writeJson(`${lang}/${id}/summary.json`, { title: topic.title, description: topic.description, html });
        register(`${lang}/${id}/summary`, `${lang}/${id}/summary.json`);

        // Die iOS-App ordnet Lektion und Übungen über den Titel der Themendatei zu.
        const title = topic.title;

        // Schritt-für-Schritt-Erklärung
        const lessonFile = firstExisting(lessonFileCandidates(title, lang));
        if (!lessonFile) {
          errors.push(`Lektion fehlt: ${lang} ${id} „${title}“ (gesucht: ${lessonFileCandidates(title, lang).join(', ')})`);
        } else {
          const lesson = readJson(lessonFile, LessonSchema);
          lesson.steps.forEach((s, i) => {
            for (const key of ['text', 'formula', 'explanation', 'insight'] as const) {
              const v = s[key];
              if (v) checkTex(v, `${lessonFile} Schritt ${i + 1} ${key}`);
            }
            if (s.formula?.includes('$')) issues.push(`$ in formula: ${lessonFile} Schritt ${i + 1}`);
            if (s.visual) visualsUsed.set(s.visual, (visualsUsed.get(s.visual) ?? 0) + 1);
          });
          stats.lessonSteps[lang] = lesson.steps.length;
          stats.lessonVisuals[lang] = lesson.steps.filter((s) => s.visual).length;
          totals.steps[lang] += lesson.steps.length;
          totals.lessons++;
          writeJson(`${lang}/${id}/lesson.json`, lesson);
          register(`${lang}/${id}/lesson`, `${lang}/${id}/lesson.json`);
        }

        // Übungen: Der Dateistamm wird für beide Sprachen aus dem deutschen Titel bestimmt.
        // (iOS bestimmt ihn je Sprache aus dem Titel; bei abweichenden EN-Titeln findet iOS keine Datei.)
        const stem = exerciseStem(topicJson.de.title);
        if (lang === 'en' && exerciseStem(title) !== stem) {
          issues.push(
            `iOS-Abweichung: Für ${id} „${title}“ (EN) findet iOS keine Übungsdatei; Android nutzt den deutschen Dateistamm „${stem}“.`,
          );
        }
        const exFile = stem
          ? firstExisting([
              `aufgaben/${lang}/${lang === 'en' ? stem + '_en' : stem}.json`,
              `aufgaben/${lang}/${stem}.json`,
            ])
          : undefined;
        if (!exFile) {
          errors.push(`Übungen fehlen: ${lang} ${id} „${title}“ (Stamm: ${stem ?? '—'})`);
          exerciseIds[lang] = [];
        } else {
          const data = readJson(exFile, ExerciseFileSchema);
          const ids = data.exercises.map((e) => e.id);
          if (new Set(ids).size !== ids.length) errors.push(`Doppelte Aufgaben-IDs in ${exFile}`);
          exerciseIds[lang] = ids;
          data.exercises.forEach((e) => {
            checkTex(e.title, `${exFile} #${e.id} title`);
            checkTex(e.description, `${exFile} #${e.id} description`);
            e.solutionSteps.forEach((st, n) => checkTex(st, `${exFile} #${e.id} Schritt ${n + 1}`));
            if (lang === 'de') {
              stats.exercises[e.difficulty as Difficulty]++;
              idLock[`ex:${id}:${e.id}`] = e.title;
            }
          });
          totals.exercises[lang] += data.exercises.length;
          writeJson(`${lang}/${id}/exercises.json`, data);
          register(`${lang}/${id}/exercises`, `${lang}/${id}/exercises.json`);
        }
      }

      if (JSON.stringify(exerciseIds.de) !== JSON.stringify(exerciseIds.en)) {
        errors.push(`Aufgaben-IDs DE/EN verschieden in Thema ${id}`);
      }
      const lessonParity =
        stats.lessonSteps.de === stats.lessonSteps.en && stats.lessonVisuals.de === stats.lessonVisuals.en;
      parityRows.push(
        `| ${id} | ${topicJson.de.title} | ${stats.lessonSteps.de} (${stats.lessonVisuals.de}) | ${stats.lessonSteps.en} (${stats.lessonVisuals.en}) | ${exerciseIds.de.length} / ${exerciseIds.en.length} | ${lessonParity ? '✓' : '⚠︎'} |`,
      );
      if (topicJson.de.title !== subIdx.title) {
        issues.push(`Titel in index.json („${subIdx.title}“) ≠ Themendatei („${topicJson.de.title}“) für ${id}`);
      }

      topics.push({
        id,
        courseId: courseIdx.id,
        position: ti + 1,
        title: { de: topicJson.de.title, en: topicJson.en.title },
        description: { de: topicJson.de.description, en: topicJson.en.description },
        icon: topicJson.de.icon,
        stats,
      });
      totals.topics++;
    }

    courses.push({
      id: courseIdx.id,
      title: { de: courseJson.de.title, en: courseJson.en.title },
      description: { de: courseJson.de.description, en: courseJson.en.description },
      icon: courseJson.de.icon,
      topics,
    });
  }

  // --- Klausuren ------------------------------------------------------------
  const examSwift = readFileSync(join(SRC, 'ÜbungsklausurenView.swift'), 'utf8');
  sourceFiles.add('ÜbungsklausurenView.swift');
  const enName: Record<string, string> = {};
  for (const m of examSwift.matchAll(/case "([a-z0-9_]+)":\s*return "([a-z0-9_]+)"/g)) enName[m[1]] = m[2];

  const exams: ExamEntry[] = [];
  let examExercises = 0;
  for (const m of examSwift.matchAll(/ExamTopic\(([\s\S]*?)\n\s*\)/g)) {
    const body = m[1];
    const str = (k: string) => body.match(new RegExp(`${k}: "([^"]*)"`))?.[1];
    const num = (k: string) => Number(body.match(new RegExp(`${k}: (\\d+)`))?.[1]);
    const color = body.match(/Color\(red: ([\d.]+), green: ([\d.]+), blue: ([\d.]+)\)/);
    const key = str('examFilename');
    if (!key || !color) throw new Error(`Klausur in ÜbungsklausurenView.swift nicht lesbar: ${body.slice(0, 80)}`);
    const files: Localized = { de: `klausuren/de/${key}.json`, en: `klausuren/en/${enName[key] ?? key}.json` };
    const counts: number[] = [];
    for (const lang of LANGS) {
      if (!existsSync(join(SRC, files[lang]))) {
        errors.push(`Klausurdatei fehlt: ${files[lang]}`);
        continue;
      }
      const exam = readJson(files[lang], ExamSchema);
      counts.push(exam.exercises.length);
      exam.exercises.forEach((e) => {
        checkTex(e.description, `${files[lang]} #${e.id}`);
        e.solutionSteps.forEach((st, n) => checkTex(st, `${files[lang]} #${e.id} Schritt ${n + 1}`));
        if (lang === 'de') idLock[`exam:${key}:${e.id}`] = e.title;
      });
      examExercises += lang === 'de' ? exam.exercises.length : 0;
      writeJson(`${lang}/exams/${key}.json`, exam);
      register(`${lang}/exams/${key}`, `${lang}/exams/${key}.json`);
    }
    if (counts.length === 2 && counts[0] !== counts[1]) errors.push(`Klausur ${key}: DE ${counts[0]} / EN ${counts[1]} Aufgaben`);
    exams.push({
      key,
      title: { de: str('title') ?? key, en: str('titleEnglish') ?? key },
      subtitle: { de: str('subtitle') ?? '', en: str('subtitleEnglish') ?? '' },
      durationMinutes: num('duration'),
      questions: num('questions'),
      icon: str('icon') ?? 'doc',
      color: swiftColorToHex(Number(color[1]), Number(color[2]), Number(color[3])),
    });
  }

  // --- Grafiken: verwendete Namen gegen iOS-Implementierung -------------------
  const visualSwift = readFileSync(join(SRC, 'Views/LessonVectorVisuals.swift'), 'utf8');
  const implemented = new Set([...visualSwift.matchAll(/case "([A-Za-z0-9]+)":/g)].map((m) => m[1]));
  const missingInIos = [...visualsUsed.keys()].filter((v) => !implemented.has(v));
  if (missingInIos.length) errors.push(`Grafiken ohne iOS-Implementierung: ${missingInIos.join(', ')}`);

  // --- ID-Stabilität --------------------------------------------------------
  const idChanges: string[] = [];
  if (existsSync(ID_LOCK)) {
    const previous = JSON.parse(readFileSync(ID_LOCK, 'utf8')) as Record<string, string>;
    for (const [key, title] of Object.entries(previous)) {
      if (!(key in idLock)) idChanges.push(`entfernt: ${key} („${title}“)`);
      else if (idLock[key] !== title) idChanges.push(`geändert: ${key} „${title}“ → „${idLock[key]}“`);
    }
  }
  if (idChanges.length && !UPDATE_IDS) {
    errors.push(
      `Bestehende Aufgaben-IDs haben sich geändert (Lernfortschritt hängt daran). Prüfen und ggf. mit --update-ids übernehmen:\n  ` +
        idChanges.slice(0, 30).join('\n  '),
    );
  }

  if (errors.length) {
    console.error('\nImport abgebrochen:\n- ' + errors.join('\n- '));
    process.exit(1);
  }

  // --- Ausgabe --------------------------------------------------------------
  const hash = createHash('sha256');
  for (const f of [...sourceFiles].sort()) hash.update(f).update(readFileSync(join(SRC, f)));
  const manifest: ContentManifest = {
    schemaVersion: 1,
    source: { commit, dirty: dirtyFiles.length > 0, contentHash: hash.digest('hex').slice(0, 16) },
    courses,
    exams,
  };
  writeJson('manifest.json', manifest);

  writeFileSync(
    ID_LOCK,
    JSON.stringify(Object.fromEntries(Object.entries(idLock).sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true }))), null, 1) + '\n',
  );

  mkdirSync(dirname(REGISTRY), { recursive: true });
  writeFileSync(
    REGISTRY,
    [
      '// Generiert von tools/import-content.ts – nicht von Hand ändern.',
      "import type { ContentManifest } from '../types';",
      '',
      "export const manifest: ContentManifest = require('../../../assets/content/manifest.json');",
      '',
      '/** Lädt eine Inhaltsdatei erst beim ersten Zugriff. */',
      'export const contentFiles: Record<string, () => unknown> = {',
      ...registry.sort(),
      '};',
      '',
    ].join('\n'),
  );

  const visualRows = [...visualsUsed.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const report = [
    '# Bericht: Inhaltsimport aus dem SwiftUI-Projekt',
    '',
    `Generiert von \`tools/import-content.ts\`. Quelle: \`${relative(ROOT, SRC) || SRC}\`, Commit \`${commit.slice(0, 10)}\`${dirtyFiles.length ? `, **mit ${dirtyFiles.length} nicht committeten Änderungen in den Inhaltsordnern**` : ''}, Inhalts-Hash \`${manifest.source.contentHash}\`.`,
    '',
    '## Umfang',
    '',
    `- Kurse: ${courses.length}, Themen: ${totals.topics}, Lektionen: ${totals.lessons} (DE+EN)`,
    `- Lektionsschritte: DE ${totals.steps.de}, EN ${totals.steps.en}`,
    `- Übungen: DE ${totals.exercises.de}, EN ${totals.exercises.en}`,
    `- Klausuren: ${exams.length} mit ${examExercises} Aufgaben (je Sprache)`,
    `- Verwendete Grafiken: ${visualsUsed.size} verschiedene, ${[...visualsUsed.values()].reduce((a, b) => a + b, 0)} Verwendungen`,
    `- Stabile IDs in \`tools/content-ids.lock.json\`: ${Object.keys(idLock).length}${idChanges.length ? ` (${idChanges.length} Änderungen übernommen)` : ''}`,
    '',
    '## DE/EN-Parität pro Thema',
    '',
    'Lektion: Schritte (davon mit Grafik). ⚠︎ = Lektionen unterscheiden sich.',
    '',
    '| ID | Thema | Lektion DE | Lektion EN | Übungen DE / EN | |',
    '|---|---|---|---|---|---|',
    ...parityRows,
    '',
    '## LaTeX-Auffälligkeiten',
    '',
    texIssueCounts.size
      ? [...texIssueCounts.entries()].map(([k, v]) => `- ${k}: ${v}`).join('\n')
      : 'Keine.',
    '',
    '## Weitere Hinweise',
    '',
    ...(issues.length ? issues.map((i) => `- ${i}`) : ['Keine.']),
    '',
    '## Grafiken (Name: Verwendungen)',
    '',
    visualRows.map(([k, v]) => `\`${k}\`: ${v}`).join(' · '),
    '',
  ].join('\n');
  mkdirSync(dirname(REPORT), { recursive: true });
  writeFileSync(REPORT, report);

  console.log(
    `Import ok: ${totals.topics} Themen, ${totals.exercises.de} Übungen/Sprache, ${exams.length} Klausuren, ` +
      `${visualsUsed.size} Grafiken, Commit ${commit.slice(0, 10)}${dirtyFiles.length ? ' (dirty)' : ''}. ` +
      `Bericht: ${relative(ROOT, REPORT)}`,
  );
}

main();
