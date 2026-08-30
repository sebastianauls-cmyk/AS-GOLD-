# AS Gold V25 – Freigabeablauf

Stand: 30. August 2026

V25 erweitert den nichtproduktiven V24-Arbeitszweig um den durchgängigen Schritt
von der geprüften Dokumentinformation zur ausdrücklichen Freigabe. Produktion,
Live-Datenbank und Bezahlfunktion bleiben unverändert.

## Umgesetzt

- Freigabe direkt aus einem fallzugeordneten Dokument vorbereiten
- neuen Freigabeentwurf mit Fall, Bezugsdokument, Verwendungszweck, Empfänger,
  Betreff und freizugebendem Inhalt anlegen
- Anlagenbezeichnung als Vorschau-Snapshot speichern
- verbindliche Vorschau mit sichtbarer Revisionsnummer anzeigen
- Freigabe erst nach aktiv gesetzter Prüfbestätigung ermöglichen
- Zustimmung und Ablehnung als getrennte, ausdrückliche Aktionen
- Zustimmung mit genau der geprüften `preview_revision` verknüpfen
- konkurrierende Änderungen vor Speichern, Freigeben oder Ablehnen erkennen
- Inhaltsänderungen nach einer Zustimmung als neue Revision behandeln und die
  vorherige Zustimmung über den vorhandenen Datenbanktrigger ungültig machen
- wichtige Freigabeereignisse lokal und im Server-Audit protokollieren
- Fall-Exporte um Ziel, Frist, nächsten Schritt, Bewertungen, Quellenstatus und
  Freigaberevisionen ergänzen
- vollständige Oberfläche in Deutsch, Englisch, Türkisch, Polnisch,
  Ukrainisch, Russisch und Arabisch bereitstellen
- responsive Darstellung für Desktop und mobile Breiten vorbereiten

## Vorbereitete Datenbank-Härtung

Die Migration `20260830120000_v25_approval_integrity.sql` ist versioniert, aber
nicht angewendet. Sie soll nach getrennter Prüfung:

- eine Freigabe nur mit einem Fall desselben Kontos verknüpfen
- ein Bezugsdokument nur zulassen, wenn es demselben Konto und Fall gehört
- `preview_required` verbindlich aktivieren
- den Zustand `approved` an eine vorhandene Zeitangabe und exakt dieselbe
  Vorschau-Revision binden
- bei nicht freigegebenen Zuständen veraltete Zustimmungsdaten verhindern

## Bewusst nicht aktiviert

- kein automatischer E-Mail- oder sonstiger Versand
- keine externe Verwendung allein durch das Setzen des Freigabestatus
- keine Live-Migration
- kein produktives Deployment
- keine Zahlung oder automatische Verlängerung

## Verifizierung

- Produktions-Build mit Next.js 15.5.24 erfolgreich
- statische Prüfung ohne Whitespace- oder Patchfehler erfolgreich
- bestehendes Live-Schema und vorhandener Revisions-Invalidierungstrigger rein
  lesend abgeglichen
- nichtproduktives Vercel-Deployment `dpl_2AmsUt5KMcHJMCNQdr7tpiWqFhmh`
  unter `app-gold-workspace-dlnkwmhxs-auls.vercel.app` im Status `READY`
- öffentliche Oberfläche in Deutsch, Englisch und Arabisch einschließlich
  RTL-Umschaltung geprüft
- Registrierung, unabhängige Passwort-Sichtbarkeit, sechs Tarifstufen sowie die
  Hinweise auf deaktivierte Zahlung und fehlende automatische Verlängerung geprüft
- keine Anwendungsfehler im Browserprotokoll; ausschließlich eine Meldung der
  Browser-Test-Erweiterung außerhalb der App

Noch ausstehend sind die authentifizierte Prüfung der V25-Freigabefunktionen in
einer isolierten Testdatenbank, die Migrationsprüfung und der physische Mobiltest.
Keine dieser Stufen darf Live-Kundendaten verändern.
