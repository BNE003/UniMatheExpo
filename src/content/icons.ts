/**
 * Die iOS-Daten enthalten SF-Symbol-Namen (Feld `icon` in lerninhalt/*.json).
 * Android zeigt Material Symbols; diese Tabelle ordnet jedem verwendeten SF-Symbol ein passendes zu.
 */
import type { AndroidSymbol, SFSymbol } from 'expo-symbols';

/** Symbol für beide Plattformen: SF Symbol (iOS, wie in der iOS-App) und Material Symbol (Android). */
export interface IconName {
  ios: SFSymbol;
  android: AndroidSymbol;
}

const SF_TO_MATERIAL: Record<string, AndroidSymbol> = {
  angle: 'square_foot',
  'arrow.left.and.right': 'swap_horiz',
  'arrow.right.to.line': 'east',
  'arrow.triangle.2.circlepath': 'sync',
  'arrow.triangle.branch': 'alt_route',
  'arrow.up.forward': 'north_east',
  'arrow.up.left.and.arrow.down.right': 'open_in_full',
  'arrow.up.right.and.arrow.down.left': 'close_fullscreen',
  'bolt.fill': 'bolt',
  'book.fill': 'menu_book',
  'chart.bar.fill': 'bar_chart',
  'chart.bar.xaxis': 'bar_chart',
  'chart.dots.scatter': 'scatter_plot',
  'chart.line.flattrend.xyaxis': 'show_chart',
  'chart.line.uptrend.xyaxis': 'trending_up',
  'chart.xyaxis.line': 'show_chart',
  'circle.circle.fill': 'radio_button_checked',
  'circle.grid.2x2.fill': 'category',
  'cpu.fill': 'memory',
  'cube.transparent': 'view_in_ar',
  divide: 'percent',
  'equal.circle.fill': 'drag_handle',
  'exclamationmark.triangle.fill': 'warning',
  function: 'functions',
  'graduationcap.fill': 'school',
  'i.circle.fill': 'info',
  integral: 'all_inclusive',
  'lessthan.circle.fill': 'chevron_left',
  'move.3d': '3d_rotation',
  number: 'tag',
  'number.square.fill': 'pin',
  'person.3.fill': 'groups',
  'plus.forwardslash.minus': 'exposure',
  'point.3.connected.trianglepath.dotted': 'hub',
  'point.topleft.down.curvedto.point.bottomright.up': 'route',
  'ruler.fill': 'straighten',
  scope: 'filter_center_focus',
  scribble: 'gesture',
  'scribble.variable': 'draw',
  'square.grid.2x2.fill': 'grid_view',
  'square.grid.3x3.fill': 'grid_on',
  'square.on.square': 'filter_none',
  'stopwatch.fill': 'timer',
  sum: 'functions',
  tablecells: 'table_chart',
  'text.book.closed.fill': 'auto_stories',
  'x.squareroot': 'calculate',
  // Klausuren (ÜbungsklausurenView.swift)
  'number.circle': 'looks_one',
  grid: 'grid_on',
  cube: 'view_in_ar',
  'waveform.path': 'graphic_eq',
};

export function materialIcon(sfSymbol: string): AndroidSymbol {
  return SF_TO_MATERIAL[sfSymbol] ?? 'functions';
}

/** Themen-Symbol aus den Inhaltsdaten (SF-Name) für beide Plattformen. */
export function topicIcon(sfSymbol: string): IconName {
  return { ios: sfSymbol as SFSymbol, android: materialIcon(sfSymbol) };
}

/** Symbole der Oberfläche; die SF-Namen entsprechen denen in der iOS-App. */
export const icons = {
  close: { ios: 'xmark', android: 'close' },
  chapters: { ios: 'list.bullet', android: 'format_list_bulleted' },
  back: { ios: 'arrow.left', android: 'arrow_back' },
  forward: { ios: 'arrow.right', android: 'arrow_forward' },
  check: { ios: 'checkmark', android: 'check' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right' },
  summary: { ios: 'doc.text', android: 'description' },
  exercises: { ios: 'pencil.line', android: 'edit_note' },
  stepByStep: { ios: 'brain.head.profile', android: 'psychology' },
  chevronLeft: { ios: 'chevron.left', android: 'chevron_left' },
  clock: { ios: 'clock.fill', android: 'schedule' },
  question: { ios: 'questionmark.circle.fill', android: 'help' },
  startCircle: { ios: 'arrow.right.circle.fill', android: 'arrow_circle_right' },
  star: { ios: 'star.fill', android: 'star' },
  info: { ios: 'info.circle.fill', android: 'info' },
  play: { ios: 'play.fill', android: 'play_arrow' },
  lightbulb: { ios: 'lightbulb.fill', android: 'lightbulb' },
  hide: { ios: 'eye.slash.fill', android: 'visibility_off' },
  finish: { ios: 'checkmark.circle.fill', android: 'check_circle' },
  swap: { ios: 'arrow.left.and.right', android: 'swap_horiz' },
  // Einstellungen (SettingsView.swift)
  flag: { ios: 'flag', android: 'flag' },
  globe: { ios: 'globe', android: 'language' },
  sun: { ios: 'sun.max.fill', android: 'light_mode' },
  moon: { ios: 'moon.fill', android: 'dark_mode' },
  system: { ios: 'circle.lefthalf.filled', android: 'brightness_auto' },
  selected: { ios: 'checkmark.circle.fill', android: 'check_circle' },
  mail: { ios: 'envelope.fill', android: 'mail' },
  feedback: { ios: 'bubble.left.and.bubble.right.fill', android: 'forum' },
  legal: { ios: 'doc.text.fill', android: 'description' },
  closeCircle: { ios: 'xmark.circle.fill', android: 'cancel' },
  restart: { ios: 'arrow.counterclockwise', android: 'restart_alt' },
} as const satisfies Record<string, IconName>;

export const knownSfSymbols = (): string[] => Object.keys(SF_TO_MATERIAL);
