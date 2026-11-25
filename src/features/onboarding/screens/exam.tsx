/**
 * „Welche Prüfung steht an?“ mit anschließender Datumsabfrage
 * (ExamSelectionOnboardingView, Views/OnboardingScreens.swift:393). Statt des grafischen
 * iOS-DatePickers zeigt Android einen schlichten Monatskalender im unteren Blatt.
 */
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui';
import { manifest } from '@/content/load';
import { topicIcon } from '@/content/icons';
import type { Lang } from '@/content/types';
import { loadExamDate, saveExamDate, saveExamKey } from '@/storage/onboarding';
import { withAlpha } from '@/theme/tokens';

import { ContinueButton, GlowCircle, OnboardingPage, PageTitle, cardStyle, icon, ob, obFont, useLayout, type ScreenProps } from '../kit';
import { examOptions, isoDay } from '../plan';

/** Android-Symbole für die SF-Namen der Prüfungsfächer, die nicht in den Inhaltsdaten vorkommen. */
const EXAM_ICONS: Record<string, string> = {
  'waveform.path.ecg': 'monitor_heart',
  'square.grid.3x3': 'grid_on',
  'book.closed': 'book',
};

export function ExamSelectScreen({ lang, step, total, next }: ScreenProps) {
  const { width, height, compact } = useLayout();
  const options = useMemo(() => examOptions(manifest.exams, lang), [lang]);
  // Wie in iOS startet die Auswahl leer; erst nach einer Wahl ist „Weiter“ aktiv.
  const [selected, setSelected] = useState<string | null>(null);
  const [askDate, setAskDate] = useState(false);

  return (
    <OnboardingPage
      lang={lang}
      step={step}
      total={total}
      button={
        <ContinueButton
          title={lang === 'en' ? 'Continue' : 'Weiter'}
          disabled={!selected}
          onPress={() => {
            if (selected) saveExamKey(selected);
            next();
          }}
        />
      }
      decoration={<GlowCircle size={width * 0.74} offsetY={height * 0.25} />}>
      <PageTitle
        title={lang === 'en' ? 'Which exam is coming up?' : 'Welche Prüfung steht an?'}
        subtitle={lang === 'en' ? "We'll tailor your learning plan accordingly." : 'Wir passen deinen Lernplan darauf an.'}
      />
      <View style={{ gap: 12 }}>
        {options.map((option) => {
          const isSelected = selected === option.key;
          const symbol = EXAM_ICONS[option.icon] ? icon(option.icon, EXAM_ICONS[option.icon]) : topicIcon(option.icon);
          return (
            <Pressable
              key={option.key}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              onPress={() => {
                setSelected(option.key);
                saveExamKey(option.key);
                setAskDate(true);
              }}
              style={[styles.examCard, cardStyle(20, isSelected)]}>
              <View style={[styles.examIcon, { backgroundColor: isSelected ? withAlpha(ob.blue, 0.14) : withAlpha(ob.gray, 0.12) }]}>
                <Icon name={symbol} size={17} color={isSelected ? ob.blue : ob.grayStrong} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text numberOfLines={1} style={[obFont(compact ? 17 : 18, 'semibold'), { color: ob.ink }]}>
                  {option.title}
                </Text>
                <Text numberOfLines={2} style={[obFont(compact ? 13 : 14, 'medium'), { color: ob.grayStrong }]}>
                  {option.subtitle}
                </Text>
              </View>
              <Icon
                name={isSelected ? icon('checkmark.circle.fill', 'check_circle') : icon('circle', 'radio_button_unchecked')}
                size={25}
                color={isSelected ? ob.blue : withAlpha(ob.gray, 0.6)}
              />
            </Pressable>
          );
        })}
      </View>
      <ExamDateSheet lang={lang} visible={askDate} onClose={() => setAskDate(false)} />
    </OnboardingPage>
  );
}

// ---------------------------------------------------------------------------
// Datumsabfrage

const WEEKDAYS = { de: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'], en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] };

function ExamDateSheet({ lang, visible, onClose }: { lang: Lang; visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const today = new Date();
  const todayKey = isoDay(today);
  const stored = loadExamDate();
  const [picked, setPicked] = useState<string>(stored && stored >= todayKey ? stored : todayKey);
  const [month, setMonth] = useState(() => {
    const [y, m] = picked.split('-').map(Number);
    return { year: y, month: m - 1 };
  });

  const monthTitle = new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'de-DE', { month: 'long', year: 'numeric' }).format(
    new Date(month.year, month.month, 1),
  );
  const firstWeekday = (new Date(month.year, month.month, 1).getDay() + 6) % 7; // Montag = 0
  const daysInMonth = new Date(month.year, month.month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const canGoBack = month.year > today.getFullYear() || (month.year === today.getFullYear() && month.month > today.getMonth());
  const shift = (delta: number) =>
    setMonth(({ year, month: m }) => {
      const d = new Date(year, m + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  const finish = (withDate: boolean) => {
    saveExamDate(withDate ? picked : null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => finish(false)}>
      <Pressable style={styles.backdrop} onPress={() => finish(false)} accessibilityLabel={lang === 'en' ? 'Skip' : 'Überspringen'} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.grabber} />
        <Text style={[obFont(24, 'bold'), styles.sheetTitle]}>{lang === 'en' ? 'When is your exam?' : 'Wann hast du die Prüfung?'}</Text>
        <Text style={[obFont(15, 'medium'), styles.sheetSubtitle]}>
          {lang === 'en' ? 'You can skip this for now and set it later.' : 'Du kannst das auch überspringen und später festlegen.'}
        </Text>

        <View style={styles.monthRow}>
          <Text style={[obFont(17, 'bold'), { color: ob.ink }]}>{monthTitle}</Text>
          <View style={{ flexDirection: 'row', gap: 18 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={lang === 'en' ? 'Previous month' : 'Vorheriger Monat'}
              disabled={!canGoBack}
              hitSlop={10}
              onPress={() => shift(-1)}>
              <Icon name={icon('chevron.left', 'chevron_left')} size={20} color={canGoBack ? ob.blue : withAlpha(ob.gray, 0.4)} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={lang === 'en' ? 'Next month' : 'Nächster Monat'} hitSlop={10} onPress={() => shift(1)}>
              <Icon name={icon('chevron.right', 'chevron_right')} size={20} color={ob.blue} />
            </Pressable>
          </View>
        </View>

        <View style={styles.week}>
          {WEEKDAYS[lang].map((d) => (
            <Text key={d} style={[obFont(13, 'semibold'), styles.weekday]}>
              {d.toUpperCase()}
            </Text>
          ))}
        </View>
        <View style={styles.grid}>
          {cells.map((day, i) => {
            if (day === null) return <View key={i} style={styles.cell} />;
            const key = isoDay(new Date(month.year, month.month, day));
            const past = key < todayKey;
            const active = key === picked;
            return (
              <Pressable
                key={i}
                style={styles.cell}
                disabled={past}
                accessibilityRole="button"
                accessibilityState={{ selected: active, disabled: past }}
                onPress={() => setPicked(key)}>
                <View style={[styles.dayCircle, active && { backgroundColor: withAlpha(ob.blue, 0.16) }]}>
                  <Text
                    style={[
                      obFont(18, active || key === todayKey ? 'bold' : 'medium'),
                      { color: past ? withAlpha(ob.gray, 0.45) : active || key === todayKey ? ob.blue : ob.ink },
                    ]}>
                    {day}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sheetButtons}>
          <Pressable accessibilityRole="button" onPress={() => finish(false)} style={[styles.sheetButton, styles.skip]}>
            <Text style={[obFont(16, 'semibold'), { color: ob.ink }]}>{lang === 'en' ? 'Skip' : 'Überspringen'}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => finish(true)} style={[styles.sheetButton, { backgroundColor: ob.blue }]}>
            <Text style={[obFont(16, 'semibold'), { color: '#FFFFFF' }]}>{lang === 'en' ? 'Save date' : 'Datum speichern'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  examCard: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, minHeight: 86 },
  examIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 14,
  },
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, backgroundColor: withAlpha(ob.gray, 0.4), marginBottom: 8 },
  sheetTitle: { color: ob.ink, textAlign: 'center' },
  sheetSubtitle: { color: ob.grayStrong, textAlign: 'center' },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, marginTop: 6 },
  week: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', color: withAlpha(ob.gray, 0.8) },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  sheetButtons: { flexDirection: 'row', gap: 12, marginTop: 4 },
  sheetButton: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  skip: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: withAlpha(ob.gray, 0.35) },
});
