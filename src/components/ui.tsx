/**
 * Kleine gemeinsame Bausteine, nachgebaut aus der iOS-App.
 */
import { SymbolView } from 'expo-symbols';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import type { IconName } from '@/content/icons';
import { useTheme } from '@/theme/ThemeProvider';
import { appFont, withAlpha } from '@/theme/tokens';

/** Symbol: SF Symbol auf iOS, Material Symbol auf Android. */
export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color: string }) {
  return <SymbolView name={{ ios: name.ios, android: name.android, web: name.android }} size={size} tintColor={color} />;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * PressableCardStyle (SubTopicsView.swift:745): leichtes Eindrücken auf 98 %.
 * Der Stil (inkl. flex/Breite) liegt direkt auf dem Pressable, damit Layout wie bei einer View greift.
 */
export function PressableScale({
  children,
  style,
  ...props
}: Omit<PressableProps, 'style'> & { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  return (
    <AnimatedPressable
      {...props}
      style={[style, animated]}
      onPressIn={(e) => {
        scale.set(withTiming(0.98, { duration: 150 }));
        props.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.set(withTiming(1, { duration: 150 }));
        props.onPressOut?.(e);
      }}>
      {children}
    </AnimatedPressable>
  );
}

/**
 * Hintergrund der Übersichtsseiten: Verlauf appBackground → appBackgroundSecondary mit zwei
 * dezenten Kreisen (ContentView.swift / SubTopicsView.swift).
 */
export function ScreenBackground({ variant = 'home' }: { variant?: 'home' | 'subtopics' }) {
  const { colors } = useTheme();
  const [top, bottom] =
    variant === 'home' ? [colors.background, colors.backgroundSecondary] : [colors.backgroundSecondary, colors.background];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 100 200" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={top} />
            <Stop offset="1" stopColor={bottom} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="200" fill="url(#bg)" />
      </Svg>
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 200" preserveAspectRatio="xMidYMid slice">
        <Circle cx="20" cy="60" r="40" fill={withAlpha(colors.accent, 0.05)} />
        <Circle cx="80" cy="140" r="30" fill={withAlpha(colors.purple, variant === 'home' ? 0.05 : 0.03)} />
      </Svg>
    </View>
  );
}

/** Kreis mit Akzentverlauf für Themen-Symbole (TopicCard / SubTopicCard). */
export function GradientCircle({ size, children }: { size: number; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.circleShadow, { width: size, height: size, borderRadius: size / 2, shadowColor: colors.accent }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="circle" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.accent} />
            <Stop offset="1" stopColor={colors.accent} stopOpacity={0.8} />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#circle)" />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  segmented: { flexDirection: 'row', borderRadius: 10, padding: 3 },
  segment: { flex: 1, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 8, alignItems: 'center' },
  glass: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    elevation: 3,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  primary: {
    height: 54,
    borderRadius: 14,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 4,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  circleShadow: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});

/** Segmentierte Auswahl (iOS: Picker mit .segmented). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: withAlpha(colors.text, 0.06) }]} accessibilityRole="tablist">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, selected && { backgroundColor: colors.surfaceStrong, elevation: 1 }]}>
            <Text numberOfLines={1} style={[appFont(14, selected ? 'semibold' : 'regular'), { color: colors.text }]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Karte des Rechners (GlassCard, MatrixCalculatorView.swift:1336). */
export function GlassCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.glass,
        { backgroundColor: colors.surface, borderColor: withAlpha(colors.surface, 0.4), shadowColor: '#000' },
        style,
      ]}>
      {children}
    </View>
  );
}

/** Hauptknopf mit Akzentverlauf (PrimaryButtonStyle). */
export function PrimaryButton({
  title,
  onPress,
  color,
  icon,
}: {
  title: string;
  onPress: () => void;
  color?: string;
  icon?: IconName;
}) {
  const { colors } = useTheme();
  const tint = color ?? colors.accent;
  return (
    <PressableScale accessibilityRole="button" onPress={onPress} style={[styles.primary, { shadowColor: tint }]}>
      <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="primary" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={tint} />
            <Stop offset="1" stopColor={tint} stopOpacity={0.75} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#primary)" />
      </Svg>
      {icon && <Icon name={icon} size={18} color="#FFFFFF" />}
      <Text style={[appFont(17, 'semibold'), { color: '#FFFFFF' }]}>{title}</Text>
    </PressableScale>
  );
}
