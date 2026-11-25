/**
 * Matrixrechner (MatrixCalculatorView.swift): Gauß/Gauß-Jordan mit Schritten, Multiplikation, Determinante.
 * Auf Android unbegrenzt nutzbar (iOS: eine freie Operation, danach Paywall).
 */
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard, Icon, PrimaryButton, Segmented } from '@/components/ui';
import { icons } from '@/content/icons';
import {
  determinant,
  emptyInput,
  emptyRhs,
  equationLines,
  formatNumber,
  gaussSteps,
  highlightRows,
  multiply,
  parseMatrix,
  parseNumber,
  solutionHtml,
  solveLinearSystem,
  zeroMatrix,
  type Algorithm,
  type GaussStep,
  type Matrix,
  type RowOperation,
} from '@/domain/matrix';
import { AugmentedInput, AugmentedResult, MatrixInput, MatrixResult } from '@/features/calculator/MatrixGrids';
import { useLang, useT } from '@/i18n';
import { MathView } from '@/math/MathView';
import { summaryHtml } from '@/math/templates';
import { useTheme } from '@/theme/ThemeProvider';
import { appFont, displayFont, withAlpha } from '@/theme/tokens';

type Tool = 'gauss' | 'multiply' | 'determinant';
type Size = '2' | '3' | '4';

interface GaussOutput {
  steps: GaussStep[];
  result: Matrix;
  solution: string;
}

export default function ToolsScreen() {
  const { colors } = useTheme();
  const lang = useLang();
  const t = useT();
  const insets = useSafeAreaInsets();

  const [tool, setTool] = useState<Tool>('gauss');
  const [size, setSize] = useState<Size>('3');
  const [algorithm, setAlgorithm] = useState<Algorithm>('gauss');
  const n = Number(size);

  const [matrix, setMatrix] = useState(() => emptyInput(3));
  const [rhs, setRhs] = useState(() => emptyRhs(3));
  const [left, setLeft] = useState(() => emptyInput(3));
  const [right, setRight] = useState(() => emptyInput(3));
  const [product, setProduct] = useState<Matrix>(() => zeroMatrix(3, 3));
  const [det, setDet] = useState<number | null>(null);
  const [gauss, setGauss] = useState<GaussOutput | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const resetOutputs = () => {
    setGauss(null);
    setStepIndex(0);
    setShowAll(false);
    setDet(null);
  };

  // updateMatrixSize: alle Eingaben und Ergebnisse zurücksetzen
  const changeSize = (value: Size) => {
    const k = Number(value);
    setSize(value);
    setMatrix(emptyInput(k));
    setRhs(emptyRhs(k));
    setLeft(emptyInput(k));
    setRight(emptyInput(k));
    setProduct(zeroMatrix(k, k));
    resetOutputs();
  };

  const calculateGauss = () => {
    const A = parseMatrix(matrix);
    const b = rhs.map(parseNumber);
    const output = gaussSteps(A, b, algorithm, lang);
    const solution = solveLinearSystem(A, b, lang);
    setGauss({ ...output, solution: solutionHtml(equationLines(output.result, lang), solution, lang) });
    setStepIndex(0);
    setShowAll(false);
  };

  const sizeOptions = (['2', '3', '4'] as const).map((s) => ({ value: s, label: `${s}x${s}` }));

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={{ backgroundColor: colors.backgroundSecondary }}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        <Text style={[displayFont(34), { color: colors.text }]}>{t('calc.title')}</Text>

        <GlassCard>
          <Text style={[appFont(15), { color: colors.textSecondary }]}>{t('calc.intro')}</Text>
        </GlassCard>

        <GlassCard>
          <Text style={[appFont(17, 'semibold'), { color: colors.text }]}>{t('calc.tool')}</Text>
          <Segmented<Tool>
            value={tool}
            onChange={(v) => {
              setTool(v);
              resetOutputs();
            }}
            options={[
              { value: 'gauss', label: t('calc.tool.gauss') },
              { value: 'multiply', label: t('calc.tool.multiply') },
              { value: 'determinant', label: t('calc.tool.determinant') },
            ]}
          />
        </GlassCard>

        <GlassCard>
          <Text style={[appFont(17, 'semibold'), { color: colors.text }]}>{t('calc.size')}</Text>
          <Segmented<Size> value={size} onChange={changeSize} options={sizeOptions} />
          <Text style={[appFont(12), { color: colors.textSecondary }]}>
            {t('calc.sizeHint')} {t('calc.fractionHint')}
          </Text>
        </GlassCard>

        {tool === 'gauss' && (
          <>
            <GlassCard>
              <Text style={[appFont(17, 'semibold'), { color: colors.text }]}>{t('calc.algorithm')}</Text>
              <Segmented<Algorithm>
                value={algorithm}
                onChange={(v) => {
                  setAlgorithm(v);
                  setGauss(null);
                  setStepIndex(0);
                }}
                options={[
                  { value: 'gauss', label: 'Gauss' },
                  { value: 'gaussJordan', label: 'Gauss-Jordan' },
                ]}
              />
            </GlassCard>
            <GlassCard>
              <Text style={[appFont(17, 'semibold'), { color: colors.text }]}>{t('calc.matrix')}</Text>
              <AugmentedInput matrix={matrix} rhs={rhs} onChangeMatrix={setMatrix} onChangeRhs={setRhs} />
            </GlassCard>
            <PrimaryButton title={t('calc.calculate')} onPress={calculateGauss} />

            {!gauss ? (
              <GlassCard>
                <Text style={[appFont(15), { color: colors.textSecondary }]}>{t('calc.noSteps')}</Text>
              </GlassCard>
            ) : (
              <>
                <GlassCard>
                  <View style={styles.between}>
                    <Text style={[appFont(17, 'semibold'), { color: colors.text }]}>{t('calc.steps')}</Text>
                    <Text style={[appFont(12), { color: colors.textSecondary }]}>
                      {t('calc.stepOf', { n: stepIndex + 1, total: gauss.steps.length })}
                    </Text>
                  </View>
                  <View style={styles.between}>
                    <Text style={[appFont(15), { color: colors.text }]}>{t('calc.showAll')}</Text>
                    <Switch value={showAll} onValueChange={setShowAll} trackColor={{ true: colors.accent }} />
                  </View>
                  {!showAll && (
                    <View style={styles.between}>
                      <StepNavButton
                        label={t('calc.back')}
                        disabled={stepIndex === 0}
                        onPress={() => setStepIndex((i) => Math.max(0, i - 1))}
                        leading
                      />
                      <StepNavButton
                        label={t('calc.next')}
                        disabled={stepIndex >= gauss.steps.length - 1}
                        onPress={() => setStepIndex((i) => Math.min(gauss.steps.length - 1, i + 1))}
                      />
                    </View>
                  )}
                </GlassCard>

                {(showAll ? gauss.steps : [gauss.steps[stepIndex]]).map((step) => {
                  const index = gauss.steps.indexOf(step);
                  return <StepCard key={index} step={step} index={index} />;
                })}

                <GlassCard>
                  <Text style={[appFont(17, 'semibold'), { color: colors.text }]}>{t('calc.finalMatrix')}</Text>
                  <AugmentedResult matrix={gauss.result} lang={lang} />
                </GlassCard>

                <GlassCard>
                  <MathView html={summaryHtml(gauss.solution)} estimatedHeight={260} />
                </GlassCard>
              </>
            )}
          </>
        )}

        {tool === 'multiply' && (
          <>
            <GlassCard>
              <Text style={[appFont(17, 'semibold'), { color: colors.text }]}>{t('calc.multiplication')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.product}>
                  <MatrixInput matrix={left} onChange={setLeft} name="A" />
                  <Text style={[appFont(24, 'bold'), { color: colors.accent }]}>x</Text>
                  <MatrixInput matrix={right} onChange={setRight} name="B" />
                </View>
              </ScrollView>
            </GlassCard>
            <PrimaryButton title={t('calc.calculate')} onPress={() => setProduct(multiply(parseMatrix(left), parseMatrix(right)))} />
            <GlassCard>
              <Text style={[appFont(17, 'semibold'), { color: colors.text }]}>{t('calc.result')}</Text>
              <MatrixResult matrix={product.length === n ? product : zeroMatrix(n, n)} lang={lang} />
            </GlassCard>
          </>
        )}

        {tool === 'determinant' && (
          <>
            <GlassCard>
              <Text style={[appFont(17, 'semibold'), { color: colors.text }]}>{t('calc.matrix')}</Text>
              <MatrixInput matrix={matrix} onChange={setMatrix} />
            </GlassCard>
            <PrimaryButton title={t('calc.calculateDet')} onPress={() => setDet(determinant(parseMatrix(matrix)))} />
            <GlassCard>
              <Text style={[appFont(17, 'semibold'), { color: colors.text }]}>{t('calc.determinant')}</Text>
              {det === null ? (
                <Text style={[appFont(15), { color: colors.textSecondary }]}>{t('calc.notCalculated')}</Text>
              ) : (
                <Text style={[appFont(22, 'bold'), { color: colors.accent }]}>det(A) = {formatNumber(det, lang, 4)}</Text>
              )}
            </GlassCard>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function StepNavButton({ label, disabled, onPress, leading }: { label: string; disabled: boolean; onPress: () => void; leading?: boolean }) {
  const { colors } = useTheme();
  const color = disabled ? withAlpha(colors.textSecondary, 0.5) : colors.accent;
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} hitSlop={10} style={styles.nav}>
      {leading && <Icon name={icons.chevronLeft} size={16} color={color} />}
      <Text style={[appFont(15), { color }]}>{label}</Text>
      {!leading && <Icon name={icons.chevronRight} size={16} color={color} />}
    </Pressable>
  );
}

function OperationPill({ operation }: { operation: RowOperation }) {
  const { colors } = useTheme();
  const lang = useLang();
  const pill = (row: number) => (
    <View style={[styles.rowPill, { backgroundColor: withAlpha(colors.accent, 0.15) }]}>
      <Text style={[appFont(14, 'semibold'), { color: colors.accent }]}>R{row + 1}</Text>
    </View>
  );
  return (
    <View style={[styles.operation, { backgroundColor: withAlpha(colors.accent, 0.08), borderColor: withAlpha(colors.accent, 0.2) }]}>
      {pill(operation.targetRow)}
      <Icon name={operation.type === 'swap' ? icons.swap : icons.forward} size={16} color={colors.accent} />
      {operation.type === 'swap' ? (
        pill(operation.sourceRow)
      ) : (
        <Text style={[appFont(14), { color: colors.textSecondary }]}>
          {operation.type === 'scale'
            ? `R${operation.targetRow + 1} / ${formatNumber(operation.factor, lang)}`
            : `R${operation.targetRow + 1} - ${formatNumber(operation.factor, lang)} * R${operation.sourceRow + 1}`}
        </Text>
      )}
    </View>
  );
}

function StepCard({ step, index }: { step: GaussStep; index: number }) {
  const { colors } = useTheme();
  const lang = useLang();
  const t = useT();
  return (
    <GlassCard>
      <Text style={[appFont(14), { color: colors.textSecondary }]}>{t('calc.step', { n: index + 1 })}</Text>
      {step.operation && <OperationPill operation={step.operation} />}
      <Text style={[appFont(16, 'semibold'), { color: colors.text }]}>{step.description}</Text>
      <AugmentedResult matrix={step.matrix} highlight={highlightRows(step.operation)} lang={lang} />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40, gap: 18 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nav: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  product: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 4 },
  operation: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  rowPill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 },
});
