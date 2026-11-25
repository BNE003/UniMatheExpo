# UniMathe für Android (Expo)

Android-Version der iOS-App „Höhere Mathematik“ (UniMathe). Sie ist kostenlos und bietet weder In-App-Käufe noch Abos.
Planung, Befunde und Meilensteine stehen in [ANDROID_PORT_PLAN.md](ANDROID_PORT_PLAN.md).

## Stand

Meilensteine M0/M1 (Start) und Teile von M2/M3 sind umgesetzt:

- Inhaltsimport aus dem SwiftUI-Projekt mit stabilen Themen-IDs (`tools/import-content.ts`, Bericht in [docs/content-import-report.md](docs/content-import-report.md))
- Design-Tokens und Inter-Schrift wie iOS (`src/theme`)
- Offline-Formelrenderer mit MathJax 3.2.2 (`assets/math/renderer.html`, siehe [ADR 0001](docs/adr/0001-math-rendering.md))
- Alle 121 erklärenden Grafiken der iOS-App als Animationen (`src/visuals`, Bildunterschriften DE/EN)
- Onboarding beim ersten Öffnen wie in iOS (`src/features/onboarding`); statt Gratis-Test und Kaufseite ein Schritt „100 % kostenlos, keine Werbung“
- Screens: Kursliste → Themenraster → Themenseite → Lektion (Schritt für Schritt, Kapitelübersicht) und Zusammenfassung
- Probeklausuren (18, DE/EN): Einführung mit Notenschlüssel, Timer, schrittweise Lösungen, ohne Kauf (`src/app/exam`, `src/domain/exam.ts`)
- Matrixrechner: Gauß/Gauß-Jordan mit Schritten und LGS-Lösung, Multiplikation, Determinante, unbegrenzt nutzbar (`src/app/(tabs)/tools.tsx`, `src/domain/matrix.ts`)
- Übungen: alle 1.360 Aufgaben pro Sprache nach Schwierigkeit, mit schrittweisen Lösungen (`src/app/exercises`, `src/app/exercise`)
- Noch offen: automatische Antwortprüfung (M4), Lernfortschritt (M5). Die Einstellungen enthalten vorerst nur Sprache und Darstellung.

## Einrichtung

Voraussetzung: Node 22.13 oder neuer (`.nvmrc`: 26).

```bash
nvm use
npm install
```

## Skripte

| Befehl | Zweck |
|---|---|
| `npm run import-content` | Inhalte aus dem Swift-Repo übernehmen (Pfad in `tools/content.config.json` oder `--swift-repo`) |
| `npm run import-captions` | Bildunterschriften der Grafiken aus `LessonVectorVisuals.swift` übernehmen; englische Texte für rein deutsche Swift-Grafiken stehen in `tools/visual-captions-en.json` |
| `npm run build-icons` | App-Icon, adaptives Android-Icon (Vorder-/Hintergrund, Monochrom) und Splash aus dem iOS-App-Icon erzeugen |
| `npm run build-math` | `assets/math/renderer.html` neu bauen (nach Änderungen in `tools/math-renderer/`) |
| `npm run preview-math -- 3.3 de` | Formel-Vorschau im Browser erzeugen (`.preview/math-preview.html`, über einen lokalen HTTP-Server öffnen) |
| `npm run preview-visuals -- de` | Alle Grafiken in jeder Phase als SVG-Galerie (`.preview/visuals.html`, über einen lokalen HTTP-Server öffnen) |
| `npm test` | Unit-Tests (Lektionslogik, Grafik-Konsistenz) |
| `npm run typecheck` / `npm run lint` | TypeScript und ESLint |

## Auf einem Android-Gerät starten

Die App braucht einen **Development Build**, nicht Expo Go, weil WebView, SVG und Schriften nativ eingebunden sind.

- **Lokal:** Android Studio mit SDK installieren, Gerät per USB mit aktiviertem USB-Debugging anschließen, dann `npx expo run:android`.
- **Ohne lokales SDK:** `npx eas-cli@latest build -p android --profile development` (Expo-Konto nötig), die APK auf dem Gerät installieren und anschließend `npx expo start` ausführen.

Zum Prüfen des Durchstichs: Start → „Lineare Algebra“ → „Lineare Abbildungen“ → „Lernen“. Die Lektion hat 35 Schritte (DE) mit 6 Grafiken, zum Beispiel Schritt 3 (Linearitätsprüfung) und Schritt 13 (Scherung).
