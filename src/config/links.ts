/**
 * Externe Adressen aus SettingsView.swift.
 * Hinweis (Plan O-12): Datenschutz und AGB verweisen auf dieselben Seiten wie die iOS-App.
 */
export const links = {
  supportMail: 'bene-held@web.de',
  feedback: 'https://insigh.to/b/uni-math',
  privacy: 'https://sites.google.com/view/hoehere-mathematik/startseite',
  terms: 'https://sites.google.com/view/hoehere-mathematik-agb/startseite',
  /** Google-Play-Eintrag (Paketname aus app.json), Ziel für „Bewerten“, falls der In-App-Dialog nicht verfügbar ist. */
  playStore: 'https://play.google.com/store/apps/details?id=b.held.unimathe',
} as const;

/** Impressum (ImpressumView in SettingsView.swift). */
/** Name der App, wie im App Store und in den Einstellungen angezeigt. */
export const appName = 'UniMathe';

export const imprint = {
  name: 'Benedikt Held',
  street: 'Rotkehlchenweg 12',
  city: '85591, Vaterstetten',
} as const;
