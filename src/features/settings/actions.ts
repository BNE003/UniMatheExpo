/**
 * Aktionen der Einstellungen: Support-Mail, Links, Bewertung (SettingsView.swift, SettingsModel.swift).
 */
import * as StoreReview from 'expo-store-review';
import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';

import { links } from '@/config/links';
import { markReviewAsked, registerLaunchAndShouldAskForReview } from '@/storage/settings';

/** Support: E-Mail-App mit Empfänger und Betreff öffnen (iOS: MFMailComposeViewController bzw. mailto). */
export function openSupportMail(subject: string) {
  return Linking.openURL(`mailto:${links.supportMail}?subject=${encodeURIComponent(subject)}`);
}

/** Webseite im In-App-Browser öffnen (Custom Tabs auf Android). */
export function openWebPage(url: string) {
  return WebBrowser.openBrowserAsync(url);
}

/**
 * „Bewerten“: In-App-Bewertungsdialog von Google Play, sonst der Store-Eintrag.
 * Google zeigt den Dialog nur für Installationen aus Play und nicht beliebig oft.
 */
export async function rateApp() {
  try {
    if ((await StoreReview.isAvailableAsync()) && (await StoreReview.hasAction())) {
      await StoreReview.requestReview();
      return;
    }
  } catch {
    // auf den Store-Link ausweichen
  }
  await Linking.openURL(StoreReview.storeUrl() ?? links.playStore);
}

/** SettingsModel.trackAppLaunch: ab dem 2. Start einmalig nach einer Bewertung fragen. */
export async function maybeAskForReviewOnLaunch() {
  if (!registerLaunchAndShouldAskForReview()) return;
  try {
    if (await StoreReview.isAvailableAsync()) {
      await StoreReview.requestReview();
      markReviewAsked();
    }
  } catch {
    // ohne Play-Dienste (z. B. Emulator) einfach nichts tun
  }
}
