# App Gold – Modularisierung V46

Stand: 1. September 2026

## Ziel

App Gold wird nicht neu gebaut. Der vorhandene Funktionsstand bleibt erhalten, wird aber schrittweise in klar abgegrenzte Module überführt. Änderungen sollen künftig nur das fachlich betroffene Modul berühren und keine unerwarteten Seiteneffekte in anderen Bereichen verursachen.

## Verbindliche Architekturregel

Ein Modul darf ein anderes Modul nicht mehr durch nachträgliche DOM-Manipulationen umbauen. Neue Funktionen werden über definierte Komponenten, Props, Hooks oder Services angebunden. Globale „Enhancer“, die bestehende Oberfläche nach dem Rendern verändern, werden schrittweise abgebaut.

## Zielmodule

1. navigation – Öffnen/Schließen, Zurück, Hauptnavigation, mobile Zustände
2. language – Oberflächensprache, Ausgabesprache, Flaggen, Übersetzungszustand
3. public – Startseite, Problem-Navigator, Fallarten, Preise
4. testing – Testerfreigabe, Testmodus, Testhinweise
5. auth – Login, Registrierung, Passwort, Session
6. cases – Fälle, Kunden, Fristen, Timeline, Bewertungen
7. documents – Upload, Kamera, Erkennung, Analyse, Export
8. billing – Tarife, Upgrade, Promo-Code, Laufzeiten, Zahlung
9. compliance – Datenschutz, Rechtstexte, RDG-Schutz, Audit
10. integrations – E-Mail, Cloud, Supabase und externe Dienste

## Phase 1 – Navigation und Sprache

Umgesetzt auf Branch `v46-navigation-clean`:

- neues Modul `app/modules/language/LanguageSwitcher.js`
- bestehender Importpfad `app/components/LanguageSwitcher.js` dient nur noch als kompatibler Re-Export
- genau ein Sprachmenü mit genau einem Zurück-/Schließen-Element
- Schließen über lokalen React-State; keine Browser-History-Manipulation
- Schließen zusätzlich über Klick außerhalb und Escape
- alter V43-Sichtbarkeits-Overlay wird in der Modularisierungs-Branch nicht mehr geladen
- Live-/Main-Stand bleibt bis zur Abnahme unangetastet

## Nächste Phasen

Phase 2: V44-Sprachreihenfolge ohne DOM-Umbau direkt in eine echte Header-/LanguageControls-Komponente überführen.

Phase 3: Öffentliche Startseite aus `app/page.js` in PublicHero, ProblemNavigator, CaseDiscovery und Pricing trennen.

Phase 4: Geschützten Arbeitsbereich in Dashboard, Cases, Clients, Documents, Approvals und AccountControl zerlegen.

Phase 5: Services für Supabase, Export, Analyse und Integrationen aus UI-Dateien herausziehen.

## Freigaberegel

Kein Modularisierungsschritt geht direkt auf `main`. Erst Build, mobile Prüfung, Navigationstest und Abnahme. Der Testerzugang bleibt bis zur bestätigten Stabilität geschlossen.
