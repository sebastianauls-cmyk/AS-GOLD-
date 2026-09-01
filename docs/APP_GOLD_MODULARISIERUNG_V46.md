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
- alte V44-DOM-Nachrüstlogik ist entfernt; Oberflächensprache steht in natürlicher React-Reihenfolge vor der Ausgabesprache
- `app/modules/navigation/AccessibilityHardening.js` und `MobileResilience.js` sind aktive Navigationsmodule und werden direkt im Root-Layout geladen
- Live-/Main-Stand bleibt bis zur Abnahme unangetastet

## Weitere bereits modularisierte Bereiche

- `auth`: Passwortregeln und Passwort-UI liegen im Modul `app/modules/auth/PasswordPolicy.js`.
- `cases` / `documents`: V24/V25/V26-Kernimplementierungen wurden in Fachmodule überführt; alte Komponentenpfade bleiben vorläufig als kompatible Adapter bestehen.
- `pricing`: Promo-Code-UI liegt in `app/modules/pricing/PromoCodeControl.js`.
- `compliance`: LegalDocument, LegalFooter und PrivacyControls liegen unter `app/modules/compliance/`.
- `integrations`: Die Integrationsseite wird durch `app/modules/integrations/IntegrationHub.js` gerendert. Nicht konfigurierte OAuth-Anbieter werden direkt im React-Renderzustand als deaktiviert dargestellt. Der frühere globale `V38IntegrationAvailabilityGuard` mit nachträglichen DOM-Patches wurde gelöscht.
- `tester`: Testerzugang bleibt über das Tester-Modul geschlossen.

## Noch offene Kernarbeiten

1. `V45OutputLanguageBridge` vollständig entfernen. Die Ausgabesprache muss explizit an OCR-/Analyse- und Exportservices übergeben werden, statt global `window.fetch` abzufangen und das DOM zu pollen.
2. Öffentliche Startseite aus `app/page.js` in PublicHero, ProblemNavigator, CaseDiscovery und Pricing trennen.
3. Geschützten Arbeitsbereich in Dashboard, Cases, Clients, Documents, Approvals und AccountControl zerlegen.
4. Verbliebene Public-/Case-Enhancer, die gerendertes DOM dekorieren, durch direkte Komponentenstruktur ersetzen oder klaren Fachmodulen zuordnen.
5. Services für Supabase, Export, Analyse und Integrationen aus UI-Dateien herausziehen.

## Prüfstatus

Der aktuelle V46-Branch-Stand wurde nach der Navigation-/Integrations-Migration erneut als Vercel Preview gebaut und ist `READY`. Die Regressionstests für mobile Resilienz, Accessibility und Integrationsverfügbarkeit wurden auf die neuen Modulgrenzen umgestellt. Frühere Zwischen-Builds während sequenzieller Dateiänderungen sind nicht freigaberelevant; maßgeblich ist der vollständige aktuelle Branch-Commit.

## Freigaberegel

Kein Modularisierungsschritt geht direkt auf `main`. Erst Build, mobile Prüfung, Navigationstest und vollständige Abnahme. Der Testerzugang bleibt bis zur bestätigten Stabilität geschlossen. Eine Übernahme auf `main` erfolgt erst, wenn alle Kernmodule getrennt sind, die verbliebenen globalen Korrekturschichten entfernt oder bewusst begründet sind und die komplette Build-/Regressionskette ohne Fehler durchläuft.
