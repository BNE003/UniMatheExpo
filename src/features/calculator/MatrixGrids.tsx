/**
 * Eingabe- und Ergebnisraster des Matrixrechners
 * (MatrixInputView, AugmentedMatrixInputView, MatrixResultView, AugmentedMatrixResultView).
 */
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { Lang } from '@/content/types';
import { formatNumber, type Matrix } from '@/domain/matrix';
import { useTheme } from '@/theme/ThemeProvider';
import { appFont, withAlpha } from '@/theme/tokens';

/** Zellbreite je Größe (cellSize in iOS); Höhe = 0,7 × Breite. */
export const cellSizeFor = (n: number) => (n === 2 ? 70 : n === 3 ? 58 : 48);

function InputCell({
  value,
  onChange,
  size,
  strong,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  size: number;
  strong?: boolean;
  label: string;
}) {
  const { colors } = useTheme();
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      keyboardType="numeric"
      selectTextOnFocus
      accessibilityLabel={label}
      placeholder="0"
      placeholderTextColor={withAlpha(colors.textSecondary, 0.5)}
      style={[
        appFont(15, 'semibold'),
        styles.cell,
        {
          width: size,
          height: size * 0.7,
          color: colors.text,
          backgroundColor: withAlpha(colors.surfaceStrong, strong ? 0.8 : 0.7),
          borderColor: withAlpha(colors.accent, strong ? 0.3 : 0.25),
        },
      ]}
    />
  );
}

function ValueCell({ value, size, highlighted, lang }: { value: number; size: number; highlighted: boolean; lang: Lang }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.cell,
        {
          width: size,
          height: size * 0.7,
          backgroundColor: highlighted ? withAlpha(colors.accent, 0.16) : withAlpha(colors.surfaceStrong, 0.55),
          borderColor: withAlpha(colors.accent, 0.18),
        },
      ]}>
      <Text style={[appFont(14, 'medium'), { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        {formatNumber(value, lang)}
      </Text>
    </View>
  );
}

function EqualsSign({ width }: { width: number }) {
  const { colors } = useTheme();
  return <Text style={[appFont(16, 'semibold'), { color: colors.accent, width, textAlign: 'center' }]}>=</Text>;
}

/** Breite Raster (4×4 mit rechter Seite) horizontal scrollbar halten. */
function Scrollable({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {children}
    </ScrollView>
  );
}

export function MatrixInput({
  matrix,
  onChange,
  name = 'A',
}: {
  matrix: string[][];
  onChange: (m: string[][]) => void;
  name?: string;
}) {
  const size = cellSizeFor(matrix.length);
  const set = (r: number, c: number, v: string) => onChange(matrix.map((row, i) => (i === r ? row.map((x, j) => (j === c ? v : x)) : row)));
  return (
    <View style={styles.rows}>
      {matrix.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((value, c) => (
            <InputCell key={c} value={value} size={size} label={`${name} ${r + 1},${c + 1}`} onChange={(v) => set(r, c, v)} />
          ))}
        </View>
      ))}
    </View>
  );
}

export function AugmentedInput({
  matrix,
  rhs,
  onChangeMatrix,
  onChangeRhs,
}: {
  matrix: string[][];
  rhs: string[];
  onChangeMatrix: (m: string[][]) => void;
  onChangeRhs: (r: string[]) => void;
}) {
  const size = cellSizeFor(matrix.length);
  const set = (r: number, c: number, v: string) =>
    onChangeMatrix(matrix.map((row, i) => (i === r ? row.map((x, j) => (j === c ? v : x)) : row)));
  return (
    <Scrollable>
      <View style={styles.rows}>
        {matrix.map((row, r) => (
          <View key={r} style={styles.row}>
            {row.map((value, c) => (
              <InputCell key={c} value={value} size={size} label={`A ${r + 1},${c + 1}`} onChange={(v) => set(r, c, v)} />
            ))}
            <EqualsSign width={20} />
            <InputCell
              value={rhs[r]}
              size={size}
              strong
              label={`b ${r + 1}`}
              onChange={(v) => onChangeRhs(rhs.map((x, i) => (i === r ? v : x)))}
            />
          </View>
        ))}
      </View>
    </Scrollable>
  );
}

export function MatrixResult({ matrix, lang }: { matrix: Matrix; lang: Lang }) {
  const size = cellSizeFor(matrix.length);
  return (
    <View style={styles.rows}>
      {matrix.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((value, c) => (
            <ValueCell key={c} value={value} size={size} highlighted={false} lang={lang} />
          ))}
        </View>
      ))}
    </View>
  );
}

export function AugmentedResult({ matrix, highlight = [], lang }: { matrix: Matrix; highlight?: number[]; lang: Lang }) {
  const size = cellSizeFor(matrix.length);
  return (
    <Scrollable>
      <View style={styles.rows}>
        {matrix.map((row, r) => {
          const on = highlight.includes(r);
          return (
            <View key={r} style={styles.row}>
              {row.slice(0, -1).map((value, c) => (
                <ValueCell key={c} value={value} size={size} highlighted={on} lang={lang} />
              ))}
              <EqualsSign width={18} />
              <ValueCell value={row[row.length - 1]} size={size} highlighted={on} lang={lang} />
            </View>
          );
        })}
      </View>
    </Scrollable>
  );
}

const styles = StyleSheet.create({
  rows: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cell: { borderRadius: 10, borderWidth: 1, textAlign: 'center', alignItems: 'center', justifyContent: 'center', padding: 0 },
  scrollContent: { paddingVertical: 2 },
});
