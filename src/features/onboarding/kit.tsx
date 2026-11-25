/**
 * Gemeinsame Bausteine des Onboardings (Views/OnboardingScreens.swift, OnboardingCoordinator.swift):
 * Farben, Manrope-Schrift, bewegter Hintergrund, Kopfzeile mit Schrittanzeige und der Weiter-Knopf.
 * Das Onboarding ist wie in iOS immer hell (onboardingCanvas = Weiß).
 */
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Icon, PressableScale } from '@/components/ui';
import type { IconName } from '@/content/icons';
import type { Lang } from '@/content/types';
import { onboardingFonts, withAlpha } from '@/theme/tokens';

/** SettingsModel.swift:212 */
export const ob = {
  blue: '#407BFF',
  ink: '#263238',
  gray: '#858585',
  grayStrong: '#707070',
  canvas: '#FFFFFF',
} as const;

export const obFont = (size: number, weight: keyof typeof onboardingFonts = 'regular'): TextStyle => ({
  fontFamily: onboardingFonts[weight],
  fontSize: size,
});

/** Größenstufen wie `geometry.size.height < 700` und `geometry.size.width < 400` in Swift. */
export function useLayout() {
  const { width, height } = useWindowDimensions();
  return { width, height, compact: height < 700, pad: width < 400 ? 18 : 24 };
}

export interface ScreenProps {
  lang: Lang;
  step: number;
  total: number;
  next: () => void;
}

export const icon = (ios: string, android: string): IconName => ({ ios, android }) as IconName;

/** Hintergrund: Verlauf plus zwei ruhende, sehr helle Kreise (bewusst ohne Bewegung). */
export function AnimatedBackground() {
  const { width, height } = useLayout();
  const d1 = width * 0.62;
  const d2 = width * 0.86;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="obBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={ob.canvas} />
            <Stop offset="1" stopColor={ob.blue} stopOpacity={0.14} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#obBg)" />
      </Svg>
      <View style={styles.center}>
        <View
          style={{
            width: d1,
            height: d1,
            borderRadius: d1 / 2,
            backgroundColor: withAlpha(ob.blue, 0.08),
            transform: [{ translateX: width * 0.02 }, { translateY: -height * 0.18 }],
          }}
        />
      </View>
      <View style={styles.center}>
        <View
          style={{
            width: d2,
            height: d2,
            borderRadius: d2 / 2,
            backgroundColor: withAlpha(ob.ink, 0.05),
            transform: [{ translateX: -width * 0.02 }, { translateY: height * 0.32 }],
          }}
        />
      </View>
    </View>
  );
}

/** Heller Kreis hinter dem Inhalt (`Circle().fill(onboardingBlue.opacity(…)).offset(y: …)`). */
export function GlowCircle({ size, offsetY, offsetX = 0, opacity = 0.1 }: { size: number; offsetY: number; offsetX?: number; opacity?: number }) {
  return (
    <View style={styles.center} pointerEvents="none">
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: withAlpha(ob.blue, opacity),
          transform: [{ translateX: offsetX }, { translateY: offsetY }],
        }}
      />
    </View>
  );
}

/** „Schritt n von m“ und die Kapsel „Onboarding“. */
export function OnboardingHeader({ step, total, lang }: { step: number; total: number; lang: Lang }) {
  const { compact } = useLayout();
  return (
    <View style={{ gap: 16 }}>
      <View style={styles.headerRow}>
        <Text style={[obFont(compact ? 14 : 16, 'medium'), { color: ob.grayStrong }]}>
          {lang === 'en' ? `Step ${step} of ${total}` : `Schritt ${step} von ${total}`}
        </Text>
        <View style={styles.capsule}>
          <Text style={[obFont(compact ? 13 : 15, 'semibold'), { color: ob.ink }]}>Onboarding</Text>
        </View>
      </View>
      <View style={styles.progress}>
        {Array.from({ length: Math.max(total, 1) }, (_, i) => (
          <View key={i} style={[styles.segment, { backgroundColor: i < step ? ob.blue : withAlpha(ob.gray, 0.25) }]} />
        ))}
      </View>
    </View>
  );
}

export function ContinueButton({
  title,
  onPress,
  disabled = false,
  arrow = true,
  large = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  arrow?: boolean;
  large?: boolean;
}) {
  const radius = large ? 26 : 20;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, { borderRadius: radius, paddingVertical: large ? 18 : 16, opacity: disabled ? 0.55 : 1 }]}>
      <Svg style={[StyleSheet.absoluteFill, { borderRadius: radius }]} preserveAspectRatio="none" viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="obButton" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={ob.blue} />
            <Stop offset="1" stopColor={ob.ink} stopOpacity={0.88} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" rx={0} fill="url(#obButton)" />
      </Svg>
      <Text style={[obFont(18, large ? 'bold' : 'semibold'), { color: '#FFFFFF' }]}>{title}</Text>
      {arrow && <Icon name={icon('arrow.right', 'arrow_forward')} size={16} color="#FFFFFF" />}
    </PressableScale>
  );
}

/**
 * Seitengerüst: Hintergrund, scrollbarer Inhalt mit Kopfzeile und unten fest ein Knopf über einem
 * weißen Verlauf (`.overlay(alignment: .bottom)`).
 */
export function OnboardingPage({
  lang,
  step,
  total,
  button,
  children,
  decoration,
  scroll = true,
  contentStyle,
  footnote,
}: {
  lang: Lang;
  step: number;
  total: number;
  button: ReactNode;
  children: ReactNode;
  decoration?: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  /** Kurzer Hinweis mit Häkchen über dem Knopf (wie „Jetzt keine Zahlung fällig“ in iOS) */
  footnote?: string;
}) {
  const insets = useSafeAreaInsets();
  const { compact, pad } = useLayout();
  const content = (
    <View style={[{ paddingHorizontal: pad, paddingTop: insets.top + (compact ? 20 : 24), gap: 16 }, !scroll && { flex: 1 }, contentStyle]}>
      <OnboardingHeader step={step} total={total} lang={lang} />
      {children}
    </View>
  );
  return (
    <View style={styles.page}>
      <AnimatedBackground />
      {decoration}
      {scroll ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: (compact ? 126 : 144) + insets.bottom }}>
          {content}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, paddingBottom: (compact ? 120 : 136) + (footnote ? 30 : 0) + insets.bottom }}>{content}</View>
      )}
      <View style={styles.bottom} pointerEvents="box-none">
        <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 100 100" pointerEvents="none">
          <Defs>
            <LinearGradient id="obFade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={ob.canvas} stopOpacity={0} />
              <Stop offset="0.5" stopColor={ob.canvas} stopOpacity={0.92} />
              <Stop offset="1" stopColor={ob.canvas} stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100" height="100" fill="url(#obFade)" />
        </Svg>
        <View style={{ paddingHorizontal: pad, paddingTop: 10, paddingBottom: insets.bottom + 14, gap: 12 }}>
          {footnote ? (
            <View style={styles.footnote}>
              <Icon name={icon('checkmark', 'check')} size={13} color={ob.grayStrong} />
              <Text style={[obFont(15, 'semibold'), { color: ob.grayStrong }]}>{footnote}</Text>
            </View>
          ) : null}
          {button}
        </View>
      </View>
    </View>
  );
}

/** Titel und Untertitel einer Seite. */
export function PageTitle({ title, subtitle, center = false, size }: { title: string; subtitle?: string; center?: boolean; size?: number }) {
  const { compact } = useLayout();
  const align = center ? ('center' as const) : ('left' as const);
  return (
    <View style={{ gap: 8 }}>
      <Text style={[obFont(size ?? (compact ? 30 : 34), 'bold'), { color: ob.ink, textAlign: align }]}>{title}</Text>
      {subtitle ? (
        <Text style={[obFont(compact ? 17 : 19, 'medium'), { color: ob.grayStrong, textAlign: align, lineHeight: (compact ? 17 : 19) * 1.35 }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

/** Weiße Karte mit dünnem Rand (`RoundedRectangle().fill(.white.opacity(0.9)).strokeBorder(gray 0.2)`). */
export const cardStyle = (radius: number, selected = false): ViewStyle => ({
  borderRadius: radius,
  backgroundColor: selected ? withAlpha(ob.blue, 0.08) : 'rgba(255,255,255,0.9)',
  borderWidth: selected ? 1.6 : 1,
  borderColor: selected ? withAlpha(ob.blue, 0.75) : withAlpha(ob.gray, 0.22),
});

export const shadow = (radius: number, opacity: number, y: number, color: string = ob.ink): ViewStyle => ({
  shadowColor: color,
  shadowOpacity: opacity,
  shadowRadius: radius,
  shadowOffset: { width: 0, height: y },
  elevation: Math.round(radius / 3),
});

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: ob.canvas },
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  capsule: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: withAlpha(ob.gray, 0.22),
  },
  progress: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  segment: { flex: 1, height: 7, borderRadius: 3.5 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
    ...shadow(10, 0.24, 5, ob.blue),
  },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  footnote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
});
