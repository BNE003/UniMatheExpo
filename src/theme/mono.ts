import { Platform } from 'react-native';

/** Monospace für Kopfzeilen wie „LINEARE ALGEBRA / 03“ (iOS: design: .monospaced). */
export const monoFont = Platform.select({ ios: 'Menlo', default: 'monospace' });
