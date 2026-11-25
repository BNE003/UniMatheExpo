# UniMathe für Android – Analyse- und Portierungsplan

Stand: 24.11.2026 · Referenz: SwiftUI-Projekt `/Users/benediktheld/Desktop/app/UniMatheApp` (Branch `main`, letzter Commit `08df1b3`, **mit nicht committeten Änderungen**, siehe 0.3)
Ziel: eigenständige Android-App mit Expo, React Native und TypeScript, kostenlos, ohne Paywall, ohne In-App-Käufe.

## Kennzeichnung

| Marke | Bedeutung |
|---|---|
| **[B]** | Belegter Befund aus dem Quellcode, mit Dateipfad |
| **[E]** | Technische Empfehlung |
| **[O]** | Offene Frage oder nicht eindeutig aus dem Projekt ableitbar; braucht eine Entscheidung |

Pfade ohne führenden `/` sind relativ zu `UniMatheApp/UniMathe/UniMathe/` (dem App-Target), sofern nicht anders angegeben.

---

## 0. Zusammenfassung der wichtigsten Befunde

1. **[B] Die Inhalte liegen vollständig als JSON im Bundle und sind sofort wiederverwendbar.** Das sind 48 Übungsdateien mit je 1.360 Aufgaben (DE und EN), 49/50 Schritt-für-Schritt-Lektionen mit 1.197 bzw. 1.200 Schritten, 18 Probeklausuren mit je 102 Aufgaben und 56 Zusammenfassungen pro Sprache. Alle Dateien sind gültiges JSON (geprüft).
2. **[B] Formeln werden mit MathJax 3 in WKWebViews gerendert** (`LaTeXView.swift`, lokales `MathJax.bundle`, 23 MB). Unter Android ist das der wichtigste technische Risikopunkt (Performance bei vielen WebViews, Höhenmessung).
3. **[B] Die „interaktiven Grafiken“ sind 120 in Swift programmierte, phasenweise ablaufende Animationen** (`Views/LessonVectorVisuals.swift`, 6.164 Zeilen) mit Wiederholen-Knopf. Echte Interaktion wie Ziehen oder Schieberegler gibt es nicht. Sie müssen alle neu in TypeScript (react-native-svg + Reanimated) geschrieben werden. Das ist der größte Portierungsaufwand.
4. **[B] Eine automatische Antwortprüfung gibt es in der iOS-App nicht.** Übungen und Klausuraufgaben haben nur `description` + `solutionSteps`, also keine Felder für Lösung, Optionen oder Toleranz (`Models/Exercise.swift`, `Models/Exam.swift`). Der Nutzer deckt die Lösung Schritt für Schritt auf. Im Onboarding gibt es eine „Mini-Diagnose“, die aber nur eine Selbsteinschätzung ist (`Views/OnboardingScreens.swift:1320`).
5. **[B] Lernkarten gibt es in der iOS-App nicht.** Eine Suche nach „Lernkarte/Flashcard/Karteikarte“ im gesamten Projekt findet nichts.
6. **[B] Lernfortschritt wird nur als manuell abgehakter Lernplan gespeichert** (`Models/LearningPlan.swift`, `UserDefaults`-Schlüssel `learningPlan.v1`). Es gibt keine automatische Erfassung gelesener Lektionen, gelöster Aufgaben oder Klausurergebnisse.
7. **[B] Premium wird an 6 Stellen geprüft, jeweils mit `StoreKitManager.shared.purchasedProductIDs.isEmpty`.** Die Grenzen: 8 Lektionsschritte, 2 Übungen pro Schwierigkeitsgrad, 8 Lösungsschritte, Klausurstart, Klausurlösungen und 1 Rechner-Operation. Für Android entfallen alle diese Sperren (Abschnitt 3).
8. **[B] DE und EN sind bei den Kernthemen nicht inhaltsgleich.** Die englischen Lektionen der Grundlagen-, Analysis- und LA-Themen sind ältere, kürzere Fassungen ohne Grafiken. Beispiel Lineare Abbildungen: DE 35 Schritte mit 6 Grafiken, EN 25 Schritte ohne Grafik. Brückenkurs und Numerik sind dagegen generiert und parallel.

Daraus folgt: Der Plan in Abschnitt 4 setzt **Antwortprüfung und Lernkarten als neue Funktionen** an, die auf vorhandenen Inhalten aufbauen. Ob sie wirklich in den ersten Release gehören, ist eine offene Produktentscheidung (O-1, O-2).

### 0.3 Zustand des Swift-Repos

**[B]** `git status` im Swift-Repo zeigt nicht committete Änderungen (`ContentView.swift`, `LessonVectorVisuals.swift`, beide `index*.json`) sowie neue, nicht versionierte Numerik-Dateien (`aufgaben/de/numerik_*.json` usw., `NUMERIK.md`).
**[E]** Vor dem ersten Inhaltsimport sollte dieser Stand auf iOS-Seite committet werden. Android importiert dann immer von einem festen Commit-Hash (siehe 2.8).

---

## 1. Analyse der SwiftUI-App

### 1.1 Projektaufbau

- **[B]** Das Xcode-Projekt nutzt `PBXFileSystemSynchronizedRootGroup` (`UniMathe.xcodeproj/project.pbxproj:44`). Alles unter `UniMathe/UniMathe/` gehört automatisch zum Target, auch Ressourcen-Ordner. Dateien außerhalb (`UniMathe/ContentView_OLD.swift`, `UniMathe/MathSolver.swift`, `UniMathe/Repositories/`, `UniMathe/Models/`, `UniMathe/ViewModels/`, `UniMathe/Views/`) gehören **nicht** zur App und sind Altlasten.
- **[B]** Leere oder tote Dateien im Target: `Views/ContentSelectionView.swift`, `Views/ExamView.swift` und `ViewModels/LearningContentViewModel.swift` (jeweils 0–1 Byte), `Models/LearningContent.swift` (wird nicht verwendet). `LanguageTestView.swift` und `TestLanguageApp.swift` sind Testansichten.
- **[B]** iOS 18.4, Version 1.7, Bundle-ID `b.held.UniMathe`. Das SPM-Paket PostgREST ist eingebunden, wird aber nirgends importiert. Die App arbeitet komplett offline.
- **[B]** Entwicklungswerkzeug für Inhalte: `UniMathe/tools/content_lib.py`. Es erzeugt Lektionen, Übungen und Zusammenfassungen für Brückenkurs und Numerik, prüft LaTeX (Klammern, `\(`/`\)`, `$`) und vergibt deterministische UUIDv5-IDs.

### 1.2 Navigation

**[B]** `UniMatheApp.swift` → Onboarding (`Views/OnboardingCoordinator.swift`) **oder** `MainTabView.swift` mit 4 Tabs:

| Tab | iOS-Label DE/EN | View | Icon (SF Symbol) |
|---|---|---|---|
| 0 | Start / Home | `ContentView.swift` (`ContentView`) | `house.circle.fill` |
| 1 | Klausuren / Exams | `ÜbungsklausurenView.swift` | `doc.text.below.ecg` |
| 2 | Rechner / Tools | `Views/MatrixCalculatorView.swift` | `square.grid.3x3.fill` |
| 3 | Einstellungen / Settings | `SettingsView.swift` | `gear.circle.fill` |

Hauptpfad im Start-Tab (alles in einem `NavigationStack`):

```
ContentView (Kursliste: 5 Kurse + Lernplan-Karte)
 └─ SubTopicsView (Themenraster eines Kurses)                Views/SubTopicsView.swift:3
     └─ ContentSelectionView (Themenseite, 3 Kacheln)         Views/SubTopicsView.swift:476
         ├─ 01 InteractiveLearningView (Schritt-für-Schritt)  ContentView.swift:1560
         │    └─ LessonChapterSheet (Kapitelübersicht, Sheet) ContentView.swift:1162
         ├─ 02 TopicDetailView (Zusammenfassung, HTML)        ContentView.swift:1903
         │    └─ Button → InteractiveLearningView
         └─ 03 ExercisesView (Übungen nach Schwierigkeit)     ContentView.swift:654
              └─ ExerciseDetailView (Aufgabe + Lösungsschritte) Views/ExerciseDetailView.swift
 └─ LearningPlanView (Lernplan erstellen/abhaken)             Views/LearningPlanView.swift
```

Weitere Pfade: `ÜbungsklausurenView` → `ExamDetailView` (`Views/ExamDetailView.swift`). Aus den Einstellungen und aus allen Sperrstellen öffnet sich `PurchaseView` (`paywall/PurchaseView.swift`) als `fullScreenCover`.

- **[B]** Die Tab-Leiste wird in Unterseiten über `TabBarManager.shared.hide()/show()` ausgeblendet (`TabBarManager.swift`).
- **[B]** Ein Sprachwechsel erzwingt einen Neuaufbau über `.id(settings.language)` (`UniMatheApp.swift:43`).
- **[E]** Für Android eignet sich Expo Router mit Tabs-Layout plus Stack pro Tab. Die Lektion läuft als Vollbild-Stack-Screen ohne Tab-Leiste (eigene Route außerhalb der Tab-Gruppe). Die Kapitelübersicht wird ein Bottom Sheet. Die System-Zurück-Taste (Back-Geste) muss in der Lektion auf „Lektion schließen“ führen, nicht schrittweise zurück. Zurück zum vorherigen Schritt geht über den Zurück-Button der App.

### 1.3 Wichtigste Screens

| Screen | Datei | Inhalt / Verhalten |
|---|---|---|
| Kursliste | `ContentView.swift:188` | Titel „Höhere Mathematik“ (Schrift „Nexa Bold“, **[O-9]**: Schriftdatei nicht im Projekt gefunden), `LearningPlanProgressCard`, Liste von `TopicCard` |
| Themenraster | `Views/SubTopicsView.swift:3` | 2-spaltiges Raster mit `SubTopicCard`; Illustrationen aus `Assets.xcassets`, per Titel-Vergleich zugeordnet |
| Themenseite | `Views/SubTopicsView.swift:476` | Kopfzeile „KURS / 03“ + großer Titel (InterDisplay), `LearnHeroCard` (01), `TopicActionTile` Zusammenfassung (02) + Übungen (03) |
| Lektion | `ContentView.swift:1560` | `ProgressHeader` mit Kapitel-Segmentbalken, `ExplanationContent` pro Schritt, unten Zurück/Weiter |
| Zusammenfassung | `ContentView.swift:1903` | HTML aus `markdownContent` in einem einzigen `LaTeXView` |
| Übungen | `ContentView.swift:654` | Auswahl Leicht/Mittel/Schwer, Liste `ExerciseCard` |
| Aufgabe | `Views/ExerciseDetailView.swift` | Aufgabentext, „Lösung anzeigen“, dann „Nächster Schritt“ |
| Lernplan | `Views/LearningPlanView.swift` | Themen wählen (mit Suche), Optionen Lektionen/Übungen/Klausuren, Plan abhaken |
| Klausurliste | `ÜbungsklausurenView.swift` | 18 Klausuren, fest im Code definiert (Titel, Farbe, Dauer, Dateiname) |
| Klausur | `Views/ExamDetailView.swift` | Intro mit Notenschlüssel, Start mit Timer, Aufgaben, Lösungen schrittweise |
| Matrixrechner | `Views/MatrixCalculatorView.swift` | 2×2–4×4: Determinante, Multiplikation, LGS mit Gauß/Gauß-Jordan inkl. Zwischenschritten |
| Einstellungen | `SettingsView.swift` | Sprache, Dunkelmodus, Akzentfarbe, Pro-Button, Kontakt, Feedback, Bewertung, Datenschutz/AGB-Links |
| Onboarding | `Views/OnboardingCoordinator.swift`, `Views/OnboardingScreens.swift` (3.563 Zeilen) | 11 Screens (`Models/OnboardingManager.swift:197`): Sprache, Theme, Problem, Klausurwahl, Klausurvorschau, Mini-Diagnose, Themenschau, Schritt-für-Schritt-Demo, persönlicher Plan, **Premium-Testangebot**, **Trial-Erinnerung** |

### 1.4 Wiederverwendbare Design-Komponenten und Tokens

**[B] Farben** (`SettingsModel.swift:182–214`, hell/dunkel):

| Token | Hell | Dunkel |
|---|---|---|
| `appBackground` | rgb(0.96, 0.97, 0.99) | rgb(0.08, 0.09, 0.11) |
| `appBackgroundSecondary` | rgb(0.92, 0.95, 0.99) | rgb(0.12, 0.14, 0.17) |
| `appSurface` | weiß, α 0.94 | rgb(0.15, 0.17, 0.20), α 0.94 |
| `appSurfaceStrong` | weiß | rgb(0.18, 0.20, 0.24) |
| `appBorder` | rgb(0.19, 0.46, 0.95), α 0.15 | rgb(0.45, 0.62, 1.0), α 0.22 |
| `appShadow` | schwarz, α 0.08 | schwarz, α 0.35 |
| `appAccentBlue` | systemBlue (#007AFF) | rgb(0.20, 0.64, 1.0) (#33A3FF) |
| Onboarding | `onboardingBlue` #407BFF, `onboardingInk` #263238, Grau #858585/#707070 | – |

Schwierigkeitsfarben: Grün/Orange/Rot (`Models/Exercise.swift:30`). Grafikfarben: `VisualColor` (`Views/LessonVectorVisuals.swift:370`).

**[B] Typografie** (`Views/AppTypography.swift`): Inter Regular/Medium/SemiBold/Bold und InterDisplay-Bold (TTF in `Fonts/`, SIL OFL), über `Font.app(size, weight:)` und `Font.appDisplay(size)`. In WebViews wird Inter als Base64-`@font-face` eingebettet (`MathJax.bundle/fonts/*.woff2`). Manrope (`Fonts/Manrope-*.ttf`) wird ausschließlich im Onboarding verwendet (`Views/OnboardingTypography.swift:13–17`).

**[B] Komponenten**:
- `PressableCardStyle` (Eindrück-Effekt), `LearnHeroCard`, `TopicActionTile`: `Views/SubTopicsView.swift:745/793/847`
- `TopicCard`: `ContentView.swift:450`; `SubTopicCard`: `Views/SubTopicsView.swift:247`
- `ProgressHeader` (Kapitel-Segmente + „n/m“), `LessonCircleButton` (44 pt), `LessonChapterSheet`, `ExplanationContent` (Absätze, Aufzählungskacheln `LessonBulletTile`, Formelkasten, Erklärungsbox, „MERKE“-Box), `ContinueButton`, `BackStepButton`: `ContentView.swift:1037–1560`
- `LessonRichText`, `LessonFormulaView` (Formelbox mit Auto-Verkleinern auf mind. 78 % und eigenem Scrollbalken): `Views/LessonMathViews.swift`
- `LaTeXView` (WebView + MathJax + Höhenmessung): `LaTeXView.swift`
- `AnimatedFigure`, `PlaneWindow`, `CoordinateGrid`, `Arrow`, `MathLabel`, `Dot`: `Views/LessonVectorVisuals.swift:352–541`
- `LearningPlanProgressCard`: `ContentView.swift:1234`; `ExamCard`, `StatItem`: `ÜbungsklausurenView.swift:321/433`
- `ConfettiView`: `Views/ConfettiView.swift`

**[E]** Die Tokens kommen 1:1 in `src/theme/tokens.ts` (hell/dunkel), Inter über `expo-font`. Die Komponenten werden als eigene RN-Komponenten nachgebaut, ohne UI-Kit, damit das Erscheinungsbild der iOS-App erhalten bleibt. Android-Anpassungen: Ripple statt Eindrück-Effekt ist **nicht** nötig, der Eindrück-Effekt (Scale 0.97) funktioniert auf Android auch. Die Glassmorphism-Tab-Leiste (`MainTabView.swift:47`) wird durch eine opake Leiste in `appSurface` ersetzt, Edge-to-Edge mit korrekten Insets.

### 1.5 Kurs-JSONs

**[B] Struktur und Ladelogik:**

| Ordner | Format | Schlüssel / Dateinamen | Lader |
|---|---|---|---|
| `lerninhalt/{de,en}/index(_en).json` | `{topics:[{id,title,filename,subTopics:[{id,title,filename}]}]}` | IDs `0`–`4`, Themen `0.1`…`4.14` | `ContentView.swift:314`, `Models/IndexResponse.swift` |
| `lerninhalt/{de,en}/*_content(_en).json` | `MathTopic {id,title,icon,description,subTopics?,markdownContent?}` | `markdownContent` = HTML mit `$$…$$` | `ContentView.swift:314–440`, `Views/SubTopicsView.swift:593` |
| `beispiele/{de,en}/*_beispiel.json` | `{id,topic,steps:[{id,section,text,formula?,explanation?,visual?,insight?}]}` | Schritt-IDs UUID | `ContentView.swift:1721` |
| `aufgaben/{de,en}/*.json` | `{exercises:[{id:Int,topic,title,description,difficulty,points,solutionSteps:[String]}]}` | IDs 1…n **pro Datei** | `ContentView.swift:799` |
| `klausuren/{de,en}/*.json` | `{exam:{title,subtitle,duration,totalPoints,difficulty,language,instructions},exercises:[…]}` | IDs 1…n pro Klausur | `Models/Exam.swift:276` |

Kurse im Index (DE): **0 Brückenkurs** (15 Themen), **1 Grundlagen** (9), **2 Analysis** (5), **3 Lineare Algebra** (5), **4 Numerik** (14). Das sind 48 Themen.

**[B] Probleme der Ladelogik, die Android nicht übernehmen soll:**
- Die Zuordnung Thema → Übungs- bzw. Lektionsdatei läuft über den **angezeigten Titel**: `switch topic.title` in `ContentView.swift:804` und `:1738`, `bridgeCourseFileStem`/`numericsFileStem` in `ContentView.swift:106/146`. Englische Lektionen haben eigene Dateinamen (`linear_mappings_beispiel.json`), deutsche werden über `normalizedFileName(title)` gebildet. Es gibt Sonderfälle (`_fixed`, `determinants_beispiel_old.json`, `complete_induction_beispiel.json` neben `mathematical_induction_beispiel.json`).
- Klausuren: DE→EN-Dateinamen-Tabelle in `ÜbungsklausurenView.swift:476`, Metadaten (Farbe, Icon, Dauer) fest im Code.
- Themen-Icons sind SF-Symbol-Namen im JSON (47 verschiedene, z. B. `function`, `sum`, `x.squareroot`). Die Illustrationen der Karten werden per Titelvergleich zugeordnet (`ContentView.swift:456`, `Views/SubTopicsView.swift:252`).
- Zusammenfassungen (`markdownContent`) haben Datenfehler durch `process_content_*.py`, das Klammern außerhalb von `$$` entfernt. Beispiel: `lerninhalt/de/lineare_abbildungen_content.json` enthält „fv + w = fv + fw“ statt „f(v + w) = f(v) + f(w)“. **[O-6]**

**[E]** Android baut beim Import ein **Manifest mit stabilen Themen-IDs** (z. B. `3.3`). Es ordnet jeder ID pro Sprache die Dateien zu (Lektion, Übungen, Zusammenfassung). Die App lädt dann nur noch über IDs, nie über Titel (siehe 2.8).

### 1.6 Formeldarstellung

**[B]**
- `LaTeXView.swift`: eigenes HTML-Dokument pro View, MathJax 3 `tex-mml-chtml.js` aus `MathJax.bundle/es5`. Erkennt `$…$`, `\(…\)`, `$$…$$`, `\[…\]`. Pakete `base, ams, noerrors, noundefined`. Farben für Hell/Dunkel werden per CSS-Variable gesetzt. Die Höhe wird per `postMessage` an Swift gemeldet (`sizeHandler`). Fallback auf CDN, falls das Bundle fehlt.
- `LessonRichText` (`Views/LessonMathViews.swift:22`): Nur wenn der Text `\(` enthält, wird ein WebView verwendet, sonst nativer Text. Ein Regex verhindert Umbrüche zwischen Formel und Satzzeichen.
- `LessonFormulaView` (`Views/LessonMathViews.swift:101`): abgesetzte Formel, Verkleinerung auf mind. 78 %, darüber hinaus horizontales Scrollen mit eigenem Scrollbalken und dem Hinweis „← Wischen für mehr →“.
- Übungen und Klausuren: jeder Titel, jede Beschreibung und jeder Lösungsschritt ist ein **eigener** `LaTeXView` (`Views/ExerciseDetailView.swift:34`, `ContentView.swift:981`). Eine Übungsliste mit 10 Karten erzeugt damit rund 20 WebViews.

**[E] Android-Strategie:**
1. **Gleiche Engine, weniger WebViews:** `react-native-webview` mit lokal gebündeltem MathJax 3 (dieselbe Version, kein CDN). Als Fallback auf Android KaTeX prüfen.
2. **Ein WebView pro Screen-Inhalt statt pro Textstück:** Lektionsschritt und Aufgabe werden als ein HTML-Dokument gerendert, in dem Text, Formelbox, Erklärung und Merke-Box als HTML-Bausteine im gleichen Design stehen. Native RN-Komponenten bleiben für Kopfzeile, Buttons, Grafiken und Listen.
3. **Für Listen (Übungskarten):** Vorschau-Text vorab beim Import in Klartext umwandeln oder per serverseitig (beim Build) vorgerendertem SVG darstellen, damit Listen ohne WebView auskommen. Das muss im Prototyp entschieden werden (Risiko R1).
4. Die Höhenmessung über `window.ReactNativeWebView.postMessage` übernimmt die Logik aus `LaTeXView.swift:100–200`.

### 1.7 Schritt-für-Schritt-Erklärungen

**[B]**
- Datenmodell `InteractiveExampleStep` (`ContentView.swift:46`): `text` (Absätze; Zeilen mit „• “ oder „- “ werden zu Aufzählungskacheln), `formula` (LaTeX ohne Begrenzer), `explanation`, `section` (Kapitelname; aufeinanderfolgende gleiche Werte bilden ein Kapitel, `LessonChapter.chapters`, `ContentView.swift:1043`), `visual` (Name einer Animation) und `insight` (Merke). 1.834 von 2.397 Schritten haben ein `insight`.
- Ablauf: Ein Schritt wird ausgeblendet, der nächste eingeblendet (Spring-Animation). Kapitelübersicht als Sheet, Sprung an den Kapitelanfang. Fortschritt „n/m“ und Segmentbalken pro Kapitel.
- **[B] Es wird keine Position gespeichert.** Beim erneuten Öffnen beginnt die Lektion bei Schritt 1.

**[E]** Der Port übernimmt Datenmodell, Kapitellogik und Layout 1:1. Neu und Android-spezifisch: Wischgesten links/rechts zum Blättern (optional, **[O]**), Zurück-Taste schließt die Lektion, Lesefortschritt pro Lektion wird gespeichert (siehe 1.10).

### 1.8 Interaktive Grafiken

**[B]**
- `LessonVisualView(kind:)` (`Views/LessonVectorVisuals.swift:15`): `switch` mit **121 Namen**. 120 davon werden in Lektionen verwendet, `conditionAmplifier` ist ungenutzt. Alle verwendeten Namen sind implementiert (abgeglichen). DE-Lektionen haben 140 Grafik-Referenzen, EN-Lektionen 66 (nur Brückenkurs und Numerik).
- Gemeinsamer Rahmen `AnimatedFigure` (`:541`): Koordinatenfenster `PlaneWindow`, optional Gitter, eine Liste von Bildunterschriften (= Phasen). Die Phasen laufen automatisch ab (1,2 s Start, dann alle 2,6 s mit 0,9 s Ease-in-out), Fortschrittssegmente, Wiederholen-Knopf. **Keine Nutzerinteraktion außer Wiederholen.**
- Bausteine: `Arrow`/`VectorArrowShape`, `PlaneLineShape`, `SkewGridShape`/`AnimatableGridShape`, `ParallelogramShape`, `MathLabel`, `Dot`, `CoordinateGrid`.
- **Lokalisierung uneinheitlich:** Lineare Algebra, Grundlagen und Analysis (z. B. `LinearityCheckVisual` `:1061`, `KernelImageVisual` `:1105`, `GridMapVisual`-Aufrufe `:42–80`) haben **nur deutsche** Bildunterschriften. Brückenkurs und Numerik nutzen `bk(de, en)` (`:3306`). Weil die EN-Lektionen dieser Themen keine Grafiken referenzieren, fällt das auf iOS nicht auf.

**[E]**
- Port als datengetriebene Grafik-Bibliothek in TypeScript: `react-native-svg` für die Zeichnung, `react-native-reanimated` für Phasenübergänge, gleiche Zeitkonstanten. `PlaneWindow` und die Bausteine werden 1:1 nachgebaut, jede Grafik als eigene Komponente in `src/visuals/<name>.tsx` mit Registry `Record<string, Component>`.
- Bildunterschriften kommen **aus dem Code in Daten**: `visuals/captions.{de,en}.json`, Schlüssel `<visual>.<phase>`. Davon profitiert später auch iOS (siehe 2.9).
- Unbekannte `visual`-Namen zeigen nichts an (Lektion bleibt nutzbar) und erzeugen im Entwicklungsbuild eine Warnung. So können Grafiken schrittweise portiert werden.
- **[O-4] „Interaktiv“:** Die iOS-Grafiken sind Animationen, keine Interaktionen. Der Plan übernimmt sie zunächst 1:1. Er schlägt **eine** echte Interaktion für den Durchstich vor (Ziehen von x bei `shearMap`, siehe M3), aber nur, wenn das gewünscht ist.

### 1.9 Antwortprüfung

**[B]** Nicht vorhanden. Übungen: „Lösung anzeigen“ → schrittweises Aufdecken (`Views/ExerciseDetailView.swift:46–90`). Klausuren: Timer, Lösungen pro Aufgabe aufklappbar, Notenschlüssel nach Prozent (`Views/ExamDetailView.swift:893`), aber **keine Punkteeingabe und keine Auswertung**.

**[E] Vorschlag für Android** (neu, abwärtskompatibel mit den Daten):
- Optionales Feld `check` pro Aufgabe in einer **separaten Overlay-Datei** `checks/<themen-id>.json`, Schlüssel = stabile Aufgaben-ID (2.7). So bleiben die iOS-Dateien unverändert und iOS kann die Daten später nutzen.
- Typen für den Start: `choice` (Einfach- und Mehrfachauswahl), `number` (mit Toleranz, Dezimalkomma und -punkt), `matrix` (Einträge mit Toleranz, Brüche wie `1/2` erlaubt), `self` (Selbsteinschätzung „richtig/teilweise/falsch“ nach dem Aufdecken, ohne Autorenaufwand für alle Aufgaben nutzbar).
- Prüflogik als reine TypeScript-Funktionen mit Unit-Tests (`src/domain/answerCheck.ts`). Für Zahlen und Brüche kann der vorhandene Parser im Matrixrechner (`parseMatrix`, `Views/MatrixCalculatorView.swift`) als Vorlage dienen.
- **[O-1]** Für welche Aufgaben werden `check`-Daten erstellt? Vorschlag: erst nur für den Durchstich, dann `easy`-Aufgaben mit eindeutigem Endergebnis; alle übrigen fallen auf `self` zurück.

### 1.10 Lernfortschritt

**[B]**
- `LearningPlanManager` (`Models/LearningPlan.swift`): Plan mit Items `{id, type: content|exercises|steps|exams, topicID, topicTitle, isCompleted}`, gespeichert als JSON in `UserDefaults["learningPlan.v1"]`. Die Erledigung wird **manuell** abgehakt (`toggleCompletion`).
- Weitere gespeicherte Werte: Sprache, Dunkelmodus, große Schrift, Benachrichtigungen, Akzentfarbe, Start-/Nutzungszähler für die Bewertungsabfrage (`SettingsModel.swift:23–150`), Onboarding-Status und -Antworten (`Models/OnboardingManager.swift`), `matrixFreeOperationCount`.
- Keine Speicherung von Lektionsposition, gelösten Aufgaben oder Klausurergebnissen. Keine Cloud-Synchronisierung.

**[E] Android:**
- Lokale Datenbank `expo-sqlite` mit Tabellen `lesson_progress(topic_id, lang, step_index, completed_at)`, `exercise_attempt(exercise_key, result, answered_at)`, `exam_attempt(exam_key, started_at, finished_at, self_points)`, `flashcard_review(card_key, due_at, interval, ease)` und `learning_plan(json)`. Einfache Einstellungen in `AsyncStorage` oder in einer Key-Value-Tabelle.
- Schlüssel sind stabile IDs (2.7), **sprachunabhängig**, damit der Fortschritt einen Sprachwechsel überlebt.
- Lernplan wie iOS, zusätzlich **automatisches Abhaken**: `steps` gilt als erledigt, wenn der letzte Schritt erreicht ist; `exercises` bei X % bearbeiteten Aufgaben (**[O-3]**). Manuelles Abhaken bleibt möglich.
- Schema-Version und Migrationen von Anfang an.

### 1.11 Prüfungen (Probeklausuren)

**[B]** 18 Klausuren (DE/EN), Liste und Metadaten fest in `ÜbungsklausurenView.swift:9–207`. Ablauf in `Views/ExamDetailView.swift`: Intro (Dauer, Punkte, Aufgabenanzahl, Notenschlüssel 1,0–5,0 nach Prozent), „Klausur starten“ startet einen Sekunden-Timer, dann Aufgabenkarten mit „Lösung anzeigen“ und schrittweisen Lösungen, zum Schluss „Klausur beenden“. Zusätzlich gibt es `DefaultExamStore` mit eingebetteten Ersatzdaten (`Models/Exam.swift:32–275`), der auf Android **nicht** nötig ist.

**[E]** Klausurmetadaten (Farbe, Icon, Reihenfolge, DE/EN-Dateizuordnung) werden beim Import in `exams.manifest.json` gelegt. Timer mit `Date`-Differenz statt Zähl-Timer, damit er auch im Hintergrund weiterläuft. Neu: Am Ende trägt man die selbst vergebenen Punkte pro Aufgabe ein, daraus wird die Note nach dem vorhandenen Schlüssel berechnet und gespeichert (nutzt die vorhandene Logik, keine neuen Inhalte nötig).

### 1.12 Lernkarten

**[B]** Nicht vorhanden.

**[E] Vorschlag** (nur aus vorhandenem Material):
- **Quelle A, empfohlen:** Ein Lektionsschritt mit `insight` ergibt eine Karte. Vorderseite: `section` + Frage aus dem Schritt-Kontext. Rückseite: `insight` + `formula`. Damit sind sofort 1.834 Karten in beiden Sprachen verfügbar. Die Vorderseite braucht aber eine **Frage**. Automatisch abgeleitet wäre das „Was ist die Kernaussage zu: <Kapitel> – <erster Satz von text>?“, was didaktisch schwach ist.
- **Quelle B:** Der letzte Lösungsschritt vieler Übungen heißt „Merke: …“ (z. B. `aufgaben/de/lineare_abbildungen.json`, Aufgabe 1, Schritt 8). Vorderseite: Aufgabentitel, Rückseite: Merke-Text.
- **Quelle C:** Formeln aus den Zusammenfassungen (`markdownContent`, `$$…$$`-Blöcke mit vorangehender `<h4>`-Überschrift). Diese enthalten aber die in 1.5 beschriebenen Datenfehler.
- Empfehlung: Kartenstapel pro Thema **beim Import generieren** (`flashcards/<lang>/<themen-id>.json`) aus A + B, danach redaktionell kuratieren. Wiederholung mit einfachem Leitner- oder SM-2-Verfahren, lokal gespeichert.
- **[O-2]** Sollen Lernkarten in den ersten Release, obwohl es sie auf iOS nicht gibt, und wie viel Redaktionsaufwand ist dafür eingeplant? Ohne Redaktion empfehle ich, Lernkarten als „Beta“ zu kennzeichnen oder auf einen späteren Release zu verschieben (siehe Release-Kriterium in 5.4).

### 1.13 Lokalisierung

**[B]**
- Zwei Sprachen (`AppLanguage` de/en, `SettingsModel.swift:6`). Die Vorgabe richtet sich nach der Systemsprache und ist in den Einstellungen umschaltbar.
- **UI-Texte:** keine String Catalogs oder `.strings`, sondern 205 Inline-Ternaries `language == .english ? "…" : "…"` im Code, dazu verstreute fest deutsche Texte (z. B. „Lerninhalte“ in `Views/SubTopicsView.swift:71`, „Fehler beim Laden der Daten“ in `ContentView.swift:238`, „Punkte“ in `ContentView.swift:946/987`).
- **Inhalte:** getrennte Dateien pro Sprache, Benennung uneinheitlich (Suffix `_en`, übersetzte Dateinamen, `_en_beispiel`).
- **Paritätsprobleme:** gleich viele Aufgaben und Klausuraufgaben pro Datei in DE/EN. Lektionen der Kernthemen unterscheiden sich in Länge und Grafiken (Tabelle unten), Grafik-Bildunterschriften teils nur DE.

| Thema | DE Schritte (Grafiken) | EN Schritte (Grafiken) |
|---|---|---|
| Lineare Abbildungen | 35 (6) | 25 (0) |
| Vektorräume | 45 (6) | 25 (0) |
| Mengen und Abbildungen | 37 (10) | 23 (0) |
| Eigenwerte | 39 (7) | 25 (0) |

**[E]** UI-Texte für Android in `i18next` mit `locales/{de,en}/ui.json`. Die Texte werden einmalig aus den Swift-Ternaries extrahiert (halbautomatisch per Skript, 205 Stellen). Sprache nach Gerätesprache (`expo-localization`) mit Umschalter in den Einstellungen wie iOS. Die EN-Inhalte werden zunächst so übernommen, wie sie sind. Inhaltsgleichheit ist ein eigener Redaktions-Meilenstein (M9, **[O-5]**).

### 1.14 Weitere Funktionen

- **[B] Matrixrechner** (`Views/MatrixCalculatorView.swift`, 1.379 Zeilen): Größen 2–4, Determinante, Produkt, LGS (Gauß/Gauß-Jordan) mit Zeilenoperationen als Schritte. Reine Logik, gut nach TypeScript portierbar.
- **[B] Bewertungsabfrage** über `SKStoreReviewController` (`SettingsModel.swift:147`, `SettingsView.swift:222`). Android: `expo-store-review`.
- **[B] Einstellungen:** Datenschutz-Link `https://sites.google.com/view/hoehere-mathematik/startseite`, AGB `https://sites.google.com/view/hoehere-mathematik-agb/startseite`, Feedback `https://insigh.to/b/uni-math`, Kontakt per Mail (`SettingsView.swift:198–250`).
- **[B] `ProFeaturesView`** (`UniMathe/ProFeaturesView.swift`): Werbeseite für Pro, entfällt.
- **[B] Benachrichtigungen:** Es gibt den Schalter `notificationsEnabled` und den Onboarding-Screen „Trial-Erinnerung“. Im Code findet sich kein Aufruf von `UNUserNotificationCenter`. **[O]** Ob Benachrichtigungen auf iOS überhaupt aktiv sind, lässt sich nicht eindeutig ableiten. Für Android gehören sie nicht in den ersten Release.

---

## 2. Übernahme pro Bereich

### 2.1 Übersicht

| Bereich | Direkt übernehmbar (Daten/Assets) | In TypeScript portieren | Android-spezifisch neu |
|---|---|---|---|
| Kursstruktur | `lerninhalt/*/index*.json`, `*_content*.json` | Laden, Baum, Leaf-Themen (`LearningPlanManager.expandSelectedTopics`) | Manifest mit IDs statt Titel-Mapping; Icon-Mapping SF Symbol → Android-Icon |
| Lektionen | `beispiele/**` (alle 99 Dateien) | `LessonChapter.chapters`, Text→Absatz/Aufzählung (`ExplanationContent.blocks`) | Vollbild-Stack, Back-Taste, Positionsspeicher |
| Formeln | `MathJax.bundle/es5` (nur benötigte Teile), Inter-woff2 | HTML/CSS-Vorlagen aus `LaTeXView.swift`, `LessonMathViews.swift`, Formelbox-JS | `react-native-webview`, Bündelung als Asset, WebView-Pooling |
| Grafiken | – (nur Code) | 120 Grafiken + Bausteine aus `LessonVectorVisuals.swift` | SVG/Reanimated, Bildunterschriften als Daten |
| Zusammenfassungen | `markdownContent` (HTML) | CSS aus `LaTeXView.swift` (Klassen `.definition`, `.property`, `.math-block` …) | Datenkorrektur (O-6) |
| Übungen | `aufgaben/**` | Filter nach Schwierigkeit, schrittweises Aufdecken | Antwortprüfung (neu), Versuchsspeicher |
| Klausuren | `klausuren/**` | Notenschlüssel `getGradingScale`, Timer | Metadaten-Manifest, Selbstbewertung (neu) |
| Lernplan | – | `LearningPlan.swift` komplett | SQLite statt UserDefaults, Auto-Abhaken |
| Lernkarten | Quellen: `insight`, Merke-Schritte | – | komplett neu (O-2) |
| Rechner | – | Gauß, RREF, Determinante, Produkt, Parser | Zahlentastatur-Layout |
| Onboarding | Texte aus `OnboardingScreens.swift`, `Assets.xcassets/0.imageset/0.svg` | Ablaufsteuerung `OnboardingManager` | ohne Premium- und Trial-Screens, kürzerer Ablauf (O-8) |
| Assets | `Assets.xcassets/*.imageset` (Themen-Illustrationen, Logo, AppIcon), `Fonts/Inter*` | – | adaptive App-Icons (Vorder-/Hintergrund), Splash |
| Einstellungen | URLs, Mail | Sprache/Dark-Mode/Akzentfarbe | `expo-store-review`, Android-Datenschutzseite (Data Safety) |

### 2.2 Nicht übernehmen

`paywall/`, `UniMathe/StoreKitManager.swift`, `UniMathe/ProFeaturesView.swift`, `UniMathe/Configuration.storekit`, `matrixFreeOperationCount`, Onboarding-Screens `premiumTrialOffer` und `trialReminder`, `DefaultExamStore`, PostgREST, alle Dateien außerhalb des Targets, `*_old.json`, `*_fixed.json` (nach Prüfung, welche Variante die aktuelle ist, **[O]**), `process_content_*.py`.

### 2.3 Gemeinsame Inhaltsquelle für beide Apps

**[E] Empfohlener Weg in drei Stufen:**

1. **Kurzfristig, ab M1: Import-Skript, iOS bleibt Quelle der Wahrheit.**
   `tools/import-content.ts` (bzw. `.py`) im Android-Repo liest einen **festen Commit** des Swift-Repos (Pfad oder Git-Submodule/Sparse-Checkout auf `UniMathe/UniMathe/{lerninhalt,beispiele,aufgaben,klausuren}`) und schreibt nach `assets/content/`:
   - Originaldateien unverändert, nur umbenannt nach Schema `<lang>/<themen-id>/{lesson,exercises,summary}.json` bzw. `exams/<exam-id>.json`
   - `manifest.json` (Kurse, Themen-IDs, Titel DE/EN, Icons, Dateizuordnung, Content-Version = Swift-Commit-Hash)
   - Validierung: Schema (Zod), LaTeX-Prüfungen wie `content_lib.check_tex`, unbekannte `visual`-Namen, DE/EN-Parität (Bericht, kein Abbruch)
   Damit bleibt die iOS-App unverändert und Android ist reproduzierbar.
2. **Mittelfristig, nach dem Release: eigenes Content-Repo `unimathe-content`.**
   Kanonisches Layout nach Themen-ID, JSON Schema, die vorhandenen Generatoren (`content_lib.py`) ziehen dorthin um. Beide Apps beziehen die Inhalte per Submodule. iOS braucht dafür eine kleine Anpassung des Laders, die aber aus diesem Plan heraus **nicht** umgesetzt wird (Entscheidung iOS-seitig, **[O-7]**).
3. **Optional später: Inhalts-Updates ohne App-Update** (Download eines versionierten Pakets). Für den Start nicht nötig, weil alles gebündelt und offline ist.

### 2.4 Übersetzungen

- Inhalte: wie 2.3, Sprache als Ordner. Inhaltsgleichheit wird über Themen-ID und Schrittanzahl im Import-Bericht sichtbar.
- UI-Texte: `locales/{de,en}/ui.json` im Android-Repo. Im Content-Repo (Stufe 2) könnten sie geteilt werden, wenn iOS auf String Catalogs umstellt. Bis dahin bleiben die Android-UI-Texte getrennt.
- Grafik-Bildunterschriften: `visuals/captions.{de,en}.json` im Inhaltsbestand, damit fehlende EN-Texte sichtbar werden und später gemeinsam gepflegt werden können.

### 2.5 Bestehende Aufgaben-IDs

**[B]** `id` ist eine Ganzzahl, eindeutig nur innerhalb einer Datei (1…n, geprüft: keine Duplikate pro Datei). DE und EN haben pro Datei gleich viele Aufgaben, die gleiche ID meint die gleiche Aufgabe (Stichprobe: `lineare_abbildungen` #1 „Linearität prüfen“ / „Checking linearity“). Lektionsschritte haben UUIDs; für Brückenkurs/Numerik deterministisch, für die anderen Themen pro Sprache verschieden. Klausuraufgaben sind 1…n pro Klausur.

**[E]** Stabile, sprachunabhängige Schlüssel:
- Aufgabe: `ex:<themen-id>:<id>`, z. B. `ex:3.3:10`
- Klausuraufgabe: `exam:<exam-key>:<id>` mit `exam-key` = deutscher Dateistamm, z. B. `exam:lineare_algebra_1_anfaenger:2`
- Lektion: `lesson:<themen-id>`, Position als Index. Weil DE/EN unterschiedlich lang sein können, wird beim Sprachwechsel der Index auf das Kapitel (`section`-Nummer) abgebildet oder auf 0 gesetzt (**[O]**).
- Lernkarte: `card:<themen-id>:<quelle>:<n>`
- Regel für Autoren (ins Content-README): IDs werden nie neu vergeben oder umnummeriert, neue Aufgaben bekommen die nächste freie Nummer. Der Import bricht ab, wenn sich eine bestehende ID zwischen zwei Content-Versionen auf einen anderen Titel ändert (Abgleich mit dem vorherigen Manifest).

### 2.6 Offline-Nutzung

**[B]** Die iOS-App ist vollständig offline: Inhalte und MathJax liegen im Bundle, es gibt keinen Netzwerkzugriff außer den Links in den Einstellungen.
**[E]** Android genauso: alle Inhalte, MathJax, Schriften und Grafiken als App-Assets, keine CDN-Fallbacks. Die WebView lädt nur `file:///android_asset/...` bzw. Expo-Asset-URIs. **Abnahmetest:** Flugmodus ab der frischen Installation.
**[E] Größe:** `MathJax.bundle` umfasst 23 MB, davon braucht man nur `tex-chtml` + woff2-Schriften (ein Ziel unter 5 MB ist realistisch, R4). Die Inhalts-JSONs haben zusammen rund 7 MB. Die PNGs in `Assets.xcassets` (25 MB) werden auf WebP mit passender Auflösung verkleinert.

---

## 3. Premium-Kopplung in Swift und freie Umsetzung auf Android

### 3.1 Belegte Sperrstellen

| # | Funktion | Stelle | iOS-Verhalten ohne Kauf | Android |
|---|---|---|---|---|
| P1 | Schritt-für-Schritt-Lektion | `ContentView.swift:1562, 1685–1705` | Ab Schritt 9 (`freeLessonSteps = 8`) Paywall, Rücksprung auf Schritt 8 | alle Schritte frei |
| P2 | Übungsliste | `ContentView.swift:670–681, 741–770` | Pro Schwierigkeit nur die ersten 2 Aufgaben, Rest verschwommen mit Schloss | alle Aufgaben sichtbar, kein Schloss |
| P3 | Lösungsschritte einer Aufgabe | `Views/ExerciseDetailView.swift:12, 57` | Ab Schritt 9 (`freeStepLimit = 8`) Paywall | alle Schritte frei |
| P4 | Klausur starten | `Views/ExamDetailView.swift:234` | Start nur mit Kauf | Start frei |
| P5 | Klausurlösungen | `Views/ExamDetailView.swift:588` | Lösungen nur mit Kauf | frei |
| P6 | Matrixrechner | `Views/MatrixCalculatorView.swift:10, 439, 614–627` | 1 freie Operation (dauerhaft gezählt), danach Paywall | unbegrenzt |
| P7 | Einstellungen | `SettingsView.swift:160` | Button „Pro Version“ | entfällt |
| P8 | Onboarding | `Views/OnboardingCoordinator.swift:58`, `Views/OnboardingScreens.swift:2982, 3189, 3501` | Testangebot, Trial-Erinnerung, Paywall | Screens entfallen |
| P9 | Pro-Übersicht | `UniMathe/ProFeaturesView.swift:68` | Werbeseite | entfällt |

Produkte (nur zur Dokumentation, `UniMathe/StoreKitManager.swift:7–9`): `unimathe.pro.year`, `unimathe.pro.month`, `unimathe.pro.lifetime`. Testphase 3 Tage (`Configuration.storekit:104`).

**[B]** Zusammenfassungen, Lernplan, Kursliste und Themenseiten sind auf iOS nicht gesperrt.
**[B]** Nicht als Premium gekennzeichnete Inhalte gibt es nicht: Alle Inhalte liegen im Bundle, die Sperre ist reine UI-Logik. Auf Android muss also **kein Inhalt zusätzlich beschafft werden**.

### 3.2 Umsetzung ohne Kaufstatus

**[E]**
- **Kein** `isPro`-Flag, **kein** `EntitlementProvider` mit Rückgabe `true`, kein toter Paywall-Code. Die Lernabläufe werden so gebaut, als hätte es nie eine Sperre gegeben. So entfällt das Risiko, dass ein vergessenes Flag Inhalte sperrt, und Google Play erkennt keine „Kauf-Funktionalität“.
- Lektion (P1): `goToStep` ohne Grenze; Fortschrittsbalken und Kapitel-Sheet erlauben Sprünge in alle Kapitel.
- Übungen (P2/P3): Liste vollständig; die Verschwommen-/Schloss-Darstellung wird nicht portiert. `isFreeExercise` aus `ExerciseDetailView` entfällt.
- Klausur (P4/P5): direkt startbar; Lösungen jederzeit aufklappbar. **[O-10]** Optional „Lösungen erst nach Abgabe“ als Lernmodus, keine Sperre.
- Rechner (P6): kein Zähler.
- Onboarding (P8): Ablauf endet nach „persönlicher Plan“ direkt in der App. Die „Premium“-Begriffe in den Onboarding-Texten werden ersetzt.
- Einstellungen: statt „Pro Version“ und „Käufe wiederherstellen“ ein Hinweis „Alle Inhalte kostenlos“ (**[O]**, Formulierung).
- Store-Eintrag: „kostenlos, keine In-App-Käufe“; im Build darf keine Billing-Bibliothek enthalten sein (prüfen mit `aapt dump permissions` bzw. Merged Manifest: keine `com.android.vending.BILLING`-Permission).
- Abnahme: automatischer Test, dass für jedes Thema jeder Lektionsschritt, jede Aufgabe mit allen Lösungsschritten und jede Klausur mit Lösungen erreichbar ist (5.4).
- iOS und seine Monetarisierung bleiben unverändert. Dieser Plan ändert keine Swift-Dateien.

---

## 4. Meilensteine bis zum vollständigen Durchstich „Lineare Abbildungen“

Konvention: Jeder Meilenstein endet mit einem lauffähigen Build auf einem echten Android-Gerät.

### M0 – Entscheidungen und Prototyp-Risiken klären (Spike)

- **Ziel:** Die drei technisch riskanten Bausteine sind an einem Wegwerf-Prototyp entschieden, bevor Screens portiert werden.
- **Aufgaben:**
  1. Expo-Projekt (SDK aktuell stabil, TypeScript, Expo Router, Dev Build statt Expo Go) initialisieren.
  2. **R1 Formeln:** `react-native-webview` + lokal gebündeltes MathJax 3 (`tex-chtml`, nur benötigte Erweiterungen). Den Schritt `beispiele/de/lineare_abbildungen_beispiel.json` Schritt 11 (Rotationsmatrix) und Schritt 29 (breite Matrix `M_C^B(f)`) rendern. Messen: Zeit bis sichtbar, Speicher, Höhe korrekt, Dunkelmodus. Gegenprobe mit KaTeX.
  3. **R1b Listen:** Übungsliste `aufgaben/de/lineare_abbildungen.json` (30 Karten) mit (a) einem WebView pro Karte, (b) einem WebView für die ganze Liste, (c) Klartext-Vorschau. Ruckeln beim Scrollen auf einem Mittelklassegerät messen.
  4. **R2 Grafiken:** `GridMapVisual` (`shearMap`) in react-native-svg + Reanimated nachbauen, Phasen und Zeitkonstanten wie `AnimatedFigure`.
  5. **R3 Assets:** MathJax und JSON als Assets bündeln, im Flugmodus laden, APK-/AAB-Größe messen.
- **Abhängigkeiten:** keine. Klärung von O-1, O-2 und O-4 parallel.
- **Abnahmekriterien:**
  - Der Lektionsschritt mit Formel rendert im Release-Build auf einem echten Gerät in < 500 ms nach dem Einblenden, ohne Höhensprung > 1 Zeile.
  - Die Übungsliste mit 30 Karten scrollt ohne sichtbares Ruckeln (Profiler: keine Frames > 32 ms bei normalem Scrollen).
  - Die Scherungs-Animation läuft mit 60 fps und sieht aus wie in iOS (Screenshot-Vergleich).
  - Alles funktioniert im Flugmodus. Entscheidung im Repo dokumentiert (`docs/adr/0001-math-rendering.md`).

### M1 – Grundgerüst, Design-System, Inhaltsimport

- **Ziel:** App-Skelett mit Tabs, Theme und importierten Inhalten. Das Design entspricht iOS.
- **Aufgaben:**
  1. Ordnerstruktur `app/` (Routes), `src/theme`, `src/components`, `src/content`, `src/domain`, `src/storage`, `src/visuals`, `tools/`.
  2. `tokens.ts` aus 1.4, Inter über `expo-font`, Hell/Dunkel nach System plus manuellem Schalter.
  3. Tabs Start / Klausuren / Rechner / Einstellungen mit Android-Icons; Tab-Leiste in Unterseiten ausblenden.
  4. Import-Skript (2.3 Stufe 1) für alle Kurse, Manifest, Zod-Schemas, Validierungsbericht.
  5. i18n-Gerüst (`i18next`), DE/EN-Umschaltung.
  6. Basiskomponenten: `PressableCard`, `TopicCard`, `SubTopicCard`, `TopicActionTile`, `LearnHeroCard`, `ScreenBackground` (Verlauf + Kreise).
- **Abhängigkeiten:** M0 (Rendering-Entscheidung, Asset-Strategie).
- **Abnahmekriterien:**
  - `npm run import-content -- --swift-repo <pfad> --ref <commit>` erzeugt reproduzierbar `assets/content/**` + `manifest.json`. Ein zweiter Lauf erzeugt keinen Git-Diff.
  - Der Validierungsbericht listet 48 Themen × 2 Sprachen, 1.360 Aufgaben pro Sprache, 18 Klausuren, 0 Schemafehler und alle bekannten Paritätsabweichungen (z. B. Lineare Abbildungen 35/25 Schritte).
  - Die Kursliste zeigt die 5 Kurse mit korrekten Titeln in DE und EN. Beim Umschalten im Hell-/Dunkelmodus gibt es keine nicht lesbaren Texte.

### M2 – Themenliste und Themenseite (Durchstich Teil 1)

- **Ziel:** Navigation Start → „Lineare Algebra“ → „Lineare Abbildungen“ (`3.3`) → Themenseite mit drei Kacheln.
- **Aufgaben:** `SubTopicsView`-Raster, `ContentSelectionView`-Kopfzeile („LINEARE ALGEBRA / 03“), Laden ausschließlich über Themen-ID aus dem Manifest, Illustration `abbildung.png` aus `Assets.xcassets/abbildung.imageset/`.
- **Abhängigkeiten:** M1.
- **Abnahmekriterien:** Die Themenseite „Lineare Abbildungen“ ist in DE und EN erreichbar. Beide Sprachen zeigen dieselbe Themen-ID. Die System-Zurück-Taste führt jeweils eine Ebene zurück. Auf iOS-Screenshots und Android sind Abstände, Schriften und Farben vergleichbar (Review mit Screenshot-Paar).

### M3 – Erklärung mit echter Formel und Grafik (Durchstich Teil 2)

- **Ziel:** Die Lektion `beispiele/de/lineare_abbildungen_beispiel.json` ist vollständig benutzbar.
- **Konkretes Material:**
  - Schritt 2 (`id cc0e8400-…0002`): Text mit Inline-Formeln `\(f \colon V \to W\)`, Formelbox `\begin{align*} f(u + v) &= f(u) + f(v) \\ f(\lambda v) &= \lambda \, f(v) \end{align*}`, Erklärung und Merke-Box.
  - Schritt 3: Grafik `linearityCheck` (`Views/LessonVectorVisuals.swift:1061`) mit Formel.
  - Schritt 13: Grafik `shearMap` + Formel `S = \begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix}`.
  - Weitere Grafiken dieser Lektion: `reflectionMap` (Schritt 14), `kernelImage` (16), `matrixOrder` (28), `basisChange` (31).
- **Aufgaben:**
  1. `LessonScreen`: `ProgressHeader` mit Kapitelsegmenten (8 Kapitel), Kapitel-Bottom-Sheet, Weiter/Zurück, Ein-/Ausblend-Animation.
  2. `ExplanationContent` in einem WebView-Dokument (oder nach Entscheidung aus M0) mit Absätzen, Aufzählungskacheln, Formelbox (Auto-Fit 78 % + Scrollbalken), Erklärung und Merke-Box.
  3. Grafik-Bausteine (`PlaneWindow`, Gitter, Pfeil, Label, Punkt, `AnimatedFigure`) und die 6 Grafiken dieser Lektion. Bildunterschriften in `captions.de.json` + **neu übersetzt** `captions.en.json`.
  4. **Optional (O-4):** Bei `shearMap` lässt sich der Beispielvektor x im letzten Schritt ziehen; `f(x)` wird live berechnet. Das wäre die einzige echte Interaktion im Durchstich.
  5. EN-Lektion `beispiele/en/linear_mappings_beispiel.json` (25 Schritte, keine Grafiken) läuft ebenfalls.
- **Abhängigkeiten:** M0 (R1, R2), M2.
- **Abnahmekriterien:**
  - Alle 35 DE-Schritte und 25 EN-Schritte sind ohne Paywall erreichbar, Formeln rendern ohne MathJax-Fehler (`noerrors` liefert keine roten Fehlerboxen; automatisch über den DOM des WebViews geprüft).
  - Die 6 Grafiken laufen ab und lassen sich wiederholen; die Phasentexte stimmen inhaltlich mit iOS überein.
  - Die breite Formel in Schritt 30 (`M_C^B(f)`) wird verkleinert oder ist horizontal scrollbar mit sichtbarem Balken.
  - Ein Kapitelsprung über das Sheet landet auf dem Kapitelanfang.

### M4 – Übung mit Antwortprüfung (Durchstich Teil 3)

- **Ziel:** Eine Übung aus „Lineare Abbildungen“ lässt sich beantworten, automatisch prüfen und danach mit allen Lösungsschritten nachvollziehen.
- **Befund:** In Swift fehlt die Antwortprüfung (1.9). **Vorschlag aus vorhandenem Material:**
  - **Aufgabe `ex:3.3:10` „Einfache Scherung“** (`aufgaben/de/lineare_abbildungen.json`, id 10, easy): „Bestimmen Sie die Darstellungsmatrix der Scherung … mit Scherfaktor 2 in x-Richtung.“ Lösung laut `solutionSteps`: \(\begin{pmatrix}1&2\\0&1\end{pmatrix}\). → `check: {type: "matrix", rows: 2, cols: 2, answer: [[1,2],[0,1]]}`. Sie passt zur Grafik `shearMap` aus M3.
  - **Aufgabe `ex:3.3:1` „Linearität prüfen“** (id 1, easy): drei Abbildungen, nur (a) linear (Schritt 7). → `check: {type: "choice", multiple: true, options: ["a","b","c"], answer: ["a"]}`. Die Optionstexte werden aus der Beschreibung übernommen.
- **Aufgaben:**
  1. `ExercisesScreen` mit Schwierigkeitswahl und allen 30 Aufgaben (ohne Sperre).
  2. `ExerciseScreen`: Aufgabe, Eingabebereich passend zum `check`-Typ (Matrix-Raster mit Zahlentastatur; Auswahlchips), „Prüfen“, Rückmeldung richtig/falsch mit Hinweis, danach „Lösung anzeigen“ und schrittweise Lösung wie iOS.
  3. Für Aufgaben ohne `check`: Lösung aufdecken und Selbsteinschätzung (`self`).
  4. `answerCheck.ts` mit Unit-Tests (Toleranz, `1/2`, `0,5`, `-0`, leere Felder, Reihenfolge der Mehrfachauswahl).
  5. Overlay-Datei `assets/content/checks/3.3.json` (DE/EN gemeinsam, da sprachneutral; Optionstexte pro Sprache).
- **Abhängigkeiten:** M3 (Formel-Rendering), Entscheidung O-1.
- **Abnahmekriterien:**
  - `ex:3.3:10`: Eingabe `1 2 / 0 1` → „richtig“; `1 0 / 2 1` → „falsch“ + Hinweis; `1, 2.0, 0, 1` und `1, 2,0, 0, 1` werden als richtig erkannt.
  - `ex:3.3:1`: nur „a“ → richtig; „a, b“ → falsch.
  - Unit-Tests für `answerCheck.ts` laufen grün in CI.
  - Alle 30 Aufgaben sind mit allen Lösungsschritten ohne Kauf erreichbar.

### M5 – Gespeicherter Lernfortschritt (Durchstich Teil 4)

- **Ziel:** Der Fortschritt aus M3 und M4 übersteht einen App-Neustart und einen Sprachwechsel.
- **Aufgaben:**
  1. `expo-sqlite` mit Schema aus 1.10, Migrationen, Repository-Schicht.
  2. Lektionsposition und „abgeschlossen“ speichern; auf der Themenseite „Weiter bei Schritt n“ bzw. „Abgeschlossen“ anzeigen.
  3. Übungsversuche speichern; in der Liste Status-Badge (richtig / falsch / angesehen).
  4. Lernplan-Port (`LearningPlanManager` 1:1) inklusive Auto-Abhaken für `steps` (O-3).
  5. `LearningPlanProgressCard` auf der Startseite.
- **Abhängigkeiten:** M3, M4.
- **Abnahmekriterien:**
  - Die Lektion „Lineare Abbildungen“ bis Schritt 13 öffnen, App beenden (auch über „Aus Verlauf entfernen“) und neu starten: Die Themenseite zeigt „Weiter bei Schritt 13“, die Lektion öffnet dort.
  - `ex:3.3:10` richtig gelöst, App neu gestartet: Die Aufgabe ist in der Liste als gelöst markiert, auch nach Umschalten auf EN.
  - Ein Lernplan mit Thema 3.3 zählt die Lektion nach Erreichen des letzten Schritts automatisch als erledigt.
  - Bei einem Update der App (Installation über bestehende Version) bleiben die Daten erhalten (Test mit zwei Builds).

**Ergebnis nach M5:** vollständiger Ablauf **Themenliste → Erklärung mit echter Formel und Grafik → Übung mit Antwortprüfung → gespeicherter Lernfortschritt** am Thema Lineare Abbildungen.

---

## 5. Restliche Übernahme, Tests und Veröffentlichung

Legende: **R1** = für den ersten öffentlichen Release nötig · **S** = kann später folgen

### M6 – Alle Kurse, Lektionen und Zusammenfassungen (R1)

- **Ziel:** Alle 48 Themen mit Lektion und Zusammenfassung in DE/EN.
- **Aufgaben:** Zusammenfassungsscreen (HTML + CSS aus `LaTeXView.swift`) inklusive „Schritt-für-Schritt“-Button; Icon-Mapping der 47 SF-Symbole auf Material Symbols (Tabelle `src/content/iconMap.ts`); Themen-Illustrationen; Datenkorrektur der Zusammenfassungen (O-6).
- **Grafiken:** alle 120 portieren, priorisiert nach Kursreihenfolge im Index (Brückenkurs 0 zuerst, weil dort DE und EN vorhanden sind). Pro Grafik: Komponente, Bildunterschriften DE+EN, Screenshot-Vergleich.
  **[E]** Wenn der Release vor Abschluss aller Grafiken kommen soll, ist der Fallback „Grafik nicht angezeigt“ technisch möglich. Für R1 ist aber vorgegeben, dass alle in iOS vorhandenen Grafiken enthalten sind (**[O-11]**, Entscheidung zur Release-Reihenfolge).
- **Abhängigkeiten:** M3.
- **Abnahmekriterien:** Ein automatischer Rundgang (Detox/Maestro) öffnet jede der 96 Lektionen (48 × 2 Sprachen) und blättert bis zum letzten Schritt. 0 Ladefehler, 0 MathJax-Fehlerboxen, 0 unbekannte `visual`-Namen.

### M7 – Alle Übungen (R1)

- **Ziel:** 1.360 Aufgaben pro Sprache mit schrittweisen Lösungen, Antwortprüfung dort, wo `check`-Daten existieren, sonst Selbsteinschätzung.
- **Aufgaben:** `check`-Daten für einen ersten Satz von Aufgaben (Umfang nach O-1); Import-Validierung für `checks/*.json` (verweist nur auf existierende IDs, Antwort ist gültig).
- **Abhängigkeiten:** M4, M6.
- **Abnahmekriterien:** Der Rundgang öffnet jede Aufgabe und deckt alle Lösungsschritte auf (ohne Kauf). Für jede `check`-Aufgabe gibt es einen automatischen Test, bei dem die hinterlegte Antwort als richtig erkannt wird.

### M8 – Klausuren (R1)

- **Ziel:** 18 Probeklausuren mit Intro, Notenschlüssel, Timer, Lösungen, Selbstbewertung, Ergebnisspeicher.
- **Aufgaben:** Manifest mit Metadaten aus `ÜbungsklausurenView.swift:9–207`, DE/EN-Zuordnung aus `:476`; Port `getGradingScale`; Timer über Zeitstempel; Punkteeingabe pro Aufgabe → Note.
- **Abhängigkeiten:** M3 (Rendering), M5 (Speicher).
- **Abnahmekriterien:** Jede der 18 Klausuren lässt sich in DE und EN starten. Alle Lösungen sind aufklappbar. Für 100 Punkte ergeben 50 Punkte die Note „4,0“ und 49 Punkte „5,0“ (Unit-Test gegen iOS-Logik). Der Timer läuft nach 2 Minuten im Hintergrund korrekt weiter.

### M9 – Lernkarten (R1 oder S, abhängig von O-2)

- **Ziel:** Kartenstapel pro Thema mit einfacher Wiederholungslogik.
- **Aufgaben:** Generator im Import (Quellen A+B aus 1.12), Redaktionsliste, Kartenscreen (umdrehen, „gewusst/nicht gewusst“), Fälligkeitslogik (Leitner, 5 Fächer), Einstieg auf der Themenseite als vierte Kachel „04 Lernkarten“.
- **Abhängigkeiten:** M5, M6.
- **Abnahmekriterien:** Für jedes der 48 Themen existiert mindestens ein Stapel in DE und EN. Beantwortete Karten erscheinen nach der Leitner-Regel wieder. Der Fortschritt bleibt über einen Neustart erhalten.

### M10 – Lernplan, Rechner, Einstellungen, Onboarding (R1)

- **Aufgaben:**
  - Lernplan-Screen vollständig (Suche, Auswahl, Optionen, Liste mit Navigation zu Lektion/Übungen/Klausur).
  - Matrixrechner: Logik aus `MatrixCalculatorView.swift` nach `src/domain/matrix.ts` portieren (mit Unit-Tests: Determinante, RREF, LGS mit eindeutiger/keiner/unendlich vielen Lösungen), UI mit Zahlenfeldern.
  - Einstellungen: Sprache, Darstellung, Akzentfarbe (**[O]**: wird sie auf iOS überall verwendet?), Kontakt, Feedback, Bewertung (`expo-store-review`), Datenschutz/AGB (Android-taugliche Fassung, O-12), Version/Content-Version.
  - Onboarding: verkürzt ohne P8-Screens (O-8).
- **Abnahmekriterien:** Unit-Tests für die Rechnerlogik grün und deckungsgleich mit Stichproben aus iOS (3 Matrizen pro Operation). Das Onboarding erscheint nur bei der ersten Installation und lässt sich überspringen. In der gesamten App gibt es keine Texte zu „Pro“, „Premium“, „Abo“ oder „kaufen“ (Grep über `locales/` und Inhalte; die Inhaltsdateien enthalten diese Wörter nicht in diesem Sinn, **[O]** wird im Import geprüft).

### M11 – Qualität auf echten Android-Geräten (R1)

- **Geräte-Matrix (Minimum):** 1 aktuelles Pixel (Android 15/16), 1 Samsung-Mittelklasse (One UI, z. B. Galaxy A-Serie), 1 älteres/schwächeres Gerät (Android 10–11, 3–4 GB RAM), 1 Tablet oder Foldable (optional S). **[O-13]** Welche Geräte stehen zur Verfügung?
- **Prüfpunkte:**
  - Leistung: Kaltstart < 2,5 s auf dem Mittelklassegerät; Lektionsschritt < 500 ms; Übungsliste flüssig.
  - Darstellung: Schriftgröße des Systems 100 %/130 %/200 %, Anzeigegröße, Hell/Dunkel, Gestennavigation und 3-Tasten-Navigation, Edge-to-Edge mit Ausschnitten (Notch).
  - Bedienung: System-Zurück überall sinnvoll, Tastatur verdeckt keine Eingabefelder (Matrix-Eingabe), TalkBack-Beschriftungen für Buttons, Grafiken und Formeln (MathJax-Assistive-MML prüfen).
  - Robustheit: Prozess-Tod im Hintergrund (Entwickleroption „Aktivitäten nicht behalten“), Rotation, Flugmodus ab Installation, Update-Installation über eine Vorversion.
  - Automatisiert: Maestro-Flows für Durchstich, Paywall-Freiheit (5.4) und Rundgänge aus M6/M7/M8; Unit-Tests in CI.
- **Abnahmekriterien:** Alle Prüfpunkte auf mindestens 3 Geräten bestanden, Protokoll in `docs/qa/`.

### M12 – Geschlossener Google-Play-Test (R1)

- **Aufgaben:**
  1. Play-Console-Konto. **[B/O]** Neue private Entwicklerkonten müssen nach den aktuellen Google-Vorgaben einen geschlossenen Test mit mindestens 12 Testern über 14 Tage durchführen, bevor Produktionszugang gewährt wird. Die genauen aktuellen Bedingungen vor Beginn in der Play Console prüfen.
  2. Paketname festlegen (**[O-14]**, z. B. `b.held.unimathe`; endgültig, nicht änderbar). Upload-Key und Play App Signing, EAS Build (`production`-Profil, AAB), Versionierung (`versionCode` automatisch).
  3. Store-Eintrag DE/EN: Titel, Kurzbeschreibung, Screenshots (Telefon, optional Tablet), Feature-Grafik, Kategorie Bildung, Inhaltsbewertung (IARC), Zielgruppe (**[O-15]**: keine Kinder unter 13, damit „Designed for Families“ nicht greift), Datensicherheit („keine Daten erhoben“, sofern kein Crash-Reporting; mit Crash-Reporting entsprechend angeben), Datenschutzerklärung-URL, „Enthält Werbung: Nein“, „In-App-Käufe: Nein“.
  4. Testergruppe einladen, Feedback-Kanal (Mail/Formular), Crash-Reporting (**[O-16]**: z. B. Sentry, Auswirkung auf die Datensicherheit-Angaben).
- **Abhängigkeiten:** M6–M8, M10, M11 (M9 nach O-2).
- **Abnahmekriterien:** Build über den geschlossenen Track installierbar. Vorgaben zu Testeranzahl und -dauer erfüllt. Keine Abstürze mit Nutzerwirkung im Pre-Launch-Report und in Android Vitals (ANR-Rate < 0,47 %, Absturzrate < 1,09 %). Alle Tester-Rückmeldungen mit Schweregrad „hoch“ sind behoben.

### M13 – Erster öffentlicher Release (R1)

- **Aufgaben:** Produktionszugang beantragen, gestaffelter Rollout (z. B. 20 % → 50 % → 100 %), Release Notes DE/EN, Überwachung von Vitals und Bewertungen in den ersten 7 Tagen.
- **Abnahmekriterien (Release-Gate):**
  1. **Nach einer frischen Installation sind alle enthaltenen Kurse, Übungen, Prüfungen und Lernkarten ohne Kauf zugänglich.** Nachweis: Maestro-Flow auf frischer Installation im Flugmodus erreicht für jedes der 48 Themen den letzten Lektionsschritt, für jede Aufgabe den letzten Lösungsschritt, für jede der 18 Klausuren Start und alle Lösungen sowie für jeden Lernkartenstapel die letzte Karte. Zusätzlich keine Billing-Permission im Merged Manifest und keine Kaufbegriffe in den UI-Texten.
  2. Der Durchstich (M5) funktioniert unverändert.
  3. Store-Einträge vollständig, Datenschutzerklärung erreichbar, Datensicherheit-Angaben stimmen mit dem Build überein.
  4. Content-Version (Swift-Commit) in den Einstellungen sichtbar und im Release-Tag dokumentiert.

### Später (S)

- DE/EN-Inhaltsgleichheit der Kernthemen (EN-Lektionen auf den DE-Stand bringen, inkl. Grafiken). Das ist Redaktionsarbeit und hilft auch iOS (O-5).
- Content-Repo (2.3 Stufe 2) und gemeinsame UI-Texte.
- Weitere echte Interaktionen in Grafiken (O-4).
- Ausbau der `check`-Daten auf mittlere und schwere Aufgaben.
- Tablet-Layouts (2-spaltig; iOS nutzt `horizontalSizeClass` an mehreren Stellen).
- Erinnerungen/Benachrichtigungen, Android-Widget „Weiterlernen“.
- Synchronisierung des Fortschritts zwischen Geräten (kein iOS-Gegenstück, nicht geplant).

---

## 6. Technische Risiken, vor dem Portieren vieler Screens zu prüfen

| ID | Risiko | Warum relevant (Befund) | Prüfung im Prototyp (M0) | Ausweichweg |
|---|---|---|---|---|
| R1 | Leistung und Höhenmessung vieler MathJax-WebViews auf Android | iOS nutzt einen WebView pro Textstück (`ExerciseDetailView.swift:34`, `ContentView.swift:981`). Android-WebViews sind schwerer als WKWebView mit gemeinsamem Prozesspool (`LaTeXView.swift:10`). | Messungen 1.6/M0.2–3 | Ein WebView pro Screen; Klartext-Vorschau in Listen; KaTeX; Vorrendern zu SVG beim Import |
| R2 | 120 Grafiken in SVG/Reanimated nachbauen | 6.164 Zeilen SwiftUI mit Animationen von Pfaden (`AnimatableGridShape`, `SkewGridShape`) | `shearMap` in M0, Aufwandsschätzung pro Grafik daraus ableiten | Skia (`@shopify/react-native-skia`) statt SVG bei Leistungsproblemen; Release-Reihenfolge (O-11) |
| R3 | Lokale Assets in der WebView (MathJax, Schriften) offline laden | iOS lädt per `baseURL` aus dem Bundle; auf Android unterscheiden sich `file:///android_asset` und Expo-Assets in Dev/Release | Release-Build im Flugmodus | MathJax inline in das HTML einbetten (größer, aber robust) |
| R4 | App-Größe | MathJax-Bundle 23 MB, Bilder 25 MB | AAB-Größe nach M0 | MathJax auf benötigte Komponenten reduzieren, WebP |
| R5 | Dateizuordnung über Titel und uneinheitliche Dateinamen | `ContentView.swift:804/1738`, `_fixed`, `_old` | Import-Skript bildet alle 48×2 Zuordnungen und meldet Lücken | manuelle Zuordnungstabelle im Import |
| R6 | Inhaltsfehler werden auf Android sichtbar | Klammerverlust in Zusammenfassungen (1.5), nur-deutsche Grafiktexte (1.8) | Validierungsbericht | Korrektur im Import-Overlay statt in den iOS-Dateien (O-6) |
| R7 | Fortschrittsschlüssel bei Inhaltsänderungen | Aufgaben-IDs nur pro Datei eindeutig, DE/EN-Lektionslängen verschieden | Schlüsselkonzept 2.5 mit Test (ID-Stabilität zwischen zwei Content-Versionen) | Mapping-Tabelle bei Umnummerierung |
| R8 | Anforderungen von Google Play an neue Konten | Pflicht-Testphase vor dem Produktionszugang | früh Konto anlegen und Tester gewinnen | – |

---

## 7. Offene Fragen

| ID | Frage | Vorschlag |
|---|---|---|
| O-1 | Für welche Aufgaben soll eine automatische Antwortprüfung entstehen, und wer pflegt die `check`-Daten? | Start mit dem Durchstich, dann `easy`-Aufgaben mit eindeutigem Ergebnis, Rest mit Selbsteinschätzung |
| O-2 | Gehören Lernkarten in den ersten Release? Wie viel Redaktion ist möglich? | Generieren aus `insight` + Merke-Schritten, kuratiert; sonst als Beta oder später |
| O-3 | Wann gilt „Übungen eines Themas“ im Lernplan als erledigt? | ≥ 50 % der Aufgaben bearbeitet oder manuell |
| O-4 | Sollen die Grafiken nur abgespielt werden (wie iOS) oder echte Interaktion bekommen? | 1:1 wie iOS, eine Interaktion (`shearMap`) im Durchstich als Test |
| O-5 | Sollen die EN-Lektionen der Kernthemen vor dem Release auf den DE-Stand gebracht werden? | Nein, später (S); im Store-Text keine falschen Versprechen zu EN-Grafiken |
| O-6 | Dürfen offensichtliche Inhaltsfehler (z. B. fehlende Klammern in Zusammenfassungen) für Android im Import korrigiert werden, bevor iOS sie korrigiert? | Ja, als Overlay im Android-Repo mit Rückmeldeliste an iOS |
| O-7 | Ist eine spätere Umstellung von iOS auf ein gemeinsames Content-Repo gewünscht? | Ja, nach dem Android-Release |
| O-8 | Welche Onboarding-Screens soll Android behalten? | Sprache, Theme, Klausurwahl, Themenschau, Schritt-für-Schritt-Demo, persönlicher Plan |
| O-9 | Schrift „Nexa Bold“ im Startseitentitel (`ContentView.swift:252`) ist nicht im Projekt; iOS fällt vermutlich auf die Systemschrift zurück. Was ist gewollt? | InterDisplay-Bold verwenden |
| O-10 | Klausur-Lernmodus „Lösungen erst nach Abgabe“? | Optionaler Schalter, Standard wie iOS (frei) |
| O-11 | Release erst, wenn alle 120 Grafiken portiert sind? | Ja (Ziel „möglichst genau“); sonst Fallback ohne Grafik |
| O-12 | Datenschutz/AGB: Die bestehenden Seiten beziehen sich auf iOS und Käufe. Braucht Android eigene Fassungen? | Eigene Android-Fassung ohne Kaufbezug |
| O-13 | Welche echten Android-Geräte stehen zum Testen zur Verfügung? | siehe Geräte-Matrix M11 |
| O-14 | Paketname und App-Name in Google Play („Höhere Mathematik“ wie im README oder „UniMathe“)? | `b.held.unimathe`, Name wie iOS-Store-Eintrag |
| O-15 | Zielgruppe in Google Play (Altersangabe) | 18+ bzw. Studierende, nicht für Kinder |
| O-16 | Crash-Reporting und Analyse ja/nein? | Crash-Reporting ja (ohne personenbezogene Daten), keine Analyse |
| O-17 | Welche Datei gilt bei `sets_and_mappings_beispiel.json` vs. `_fixed.json` und bei `complete_induction_beispiel.json` vs. `mathematical_induction_beispiel.json`? | Lader-Reihenfolge iOS übernehmen: die Datei ohne `_fixed` bzw. diejenige, die die Suchreihenfolge in `ContentView.swift:1803–1820` findet (`_fixed` nur, wenn die Hauptdatei fehlt) |

---

## 8. Die ersten drei Aufgaben für den Implementierungsstart

1. **Swift-Inhalte festschreiben und Import-Skript bauen.**
   Auf iOS-Seite den aktuellen Stand (Numerik-Dateien, Index-Änderungen) committen und den Commit-Hash notieren. Im Android-Repo `tools/import-content.ts` anlegen. Das Skript liest `lerninhalt`, `beispiele`, `aufgaben` und `klausuren` von diesem Commit, schreibt `assets/content/<lang>/<themen-id>/…`, erzeugt `manifest.json` mit Themen-IDs und Dateizuordnung und gibt einen Validierungsbericht aus (Schema, LaTeX-Balance, `visual`-Namen, DE/EN-Parität).
   *Fertig, wenn* der Bericht 48 Themen × 2 Sprachen, 1.360 Aufgaben pro Sprache und 18 Klausuren ohne Schemafehler ausweist und ein zweiter Lauf keinen Diff erzeugt.

2. **Expo-Projekt anlegen und Formel-Spike (R1, R3) durchführen.**
   Expo + TypeScript + Expo Router + Dev Build initialisieren, `react-native-webview` mit lokal gebündeltem MathJax 3 einrichten. Die Schritte 2, 13 und 30 aus `beispiele/de/lineare_abbildungen_beispiel.json` sowie die 30 Übungskarten aus `aufgaben/de/lineare_abbildungen.json` im Release-Build auf einem echten Gerät im Flugmodus rendern und messen.
   *Fertig, wenn* die Entscheidung (WebView-Strategie, MathJax vs. KaTeX, Listen-Darstellung) mit Messwerten in `docs/adr/0001-math-rendering.md` steht.

3. **Grafik-Spike `shearMap` (R2) und Design-Tokens.**
   `PlaneWindow`, `CoordinateGrid`, `Arrow`, `MathLabel`, `Dot` und `AnimatedFigure` mit react-native-svg + Reanimated nachbauen und `GridMapVisual` mit den `shearMap`-Parametern aus `Views/LessonVectorVisuals.swift:42–53` umsetzen, Bildunterschriften aus `captions.de.json`. Parallel `src/theme/tokens.ts` aus `SettingsModel.swift:182–214` und Inter-Schriften anlegen.
   *Fertig, wenn* die Animation auf dem Gerät mit 60 fps läuft, sich per Knopf wiederholen lässt und im Screenshot-Vergleich mit iOS (hell und dunkel) übereinstimmt. Aus dem Aufwand wird die Schätzung für die übrigen 119 Grafiken abgeleitet.
