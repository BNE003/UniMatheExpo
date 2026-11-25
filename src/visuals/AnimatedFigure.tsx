/**
 * Rahmen einer erklärenden Grafik: Zeichenfläche, Phasenfortschritt, Bildunterschrift, Wiederholen.
 * Port von `AnimatedFigure` (LessonVectorVisuals.swift:541) mit denselben Zeitkonstanten:
 * 1,2 s Pause, dann alle 2,6 s die nächste Phase, Übergang 0,9 s ease-in-out.
 */
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  cancelAnimation,
  createAnimatedComponent,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { useLang } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { fontFamilies, withAlpha, type Palette } from '@/theme/tokens';

import { coordinateGridPaths, elementOpacity, elementPath, lerpPt, toPx } from './geometry';
import type { ColorRole, FigureSpec, LabelEl, PlaneWindow, SceneEl, ShapeEl } from './scene';

const AnimatedPath = createAnimatedComponent(Path);

const START_DELAY = 1200;
const PHASE_INTERVAL = 2600;
const TRANSITION = { duration: 900, easing: Easing.bezier(0.42, 0, 0.58, 1) };

function roleColor(colors: Palette, role: ColorRole): string {
  switch (role) {
    case 'first':
      return colors.accent;
    case 'second':
      return colors.orange;
    case 'result':
      return colors.difficulty.easy;
    case 'warning':
      return colors.difficulty.hard;
    case 'extra':
      return colors.purple;
  }
}

/** Element `k` in allen Phasen; prüft, dass jede Phase dieselben Elemente liefert. */
function tracks(spec: FigureSpec, phases: number): SceneEl[][] {
  const scenes = Array.from({ length: phases }, (_, i) => spec.scene(i));
  const keys = scenes[0].map((e) => e.key);
  scenes.forEach((s, i) => {
    const k = s.map((e) => e.key);
    if (k.join('|') !== keys.join('|')) {
      throw new Error(`Grafik: Phase ${i} liefert andere Elemente als Phase 0 (${k.join(',')})`);
    }
  });
  return keys.map((_, k) => scenes.map((s) => s[k]));
}

interface Props {
  spec: FigureSpec;
  captions: string[];
}

export function AnimatedFigure({ spec, captions }: Props) {
  const { colors } = useTheme();
  const lang = useLang();
  const [width, setWidth] = useState(0);
  const [phase, setPhase] = useState(0);
  const [runId, setRunId] = useState(0);
  const position = useSharedValue(0);
  const aspect = spec.aspectRatio ?? 1;
  const height = width / aspect;
  const elementTracks = useMemo(() => tracks(spec, captions.length), [spec, captions.length]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    cancelAnimation(position);
    position.set(0);
    const advance = (next: number) => {
      if (next >= captions.length) return;
      setPhase(next);
      position.set(withTiming(next, TRANSITION));
      timers.push(setTimeout(() => advance(next + 1), PHASE_INTERVAL));
    };
    timers.push(setTimeout(() => advance(1), START_DELAY));
    return () => timers.forEach(clearTimeout);
  }, [runId, captions.length, position]);

  const grid = useMemo(
    () => (width > 0 && spec.showGrid !== false ? coordinateGridPaths(spec.window, width, height) : null),
    [spec.window, spec.showGrid, width, height],
  );

  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width));

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: '#000' }]}>
      <View style={[styles.canvas, { aspectRatio: aspect }]} onLayout={onLayout}>
        {width > 0 && (
          <>
            <Svg width={width} height={height}>
              {grid && (
                <>
                  <Path d={grid.grid} stroke={colors.textSecondary} strokeOpacity={0.25} strokeWidth={0.5} />
                  <Path d={grid.axes} stroke={colors.textSecondary} strokeOpacity={0.9} strokeWidth={1} />
                </>
              )}
              {elementTracks.map((track) =>
                track[0].kind === 'label' ? null : (
                  <ShapeTrack
                    key={track[0].key}
                    track={track as ShapeEl[]}
                    position={position}
                    window={spec.window}
                    width={width}
                    height={height}
                    colors={colors}
                  />
                ),
              )}
            </Svg>
            {elementTracks.map((track) =>
              track[0].kind === 'label' ? (
                <LabelTrack
                  key={track[0].key}
                  track={track as LabelEl[]}
                  phase={phase}
                  position={position}
                  window={spec.window}
                  width={width}
                  height={height}
                  colors={colors}
                />
              ) : null,
            )}
          </>
        )}
      </View>

      <View style={styles.progress}>
        {captions.map((_, i) => (
          <View
            key={i}
            style={[styles.segment, { backgroundColor: i <= phase ? colors.accent : colors.textSecondary, opacity: i <= phase ? 1 : 0.25 }]}
          />
        ))}
      </View>

      <View style={styles.captionRow}>
        <Animated.Text key={phase} entering={FadeIn.duration(300)} style={[styles.caption, { color: colors.text }]}>
          {captions[Math.min(phase, captions.length - 1)]}
        </Animated.Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={lang === 'en' ? 'Replay animation' : 'Animation wiederholen'}
          hitSlop={10}
          onPress={() => {
            setPhase(0);
            setRunId((r) => r + 1);
          }}
          style={({ pressed }) => [styles.replay, { backgroundColor: withAlpha(colors.accent, 0.12), opacity: pressed ? 0.6 : 1 }]}>
          <Svg width={14} height={14} viewBox="0 0 24 24">
            <Path
              d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.6h4.6"
              fill="none"
              stroke={colors.accent}
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>
      </View>
    </View>
  );
}

interface TrackProps<T> {
  track: T[];
  position: SharedValue<number>;
  window: PlaneWindow;
  width: number;
  height: number;
  colors: Palette;
}

function ShapeTrack({ track, position, window, width, height, colors }: TrackProps<ShapeEl>) {
  const first = track[0];
  const animatedProps = useAnimatedProps(() => {
    const last = track.length - 1;
    const p = Math.min(Math.max(position.get(), 0), last);
    const i = Math.min(Math.floor(p), Math.max(last - 1, 0));
    const t = last === 0 ? 0 : p - i;
    const a = track[i];
    const b = track[Math.min(i + 1, last)];
    return { d: elementPath(a, b, t, window, width, height), opacity: elementOpacity(a, b, t) };
  });

  switch (first.kind) {
    case 'arrow':
      return (
        <AnimatedPath
          animatedProps={animatedProps}
          fill="none"
          stroke={roleColor(colors, first.color)}
          strokeWidth={first.width ?? 3}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={first.dashed ? [5, 5] : undefined}
        />
      );
    case 'line':
    case 'grid':
      return (
        <AnimatedPath
          animatedProps={animatedProps}
          fill="none"
          stroke={roleColor(colors, first.color)}
          strokeOpacity={first.alpha ?? 1}
          strokeWidth={first.width ?? 1}
          strokeDasharray={first.kind === 'line' && first.dash ? [...first.dash] : undefined}
        />
      );
    case 'poly':
      return (
        <AnimatedPath
          animatedProps={animatedProps}
          fill={first.fill ? roleColor(colors, first.fill.color) : 'none'}
          fillOpacity={first.fill?.alpha ?? 1}
          stroke={first.stroke ? roleColor(colors, first.stroke.color) : undefined}
          strokeOpacity={first.stroke?.alpha ?? 1}
          strokeWidth={first.stroke?.width ?? 0}
          strokeDasharray={first.stroke?.dash ? [...first.stroke.dash] : undefined}
          strokeLinejoin="round"
        />
      );
    case 'dot':
      return first.hollow ? (
        <AnimatedPath
          animatedProps={animatedProps}
          fill="none"
          stroke={roleColor(colors, first.color)}
          strokeWidth={2}
          strokeDasharray={[3, 3]}
        />
      ) : (
        <AnimatedPath animatedProps={animatedProps} fill={roleColor(colors, first.color)} />
      );
  }
}

const LABEL_BOX = { width: 140, height: 22 };

function LabelTrack({ track, phase, position, window, width, height, colors }: TrackProps<LabelEl> & { phase: number }) {
  const current = track[Math.min(phase, track.length - 1)];
  const style = useAnimatedStyle(() => {
    const last = track.length - 1;
    const p = Math.min(Math.max(position.get(), 0), last);
    const i = Math.min(Math.floor(p), Math.max(last - 1, 0));
    const t = last === 0 ? 0 : p - i;
    const a = track[i];
    const b = track[Math.min(i + 1, last)];
    const at = toPx(lerpPt(a.at, b.at, t), window, width, height);
    const oa = a.offset ?? [12, -10];
    const ob = b.offset ?? [12, -10];
    const dx = oa[0] + (ob[0] - oa[0]) * t;
    const dy = oa[1] + (ob[1] - oa[1]) * t;
    return {
      opacity: elementOpacity(a, b, t),
      transform: [{ translateX: at[0] + dx - LABEL_BOX.width / 2 }, { translateY: at[1] + dy - LABEL_BOX.height / 2 }],
    };
  });
  return (
    <Animated.View pointerEvents="none" style={[styles.labelBox, style]}>
      <Text style={[styles.label, { color: roleColor(colors, current.color), backgroundColor: withAlpha(colors.surfaceStrong, 0.75) }]}>
        {current.text}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: 16,
    gap: 10,
    elevation: 2,
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  canvas: { width: '100%', borderRadius: 12, overflow: 'hidden' },
  progress: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 4, borderRadius: 2 },
  captionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  caption: { flex: 1, fontFamily: fontFamilies.regular, fontSize: 13, lineHeight: 18 },
  replay: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  labelBox: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: LABEL_BOX.width,
    height: LABEL_BOX.height,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'serif',
    fontStyle: 'italic',
    fontWeight: '600',
    fontSize: 13,
    paddingHorizontal: 3,
    borderRadius: 4,
    overflow: 'hidden',
  },
});
