# Bericht: Inhaltsimport aus dem SwiftUI-Projekt

Generiert von `tools/import-content.ts`. Quelle: `../../../Desktop/app/UniMatheApp/UniMathe/UniMathe`, Commit `08df1b3c05`, **mit 88 nicht committeten Änderungen in den Inhaltsordnern**, Inhalts-Hash `91d8107dbf86df5b`.

## Umfang

- Kurse: 5, Themen: 48, Lektionen: 96 (DE+EN)
- Lektionsschritte: DE 1172, EN 1166
- Übungen: DE 1360, EN 1360
- Klausuren: 18 mit 102 Aufgaben (je Sprache)
- Verwendete Grafiken: 120 verschiedene, 206 Verwendungen
- Stabile IDs in `tools/content-ids.lock.json`: 1462

## DE/EN-Parität pro Thema

Lektion: Schritte (davon mit Grafik). ⚠︎ = Lektionen unterscheiden sich.

| ID | Thema | Lektion DE | Lektion EN | Übungen DE / EN | |
|---|---|---|---|---|---|
| 0.1 | Zahlen & Rechengesetze | 15 (3) | 15 (3) | 24 / 24 | ✓ |
| 0.2 | Potenzen, Wurzeln & Logarithmen | 14 (2) | 14 (2) | 24 / 24 | ✓ |
| 0.3 | Terme & Umformungen | 14 (2) | 14 (2) | 24 / 24 | ✓ |
| 0.4 | Summen- & Produktzeichen | 13 (3) | 13 (3) | 24 / 24 | ✓ |
| 0.5 | Gleichungen | 15 (2) | 15 (2) | 24 / 24 | ✓ |
| 0.6 | Ungleichungen & Beträge | 12 (2) | 12 (2) | 24 / 24 | ✓ |
| 0.7 | Lineare Gleichungssysteme | 11 (1) | 11 (1) | 24 / 24 | ✓ |
| 0.8 | Funktionen: Grundbegriffe | 12 (3) | 12 (3) | 24 / 24 | ✓ |
| 0.9 | Polynome & rationale Funktionen | 12 (2) | 12 (2) | 24 / 24 | ✓ |
| 0.10 | e-Funktion & Logarithmus | 12 (1) | 12 (1) | 24 / 24 | ✓ |
| 0.11 | Trigonometrie | 12 (2) | 12 (2) | 24 / 24 | ✓ |
| 0.12 | Ableitungen & Kurvendiskussion | 13 (3) | 13 (3) | 24 / 24 | ✓ |
| 0.13 | Integrale & Stammfunktionen | 12 (2) | 12 (2) | 24 / 24 | ✓ |
| 0.14 | Vektoren & Geometrie | 11 (2) | 11 (2) | 24 / 24 | ✓ |
| 0.15 | Mathematische Sprache & Beweise | 13 (2) | 13 (2) | 24 / 24 | ✓ |
| 1.1 | Mengen und Abbildungen | 37 (10) | 23 (0) | 42 / 42 | ⚠︎ |
| 1.2 | Logik | 24 (3) | 29 (0) | 35 / 35 | ⚠︎ |
| 1.3 | Vollständige Induktion | 22 (2) | 29 (0) | 37 / 37 | ⚠︎ |
| 1.4 | Binomische Formeln | 17 (2) | 1 (0) | 35 / 35 | ⚠︎ |
| 1.5 | Größter gemeinsamer Teiler | 18 (1) | 29 (0) | 36 / 36 | ⚠︎ |
| 1.6 | Gruppen | 19 (2) | 29 (0) | 42 / 42 | ⚠︎ |
| 1.7 | Ringe | 17 (1) | 29 (0) | 41 / 41 | ⚠︎ |
| 1.8 | Körper | 19 (2) | 38 (0) | 36 / 36 | ⚠︎ |
| 1.9 | Komplexe Zahlen | 20 (3) | 16 (0) | 33 / 33 | ⚠︎ |
| 2.1 | Folgen und Reihen | 29 (3) | 29 (0) | 33 / 33 | ⚠︎ |
| 2.2 | Grenzwerte | 23 (3) | 29 (0) | 31 / 31 | ⚠︎ |
| 2.3 | Differentialrechnung | 27 (5) | 30 (0) | 33 / 33 | ⚠︎ |
| 2.4 | Integralrechnung | 27 (4) | 29 (0) | 38 / 38 | ⚠︎ |
| 2.5 | Mehrdimensionale Analysis | 27 (4) | 29 (0) | 37 / 37 | ⚠︎ |
| 3.1 | Vektorräume | 45 (6) | 25 (0) | 31 / 31 | ⚠︎ |
| 3.2 | Matrizen | 37 (4) | 35 (0) | 33 / 33 | ⚠︎ |
| 3.3 | Lineare Abbildungen | 35 (6) | 25 (0) | 30 / 30 | ⚠︎ |
| 3.4 | Determinanten | 28 (6) | 25 (0) | 31 / 31 | ⚠︎ |
| 3.5 | Eigenwerte und Eigenvektoren | 39 (7) | 25 (0) | 30 / 30 | ⚠︎ |
| 4.1 | Gleitkommazahlen & Rundungsfehler | 48 (4) | 48 (4) | 24 / 24 | ✓ |
| 4.2 | Kondition & Stabilität | 40 (4) | 40 (4) | 24 / 24 | ✓ |
| 4.3 | Gauß-Elimination & LR-Zerlegung | 38 (3) | 38 (3) | 24 / 24 | ✓ |
| 4.4 | Normen & Matrixkondition | 33 (3) | 33 (3) | 24 / 24 | ✓ |
| 4.5 | Ausgleichsrechnung & QR-Zerlegung | 35 (3) | 35 (3) | 24 / 24 | ✓ |
| 4.6 | Iterative Löser für LGS | 35 (2) | 35 (2) | 24 / 24 | ✓ |
| 4.7 | Nullstellenverfahren | 33 (3) | 33 (3) | 24 / 24 | ✓ |
| 4.8 | Newton-Verfahren für Systeme | 32 (1) | 32 (1) | 24 / 24 | ✓ |
| 4.9 | Polynominterpolation | 31 (2) | 31 (2) | 24 / 24 | ✓ |
| 4.10 | Spline-Interpolation | 29 (1) | 29 (1) | 24 / 24 | ✓ |
| 4.11 | Numerische Integration | 30 (2) | 30 (2) | 24 / 24 | ✓ |
| 4.12 | Eigenwerte numerisch | 29 (2) | 29 (2) | 24 / 24 | ✓ |
| 4.13 | Einschrittverfahren für DGL | 31 (2) | 31 (2) | 24 / 24 | ✓ |
| 4.14 | Steife DGL & Mehrschrittverfahren | 27 (2) | 27 (2) | 24 / 24 | ✓ |

## LaTeX-Auffälligkeiten

- Steuerzeichen: 2
- \( \) unausgeglichen: 2

## Weitere Hinweise

- iOS-Abweichung: Für 1.3 „Complete Induction“ (EN) findet iOS keine Übungsdatei; Android nutzt den deutschen Dateistamm „vollstaendige_induktion“.
- LaTeX (Steuerzeichen): aufgaben/de/vektorraeume.json #27 Schritt 5
- LaTeX (Steuerzeichen): aufgaben/en/vektorraeume_en.json #27 Schritt 5
- LaTeX (\( \) unausgeglichen): aufgaben/de/determinanten.json #22 Schritt 3
- LaTeX (\( \) unausgeglichen): aufgaben/en/determinanten_en.json #22 Schritt 3

## Grafiken (Name: Verwendungen)

`absDistance`: 2 · `backSubstitution`: 2 · `balanceScale`: 2 · `basisChange`: 2 · `basisCoordinates`: 1 · `binomialDifference`: 1 · `binomialSquare`: 1 · `bisectionInterval`: 2 · `cancellationDigits`: 2 · `cartesianProduct`: 1 · `charPolyCollapse`: 1 · `clockF5`: 1 · `clockZ12`: 1 · `clockZ6`: 1 · `cobwebFixedPoint`: 2 · `completingSquare`: 2 · `complexMultiplication`: 1 · `complexOperations`: 1 · `composition`: 1 · `continuityTypes`: 1 · `contourGradient`: 3 · `criticalPoints`: 1 · `curveSketching`: 2 · `deMorgan`: 1 · `derivativeGraph`: 3 · `detArea`: 1 · `detRules`: 1 · `differenceQuotientError`: 2 · `distributiveArea`: 2 · `dominoes`: 3 · `dotProduct`: 4 · `eigenMap`: 1 · `eigenSearch`: 1 · `eigenvalueScaling`: 1 · `eliminationSweep`: 2 · `euclidRectangle`: 1 · `eulerSteps`: 2 · `eulerTangent`: 2 · `evenOddSymmetry`: 2 · `fieldInverses`: 1 · `floatNumberLine`: 2 · `fractionAddition`: 2 · `functionTransform`: 2 · `fundamentalTheorem`: 3 · `gaussSum`: 3 · `geometricSeries`: 1 · `gershgorinDiscs`: 2 · `householderReflection`: 2 · `ieeeLayout`: 2 · `illConditionedLines`: 2 · `implicationSets`: 1 · `implicationTable`: 3 · `improperIntegral`: 1 · `inequalityFlip`: 2 · `injSurj`: 1 · `intervalLine`: 2 · `inverseMap`: 1 · `inverseReflection`: 2 · `jacobiZigzag`: 2 · `kernelImage`: 1 · `lagrange`: 1 · `lagrangeBasis`: 2 · `leastSquaresFit`: 2 · `linearCombination`: 1 · `linearDependence`: 1 · `linearityCheck`: 1 · `linearSystemLines`: 2 · `logInverse`: 2 · `mapCheck`: 1 · `matrixOrder`: 3 · `matrixTimesVector`: 1 · `matrixTransform`: 1 · `meanValue`: 1 · `modClasses`: 1 · `newton`: 3 · `newton2D`: 2 · `normUnitBalls`: 2 · `numberSets`: 2 · `pivotSwap`: 2 · `polarArea`: 1 · `polynomialRoots`: 2 · `powerIteration`: 3 · `powerRules`: 2 · `powerSet`: 1 · `preimage`: 1 · `quadraticRoots`: 2 · `quantifierOrder`: 1 · `rationalAsymptotes`: 2 · `recursionBlowup`: 2 · `reflectionMap`: 2 · `removableHole`: 1 · `riemannSums`: 5 · `rootsOfUnity`: 1 · `rungeKuttaStages`: 2 · `rungePhenomenon`: 2 · `secantToTangent`: 5 · `sequenceConvergence`: 1 · `seriesComparison`: 1 · `shearEigen`: 1 · `shearMap`: 2 · `sigmaUnroll`: 2 · `signedArea`: 1 · `sineUnwrap`: 2 · `singularMatrix`: 2 · `spanGrowth`: 1 · `splinePieces`: 2 · `squeeze`: 1 · `stabilityRegions`: 2 · `stiffExplosion`: 2 · `subspaceClosure`: 1 · `subtractionZoom`: 2 · `swallowedSummand`: 2 · `taylorSine`: 1 · `telescopeSum`: 2 · `trapezoidVsSimpson`: 2 · `triangleSymmetries`: 1 · `unitCircle`: 2 · `unitCircleImage`: 2 · `vectorAddition`: 3 · `vennOperations`: 1
