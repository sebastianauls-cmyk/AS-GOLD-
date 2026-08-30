# AS Gold V27 – kundenfreundliche Fallauswahl

Stand: 30. August 2026, nach öffentlichem Produktions-Browserlauf

V27 baut ausschließlich auf dem vollständigen V26-Stand auf. Die fachlichen
Abläufe aus V24, der revisionsgebundene Freigabeablauf aus V25 und die
kontrollierte Dokumentanalyse aus V26 wurden nicht entfernt oder ersetzt. V27
ist der aktuelle Produktionsstand im kontrollierten Testbetrieb.

## Ziel der Änderung

Die öffentliche Startseite soll innerhalb weniger Sekunden beantworten:

- Für wen ist AS Gold gedacht?
- Bei welcher Art von Vorgang hilft die Anwendung?
- Welche typischen Fälle passen?
- Was macht AS Gold mit den Unterlagen?
- Welches konkrete Ergebnis erhält der Nutzer?

## Umgesetzte Darstellung

- sichtbare Zielgruppen: Privatpersonen, Selbstständige und kleine Unternehmen
  sowie Teams mit dokumentenreichen Kundenfällen
- acht auswählbare Fallarten:
  1. Versicherung und Schaden
  2. Miete, Pacht und Immobilie
  3. Vertrag und Forderung
  4. Behörde und Sozialversicherung
  5. Arbeit und Abrechnung
  6. Unternehmen und Kunden
  7. Konflikt und Beweislage
  8. privater komplexer Vorgang
- je Fallart nur eine geöffnete Detailansicht mit typischen Beispielen,
  Unterstützung und Ergebnis
- kompakte Drei-Schritte-Erklärung vom Falltyp bis zur prüfbaren Fallakte
- vollständige Transparenzregeln über eine aufklappbare Detailansicht
- sichtbarer kostenloser Einstieg ohne Zahlung und automatische Verlängerung
- Klarstellung, dass AS Gold strukturiert und vorbereitet, aber keine
  individuelle Rechts- oder Steuerberatung ersetzt
- vollständige Texte für DE, EN, TR, PL, UK, RU und AR einschließlich RTL

## Technischer Prüfstand

- `npm ci`: erfolgreich
- `npm run build` mit Next.js 15.5.24: erfolgreich
- statische Generierung der Route `/`: erfolgreich
- React-/JavaScript-Kompilierung und Typprüfung: erfolgreich
- `git diff --check`: erfolgreich
- Vercel-Preview `dpl_2QFNfjPWDuJrs5R7f5nDkw6QR7H2`: `READY`
- Vercel-Produktion `dpl_GgyevtiiYyxF8pap12RPfhDiDXbC`: `READY`
- Live-Adresse: `https://app-gold-workspace.vercel.app`
- öffentlicher Desktop-Browserlauf bei 1363 × 936 CSS-Pixeln: erfolgreich
- alle acht Fallarten schalten die zugehörige Detailansicht korrekt um
- Registrierungsansicht, unabhängige Klartextanzeige beider Passwortfelder und
  Zurück-Navigation zur Erklärung: erfolgreich
- DE, EN, TR, PL, UK, RU und AR: vollständig umschaltbar
- Arabisch setzt `lang=ar` und `dir=rtl`; in keiner der sieben Sprachen wurde
  horizontaler Seitenüberlauf festgestellt
- sechs Transparenzregeln sind vollständig aufklappbar
- alle sechs Nutzerziele empfehlen jeweils die passende günstigste Tarifstufe
- keine Fehler aus dem Anwendungscode im Browserprotokoll; Meldungen stammten
  ausschließlich aus der Testbrowser-Erweiterung
- Vercel-Laufzeitfehlerprüfung für die letzte Stunde: keine Fehler gefunden

## Noch ausstehende Prüfungen

- visueller und funktionaler Test auf einem echten Mobilgerät; die
  responsiven Regeln für 980, 700, 560 und 420 Pixel sind vorhanden, ersetzen
  aber keinen physischen Gerätetest
- authentifizierter End-to-End-Test mit einem isolierten Testkonto und reinen
  Testdateien
- getrennte Freigabe und Prüfung der vorbereiteten Datenbankmigrationen
- Aktivierung des Supabase-Schutzes vor bekannten kompromittierten Passwörtern

## Unveränderte Grenzen

- keine Zahlung, kein Abonnement und keine automatische Verlängerung
- kein automatischer Versand
- keine automatische fachliche oder rechtliche Endentscheidung
- kontrollierter Testbetrieb ohne echte Kundendaten
- beim öffentlichen Browserlauf wurden kein Konto angelegt, keine Formulardaten
  übermittelt und keine Live-Daten verändert

## Freigabestatus

- V27 ist gebaut, versioniert, gesichert und produktiv veröffentlicht.
- Die öffentliche Oberfläche ist für externe Tester erreichbar.
- Die Freigabe bezieht sich weiterhin ausschließlich auf den kontrollierten
  Testbetrieb ohne echte Kundendaten und ohne Bezahlfunktion.
