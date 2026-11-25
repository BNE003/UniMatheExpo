# ADR 0001: Formeldarstellung auf Android

Status: **vorläufig angenommen**. Die Messung auf einem echten Gerät steht noch aus (siehe unten).

## Kontext

Die iOS-App setzt Formeln mit MathJax 3.2.2 (CHTML) in WKWebViews (`LaTeXView.swift`). Fast jedes Textstück hat dort einen eigenen WebView. Android-WebViews sind schwerer, und die Inhalte müssen vollständig offline funktionieren (Risiken R1 und R3 in `ANDROID_PORT_PLAN.md`).

## Entscheidung

- **Gleiche Engine und Version:** MathJax 3.2.2. Der Ausgabe-Modus ist **SVG** (`tex-svg.js`) statt CHTML. SVG braucht keine nachgeladenen Schriftdateien, deshalb passt alles in eine einzige Datei `assets/math/renderer.html` (2,3 MB inklusive Inter als data-URI). Die TeX-Konfiguration (Pakete `base, ams, noerrors, noundefined`, Begrenzer) ist identisch mit iOS.
- **Ein Renderer, Inhalte per Nachricht:** Jede `MathView` lädt die lokale Datei. Sobald `ready` kommt, schickt React Native den Inhalt über `UM.render({ html, vars })`. Die WebView meldet die Höhe (`height`) und das Ergebnis (`rendered` mit Anzahl der Formelfehler und Renderzeit).
- **Weniger WebViews:** Ein Lektionsschritt besteht aus höchstens zwei WebViews, Text vor und nach der nativen Grafik. Absätze, Aufzählungskacheln, Formelkasten, Erklärung und Merke-Box sind HTML-Bausteine (`src/math/templates.ts`), die das iOS-Layout nachbilden.
- **Gleiche Formelkasten-Logik wie iOS:** Formeln werden auf mindestens 78 % verkleinert, sonst horizontal gescrollt, mit eigenem Scrollbalken und dem Hinweis „Wischen für mehr“.

## Bisher geprüft (im Browser, nicht auf Android)

`npm run preview-math` rendert alle 35 Schritte der Lektion 3.3 (DE), die Zusammenfassung und drei Übungen jeweils hell und dunkel: 90 Renderer-Instanzen, **0 MathJax-Fehler**, alle Formelkästen korrekt verkleinert oder scrollbar. Die Renderzeit pro Instanz auf dem Desktop liegt bei maximal etwa 2 s, wenn 90 Instanzen parallel starten. Das ist kein Messwert für Android.

## Offen: Messung auf dem Gerät (M0)

1. Zeit vom Öffnen eines Lektionsschritts bis zur sichtbaren Formel im Release-Build auf einem Mittelklassegerät. Ziel: < 500 ms.
2. Speicherbedarf mit zwei gleichzeitigen WebViews.
3. Horizontales Scrollen im Formelkasten innerhalb der vertikalen ScrollView (`nestedScrollEnabled`).
4. Falls 1 nicht erreicht wird, kommen folgende Optionen in Frage: WebView vorwärmen bzw. wiederverwenden, KaTeX als leichtere Engine oder Formeln beim Import zu SVG vorrendern (MathJax läuft auch in Node).
