/**
 * Einstellungen (SettingsView.swift): Sprache, Darstellung, Support, Feedback, Bewerten, Rechtliches.
 * Ohne „Pro Version“ – auf Android ist alles kostenlos.
 */
import Constants from 'expo-constants';
import { useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Rect } from 'react-native-svg';

import { Icon } from '@/components/ui';
import { appName, imprint, links } from '@/config/links';
import { useRestartOnboarding } from '@/features/onboarding/control';
import { icons, type IconName } from '@/content/icons';
import { manifest } from '@/content/load';
import type { Lang } from '@/content/types';
import { openSupportMail, openWebPage, rateApp } from '@/features/settings/actions';
import { useLang, useSetLang, useT } from '@/i18n';
import { useTheme, type AppearancePreference } from '@/theme/ThemeProvider';
import { appFont, withAlpha } from '@/theme/tokens';

/** Hintergrund mit dezenten Formen in Akzentfarbe (SettingsView: Kreise und gedrehtes Rechteck). */
function SettingsBackground() {
  const { colors } = useTheme();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 200" preserveAspectRatio="xMidYMid slice">
        <Circle cx="30" cy="40" r="25" fill={withAlpha(colors.accent, 0.1)} />
        <Circle cx="80" cy="200" r="35" fill={withAlpha(colors.accent, 0.05)} />
        <Rect x="10" y="20" width="80" height="60" rx="40" fill={withAlpha(colors.accent, 0.07)} transform="rotate(30 50 50)" />
      </Svg>
    </View>
  );
}

function Section({ title, children }: { title?: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: '#000' }]}>
      {title && <Text style={[appFont(17, 'semibold'), styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>}
      {children}
    </View>
  );
}

/** Auswahlzeile mit Häkchen (Sprache / Darstellung). */
function ChoiceRow({ icon, label, selected, onPress }: { icon: IconName; label: string; selected: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        { backgroundColor: selected ? withAlpha(colors.accent, 0.1) : pressed ? withAlpha(colors.text, 0.04) : 'transparent' },
      ]}>
      <Icon name={icon} size={20} color={selected ? colors.accent : colors.textSecondary} />
      <Text style={[appFont(17), styles.choiceLabel, { color: colors.text }]}>{label}</Text>
      {selected ? (
        <Icon name={icons.selected} size={22} color={colors.accent} />
      ) : (
        <View style={[styles.emptyRadio, { borderColor: withAlpha(colors.textSecondary, 0.5) }]} />
      )}
    </Pressable>
  );
}

/** Zeile mit farbigem Symbol und Pfeil (SettingsButton). */
function ActionRow({ icon, color, title, onPress }: { icon: IconName; color: string; title: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed && { backgroundColor: withAlpha(colors.text, 0.04) }]}>
      <View style={[styles.actionIcon, { backgroundColor: color }]}>
        <Icon name={icon} size={18} color="#FFFFFF" />
      </View>
      <Text style={[appFont(17, 'medium'), styles.actionTitle, { color: colors.text }]}>{title}</Text>
      <Icon name={icons.chevronRight} size={16} color={colors.textSecondary} />
    </Pressable>
  );
}

/** Auswahl von unten (iOS: ActionSheet „Rechtliche Informationen“). */
function LegalSheet({ visible, onClose, onImprint }: { visible: boolean; onClose: () => void; onImprint: () => void }) {
  const { colors } = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const option = (label: string, action: () => void, emphasized = false) => (
    <Pressable
      key={label}
      accessibilityRole="button"
      onPress={() => {
        onClose();
        action();
      }}
      style={({ pressed }) => [styles.sheetOption, pressed && { backgroundColor: withAlpha(colors.text, 0.05) }]}>
      <Text style={[appFont(17, emphasized ? 'semibold' : 'regular'), { color: colors.accent }]}>{label}</Text>
    </Pressable>
  );
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel={t('settings.cancel')} />
      <View style={[styles.sheet, { backgroundColor: colors.surfaceStrong, paddingBottom: insets.bottom + 8 }]}>
        <Text style={[appFont(15, 'semibold'), styles.sheetTitle, { color: colors.textSecondary }]}>{t('settings.legalTitle')}</Text>
        <Text style={[appFont(13), styles.sheetTitle, { color: colors.textSecondary }]}>{t('settings.legalMessage')}</Text>
        <View style={[styles.sheetRule, { backgroundColor: colors.hairline }]} />
        {option(t('settings.imprint'), onImprint)}
        {option(t('settings.privacy'), () => openWebPage(links.privacy))}
        {option(t('settings.terms'), () => openWebPage(links.terms))}
        <View style={[styles.sheetRule, { backgroundColor: colors.hairline }]} />
        {option(t('settings.cancel'), () => undefined, true)}
      </View>
    </Modal>
  );
}

/** Impressum (ImpressumView). */
function ImprintModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={[styles.imprint, { backgroundColor: colors.background, paddingTop: insets.top + 12 }]}>
        <View style={styles.imprintHead}>
          <Text style={[appFont(17, 'semibold'), { color: colors.text }]}>{t('settings.imprint')}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t('settings.close')} onPress={onClose} hitSlop={12}>
            <Icon name={icons.closeCircle} size={26} color={withAlpha(colors.text, 0.7)} />
          </Pressable>
        </View>
        <Text style={[appFont(28, 'bold'), { color: colors.text }]}>{t('settings.imprint')}</Text>
        <View style={[styles.imprintCard, { backgroundColor: colors.surface, shadowColor: '#000' }]}>
          <Text style={[appFont(15), { color: colors.textSecondary }]}>{t('settings.imprintApp', { app: appName })}</Text>
          <Text style={[appFont(17, 'semibold'), { color: colors.text }]}>{imprint.name}</Text>
          <Text style={[appFont(17), { color: colors.text }]}>{imprint.street}</Text>
          <Text style={[appFont(17), { color: colors.text }]}>{imprint.city}</Text>
        </View>
      </View>
    </Modal>
  );
}

export default function SettingsScreen() {
  const { colors, preference, setPreference } = useTheme();
  const lang = useLang();
  const setLang = useSetLang();
  const t = useT();
  const insets = useSafeAreaInsets();
  const restartOnboarding = useRestartOnboarding();
  const [legalOpen, setLegalOpen] = useState(false);
  const [imprintOpen, setImprintOpen] = useState(false);

  const languages: { value: Lang; label: string; icon: IconName }[] = [
    { value: 'de', label: 'Deutsch', icon: icons.flag },
    { value: 'en', label: 'English', icon: icons.globe },
  ];
  const appearances: { value: AppearancePreference; label: string; icon: IconName }[] = [
    { value: 'system', label: t('settings.system'), icon: icons.system },
    { value: 'light', label: t('settings.light'), icon: icons.sun },
    { value: 'dark', label: t('settings.dark'), icon: icons.moon },
  ];
  const version = Constants.expoConfig?.version ?? '';
  const content = `${manifest.source.commit.slice(0, 7)}${manifest.source.dirty ? '+' : ''}`;

  return (
    <View style={styles.flex}>
      <SettingsBackground />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}>
        <Text style={[appFont(40, 'bold'), styles.title, { color: colors.accent }]}>{t('tab.settings')}</Text>

        <Section title={t('settings.language')}>
          {languages.map((l) => (
            <ChoiceRow key={l.value} icon={l.icon} label={l.label} selected={lang === l.value} onPress={() => setLang(l.value)} />
          ))}
        </Section>

        <Section title={t('settings.appearance')}>
          {appearances.map((a) => (
            <ChoiceRow
              key={a.value}
              icon={a.icon}
              label={a.label}
              selected={preference === a.value}
              onPress={() => setPreference(a.value)}
            />
          ))}
        </Section>

        <Section>
          <ActionRow icon={icons.mail} color="#007AFF" title={t('settings.support')} onPress={() => openSupportMail(t('settings.mailSubject'))} />
          <ActionRow icon={icons.feedback} color="#34C759" title={t('settings.feedback')} onPress={() => openWebPage(links.feedback)} />
          <ActionRow icon={icons.star} color="#FFCC00" title={t('settings.rate')} onPress={rateApp} />
          <ActionRow icon={icons.legal} color="#AF52DE" title={t('settings.legal')} onPress={() => setLegalOpen(true)} />
        </Section>

        {/* Nur in der Entwicklung (Expo Go / Dev-Build) sichtbar, nicht in der veröffentlichten App */}
        {__DEV__ && (
          <Section>
            <ActionRow icon={icons.restart} color="#8E8E93" title={t('settings.restartOnboarding')} onPress={restartOnboarding} />
          </Section>
        )}

        <View style={styles.footer}>
          <Text accessibilityRole="header" style={[appFont(22, 'bold'), { color: colors.accent }]}>
            {appName}
          </Text>
          <Text style={[appFont(12), { color: colors.textSecondary }]}>
            {t('settings.copyright', { year: String(new Date().getFullYear()), owner: imprint.name })}
          </Text>
          <Text style={[appFont(13), { color: colors.textSecondary }]}>{t('settings.free')}</Text>
          <Text style={[appFont(12), { color: colors.textSecondary }]}>{t('settings.version', { version, content })}</Text>
        </View>
      </ScrollView>

      <LegalSheet visible={legalOpen} onClose={() => setLegalOpen(false)} onImprint={() => setImprintOpen(true)} />
      <ImprintModal visible={imprintOpen} onClose={() => setImprintOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 80, gap: 20 },
  title: { letterSpacing: -0.5 },
  section: {
    borderRadius: 18,
    paddingVertical: 6,
    overflow: 'visible',
    elevation: 3,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  sectionTitle: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, marginHorizontal: 0 },
  choiceLabel: { flex: 1 },
  emptyRadio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5 },
  action: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16 },
  actionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  actionTitle: { flex: 1, marginLeft: 12 },
  footer: { alignItems: 'center', gap: 4, paddingTop: 8 },
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 16 },
  sheetTitle: { textAlign: 'center', paddingHorizontal: 24, marginBottom: 4 },
  sheetRule: { height: StyleSheet.hairlineWidth, marginTop: 8 },
  sheetOption: { paddingVertical: 16, alignItems: 'center' },
  imprint: { flex: 1, paddingHorizontal: 24, gap: 24 },
  imprintHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  imprintCard: {
    padding: 20,
    gap: 12,
    borderRadius: 12,
    elevation: 2,
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
});
