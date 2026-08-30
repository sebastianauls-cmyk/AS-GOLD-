# AS Gold V24 – Implementierungsstand

Stand: 30. August 2026

V24 ist ein interner Vorschauzweig auf Basis der freigegebenen V23-Definition.
Die produktive Version, die Live-Datenbankstruktur und Zahlungen bleiben bis zu
einer ausdrücklich dokumentierten Freigabe unverändert.

## In dieser Ausbaustufe umgesetzt

- mobile Schnellaktionen für neue Fälle, Scan, Upload, Kunden, Fristen und Freigaben
- Fallanlage und -bearbeitung mit Kunde, Ziel, Sachstand, Frist und nächstem Schritt
- Fallakte mit Quellenbasis und klarer Kennzeichnung fehlender Bewertungsgrundlagen
- dokumentierbare Ampelbewertung mit Begründung und nächstem Schritt
- Kamera- oder Dateiupload mit Fallzuordnung, Dokumenttyp und Dokumentdatum
- korrigierbare Dokumentdaten, ausgelesener Inhalt, Zusammenfassung und nächster Schritt
- automatische lokale Textübernahme ausschließlich für kleine TXT- und CSV-Dateien
- Eigentümerfilter im Client zusätzlich zu bestehenden RLS-Richtlinien
- vollständiger Datenexport einschließlich Bewertungen und Quellenstatus
- Bereinigung ausgewählter Fall-/Dokumentdaten beim Abmelden

## Bewusst noch nicht behauptet oder aktiviert

- keine automatische OCR für Bilder, PDF- oder Office-Dateien
- keine KI-Bewertung ohne freigegebene, geschützte Verarbeitungspipeline
- keine automatische rechtliche oder fachliche Endentscheidung
- keine Live-Zahlung und keine automatische Vertragsverlängerung
- keine Produktionsfreigabe oder externe Pilotnutzung

## Vorbereitete, noch nicht angewendete Datenbankänderungen

- reproduzierbare V24-Fall- und Dokumentfelder samt Fristenindex
- Integritätsprüfung gegen fall-/kundenübergreifende Fremdverknüpfungen
- zusätzliche RLS-Härtung für drei interne Konfigurationstabellen

Diese Migrationen werden erst nach einer getrennten Datenbankprüfung und
Freigabe auf die Live-Umgebung angewendet.

## Nächste Freigabestufen

1. geschützte Dokumentverarbeitung mit nachvollziehbaren Quellen und Fehlerzuständen
2. End-to-End-Test mit freigegebenem Testkonto und Testdokumenten
3. Sicherheits- und Datenschutzfreigabe der vorbereiteten Migrationen
4. physischer Mobiltest auf dem freigegebenen Android-Testgerät
5. dokumentiertes Go/No-Go vor jeder Produktionsänderung

## Nichtproduktive Preview-Verifizierung

Geprüft am 30. August 2026 auf der Vercel-Preview
`app-gold-workspace-kou9998rz-auls.vercel.app`:

- Produktions-Build mit Next.js 15.5.24 erfolgreich
- Deployment `dpl_4RdX9cbpPu1YdCumpmQeTwfyM1Ak` im Status `READY`
- öffentliche Startseite in Deutsch, Englisch und Arabisch geprüft
- RTL-Umschaltung und Sprachmetadaten für Arabisch geprüft
- Registrierungs- und Anmeldeoberfläche einschließlich unabhängiger
  Passwort-Sichtbarkeit und Rücksetzung geprüft
- sechs Tarifstufen und Laufzeitlogik 1/3/6/12 Monate geprüft
- kostenloser Einstieg sowie Hinweise auf deaktivierte Zahlung, fehlendes Abo und
  fehlende automatische Verlängerung geprüft
- responsive CSS-Regeln für 850, 760, 700 und 560 Pixel statisch geprüft

Es wurden im Preview keine Konten angelegt, keine Dokumente hochgeladen und keine
Live-Daten verändert. Der authentifizierte End-to-End-Test bleibt deshalb ein
getrennter Freigabeschritt.

## Rein lesende Datenbank-Kompatibilitätsprüfung

Geprüft am 30. August 2026 gegen das aktive Supabase-Projekt, ohne Schreibzugriff:

- die von V24 verwendeten Fall- und Dokumentspalten sind bereits vorhanden
- `clients`, `cases`, `documents`, `approvals`, `assessments`, `source_status`,
  `audit_events` und `deletion_requests` haben RLS aktiviert
- die vorbereiteten V24-Integritätstrigger, die Hilfsfunktion und der
  Fristenindex sind noch nicht installiert
- die drei internen Tabellen `private.pending_owner_access`,
  `private.gold_plans` und `private.gold_plan_terms` haben noch kein RLS
- für diese drei internen Tabellen bestehen zugleich keine direkten Rechte für
  `anon`, `authenticated` oder `PUBLIC`; die zweite V24-Migration ergänzt daher
  eine zusätzliche Schutzschicht und darf erst nach Freigabe angewendet werden
- der Sicherheitsprüfer warnt zusätzlich, dass der Schutz gegen bekannte
  kompromittierte Passwörter in Supabase Auth noch deaktiviert ist

Die Live-Datenbank wurde nicht migriert. Produktion und Bezahlfunktion wurden
nicht verändert.
