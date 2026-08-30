# AS Gold V27 – kundenfreundliche Fallauswahl

Stand: 30. August 2026

V27 baut ausschließlich auf dem vollständigen GitHub-Hauptstand V26 auf. Die
fachlichen Abläufe aus V24, der revisionsgebundene Freigabeablauf aus V25 und
die kontrollierte Dokumentanalyse aus V26 wurden nicht entfernt oder ersetzt.

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
- lokaler Dev-Server auf `127.0.0.1`: gestartet
- automatisierter visueller Browserlauf: in der Ausführungsumgebung nicht
  verfügbar, weil das vorgesehene Browserprogramm nicht installiert ist

## Unveränderte Grenzen

- keine Zahlung, kein Abonnement und keine automatische Verlängerung
- kein automatischer Versand
- keine automatische fachliche oder rechtliche Endentscheidung
- kontrollierter Testbetrieb ohne echte Kundendaten
- Produktion wurde durch V27 nicht verändert

## Vor einer Produktionsfreigabe

1. denselben V27-Stand als Vercel-Preview bauen,
2. Desktop- und Mobilansicht im Browser prüfen,
3. Fallauswahl, Registrierung, Zurück-Navigation und sieben Sprachwechsel testen,
4. anschließend nur denselben geprüften Stand freigeben.
