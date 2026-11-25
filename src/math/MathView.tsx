/**
 * Zeigt HTML mit Formeln über den Offline-Renderer assets/math/renderer.html an.
 * Gegenstück zu LaTeXView (iOS): Die Höhe passt sich dem Inhalt an, die WebView scrollt selbst nicht.
 *
 * Ablauf: WebView lädt renderer.html (lokale Datei) → meldet `ready` → wir rufen `UM.render(...)`
 * auf → Renderer setzt Formeln und meldet `height` und `rendered`.
 */
import { Asset } from 'expo-asset';
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { PixelRatio, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { useLang } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

let rendererUri: Promise<string> | null = null;

/** Lokale Datei-URI des Renderers; wird einmal pro App-Start ermittelt. */
function loadRendererUri(): Promise<string> {
  rendererUri ??= Asset.fromModule(require('@/assets/math/renderer.html'))
    .downloadAsync()
    .then((asset) => asset.localUri ?? asset.uri);
  return rendererUri;
}

function useRendererUri(): string | null {
  const [uri, setUri] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    loadRendererUri().then((u) => active && setUri(u));
    return () => {
      active = false;
    };
  }, []);
  return uri;
}

export interface RenderInfo {
  mathErrors: number;
  ms: number;
}

interface Props {
  html: string;
  /** Höhe vor dem ersten Messwert, damit der Inhalt beim Laden möglichst wenig springt. */
  estimatedHeight?: number;
  style?: StyleProp<ViewStyle>;
  onRendered?: (info: RenderInfo) => void;
  /** Antippen eines Elements mit `data-action` im HTML. */
  onAction?: (value: string) => void;
}

export function MathView({ html, estimatedHeight = 40, style, onRendered, onAction }: Props) {
  const uri = useRendererUri();
  const { web, colors } = useTheme();
  const lang = useLang();
  const ref = useRef<ComponentRef<typeof WebView>>(null);
  const ready = useRef(false);
  const [height, setHeight] = useState(estimatedHeight);

  const payload = useMemo(
    () => ({
      html,
      lang,
      vars: {
        'primary-color': web.primary,
        'text-color': web.text,
        'muted-text-color': web.muted,
        'card-background': web.card,
        'math-block-background': web.mathBlock,
        'border-color': web.border,
        'surface-strong': web.surfaceStrong,
        subtle: web.subtle,
        hairline: web.hairline,
        'success-color': colors.difficulty.easy,
        'easy-color': colors.difficulty.easy,
        'medium-color': colors.difficulty.medium,
        'hard-color': colors.difficulty.hard,
        'app-border': colors.border,
        // Systemschriftgröße wie bei nativen Texten berücksichtigen (WebView-textZoom ist fest 100 %).
        'font-scale': PixelRatio.getFontScale(),
      },
    }),
    [html, lang, web, colors.difficulty, colors.border],
  );

  const send = useCallback(() => {
    if (!ready.current) return;
    ref.current?.injectJavaScript(`window.UM && window.UM.render(${JSON.stringify(payload)}); true;`);
  }, [payload]);

  useEffect(send, [send]);

  const onMessage = (event: WebViewMessageEvent) => {
    let message: { type: string; value?: number | string; mathErrors?: number; ms?: number; message?: string };
    try {
      message = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    switch (message.type) {
      case 'ready':
        ready.current = true;
        send();
        break;
      case 'height':
        if (typeof message.value === 'number' && message.value > 0) setHeight(message.value);
        break;
      case 'rendered':
        if (__DEV__ && message.mathErrors) console.warn(`MathJax: ${message.mathErrors} Formelfehler`);
        onRendered?.({ mathErrors: message.mathErrors ?? 0, ms: message.ms ?? 0 });
        break;
      case 'action':
        if (typeof message.value === 'string') onAction?.(message.value);
        break;
      case 'error':
        if (__DEV__) console.warn('Formel-Renderer:', message.message);
        break;
    }
  };

  return (
    <View style={[{ height }, style]}>
      {uri && (
        <WebView
          ref={ref}
          source={{ uri }}
          originWhitelist={['file://*']}
          allowFileAccess
          javaScriptEnabled
          scrollEnabled={false}
          nestedScrollEnabled
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          textZoom={100}
          setSupportMultipleWindows={false}
          cacheEnabled
          onMessage={onMessage}
          // Links in Inhalten nicht innerhalb der WebView öffnen
          onShouldStartLoadWithRequest={(req: { url: string }) => req.url === uri || req.url.startsWith('file://')}
          style={styles.webview}
          webviewDebuggingEnabled={__DEV__}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  webview: { flex: 1, backgroundColor: 'transparent' },
});
