/**
 * Karten der Übersichtsseiten und der Themenseite.
 * - CourseCard:      TopicCard (ContentView.swift:450)
 * - SubTopicCard:    SubTopicCard (Views/SubTopicsView.swift:247)
 * - LearnHeroCard, TopicActionTile (Views/SubTopicsView.swift:793/847)
 */
import { Image, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { icons, topicIcon, type IconName } from '@/content/icons';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { monoFont } from '@/theme/mono';
import { appFont, displayFont, withAlpha } from '@/theme/tokens';

import { GradientCircle, Icon } from './ui';

/** Illustrationen aus Assets.xcassets; iOS ordnet sie über den Titel zu, Android über die Themen-ID. */
const ILLUSTRATIONS: Record<string, ImageSourcePropType> = {
  '2.3': require('@/assets/images/topics/differentialrechnung.png'),
  '2.4': require('@/assets/images/topics/integral.png'),
  '2.5': require('@/assets/images/topics/mehrdimensionale_analysis.png'),
  '3.1': require('@/assets/images/topics/vektor.png'),
  '3.2': require('@/assets/images/topics/matrizen.png'),
  '3.3': require('@/assets/images/topics/abbildung.png'),
  '3.4': require('@/assets/images/topics/determinante.png'),
  '3.5': require('@/assets/images/topics/eigenwerte.png'),
};

function TopicBadge({ id, icon, size }: { id: string; icon: string; size: number }) {
  const illustration = ILLUSTRATIONS[id];
  return (
    <GradientCircle size={size}>
      {illustration ? (
        <Image source={illustration} style={{ width: size * 0.7, height: size * 0.7 }} resizeMode="contain" tintColor="#FFFFFF" />
      ) : (
        <Icon name={topicIcon(icon)} size={size * 0.5} color="#FFFFFF" />
      )}
    </GradientCircle>
  );
}

const cardSurface = (colors: ReturnType<typeof useTheme>['colors']) => ({
  backgroundColor: colors.surface,
  borderColor: withAlpha(colors.accent, 0.1),
  shadowColor: '#000',
});

export function CourseCard({ id, icon, title, description }: { id: string; icon: string; title: string; description: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.courseCard, cardSurface(colors)]}>
      <TopicBadge id={id} icon={icon} size={60} />
      <View style={styles.courseText}>
        <Text style={[appFont(17, 'semibold'), { color: colors.text }]}>{title}</Text>
        <Text style={[appFont(15), { color: colors.textSecondary }]} numberOfLines={2}>
          {description}
        </Text>
      </View>
      <Icon name={icons.chevronRight} size={20} color={colors.textSecondary} />
    </View>
  );
}

export function SubTopicCard({ id, icon, title }: { id: string; icon: string; title: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.subCard, cardSurface(colors)]}>
      <View style={styles.subBadge}>
        <TopicBadge id={id} icon={icon} size={64} />
      </View>
      <Text style={[appFont(17, 'semibold'), styles.subTitle, { color: colors.text }]} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.75}>
        {title}
      </Text>
    </View>
  );
}

/** Dezentes Koordinatengitter mit Vektor (VectorGridDecoration). */
function VectorGridDecoration({ color, accent }: { color: string; accent: string }) {
  let grid = '';
  for (let i = 0; i <= 4; i++) grid += `M0 ${20 + i * 30}H200`;
  for (let i = 0; i <= 5; i++) grid += `M${30 + i * 30} 0V140`;
  return (
    <Svg width={200} height={140} style={styles.decoration}>
      <Path d={grid} stroke={withAlpha(color, 0.06)} strokeWidth={1} />
      <Path d="M30 110L120 50" stroke={accent} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={120} cy={50} r={5} fill={accent} />
      <Circle cx={30} cy={110} r={4} fill={withAlpha(color, 0.2)} />
    </Svg>
  );
}

export function LearnHeroCard() {
  const { colors } = useTheme();
  const t = useT();
  return (
    <View style={[styles.hero, { backgroundColor: colors.surfaceStrong, borderColor: withAlpha(colors.text, 0.08), shadowColor: '#000' }]}>
      <VectorGridDecoration color={colors.text} accent={colors.accent} />
      <View style={[styles.eyebrow, { backgroundColor: withAlpha(colors.text, 0.06) }]}>
        <Text style={[styles.mono, { color: colors.textSecondary }]}>{t('topic.learn.eyebrow')}</Text>
      </View>
      <View style={styles.heroSpacer} />
      <View style={styles.heroText}>
        <Text style={[displayFont(30), { color: colors.text, letterSpacing: -0.5 }]}>{t('topic.learn.title')}</Text>
        <Text style={[appFont(15), { color: colors.textSecondary }]}>{t('topic.learn.subtitle')}</Text>
      </View>
      <View style={[styles.heroButton, { backgroundColor: colors.text }]}>
        <Text style={[appFont(16, 'semibold'), { color: colors.background }]}>{t('topic.learn.cta')}</Text>
        <Icon name={icons.forward} size={18} color={colors.background} />
      </View>
    </View>
  );
}

export function TopicActionTile({
  icon,
  tint,
  number,
  title,
  subtitle,
}: {
  icon: IconName;
  tint: string;
  number: string;
  title: string;
  subtitle: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.tile, { backgroundColor: colors.surfaceStrong, borderColor: withAlpha(colors.text, 0.08) }]}>
      <View style={styles.tileHead}>
        <Icon name={icon} size={22} color={tint} />
        <Text style={[styles.mono, { color: withAlpha(colors.textSecondary, 0.7) }]}>{number}</Text>
      </View>
      <View style={styles.tileText}>
        <Text style={[appFont(15, 'bold'), { color: colors.text }]} numberOfLines={2}>
          {title}
        </Text>
        <Text style={[appFont(13), { color: colors.textSecondary }]} numberOfLines={3}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 3,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  courseText: { flex: 1, gap: 4 },
  subCard: {
    height: 175,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  subBadge: { padding: 16 },
  subTitle: { textAlign: 'center', paddingHorizontal: 8, paddingBottom: 8 },
  hero: {
    minHeight: 250,
    padding: 22,
    gap: 16,
    borderRadius: 26,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 6,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  decoration: { position: 'absolute', top: -6, right: -10 },
  eyebrow: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  mono: { fontFamily: monoFont, fontSize: 11 },
  heroSpacer: { flex: 1, minHeight: 24 },
  heroText: { gap: 6 },
  heroButton: { height: 52, borderRadius: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  tile: { minHeight: 164, padding: 16, borderRadius: 22, borderWidth: 1, justifyContent: 'space-between', gap: 20 },
  tileHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tileText: { gap: 4 },
});
