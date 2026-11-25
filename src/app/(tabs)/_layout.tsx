import { NativeTabs } from 'expo-router/native-tabs';

import { useT } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

/** Vier Tabs wie MainTabView.swift: Start, Klausuren, Rechner, Einstellungen. */
export default function TabsLayout() {
  const { colors } = useTheme();
  const t = useT();
  return (
    <NativeTabs
      backgroundColor={colors.surfaceStrong}
      indicatorColor={colors.backgroundSecondary}
      iconColor={{ default: colors.textSecondary, selected: colors.accent }}
      labelStyle={{ default: { color: colors.textSecondary }, selected: { color: colors.accent } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t('tab.home')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.circle.fill" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="exams">
        <NativeTabs.Trigger.Label>{t('tab.exams')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="doc.text.below.ecg" md="description" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="tools">
        <NativeTabs.Trigger.Label>{t('tab.tools')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="square.grid.3x3.fill" md="grid_on" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>{t('tab.settings')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gear.circle.fill" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
