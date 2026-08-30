# AS Gold V26 – Veröffentlichungsstand

Stand: 30. August 2026

V26 ist der gemeinsame Veröffentlichungsstand aus dem mobilen V24-Kernablauf,
dem revisionsgebundenen V25-Freigabeablauf und der kontrollierten
Dokumentanalyse. Die Veröffentlichung bleibt ein transparenter Testbetrieb ohne
echte Kundendaten und ohne Bezahlfunktion.

## Enthalten

- Fallanlage und -bearbeitung mit Kunde, Ziel, Sachstand, Frist und nächstem Schritt
- Quellenbasis, Ampelbewertung, Begründung und dokumentierter nächster Schritt
- privater Kamera- oder Dateiupload mit Fallzuordnung
- kontrollierte Analyse für PDF- und Bilddateien über die JWT-geschützte
  Edge-Funktion `gold-ocr`
- aktive Bestätigung „interne Testdatei ohne echte Kundendaten“ vor jedem
  Analyseaufruf
- korrigierbarer Analysevorschlag, der nicht automatisch in der Datenbank
  gespeichert wird
- bewusste Speicherung der geprüften Dokumentangaben mit Audit-Ereignis
- sichtbare Freigabevorschau, Revisionsbindung sowie ausdrückliche Zustimmung
  oder Ablehnung
- sieben UI-Sprachen einschließlich RTL-Darstellung für Arabisch

## Verbindliche Grenzen

- keine automatische fachliche oder rechtliche Endentscheidung
- kein automatischer E-Mail- oder sonstiger Versand
- keine Zahlung, kein Abonnement und keine automatische Verlängerung
- keine echten Kundendaten während des kontrollierten Testbetriebs
- KI-Analyse maximal 18 MB; allgemeiner Test-Upload vorläufig maximal 50 MB
- Office-Dateien können gespeichert, aber noch nicht automatisch analysiert werden

## Datenbank- und Sicherheitsgrenze

Die Anwendung verwendet bestehende RLS-geschützte Tabellen und zusätzliche
Eigentümerfilter im Client. Die versionierten V24-/V25-Migrationen ergänzen
relationale Integritätsprüfungen, eine revisionsgebundene Freigabe-Constraint,
einen Fristenindex und RLS als zusätzliche Schutzschicht für interne Tabellen.
Ihre Anwendung und Prüfung ist Bestandteil der Produktionsfreigabe.

Der Supabase-Sicherheitsprüfer weist weiterhin darauf hin, dass der optionale
Schutz vor bekannten kompromittierten Passwörtern im Projekt noch nicht
aktiviert ist. Dieser Plattformschalter bleibt ein gesonderter Härtungspunkt;
er wird in V26 nicht als bereits aktiv behauptet.

## Freigabeprüfung

Vor der Produktion werden für exakt denselben Commit durchgeführt:

1. statische Patch- und Produktions-Build-Prüfung,
2. Vercel-Preview im Status `READY`,
3. Browserprüfung der öffentlichen Oberfläche, Registrierung und
   Sprachumschaltung ohne Anlage eines Kontos,
4. rein lesende Live-Kompatibilitätsprüfung ohne Einsicht in Kundendaten,
5. Veröffentlichung desselben geprüften Commits und Kontrolle des
   Produktionszustands.
