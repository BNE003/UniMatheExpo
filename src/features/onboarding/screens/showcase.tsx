/**
 * Onboarding-Schritte „Alles in einer App“, „Schritt für Schritt“, Lernplan und – neu für Android –
 * „100 % kostenlos“ (TopicShowcaseOnboardingView, StepByStepOnboardingView,
 * PersonalizedPlanOnboardingView in Views/OnboardingScreens.swift). Die iOS-Schritte
 * „3 Tage gratis“ und „Erinnerung vor Ablauf“ samt Kaufseite entfallen: Die App ist kostenlos.
 */
import { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';

import { Icon } from '@/components/ui';
import { topicIcon } from '@/content/icons';
import { manifest } from '@/content/load';
import type { Lang } from '@/content/types';
import { MathView } from '@/math/MathView';
import { escapeHtml } from '@/math/templates';
import { loadExamDate, loadExamKey } from '@/storage/onboarding';
import { withAlpha } from '@/theme/tokens';

import { ContinueButton, GlowCircle, OnboardingPage, PageTitle, icon, ob, obFont, shadow, useLayout, type ScreenProps } from '../kit';
import { DEFAULT_EXAM_KEY, dayRangeLabel, daysUntilExam, examTitle, theoryTopics, timelineRanges } from '../plan';

const cont = (lang: Lang) => (lang === 'en' ? 'Continue' : 'Weiter');

// ---------------------------------------------------------------------------
// 6. „Alles in einer App“: Themen als Laufband

/** customAssetName(for:) – eigene Symbolgrafiken einzelner Themen */
const TOPIC_ART: Record<string, ImageSourcePropType> = {
  integral: require('@/assets/images/topics/integral.png'),
  mehrdimensionale_analysis: require('@/assets/images/topics/mehrdimensionale_analysis.png'),
  differentialrechnung: require('@/assets/images/topics/differentialrechnung.png'),
  matrizen: require('@/assets/images/topics/matrizen.png'),
  vektor: require('@/assets/images/topics/vektor.png'),
  abbildung: require('@/assets/images/topics/abbildung.png'),
  determinante: require('@/assets/images/topics/determinante.png'),
  eigenwerte: require('@/assets/images/topics/eigenwerte.png'),
};
const ART_BY_TITLE: Record<string, string> = {
  Integralrechnung: 'integral',
  'Integral Calculus': 'integral',
  'Mehrdimensionale Analysis': 'mehrdimensionale_analysis',
  'Multidimensional Analysis': 'mehrdimensionale_analysis',
  'Multidimensional Calculus': 'mehrdimensionale_analysis',
  Differentialrechnung: 'differentialrechnung',
  'Differential Calculus': 'differentialrechnung',
  Matrizen: 'matrizen',
  Matrices: 'matrizen',
  Vektorräume: 'vektor',
  'Vector Spaces': 'vektor',
  'Lineare Abbildungen': 'abbildung',
  'Linear Mappings': 'abbildung',
  Determinanten: 'determinante',
  Determinants: 'determinante',
  'Eigenwerte und Eigenvektoren': 'eigenwerte',
  'Eigenvalues and Eigenvectors': 'eigenwerte',
};

interface Tile {
  id: string;
  title: string;
  icon: string;
}

const SPACING = 10;
const SPEED = 26; // Punkte pro Sekunde (TopicShowcaseMarqueeRow.speed)

/** Maße wie in TopicShowcaseOnboardingView: große iPhones (≥ 414 pt) bekommen breitere Karten. */
interface MarqueeSize {
  cardWidth: number;
  cardHeight: number;
  fontSize: number;
  iconSize: number;
  symbolSize: number;
  artSize: number;
  padding: number;
  radius: number;
  rowSpacing: number;
}

function marqueeSize(width: number): MarqueeSize {
  return width >= 414
    ? { cardWidth: Math.min(244, Math.max(198, width * 0.58)), cardHeight: 80, fontSize: 16, iconSize: 39, symbolSize: 17, artSize: 22, padding: 11, radius: 18, rowSpacing: 6 }
    : { cardWidth: Math.min(176, Math.max(148, width * 0.44)), cardHeight: 96, fontSize: 13, iconSize: 34, symbolSize: 15, artSize: 18, padding: 10, radius: 14, rowSpacing: 0 };
}

/**
 * Eine Reihe läuft endlos nach links bzw. rechts. Wie die SwiftUI-`TimelineView` wird die
 * Verschiebung in jedem Bild aus der vergangenen Zeit berechnet: (Zeit · 26 pt/s) mod Zykluslänge.
 */
function MarqueeRow({ items, movesLeft, size, elapsed }: { items: Tile[]; movesLeft: boolean; size: MarqueeSize; elapsed: SharedValue<number> }) {
  const cycle = items.length * (size.cardWidth + SPACING);
  const style = useAnimatedStyle(() => {
    const travel = ((elapsed.get() / 1000) * SPEED) % cycle;
    return { transform: [{ translateX: movesLeft ? -travel : travel - cycle }] };
  });
  return (
    <View style={{ height: size.cardHeight, overflow: 'visible' }}>
      <Animated.View style={[styles.marquee, style]}>
        {[0, 1, 2].flatMap((copy) => items.map((item) => <TopicChip key={`${copy}-${item.id}`} item={item} size={size} />))}
      </Animated.View>
    </View>
  );
}

function TopicChip({ item, size }: { item: Tile; size: MarqueeSize }) {
  const art = ART_BY_TITLE[item.title];
  return (
    <View
      style={[
        styles.chip,
        shadow(7, 0.08, 4),
        { width: size.cardWidth, height: size.cardHeight, paddingHorizontal: size.padding, borderRadius: size.radius },
      ]}>
      <View style={[styles.chipIcon, shadow(5, 0.28, 2, ob.blue), { width: size.iconSize, height: size.iconSize, borderRadius: size.iconSize / 2 }]}>
        {art ? (
          <Image source={TOPIC_ART[art]} style={{ width: size.artSize, height: size.artSize, tintColor: '#FFFFFF' }} resizeMode="contain" />
        ) : (
          <Icon name={topicIcon(item.icon)} size={size.symbolSize} color="#FFFFFF" />
        )}
      </View>
      {/* In den höheren Karten (96 pt) passen drei Zeilen, damit lange Titel nicht abgeschnitten werden. */}
      <Text numberOfLines={size.cardHeight >= 96 ? 3 : 2} style={[obFont(size.fontSize, 'semibold'), { color: ob.ink, flex: 1 }]}>
        {item.title}
      </Text>
    </View>
  );
}

export function TopicsScreen({ lang, step, total, next }: ScreenProps) {
  const { width, height, pad } = useLayout();
  const size = marqueeSize(width);
  const rows = useMemo(() => {
    const tiles: Tile[] = manifest.courses.flatMap((c) => c.topics.map((t) => ({ id: t.id, title: t.title[lang], icon: t.icon })));
    // Vier Reihen, abwechselnd gefüllt, damit jede Reihe Themen aus allen Kursen zeigt.
    const out: Tile[][] = [[], [], [], []];
    tiles.forEach((tile, i) => out[i % 4].push(tile));
    return out;
  }, [lang]);
  // Gemeinsame Uhr aller Reihen (Millisekunden seit dem ersten Bild)
  const elapsed = useSharedValue(0);
  useFrameCallback((frame) => {
    elapsed.set(frame.timeSinceFirstFrame);
  });
  return (
    <OnboardingPage
      lang={lang}
      step={step}
      total={total}
      button={<ContinueButton title={cont(lang)} onPress={next} />}
      decoration={<GlowCircle size={width * 0.78} offsetY={height * 0.2} />}>
      <PageTitle
        title={lang === 'en' ? 'Everything in one app' : 'Alles in einer App'}
        subtitle={
          lang === 'en'
            ? 'From fundamentals to exam prep: UniMathe covers a wide range of topics.'
            : 'Von Grundlagen bis zur Klausurvorbereitung: UniMathe deckt viele Themenbereiche ab.'
        }
      />
      {/* Das Laufband reicht bis an den Bildschirmrand (`.padding(.horizontal, -horizontalPadding)`). */}
      <View style={{ marginHorizontal: -pad, gap: size.rowSpacing + 8, marginTop: 4, overflow: 'hidden', paddingVertical: 6 }}>
        {rows.map((items, i) => (
          <MarqueeRow key={i} items={items} movesLeft={i % 2 === 0} size={size} elapsed={elapsed} />
        ))}
      </View>
    </OnboardingPage>
  );
}

// ---------------------------------------------------------------------------
// 7. Schritt-für-Schritt-Erklärungen (Demo wechselt alle 2,8 s)

const DEMO = {
  de: [
    {
      title: 'Was ist ein Vektor?',
      explanation: 'Ein Vektor beschreibt eine Richtung und eine Länge. Er wird als Koordinatenpaar dargestellt.',
      formula: '\\vec{v} = (x, y)',
      simple: 'Stell dir einen Pfeil vor: Er zeigt wohin und wie weit.',
    },
    {
      title: 'Länge berechnen',
      explanation: 'Die Länge eines Vektors berechnest du mit dem Satz des Pythagoras.',
      formula: '\\lVert \\vec{v} \\rVert = \\sqrt{x^2 + y^2}',
      simple: 'Du berechnest die Pfeillänge wie bei einem rechtwinkligen Dreieck.',
    },
    {
      title: 'Vektoren addieren',
      explanation: 'Addiere x-Werte und y-Werte getrennt. So erhältst du den Ergebnisvektor.',
      formula: '(2,3) + (1,4) = (3,7)',
      simple: 'Komponente für Komponente addieren, fertig.',
    },
  ],
  en: [
    {
      title: 'What is a vector?',
      explanation: 'A vector has a direction and a magnitude, represented by coordinates.',
      formula: '\\vec{v} = (x, y)',
      simple: 'Think of an arrow: it points somewhere and has a length.',
    },
    {
      title: 'Find the length',
      explanation: 'You compute vector length with the Pythagorean theorem.',
      formula: '\\lVert \\vec{v} \\rVert = \\sqrt{x^2 + y^2}',
      simple: 'It is the same triangle rule used for hypotenuse calculations.',
    },
    {
      title: 'Add vectors',
      explanation: 'Add x-values and y-values separately to get the result vector.',
      formula: '(2,3) + (1,4) = (3,7)',
      simple: 'Add each component one by one.',
    },
  ],
};

export function StepByStepScreen({ lang, step, total, next }: ScreenProps) {
  const { width, height, compact } = useLayout();
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % DEMO[lang].length), 2800);
    return () => clearInterval(timer);
  }, [lang]);
  const item = DEMO[lang][index % DEMO[lang].length];
  return (
    <OnboardingPage
      lang={lang}
      step={step}
      total={total}
      button={<ContinueButton title={cont(lang)} onPress={next} />}
      decoration={<GlowCircle size={width * 0.76} offsetY={height * 0.16} opacity={0.11} />}>
      <PageTitle
        title={lang === 'en' ? 'Step by Step Explanations' : 'Schritt für Schritt Erklärungen'}
        subtitle={
          lang === 'en'
            ? 'Complex learning content is split into clear, understandable steps.'
            : 'Komplexe Lerninhalte werden in klare, verständliche Einzelschritte aufgeteilt.'
        }
      />
      <View style={[styles.demoCard, { maxWidth: Math.min(width * 0.82, 332), borderRadius: compact ? 22 : 26 }, shadow(12, 0.12, 8)]}>
        <Animated.View key={index} entering={FadeIn.duration(450)} style={{ gap: 12 }}>
          <Text numberOfLines={2} style={[obFont(compact ? 20 : 22, 'bold'), { color: ob.ink }]}>
            {item.title}
          </Text>
          <Text style={[obFont(compact ? 15 : 16, 'medium'), { color: ob.grayStrong, lineHeight: (compact ? 15 : 16) * 1.4 }]}>{item.explanation}</Text>
          <View style={{ gap: 7 }}>
            <Text style={[obFont(13, 'semibold'), { color: ob.grayStrong }]}>{lang === 'en' ? 'Formula' : 'Formel'}</Text>
            <MathView html={`<div class="lesson-text">$$${escapeHtml(item.formula)}$$</div>`} estimatedHeight={56} />
          </View>
          <View style={{ gap: 6 }}>
            <Text style={[obFont(13, 'semibold'), { color: ob.grayStrong }]}>{lang === 'en' ? 'In simple words' : 'Einfach erklärt'}</Text>
            <Text style={[obFont(compact ? 14 : 15, 'medium'), { color: ob.ink, lineHeight: (compact ? 14 : 15) * 1.4 }]}>{item.simple}</Text>
          </View>
        </Animated.View>
        <View style={styles.dots}>
          {DEMO[lang].map((_, i) => (
            <View
              key={i}
              style={[styles.dot, { width: i === index ? 24 : 8, backgroundColor: i === index ? ob.blue : withAlpha(ob.gray, 0.3) }]}
            />
          ))}
        </View>
      </View>
      <View style={{ alignItems: 'center', gap: 6, marginTop: 8 }}>
        <Text style={[obFont(compact ? 17 : 18, 'semibold'), { color: ob.blue, textAlign: 'center' }]}>
          {lang === 'en' ? 'From complex to simple' : 'Von komplex zu einfach'}
        </Text>
        <Text style={[obFont(compact ? 13 : 14, 'medium'), { color: ob.grayStrong, textAlign: 'center' }]}>
          {lang === 'en' ? 'Step by step to understanding' : 'Schritt für Schritt zum Verständnis'}
        </Text>
      </View>
    </OnboardingPage>
  );
}

// ---------------------------------------------------------------------------
// 8. Persönlicher Lernplan

export function PlanScreen({ lang, step, total, next }: ScreenProps) {
  const { width, height, compact } = useLayout();
  const examKey = loadExamKey() ?? DEFAULT_EXAM_KEY;
  const title = examTitle(examKey, lang);
  const days = daysUntilExam(loadExamDate());
  const ranges = timelineRanges(days);
  const theory = theoryTopics(examKey, lang)
    .map((t) => `• ${t}`)
    .join('\n');
  const phases =
    lang === 'en'
      ? [
          { title: 'Understand theory instead of step-by-step explanations', detail: `${theory}\n+ 6 more exam-relevant topics`, icon: icon('list.number', 'format_list_numbered') },
          {
            title: 'Build a problem routine',
            detail: '• 50 focused practice sessions\n• From fundamentals to exam level\n• Step-by-step solutions included',
            icon: icon('calendar.badge.clock', 'event'),
          },
          { title: '3 real exams', detail: 'Work through 3 real exams under exam conditions.', icon: icon('doc.text.magnifyingglass', 'find_in_page') },
        ]
      : [
          { title: 'Theorie verstehen', detail: `${theory}\n+ 6 weitere prüfungsrelevante Themen`, icon: icon('list.number', 'format_list_numbered') },
          {
            title: 'Aufgabenroutine aufbauen',
            detail: '• 50 gezielte Übungseinheiten\n• Von Grundlagen bis Klausurniveau\n• Schritt-für-Schritt Lösungen inklusive',
            icon: icon('calendar.badge.clock', 'event'),
          },
          { title: '3 echte Klausuren', detail: 'Bearbeite 3 echte Klausuren unter Prüfungsbedingungen.', icon: icon('doc.text.magnifyingglass', 'find_in_page') },
        ];
  return (
    <OnboardingPage
      lang={lang}
      step={step}
      total={total}
      button={<ContinueButton title={lang === 'en' ? 'Start Plan' : 'Plan starten'} onPress={next} arrow={false} large />}
      decoration={<GlowCircle size={width * 0.76} offsetY={height * 0.16} opacity={0.11} />}>
      <Text style={[obFont(compact ? 34 : 38, 'bold'), { color: ob.ink }]}>{lang === 'en' ? 'Okay. Here is your plan.' : 'Okay. Hier ist dein Plan.'}</Text>
      <Text style={[obFont(compact ? 17 : 19, 'medium'), { color: ob.grayStrong }]}>
        {lang === 'en' ? `Based on your exam in ${days} days, we recommend:` : `Basierend auf deiner Klausur in ${days} Tagen empfehlen wir:`}
      </Text>
      <View style={[styles.goalCard, { maxWidth: Math.min(width * 0.86, 340) }, shadow(10, 0.1, 5)]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ fontSize: 30 }}>🎯</Text>
          <Text numberOfLines={2} style={[obFont(compact ? 24 : 26, 'bold'), { color: ob.ink, flex: 1 }]}>
            {lang === 'en' ? `Pass ${title} on your first attempt.` : `Bestehe ${title} im ersten Versuch.`}
          </Text>
        </View>
        <Text style={[obFont(compact ? 15 : 16, 'medium'), { color: ob.grayStrong }]}>
          {lang === 'en' ? 'A focused path all the way to exam day.' : 'Klarer Fokus bis zum Prüfungstag.'}
        </Text>
      </View>
      <Text style={[obFont(compact ? 28 : 30, 'bold'), { color: ob.ink, marginTop: 6 }]}>{lang === 'en' ? 'How we get you there:' : 'So erreichen wir das:'}</Text>
      <View style={{ gap: 14, marginBottom: 10 }}>
        {phases.map((phase, i) => (
          <View key={i} style={styles.phaseRow}>
            {i < phases.length - 1 && (
              <View style={styles.dashed} pointerEvents="none">
                <Svg width={2} height="100%">
                  <Line x1={1} y1={0} x2={1} y2="100%" stroke={withAlpha(ob.blue, 0.42)} strokeWidth={2} strokeDasharray={[6, 6]} />
                </Svg>
              </View>
            )}
            <View style={styles.phaseDot} />
            <View style={{ flex: 1, gap: 10 }}>
              <Text style={[obFont(compact ? 20 : 21, 'bold'), { color: ob.blue }]}>{dayRangeLabel(ranges[i], lang)}</Text>
              <View style={[styles.phaseCard, { maxWidth: Math.min(width * 0.8, 310) }, shadow(8, 0.08, 4)]}>
                <Icon name={phase.icon} size={20} color={ob.blue} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={[obFont(compact ? 19 : 20, 'bold'), { color: ob.ink }]}>{phase.title}</Text>
                  <Text style={[obFont(compact ? 14 : 15, 'medium'), { color: ob.grayStrong, lineHeight: (compact ? 14 : 15) * 1.45 }]}>
                    {phase.detail}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>
    </OnboardingPage>
  );
}

// ---------------------------------------------------------------------------
// 9. Neu: „100 % kostenlos“ (ersetzt Gratis-Testzeitraum, Erinnerung und Kaufseite)

const FREE_POINTS = [
  { de: 'Keine Werbung', en: 'No ads', icon: icon('nosign', 'block') },
  { de: 'Kein Abo', en: 'No subscription', icon: icon('creditcard.fill', 'credit_card_off') },
  { de: 'Keine In-App-Käufe', en: 'No in-app purchases', icon: icon('cart.badge.minus', 'remove_shopping_cart') },
  { de: 'Kein Konto nötig', en: 'No account needed', icon: icon('person.crop.circle.badge.xmark', 'no_accounts') },
];

/**
 * Aufbau wie die iOS-Seiten „3 Tage gratis“/„Erinnerung“ (zentriert, ohne Scrollen, Hinweis mit
 * Häkchen über dem Knopf). Die Inhalte blenden nacheinander ruhig ein.
 */
export function FreeScreen({ lang, step, total, next }: ScreenProps) {
  const { height, compact } = useLayout();
  // Größe nach Bildschirmhöhe, damit alles ohne Scrollen über den Knopf passt
  const hero = Math.max(90, Math.min(height * 0.17, 160));
  return (
    <OnboardingPage
      lang={lang}
      step={step}
      total={total}
      scroll={false}
      footnote={lang === 'en' ? 'No payment needed' : 'Keine Zahlung nötig'}
      button={<ContinueButton title={lang === 'en' ? "Let's go" : "Los geht's"} onPress={next} arrow={false} large />}>
      <View style={styles.freeContent}>
        {!compact && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.badge}>
            <Text style={[obFont(15, 'bold'), { color: ob.blue }]}>{lang === 'en' ? 'Free for everyone' : 'Kostenlos für alle'}</Text>
          </Animated.View>
        )}
        <Animated.View entering={FadeIn.duration(450).delay(60)} style={[styles.hero, { width: hero, height: hero, borderRadius: hero / 2 }]}>
          <Text style={[obFont(hero * 0.34, 'bold'), { color: ob.blue }]}>{lang === 'en' ? '€0' : '0 €'}</Text>
        </Animated.View>
        <Animated.View entering={FadeIn.duration(450).delay(120)} style={{ gap: compact ? 8 : 12, alignItems: 'center' }}>
          <Text style={[obFont(compact ? 27 : 32, 'bold'), styles.freeTitle]}>
            {lang === 'en' ? (
              <>
                UniMathe is <Text style={{ color: ob.blue }}>100{'\u00A0'}% free</Text>
              </>
            ) : (
              <>
                UniMathe ist <Text style={{ color: ob.blue }}>100{'\u00A0'}% kostenlos</Text>
              </>
            )}
          </Text>
          <Text style={[obFont(compact ? 15 : 17, 'medium'), styles.freeSubtitle]}>
            {lang === 'en'
              ? 'All lessons, exercises, exams and the calculator – no costs and no ads.'
              : 'Alle Lektionen, Übungen, Klausuren und der Rechner – ohne Kosten und ohne Werbung.'}
          </Text>
        </Animated.View>
        <View style={styles.pills}>
          {FREE_POINTS.map((point, i) => (
            <Animated.View key={point.de} entering={FadeIn.duration(400).delay(220 + i * 80)} style={[styles.pill, shadow(8, 0.08, 4)]}>
              <View style={styles.pillIcon}>
                <Icon name={point.icon} size={15} color={ob.blue} />
              </View>
              <Text numberOfLines={2} style={[obFont(compact ? 13 : 14, 'semibold'), { color: ob.ink, flex: 1 }]}>
                {point[lang]}
              </Text>
            </Animated.View>
          ))}
        </View>
      </View>
    </OnboardingPage>
  );
}

const styles = StyleSheet.create({
  marquee: { flexDirection: 'row', gap: SPACING, paddingVertical: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: withAlpha(ob.gray, 0.2),
  },
  chipIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: ob.blue, alignItems: 'center', justifyContent: 'center' },
  demoCard: {
    alignSelf: 'center',
    width: '100%',
    padding: 16,
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.93)',
    borderWidth: 1,
    borderColor: withAlpha(ob.gray, 0.2),
  },
  dots: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 2 },
  dot: { height: 8, borderRadius: 4 },
  goalCard: {
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: withAlpha(ob.gray, 0.2),
  },
  phaseRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  dashed: { position: 'absolute', left: 9, top: 12, bottom: -14, width: 2 },
  phaseDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: ob.blue, marginLeft: 4, marginRight: 4, marginTop: 8 },
  phaseCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: withAlpha(ob.gray, 0.2),
  },
  hero: { backgroundColor: withAlpha(ob.blue, 0.12), alignItems: 'center', justifyContent: 'center' },
  freeContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: withAlpha(ob.blue, 0.18),
  },
  freeTitle: { color: ob.ink, textAlign: 'center', maxWidth: 330 },
  freeSubtitle: { color: ob.grayStrong, textAlign: 'center', maxWidth: 310 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, alignSelf: 'stretch' },
  pill: {
    flexBasis: '46%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: withAlpha(ob.gray, 0.2),
  },
  pillIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: withAlpha(ob.blue, 0.12), alignItems: 'center', justifyContent: 'center' },
});
