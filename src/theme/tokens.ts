/**
 * Design-Tokens, 1:1 aus der iOS-App übernommen.
 * Quelle: UniMathe/SettingsModel.swift (extension Color, appBackground … appAccentBlue)
 * und Views/AppTypography.swift (Inter / InterDisplay).
 */
import { Platform, type TextStyle } from 'react-native';

/** Swift-Farbe UIColor(red:green:blue:alpha:) mit Komponenten 0…1 → CSS-Farbe. */
function rgb(r: number, g: number, b: number, a = 1): string {
  const c = (v: number) => Math.round(v * 255);
  return a === 1 ? `rgb(${c(r)}, ${c(g)}, ${c(b)})` : `rgba(${c(r)}, ${c(g)}, ${c(b)}, ${a})`;
}

export interface Palette {
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceStrong: string;
  border: string;
  shadow: string;
  accent: string;
  /** Text (iOS .primary) */
  text: string;
  /** Sekundärtext (iOS .secondary) */
  textSecondary: string;
  /** Linien/Flächen mit primary.opacity(x) in iOS */
  hairline: string;
  subtleFill: string;
  onAccent: string;
  difficulty: { easy: string; medium: string; hard: string };
  purple: string;
  orange: string;
}

const light: Palette = {
  background: rgb(0.96, 0.97, 0.99),
  backgroundSecondary: rgb(0.92, 0.95, 0.99),
  surface: rgb(1, 1, 1, 0.94),
  surfaceStrong: rgb(1, 1, 1),
  border: rgb(0.19, 0.46, 0.95, 0.15),
  shadow: 'rgba(0, 0, 0, 0.08)',
  accent: '#007AFF', // UIColor.systemBlue (hell)
  text: '#1C1C1E',
  textSecondary: 'rgba(60, 60, 67, 0.6)', // UIColor.secondaryLabel (hell)
  hairline: 'rgba(0, 0, 0, 0.06)',
  subtleFill: 'rgba(0, 0, 0, 0.04)',
  onAccent: '#FFFFFF',
  difficulty: { easy: '#34C759', medium: '#FF9500', hard: '#FF3B30' },
  purple: '#AF52DE',
  orange: '#FF9500',
};

const dark: Palette = {
  background: rgb(0.08, 0.09, 0.11),
  backgroundSecondary: rgb(0.12, 0.14, 0.17),
  surface: rgb(0.15, 0.17, 0.2, 0.94),
  surfaceStrong: rgb(0.18, 0.2, 0.24),
  border: rgb(0.45, 0.62, 1.0, 0.22),
  shadow: 'rgba(0, 0, 0, 0.35)',
  accent: rgb(0.2, 0.64, 1.0),
  text: '#E8ECF4',
  textSecondary: 'rgba(235, 235, 245, 0.6)', // UIColor.secondaryLabel (dunkel)
  hairline: 'rgba(255, 255, 255, 0.06)',
  subtleFill: 'rgba(255, 255, 255, 0.04)',
  onAccent: '#FFFFFF',
  difficulty: { easy: '#30D158', medium: '#FF9F0A', hard: '#FF453A' },
  purple: '#BF5AF2',
  orange: '#FF9F0A',
};

export const palettes = { light, dark } as const;

/** Farbe mit Deckkraft (iOS: `.opacity(x)`); akzeptiert `#RRGGBB`, `rgb(…)` und `rgba(…)`. */
export function withAlpha(color: string, alpha: number): string {
  const hex = /^#([0-9a-f]{6})$/i.exec(color);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }
  const rgb = /^rgba?\(([^)]+)\)$/.exec(color);
  if (rgb) {
    const [r, g, b, a = '1'] = rgb[1].split(',').map((s) => s.trim());
    return `rgba(${r}, ${g}, ${b}, ${Number(a) * alpha})`;
  }
  return color;
}
export type ColorSchemeName = keyof typeof palettes;

/** Farben, die in die WebView-Vorlagen übernommen werden (LaTeXView.swift: updateUIView). */
export const webColors = {
  light: {
    primary: '#007AFF',
    text: '#1C1C1E',
    muted: '#666666',
    card: 'rgba(255, 255, 255, 0.9)',
    mathBlock: 'rgba(0, 122, 255, 0.05)',
    border: 'rgba(0, 0, 0, 0.1)',
    surfaceStrong: '#FFFFFF',
    subtle: 'rgba(0, 0, 0, 0.04)',
    hairline: 'rgba(0, 0, 0, 0.08)',
  },
  dark: {
    primary: '#33A3FF',
    text: '#E8ECF4',
    muted: '#B2BDD0',
    card: 'rgba(40, 45, 54, 0.88)',
    mathBlock: 'rgba(74, 144, 255, 0.18)',
    border: 'rgba(255, 255, 255, 0.16)',
    surfaceStrong: rgb(0.18, 0.2, 0.24),
    subtle: 'rgba(255, 255, 255, 0.04)',
    hairline: 'rgba(255, 255, 255, 0.08)',
  },
} as const;

export type FontWeight = 'regular' | 'medium' | 'semibold' | 'bold';
/**
 * Eine Schriftfamilie je Stärke. Die Namen entsprechen den Dateinamen in assets/fonts und werden
 * beim App-Start mit expo-font geladen (src/theme/fonts.ts); im fertigen Build sind sie zusätzlich
 * über das expo-font-Plugin eingebettet. Kein fontWeight setzen, sonst fettet Android künstlich nach.
 */
export const fontFamilies = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  display: 'InterDisplay-Bold',
} as const;

/** Entspricht `Font.app(size, weight:)` in AppTypography.swift. */
export function appFont(size: number, weight: FontWeight = 'regular'): TextStyle {
  return { fontFamily: fontFamilies[weight], fontSize: size };
}

/** Entspricht `Font.appDisplay(size)` (InterDisplay-Bold). */
export function displayFont(size: number): TextStyle {
  return { fontFamily: fontFamilies.display, fontSize: size };
}

/** Monospace für Kopfzeilen wie „LINEARE ALGEBRA / 03“ (iOS: design: .monospaced). */
export const monoFont = Platform.select({ ios: 'Menlo', default: 'monospace' });

export const radius = { sm: 8, md: 12, lg: 14, xl: 16, xxl: 20 } as const;
