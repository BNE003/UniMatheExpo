/**
 * Einstellungen (SettingsView.swift) – vorerst nur Sprache und Darstellung, damit sich beide
 * Sprachen und Farbschemata testen lassen. Vollständiger Port in Meilenstein M10.
 * Hinweis: Kein „Pro“-Bereich – auf Android ist alles kostenlos.
 */
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Segmented } from '@/components/ui';
import { manifest } from '@/content/load';
import type { Lang } from '@/content/types';
import { useLang, useSetLang, useT } from '@/i18n';
import { useTheme, type AppearancePreference } from '@/theme/ThemeProvider';
import { appFont } from '@/theme/tokens';

export default function SettingsScreen() {
  const { colors, preference, setPreference } = useTheme();
  const lang = useLang();
  const setLang = useSetLang();
  const t = useT();
  const insets = useSafeAreaInsets();
  const de = lang === 'de';
  return (
    <View style={[styles.container, { paddingTop: insets.top + 24, backgroundColor: colors.background }]}>
      <Text style={[appFont(28, 'bold'), { color: colors.text }]}>{t('tab.settings')}</Text>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[appFont(15, 'semibold'), { color: colors.text }]}>{de ? 'Sprache' : 'Language'}</Text>
        <Segmented<Lang>
          value={lang}
          onChange={setLang}
          options={[
            { value: 'de', label: 'Deutsch' },
            { value: 'en', label: 'English' },
          ]}
        />
        <Text style={[appFont(15, 'semibold'), { color: colors.text }]}>{de ? 'Darstellung' : 'Appearance'}</Text>
        <Segmented<AppearancePreference>
          value={preference}
          onChange={setPreference}
          options={[
            { value: 'system', label: 'System' },
            { value: 'light', label: de ? 'Hell' : 'Light' },
            { value: 'dark', label: de ? 'Dunkel' : 'Dark' },
          ]}
        />
      </View>
      <Text style={[appFont(12), { color: colors.textSecondary }]}>
        {de ? 'Inhaltsstand' : 'Content version'}: {manifest.source.commit.slice(0, 10)}
        {manifest.source.dirty ? '+' : ''} · {manifest.source.contentHash}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, gap: 16 },
  card: { borderRadius: 16, padding: 16, gap: 12 },
});
