# App Gold – Modularisierung V46

Stand: 1. September 2026

## Ziel

App Gold wird nicht neu gebaut. Der vorhandene Funktionsstand bleibt erhalten, wird aber schrittweise in klar abgegrenzte Module überführt. Änderungen sollen künftig nur das fachlich betroffene Modul berühren und keine unerwarteten Seiteneffekte in anderen Bereichen verursachen.

## Verbindliche Architekturregel

Ein Modul darf ein anderes Modul nicht mehr durch nachträgliche DOM-Manipulationen umbauen. Neue Funktionen werden über definierte Komponenten, Props, Hooks oder Services angebunden. Globale „Enhancer“, die bestehende Oberfläche nach dem Rendern verändern, werden schrittweise abgebaut. Kompatibilitäts-Re-Exports unter `app/components/` sind nur Übergangsadapter; die Fachimplementierung liegt im jeweiligen Modul.

## Zielmodule

1. `navigation` – Öffnen/Schließen, Zurück, Hauptnavigation, mobile Zustände
2. `language` – Oberflächensprache, Ausgabesprache, Flaggen, Übersetzungszustand
3. `public` – Startseite, Problem-Navigator, Fallarten, Preise
4. `tester` – Testerfreigabe, Testmodus, Testhinweise
5. `auth` – Login, Registrierung, Passwort, Session
6. `cases` – Fälle, Kunden, Fristen, Timeline, Bewertungen, Freigaben
7. `documents` – Upload, Kamera, Erkennung, Analyse, Export
8. `pricing` – Tarife, Upgrade, Promo-Code, Laufzeiten, Zahlung
9. `compliance` – Datenschutz, Rechtstexte, RDG-Schutz, Audit
10. `integrations` – E-Mail, Cloud und externe Dienste
11. `services` – Supabase, Analyse- und Exportservices ohne Darstellungslogik

## Umgesetzter Stand auf `v46-navigation-clean`

### Navigation und Sprache

- `app/modules/language/LanguageSwitcher.js` ist die führende Implementierung.
- Der bisherige Pfad `app/components/LanguageSwitcher.js` ist nur noch ein kompatibler Re-Export.
- Das Sprachmenü besitzt genau ein Zurück-/Schließen-Element.
- Schließen erfolgt über lokalen React-State sowie Klick außerhalb oder Escape; Browser-History wird dafür nicht verwendet.
- Die frühere V43-Zusatzleiste und die V44-DOM-Nachrüstlogik werden nicht mehr geladen und wurden aus der Entwicklungs-Branch entfernt.
- `AccessibilityHardening` und `MobileResilience` liegen unter `app/modules/navigation/` und werden direkt aus diesem Modul geladen.
- Erklärvideo und alle zehn Sprachvarianten bleiben im Language/Public-Modul erhalten.
- `LegalLanguageContext` besitzt jetzt ebenfalls einen führenden Modulpfad unter `app/modules/language/`.

### Ausgabesprache

- Zustand, Normalisierung und Payload-Erweiterung liegen zentral in `app/modules/language/outputLanguage.js`.
- Die V45-Bridge wurde als `OutputLanguageBridge` in das Language-Modul verschoben; der alte Komponentenpfad ist nur noch ein Adapter.
- Die Regressionstests prüfen jetzt die Modulimplementierung statt der alten Datei.
- Die globale window.fetch-Interception ist entfernt. Die Ausgabesprache wird jetzt explizit aus WorkspaceApp an app/modules/services/documentAnalysis.js und von dort als output_language an gold-ocr-v28 übergeben. Der alte Bridge-Pfad bleibt nur als wirkungslose Kompatibilitätshülle bestehen.

### Fälle und Dokumentintelligenz

- V24/V25/V26-Kernbereiche wurden bereits Fachmodulen zugeordnet.
- V38 Assessment, Fristenwarnung und nächster Schritt sowie V39 Timeline, V40 Übergabe, V41 Konsistenz und V42 Aufgaben liegen vollständig unter `app/modules/cases/`.
- Die alten V38–V42 Komponentenpfade sind nur noch Re-Export-Adapter; doppelte Implementierung wurde entfernt.
- Die zugehörigen Fach-Engines werden über `app/modules/lib/` an die Case-Module angebunden, ohne vorhandene Logik zu duplizieren.
- Regressionstests prüfen nun die Modulpfade und gleichzeitig die Rückwärtskompatibilität der alten Imports.

### Öffentliche Oberfläche

- Hero-Titel, Hero-Copy, ProblemNavigator, ProductIntro, FirstAction, CaseChoice und ExplainerVideo liegen unter `app/modules/public/`.
- Die alten Komponentenpfade werden schrittweise auf reine Re-Exports reduziert; die Hero-Copy wurde ebenfalls auf diesen Adapterstandard umgestellt.
- Noch offen: die verbleibenden Public-Enhancer nicht nur fachlich zuzuordnen, sondern direkt in die Seitenstruktur zu überführen, sobald `app/page.js` zerlegt wird.

### Auth, Pricing, Compliance, Integrationen und Tester

- Passwortregeln/-UI liegen unter `app/modules/auth/`.
- Promo-Code-UI liegt unter `app/modules/pricing/`.
- LegalDocument, LegalFooter und PrivacyControls liegen unter `app/modules/compliance/`.
- `IntegrationHub` und Integration-Tokens liegen unter `app/modules/integrations/`; der frühere globale V38-Integrations-DOM-Guard wurde entfernt.
- Nicht konfigurierte OAuth-Anbieter werden direkt im React-Renderzustand deaktiviert dargestellt.
- Der öffentliche Testerzugang bleibt im Modul `app/modules/tester/TesterPaused.js` geschlossen und enthält keinen Test-Startlink.

## Technische Sicherung

Neu hinzugekommen ist `scripts/test_v46_modular_boundaries.mjs`. Dieser Guard läuft in der normalen `prebuild`-Kette und prüft unter anderem:

- Vorhandensein der zentralen Fachmodule,
- keine V43-/V44-/alte Integrationskorrekturschicht im Root-Layout,
- genau ein sichtbares Zurück-/Schließen-Element im Sprachmenü,
- keine Browser-History-Manipulation im Sprachumschalter,
- Testerzugang weiterhin geschlossen,
- wichtige alte Komponentenpfade sind echte Kompatibilitätsadapter auf die Modulimplementierung.

Mehrere vollständige Vercel-Preview-Builds der Branch sind nach den bisherigen Umbauten erfolgreich mit Status `READY` durchgelaufen. Zwischenfehler wurden ausschließlich auf der Entwicklungs-Branch korrigiert; `main` blieb unverändert.

## Verbleibende Kernarbeiten vor Freigabe

1. Den geschützten Workspace weiter in Dashboard, Cases, Clients, Documents, Approvals, Pricing und AccountControl aufteilen.
2. Verbliebene Public-/Case-Enhancer, die gerendertes DOM dekorieren, durch direkte Komponentenstruktur ersetzen.
3. Weitere Supabase-, Daten- und Exportzugriffe aus WorkspaceApp hinter Fachservices verschieben; der gemeinsame Supabase-Client und die Dokumentanalyse sind bereits ausgelagert.
4. Den öffentlichen, Auth- und geschützten Workspace als getrennte Kompositionsflächen aus WorkspaceApp herauslösen.
5. Abschließenden vollständigen Build-, Mobil-, Accessibility-, Navigations- und Funktions-Smoketest durchführen.

## Freigaberegel

Kein Modularisierungsschritt geht direkt auf `main`. Erst wenn alle Kernmodule getrennt sind, die verbliebenen globalen Korrekturschichten entfernt oder bewusst begründet sind und die komplette Build-/Regressionskette ohne Fehler durchläuft, darf der Stand kontrolliert auf `main` übernommen werden. Der Testerzugang bleibt bis dahin geschlossen.


### V46 Dokumentmodul – Upload-Konfiguration

- Die Upload-Konfiguration wurde aus WorkspaceApp herausgelöst und liegt führend unter app/modules/documents/uploadConfig.js.
- Dateigrenze, unterstützte Dateiendungen, Accept-Liste und lokalisierte Upload-Hinweise besitzen damit eine eindeutige fachliche Zuständigkeit im Dokumentmodul.
- WorkspaceApp konsumiert diese Werte nur noch über die Modulgrenze.
- Die End-to-End-, Prelaunch-, Praxis-Simulations- und V46-Modulguards wurden auf die neue Zuständigkeit umgestellt.


### V46 Statische Workspace-Kataloge

- Passwort-UI-Texte liegen unter app/modules/auth/passwordUi.js.
- Öffentliche Oberflächentexte liegen unter app/modules/public/publicUi.js.
- Exporttexte liegen unter app/modules/documents/exportUi.js.
- Die umfangreichen geschützten Workspace-Texte liegen unter app/modules/workspace/workspaceText.js.
- WorkspaceApp importiert die Kataloge nur noch über die jeweiligen Fachgrenzen und enthält keine führenden Kopien mehr.


### V46 Fachkataloge aus WorkspaceApp

- Preis- und Tarifdefinitionen liegen unter `app/modules/pricing/catalog.js`.
- Öffentliche Discovery-/Transparenz-/Testertexte liegen unter `app/modules/public/catalog.js`.
- Compliance- und Audit-/Löschtexte liegen unter `app/modules/compliance/workspaceControlText.js`.
- Initiale Workspace-Zustände liegen unter `app/modules/workspace/stateConfig.js`.
- `WorkspaceApp.js` importiert diese Kataloge nur noch und besitzt keine parallelen Inline-Kopien mehr.


### V46 Workspace-Shell

- `auth/PasswordField.js` besitzt das wiederverwendbare Passwortfeld.
- `workspace/AppLogo.js` besitzt die gemeinsame AS-Gold-Logo-Komponente.
- `workspace/ProtectedWorkspaceShell.js` besitzt Header, Sprach-/Ausgabesprachen-Steuerung, Logout-Rahmen, Nachrichtenfläche und Footer des geschützten Bereichs.
- `WorkspaceApp.js` übergibt nur noch Zustand und Handler an die Shell statt deren Markup selbst zu duplizieren.


### V46 Auth-Oberfläche

- `auth/AuthSurface.js` besitzt jetzt die vollständige Login-/Registrierungsoberfläche.
- `WorkspaceApp.js` hält weiterhin den Auth-Zustand und die Auth-Handler, rendert die Formulare aber nicht mehr selbst.
- Passwortfeld, Passwortregeln, Sprachwahl, Rechtseinwilligung und Footer werden innerhalb der Auth-Modulgrenze komponiert.
- V37-End-to-End- und Readiness-Guards verfolgen den Auth-spezifischen Zurück-Pfad jetzt bis in das Auth-Modul statt ihn fälschlich im Workspace-Controller zu verlangen.


### V46 Einheitliche Workspace-Shell

- `workspace/ProtectedWorkspaceShell.js` ist die einzige Quelle für den geschützten App-Header, Oberflächen-/Ausgabesprache, Logout, globale Nachricht und Footer.
- Der bisherige zweite Header/Footer-Pfad im allgemeinen App-Rendering wurde entfernt; alle geschützten Ansichten laufen durch dieselbe Shell.
- `workspace/LoadingSurface.js` besitzt den Ladebildschirm separat.
- Damit können Navigations- und Sprachänderungen nicht mehr versehentlich nur einen von zwei parallelen App-Rahmen verändern.


### V46 Öffentliche Oberfläche

- `public/PublicLanding.js` besitzt jetzt die komplette öffentliche Start-, Fallarten-, Transparenz- und Preisoberfläche.
- `WorkspaceApp.js` liefert nur noch Zustand, abgeleitete Daten und Aktionen an diese Oberfläche.
- Sprache, Ausgabesprache und Footer werden in der öffentlichen Modulgrenze direkt aus den kanonischen Sprach-/Compliance-Modulen komponiert.
- Öffentliche Markup-Änderungen können damit unabhängig von Authentifizierung und geschütztem Workspace erfolgen.
- V37-End-to-End- und Readiness-Guards folgen Registrierungs-/Login-Routen jetzt bis in das Public-Modul.


### V46 Direkte Public-Interaktionen

- Hero-Titel und Hero-Lead werden direkt von `PublicLanding.js` aus fachlichen Sprachkatalogen gerendert; MutationObserver-/querySelector-Korrekturen sind dort nicht mehr aktiv.
- Der ausführliche Zielgruppenblock wird direkt als React-Markup in der öffentlichen Oberfläche gerendert.
- Die Auswahl einer Fallart löst die Navigation zum Ergebnis direkt im React-onClick aus. Ein globaler document-click-Listener ist nicht mehr erforderlich.
- `HeroCopyEnhancer`, `HeroTitleStabilizer` und `CaseChoiceJumpEnhancer` bleiben nur als wirkungslose Kompatibilitätshüllen bzw. Katalogzugänge erhalten und werden nicht mehr im Root-Layout gemountet.
- Regression- und Modulgrenzen-Tests erzwingen, dass diese drei Bereiche nicht wieder als globale DOM-Nachrüstungen eingeführt werden.


### V46 Public-Module direkt eingebettet

- `V37FirstAction`, `ProblemNavigator`, `ExplainerVideo` und `ProductIntroCompact` werden direkt von `PublicLanding.js` gerendert.
- Die vier Komponenten benötigen keine `createPortal`-Slots, keine `MutationObserver` und keine dynamisch erzeugten DOM-Container mehr.
- Sprache wird als React-Prop weitergegeben statt über Beobachter auf `document.documentElement.lang` synchronisiert.
- Der Problem-Navigator wechselt Fallart und Registrierung über explizite Callback-Props; Preis- und Ergebnisnavigation bleiben lokale, nutzerinitiierte Scroll-Aktionen.
- Das Root-Layout enthält damit keine Public-Hero-Portalmodule mehr.
- Regressionstests prüfen die direkte Reihenfolge und verhindern die Rückkehr globaler Mount-Observer.


### V46 Dashboard, Tarif und Kontosteuerung getrennt

- Das Dashboard rendert nur noch Übersicht, Schnellaktionen, Empfehlung und Bereichsnavigation.
- Tarif-/Upgrade-Funktionen besitzen mit `pricing/PricingSurface.js` eine eigene geschützte Oberfläche.
- Konto-, Audit-, Datenexport- und Löschsteuerung besitzen mit `compliance/AccountSurface.js` eine eigene geschützte Oberfläche.
- `WorkspaceApp.js` routet die beiden Bereiche explizit über `section='pricing'` und `section='account'`; das Dashboard importiert deren Fachkomponenten nicht mehr.
- Dadurch können Tarif- und Compliance-Änderungen unabhängig vom Dashboard umgesetzt werden.


### V46 Direkte Fall-Abschlussmodule V40–V42

- Professionelle Übergabe, Fall-Konsistenz/Nachweise und konkrete Lücken-Aufgaben werden direkt in CaseDetail gerendert.
- Die drei globalen Komponenten V40ProfessionalHandoff, V41CaseConsistency und V42ActionableGaps sind aus app/layout.js entfernt.
- V41 verwendet die bereits geladenen Fall-, Dokument- und Bewertungsdaten und erzeugt keine zweite Supabase-Abfrage mehr.
- V42 erhält explizite React-Callbacks für Fallbearbeitung, Dokumentupload, Dokumentprüfung und Bewertung statt querySelector-/Click-Weiterleitung.
- V40 behält lokale PDF-/DOCX-Exporte, ohne MutationObserver oder nachträgliche UI-Montage.
- Die alten Modulpfade bleiben nur als dünne Kompatibilitäts-Re-Exports erhalten.


### V46 Public-Parität V59–V69 direkt modularisiert

- Die aktuelle öffentliche Zwei-Sprachen-Logik ist in die Modularchitektur übernommen: Oberflächensprache und Kunden-/Ausgabesprache bleiben unabhängig; alle öffentlichen Kundeninhalte folgen der Ausgabesprache.
- Der warme Willkommensgruß und ein eigenständiger zweisprachiger Deutsch-Reset stehen vor den beiden Sprachmodulen. Der Reset stellt Oberfläche und Ausgabe gemeinsam auf Deutsch zurück.
- Der Startablauf ist nun direkt als React-Struktur aufgebaut: Erklärung → Funktionsablauf → Startart → Problem-/Spracheingabe. Es gibt keinen nachträglich erzeugten Customer-Slot.
- Der Mikrofonstart wird über explizite React-Callbacks/Signals an den Problem-Navigator übergeben; keine querySelector-/Click-Weiterleitung ist dafür nötig.
- „Wie möchten Sie starten?“ und „Worum geht es?“ sind in allen zehn Sprachen getrennte Überschriften.
- Die ausführliche „Was ist AS Gold?“-Erklärung und der vierstufige Ablauf liegen als Public-Fachkatalog im Modul.
- Die doppelte Zielgruppenüberschrift wurde direkt im PublicLanding entfernt.
- Ein eigener V69-Modulguard ist Bestandteil der verpflichtenden prebuild-Kette.


### V70 Tester-Sharing modular vorbereitet

- Der aktuelle V70-Teilen-Flow ist als app/modules/tester/TesterShareButton.js mit zehn Sprachvarianten modular vorbereitet.
- Der frühere app/components-Pfad ist nur ein Kompatibilitäts-Re-Export.
- TesterGuide enthält den V70-Teilen-, WhatsApp-, Musterfall- und Feedback-Flow, ist aber noch nicht öffentlich geroutet.
- app/testen/page.js rendert bis zum finalen Release-Gate ausdrücklich TesterPaused.
- Ein eigener V70-Staging-Guard verhindert eine versehentliche vorzeitige Testerfreigabe.


## Controller-Orchestrierung: Auth, Tarife und Konto delegiert

Der aktive Workspace-Controller delegiert nun zusätzlich Login/Registrierung/Workspace-Bootstrap an `auth/workspaceAuthWorkflow.js`, Angebots-/Promo-/Upgrade-Sequenzen an `pricing/pricingWorkflow.js` und Datenschutz-/Löschabläufe an `compliance/accountWorkflow.js`. Damit verbleiben in `WorkspaceAppV2.js` primär Screen-State, Auswahlzustände und die Komposition der Domain-Surfaces. Direkte Repository-Aufrufe für diese drei Abläufe wurden aus dem Controller entfernt. Der Testerzugang bleibt während der verbleibenden Release-Prüfungen geschlossen.
