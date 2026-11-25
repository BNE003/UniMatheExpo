/**
 * Kopf- und Fußzeile der Lektion sowie Kapitelübersicht.
 * Port von ProgressHeader, LessonCircleButton, LessonChapterSheet, ContinueButton und
 * BackStepButton (ContentView.swift:1056–1558).
 */
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, PressableScale } from '@/components/ui';
import { icons, type IconName } from '@/content/icons';
import { chapterFill, chapterForStep, type LessonChapter } from '@/domain/lesson';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { appFont, withAlpha } from '@/theme/tokens';

function CircleButton({ icon, label, onPress, hidden }: { icon: IconName; label: string; onPress: () => void; hidden?: boolean }) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      disabled={hidden}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.circle,
        { backgroundColor: colors.surfaceStrong, borderColor: withAlpha(colors.text, 0.1), opacity: hidden ? 0 : 1 },
      ]}>
      <Icon name={icon} size={20} color={colors.text} />
    </PressableScale>
  );
}

function Segment({ fill }: { fill: number }) {
  const { colors } = useTheme();
  // Spring wie ProgressHeader (.spring(response: 0.45, dampingFraction: 0.85))
  const bar = useAnimatedStyle(() => ({
    transform: [{ scaleX: withSpring(fill, { duration: 450, dampingRatio: 0.85 }) }],
  }));
  return (
    <View style={[styles.segment, { backgroundColor: withAlpha(colors.text, 0.08) }]}>
      <Animated.View style={[styles.segmentFill, { backgroundColor: colors.accent }, bar]} />
    </View>
  );
}

export function ProgressHeader({
  topicTitle,
  chapters,
  currentStep,
  totalSteps,
  showProgress,
  onClose,
  onShowChapters,
}: {
  topicTitle: string;
  chapters: LessonChapter[];
  currentStep: number;
  totalSteps: number;
  showProgress: boolean;
  onClose: () => void;
  onShowChapters: () => void;
}) {
  const { colors } = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const chapter = chapterForStep(chapters, currentStep);
  return (
    <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.background, borderBottomColor: colors.hairline }]}>
      <View style={styles.headerRow}>
        <CircleButton icon={icons.close} label={t('lesson.close')} onPress={onClose} />
        <View style={styles.headerTitles}>
          <Text style={[appFont(15, 'semibold'), { color: colors.text }]} numberOfLines={1}>
            {topicTitle}
          </Text>
          {chapter?.title ? (
            <Text style={[appFont(12), { color: colors.textSecondary }]} numberOfLines={1}>
              {chapter.title}
            </Text>
          ) : null}
        </View>
        <CircleButton icon={icons.chapters} label={t('lesson.chapters')} onPress={onShowChapters} hidden={chapters.length <= 1} />
      </View>
      <View style={styles.progressRow}>
        <View style={styles.segments}>
          {chapters.map((c) => (
            <Segment key={c.id} fill={showProgress ? chapterFill(c, currentStep) : 0} />
          ))}
        </View>
        <Text
          style={[appFont(12, 'semibold'), styles.counter, { color: colors.textSecondary }]}
          accessibilityLabel={t('lesson.stepOf', { n: currentStep + 1, total: totalSteps })}>
          {currentStep + 1}/{totalSteps}
        </Text>
      </View>
    </View>
  );
}

export function LessonFooter({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onFinish,
}: {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onFinish: () => void;
}) {
  const { colors } = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const isLast = currentStep >= totalSteps - 1;
  const canGoBack = currentStep > 0;
  return (
    <View style={[styles.footer, { paddingBottom: insets.bottom + 8, backgroundColor: colors.background, borderTopColor: colors.hairline }]}>
      <PressableScale
        onPress={onBack}
        disabled={!canGoBack}
        accessibilityRole="button"
        accessibilityLabel={t('lesson.back')}
        style={[
          styles.backButton,
          { backgroundColor: colors.surfaceStrong, borderColor: withAlpha(colors.text, 0.1), opacity: canGoBack ? 1 : 0.4 },
        ]}>
        <Icon name={icons.back} size={22} color={colors.text} />
      </PressableScale>
      <PressableScale
        onPress={isLast ? onFinish : onNext}
        accessibilityRole="button"
        style={[styles.nextButton, { backgroundColor: colors.text }]}>
        <Text style={[appFont(16, 'semibold'), { color: colors.background }]}>{t(isLast ? 'lesson.finish' : 'lesson.continue')}</Text>
        <Icon name={isLast ? icons.check : icons.forward} size={18} color={colors.background} />
      </PressableScale>
    </View>
  );
}

export function ChapterSheet({
  visible,
  chapters,
  currentStep,
  onSelect,
  onClose,
}: {
  visible: boolean;
  chapters: LessonChapter[];
  currentStep: number;
  onSelect: (startIndex: number) => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel={t('lesson.done')} />
      <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 8 }]}>
        <View style={[styles.grabber, { backgroundColor: withAlpha(colors.text, 0.2) }]} />
        <View style={styles.sheetHeader}>
          <Text style={[appFont(17, 'semibold'), { color: colors.text }]}>{t('lesson.chaptersTitle')}</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button">
            <Text style={[appFont(16, 'semibold'), { color: colors.accent }]}>{t('lesson.done')}</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.sheetList}>
          {chapters.map((chapter) => {
            const isCurrent = currentStep >= chapter.startIndex && currentStep < chapter.startIndex + chapter.count;
            const isDone = currentStep >= chapter.startIndex + chapter.count;
            return (
              <PressableScale
                key={chapter.id}
                accessibilityRole="button"
                onPress={() => {
                  onSelect(chapter.startIndex);
                  onClose();
                }}
                style={[
                  styles.chapterRow,
                  {
                    backgroundColor: isCurrent ? withAlpha(colors.accent, 0.08) : colors.surfaceStrong,
                    borderColor: isCurrent ? withAlpha(colors.accent, 0.3) : withAlpha(colors.text, 0.08),
                  },
                ]}>
                <View style={[styles.chapterBadge, { backgroundColor: isCurrent ? colors.accent : withAlpha(colors.text, 0.06) }]}>
                  {isDone ? (
                    <Icon name={icons.check} size={16} color={colors.accent} />
                  ) : (
                    <Text style={[appFont(13, 'bold'), { color: isCurrent ? '#FFFFFF' : colors.textSecondary }]}>{chapter.id + 1}</Text>
                  )}
                </View>
                <View style={styles.chapterText}>
                  <Text style={[appFont(15, 'semibold'), { color: colors.text }]}>
                    {chapter.title ?? t('lesson.chapter', { n: chapter.id + 1 })}
                  </Text>
                  <Text style={[appFont(12), { color: colors.textSecondary }]}>{t('topic.steps', { n: chapter.count })}</Text>
                </View>
              </PressableScale>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 12, gap: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitles: { flex: 1, alignItems: 'center', gap: 2 },
  circle: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  segments: { flex: 1, flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  segmentFill: { width: '100%', height: 4, borderRadius: 2, transformOrigin: 'left' },
  counter: { fontVariant: ['tabular-nums'] },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  backButton: { width: 56, height: 56, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  nextButton: { flex: 1, height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: { maxHeight: '70%', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 8 },
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, marginBottom: 8 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  sheetList: { padding: 16, gap: 8 },
  chapterRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 14, borderWidth: 1 },
  chapterBadge: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  chapterText: { flex: 1, gap: 2 },
});
