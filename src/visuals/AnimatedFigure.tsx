/**
 * Rahmen einer erklärenden Grafik: Zeichenfläche, Phasenfortschritt, Bildunterschrift, Wiederholen.
 * Port von `AnimatedFigure` (LessonVectorVisuals.swift:541) mit denselben Zeitkonstanten:
 * 1,2 s Pause, dann alle 2,6 s die nächste Phase, Übergang 0,9 s ease-in-out.
 *
 * Ein gemeinsamer Wert `position` läuft linear von Phase k nach k + 1 (über TRANSITION_WINDOW ms).
 * Jedes Element berechnet daraus seinen eigenen Fortschritt (Verzögerung, Dauer, Kurve) und
 * interpoliert Geometrie, Farben, Linienbreite und Deckkraft auf dem UI-Thread.
 */
import { useEffect, useId, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View, type LayoutChangeEvent, type TextStyle } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  cancelAnimation,
  createAnimatedComponent,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { ClipPath, Defs, G, Path } from 'react-native-svg';

import { useLang } from '@/i18n';
import { monoFont } from '@/theme/mono';
import { useTheme } from '@/theme/ThemeProvider';
import { fontFamilies, withAlpha, type Palette } from '@/theme/tokens';

import { coordinateGridPaths, ease, elementPath, labelPoint, lerp, regionPath } from './geometry';
import {
  figureTracks,
  type Chip,
  type ColorName,
  type FigureSpec,
  type LabelEl,
  type Paint,
  type PlaneWindow,
  type RegionEl,
  type SceneEl,
  type ShapeEl,
} from './scene';

const AnimatedPath = createAnimatedComponent(Path);
const AnimatedG = createAnimatedComponent(G);

const START_DELAY = 1200;
const PHASE_INTERVAL = 2600;
/** Zeitfenster eines Übergangs; muss länger sein als die längste Verzögerung + Dauer eines Elements. */
const TRANSITION_WINDOW = 2400;
const DEFAULT_DURATION = 900;

export function namedColor(colors: Palette, name: ColorName): string {
  switch (name) {
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
    case 'primary':
      return colors.text;
    case 'secondary':
      return colors.textSecondary;
    case 'surface':
      return colors.surface;
    case 'surfaceStrong':
      return colors.surfaceStrong;
    case 'white':
      return '#FFFFFF';
  }
}

const paint = (colors: Palette, p: Paint | undefined) => (p ? withAlpha(namedColor(colors, p.color), p.alpha ?? 1) : null);

/** Fortschritt eines Elements: Index von/nach und eigene Kurve (Worklet). */
function trackProgress(position: number, last: number, delay: number[], duration: number[], easing: (string | undefined)[]) {
  'worklet';
  const p = Math.min(Math.max(position, 0), last);
  if (last === 0) return { a: 0, b: 0, t: 1 };
  const i = Math.min(Math.floor(p), last - 1);
  const frac = p - i;
  if (frac <= 0) return { a: i, b: i, t: 1 };
  if (frac >= 1) return { a: i + 1, b: i + 1, t: 1 };
  const b = i + 1;
  const x = (frac * TRANSITION_WINDOW - delay[b]) / duration[b];
  return { a: i, b, t: ease(easing[b], x) };
}

function timingArrays(track: SceneEl[]) {
  return {
    delay: track.map((e) => e.delay ?? 0),
    duration: track.map((e) => e.duration ?? DEFAULT_DURATION),
    easing: track.map((e) => e.easing),
  };
}

/** Geometrie-Signatur ohne Farbe, Deckkraft und Zeitverhalten. */
const GEOMETRY_IGNORED = new Set(['key', 'opacity', 'color', 'alpha', 'fill', 'stroke', 'delay', 'duration', 'easing', 'dashed', 'dash', 'width']);
const geometrySignature = (el: SceneEl) => JSON.stringify(el, (k, v) => (GEOMETRY_IGNORED.has(k) ? undefined : v));

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
  const tracks = useMemo(() => figureTracks(spec, captions.length), [spec, captions.length]);
  const clipPrefix = useId().replace(/[^a-zA-Z0-9]/g, '');

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    cancelAnimation(position);
    position.set(0);
    const advance = (next: number) => {
      if (next >= captions.length) return;
      setPhase(next);
      position.set(next - 1);
      position.set(withTiming(next, { duration: TRANSITION_WINDOW, easing: Easing.linear }));
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
              {tracks.map((track) => {
                const first = track[0];
                if (first.kind === 'label') return null;
                if (first.kind === 'region') {
                  return (
                    <RegionTrack
                      key={first.key}
                      id={`${clipPrefix}${first.key}`}
                      track={track as RegionEl[]}
                      phase={phase}
                      position={position}
                      window={spec.window}
                      width={width}
                      height={height}
                      colors={colors}
                    />
                  );
                }
                return (
                  <ShapeTrack
                    key={first.key}
                    track={track as ShapeEl[]}
                    phase={phase}
                    position={position}
                    window={spec.window}
                    width={width}
                    height={height}
                    colors={colors}
                  />
                );
              })}
            </Svg>
            {tracks.map((track) =>
              track[0].kind === 'label' ? (
                <LabelTrack
                  key={track[0].key}
                  textScale={spec.textReferenceWidth ? width / spec.textReferenceWidth : 1}
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
  phase: number;
  position: SharedValue<number>;
  window: PlaneWindow;
  width: number;
  height: number;
  colors: Palette;
}

/** Linienfarbe, Füllung, Breite und Strichmuster eines Elements in einer Phase. */
function shapeStyle(el: ShapeEl, colors: Palette) {
  switch (el.kind) {
    case 'arrow':
      return {
        stroke: withAlpha(namedColor(colors, el.color), el.alpha ?? 1),
        fill: null,
        width: el.width ?? 3,
        dash: el.dashed ? [5, 5] : undefined,
        cap: 'round' as const,
        join: 'round' as const,
      };
    case 'line':
    case 'grid':
      return {
        stroke: withAlpha(namedColor(colors, el.color), el.alpha ?? 1),
        fill: null,
        width: el.width ?? 1,
        dash: el.kind === 'line' && el.dash ? [...el.dash] : undefined,
        cap: 'butt' as const,
        join: 'miter' as const,
      };
    default:
      return {
        stroke: paint(colors, el.stroke),
        fill: paint(colors, el.fill),
        width: el.stroke?.width ?? 0,
        dash: el.stroke?.dash ? [...el.stroke.dash] : undefined,
        cap: el.stroke?.cap ?? 'butt',
        join: el.stroke?.join ?? 'miter',
      };
  }
}

function ShapeTrack({ track, phase, position, window, width, height, colors }: TrackProps<ShapeEl>) {
  const prepared = useMemo(() => {
    const styles = track.map((el) => shapeStyle(el, colors));
    const signatures = track.map(geometrySignature);
    return {
      ds: track.map((el) => elementPath(el, el, 1, window, width, height)),
      same: track.map((_, i) => i + 1 < track.length && signatures[i] === signatures[i + 1]),
      strokes: styles.map((s) => s.stroke ?? 'rgba(0,0,0,0)'),
      fills: styles.map((s) => s.fill ?? 'rgba(0,0,0,0)'),
      widths: styles.map((s) => s.width),
      opacities: track.map((el) => el.opacity ?? 1),
      ...timingArrays(track),
      hasStroke: styles.some((s) => s.stroke),
      hasFill: styles.some((s) => s.fill),
      strokeAnimated: styles.some((s) => s.stroke !== styles[0].stroke),
      fillAnimated: styles.some((s) => s.fill !== styles[0].fill),
    };
  }, [track, window, width, height, colors]);

  const animatedProps = useAnimatedProps(() => {
    const pr = prepared;
    const { a, b, t } = trackProgress(position.get(), track.length - 1, pr.delay, pr.duration, pr.easing);
    let d: string;
    if (t <= 0) d = pr.ds[a];
    else if (t >= 1 || a === b || pr.same[a]) d = pr.ds[b];
    else d = elementPath(track[a], track[b], t, window, width, height);
    const props: Record<string, unknown> = {
      d,
      opacity: lerp(pr.opacities[a], pr.opacities[b], t),
      strokeWidth: lerp(pr.widths[a], pr.widths[b], t),
    };
    if (pr.strokeAnimated) props.stroke = interpolateColor(t, [0, 1], [pr.strokes[a], pr.strokes[b]]);
    if (pr.fillAnimated) props.fill = interpolateColor(t, [0, 1], [pr.fills[a], pr.fills[b]]);
    return props;
  });

  const style = shapeStyle(track[Math.min(phase, track.length - 1)], colors);
  return (
    <AnimatedPath
      animatedProps={animatedProps}
      fill={prepared.hasFill ? prepared.fills[0] : 'none'}
      stroke={prepared.hasStroke ? prepared.strokes[0] : undefined}
      strokeLinecap={style.cap}
      strokeLinejoin={style.join}
      strokeDasharray={style.dash}
    />
  );
}

/** Mengen-Flächen: feste Geometrie, animierte Deckkraft. */
function RegionTrack({ id, track, phase, position, window, width, height, colors }: TrackProps<RegionEl> & { id: string }) {
  const el = track[Math.min(phase, track.length - 1)];
  const geometry = useMemo(
    () => ({
      d: regionPath(el.shapes, window, width, height),
      clip: el.clip ? regionPath(el.clip.shapes, window, width, height) : null,
    }),
    [el, window, width, height],
  );
  const timing = useMemo(() => ({ ...timingArrays(track), opacities: track.map((e) => e.opacity ?? 1) }), [track]);
  const animatedProps = useAnimatedProps(() => {
    const { a, b, t } = trackProgress(position.get(), track.length - 1, timing.delay, timing.duration, timing.easing);
    return { opacity: lerp(timing.opacities[a], timing.opacities[b], t) };
  });
  return (
    <AnimatedG animatedProps={animatedProps}>
      {geometry.clip && (
        <Defs>
          <ClipPath id={id}>
            <Path d={geometry.clip} clipRule={el.clip?.rule ?? 'nonzero'} />
          </ClipPath>
        </Defs>
      )}
      <Path
        d={geometry.d}
        fill={paint(colors, el.fill) ?? 'none'}
        fillRule={el.rule ?? 'nonzero'}
        clipPath={geometry.clip ? `url(#${id})` : undefined}
      />
    </AnimatedG>
  );
}

const LABEL_BOX = { width: 600, height: 80 };
const serifFont = Platform.select({ ios: 'Georgia', default: 'serif' });
const weightValue = { regular: '400', semibold: '600', bold: '700' } as const;

function labelFont(el: LabelEl): TextStyle {
  const style = el.style ?? 'math';
  const weight = el.weight ?? 'semibold';
  if (style === 'math') {
    return { fontFamily: serifFont, fontStyle: 'italic', fontWeight: weightValue[weight] };
  }
  if (el.font === 'mono') return { fontFamily: monoFont, fontWeight: weightValue[weight] };
  if (el.italic || el.font === 'serif') {
    return { fontFamily: serifFont, fontStyle: el.italic ? 'italic' : 'normal', fontWeight: weightValue[weight] };
  }
  return { fontFamily: fontFamilies[weight] };
}

/** `MathLabel`: halbtransparente Unterlage mit 3 pt Innenabstand und Radius 4. */
const MATH_CHIP: Chip = { shape: 'rounded', radius: 4, padX: 3, fill: { color: 'surfaceStrong', alpha: 0.75 } };
const effectiveChip = (el: LabelEl): Chip | undefined => el.chip ?? ((el.style ?? 'math') === 'math' ? MATH_CHIP : undefined);

const labelSize = (el: LabelEl) => el.size ?? ((el.style ?? 'math') === 'math' ? 13 : 15);
const labelOffset = (el: LabelEl) => el.offset ?? ((el.style ?? 'math') === 'math' ? [12, -10] : [0, 0]);

function LabelTrack({ track, phase, position, window, width, height, colors, textScale }: TrackProps<LabelEl> & { textScale: number }) {
  const current = track[Math.min(phase, track.length - 1)];
  const prepared = useMemo(() => {
    const sizes = track.map(labelSize);
    const base = Math.max(...sizes);
    const textColors = track.map((el) => withAlpha(namedColor(colors, el.color), el.alpha ?? 1));
    const chipFills = track.map((el) => paint(colors, effectiveChip(el)?.fill) ?? 'rgba(0,0,0,0)');
    const chipStrokes = track.map((el) => paint(colors, effectiveChip(el)?.stroke) ?? 'rgba(0,0,0,0)');
    return {
      base,
      scales: track.map((el, i) => (sizes[i] / base) * (el.scale ?? 1) * textScale),
      offsets: track.map(labelOffset),
      opacities: track.map((el) => el.opacity ?? 1),
      textColors,
      chipFills,
      chipStrokes,
      textAnimated: textColors.some((c) => c !== textColors[0]),
      chipAnimated: chipFills.some((c) => c !== chipFills[0]) || chipStrokes.some((c) => c !== chipStrokes[0]),
      left: track[0].anchor === 'left',
      ...timingArrays(track),
    };
  }, [track, colors, textScale]);

  const boxStyle = useAnimatedStyle(() => {
    const pr = prepared;
    const { a, b, t } = trackProgress(position.get(), track.length - 1, pr.delay, pr.duration, pr.easing);
    const p = labelPoint(track[a], track[b], t, window, width, height);
    const dx = lerp(pr.offsets[a][0], pr.offsets[b][0], t);
    const dy = lerp(pr.offsets[a][1], pr.offsets[b][1], t);
    return {
      opacity: lerp(pr.opacities[a], pr.opacities[b], t),
      transform: [
        { translateX: p[0] + dx - (pr.left ? 0 : LABEL_BOX.width / 2) },
        { translateY: p[1] + dy - LABEL_BOX.height / 2 },
        { scale: lerp(pr.scales[a], pr.scales[b], t) },
      ],
    };
  });

  const chipStyle = useAnimatedStyle(() => {
    const pr = prepared;
    if (!pr.chipAnimated) return {};
    const { a, b, t } = trackProgress(position.get(), track.length - 1, pr.delay, pr.duration, pr.easing);
    return {
      backgroundColor: interpolateColor(t, [0, 1], [pr.chipFills[a], pr.chipFills[b]]),
      borderColor: interpolateColor(t, [0, 1], [pr.chipStrokes[a], pr.chipStrokes[b]]),
    };
  });

  const textStyle = useAnimatedStyle(() => {
    const pr = prepared;
    if (!pr.textAnimated) return {};
    const { a, b, t } = trackProgress(position.get(), track.length - 1, pr.delay, pr.duration, pr.easing);
    return { color: interpolateColor(t, [0, 1], [pr.textColors[a], pr.textColors[b]]) };
  });

  const i = Math.min(phase, track.length - 1);
  const chip = effectiveChip(current);
  const chipBase = chip
    ? {
        width: chip.w,
        height: chip.h,
        paddingHorizontal: chip.w ? 0 : (chip.padX ?? 0),
        paddingVertical: chip.h ? 0 : (chip.padY ?? 0),
        borderRadius:
          chip.shape === 'circle' ? (chip.w ?? 30) / 2 : chip.shape === 'capsule' ? 999 : chip.shape === 'rect' ? 0 : (chip.radius ?? 6),
        borderWidth: chip.stroke?.width ?? 0,
        backgroundColor: prepared.chipFills[i],
        borderColor: prepared.chipStrokes[i],
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      }
    : null;

  const text = (
    <Animated.Text
      numberOfLines={1}
      style={[labelFont(current), { fontSize: prepared.base, color: prepared.textColors[i] }, textStyle]}>
      {current.text}
    </Animated.Text>
  );

  return (
    <Animated.View pointerEvents="none" style={[styles.labelBox, prepared.left && styles.labelBoxLeft, boxStyle]}>
      {chipBase ? <Animated.View style={[chipBase, chipStyle]}>{text}</Animated.View> : text}
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
  labelBoxLeft: { alignItems: 'flex-start', transformOrigin: 'left center' },
});
