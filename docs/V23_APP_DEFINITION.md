# AS Gold V23 – App-Definition und Fertigstellungsstand

Stand: 29.08.2026  
Status: Arbeitsgrundlage vor vollständigem App-Test und Produktionsfreigabe

## 1. Verbindliche Leitplanken

- Produktstand ist **V23**.
- AS Gold ist ein geschützter Arbeitsbereich zum Ordnen, Prüfen und Bearbeiten komplexer Vorgänge anhand von Kunden, Fällen und Dokumenten.
- Markt und rechtliche Grundlage sind Deutschland und deutsches Recht; die Sprache ändert diese Grundlage nicht.
- AS Gold darf keine scheinbar sichere Aussage erzeugen, wenn Unterlagen oder Grundlagen fehlen.
- Externe Vertretung und verbindliche Rechtsberatung sind nicht Bestandteil der App.
- Dokumente und Falldaten sind kontogebunden und liegen in privatem Storage mit nutzergebundener RLS.
- Kostenpflichtige Laufzeiten verlängern sich nicht automatisch.
- Die Bezahlfunktion bleibt während Definition und Test deaktiviert.
- Produktion wird erst nach bestandenem Ende-zu-Ende-Test freigegeben.

## 2. Zielgruppen und Rollen

| Bereich | V23-Zielbild | Noch verbindlich festzulegen |
|---|---|---|
| Privatnutzer | Eigene Vorgänge und Unterlagen strukturiert bearbeiten | Welche Fallarten zuerst unterstützt werden |
| Professionelle Nutzer | Mehrere Kunden und Fälle verwalten | Abgrenzung zu Rechts-, Steuer- oder sonstiger Fachberatung |
| Teams/Business | Fälle, Freigaben und wiederkehrende Abläufe gemeinsam steuern | Teamrollen, Einladungen, Sichtbarkeit und Vertretungsregeln |
| Owner/Admin | Zugänge, Rollen und Berechtigungen verwalten | Admin-Oberfläche und Vier-Augen-Regeln |

## 3. Vollständiger Soll-Ablauf

1. Nutzer informiert sich über Leistung, Grenzen und Tarife.
2. Nutzer registriert sich, bestätigt sein Konto und meldet sich an.
3. Nutzer legt einen Kunden und danach einen Fall mit Ziel, Sachstand und Fristen an.
4. Nutzer lädt Dokumente hoch oder übernimmt sie aus einer freigegebenen Quelle.
5. AS Gold extrahiert Inhalte, erkennt Dokumenttyp, Datum, Beteiligte und Fallzuordnung.
6. AS Gold zeigt Quellenlage, fehlende Unterlagen, Widersprüche, Fristen und Risiken nachvollziehbar an.
7. Nutzer prüft und korrigiert Ergebnisse; jede wesentliche Änderung bleibt nachvollziehbar.
8. AS Gold schlägt nächste Schritte und Entwürfe vor, ohne Unsicherheit zu verstecken.
9. Vor Versand oder verbindlicher Verwendung erfolgt eine ausdrückliche Freigabe.
10. Ergebnisse können in freigegebenen Formaten exportiert werden.
11. Nutzer kann Daten exportieren, eine Löschung anfragen und Aufbewahrungsstatus einsehen.

## 4. Realer Implementierungsstand

| Funktion | Status in V23 | Was noch fehlt |
|---|---|---|
| Öffentliche Erklärung und Preise | Vorhanden | Inhaltliche Endfreigabe und echter Mobiltest |
| Registrierung und Login | Vorhanden | Vollständiger E-Mail-Bestätigungs- und Passwort-Neusetzen-Test |
| Passwort-Klartextanzeige | Vorhanden | Angemeldeter E2E-Test |
| Kunden | Anlegen, listen und anzeigen vorhanden | Bearbeiten, löschen, Validierung und Dubletten |
| Fälle | Listen und Detailansicht vorhanden | Anlegen, bearbeiten, schließen, löschen und Kunden-Zuordnung in der UI |
| Dokumente | Upload, Liste, private Öffnung und Fallzuordnung vorhanden | Umbenennen, verschieben, löschen, Versionen und Fehlerwiederaufnahme |
| Inhaltsextraktion | Datenfelder vorbereitet | Verarbeitungspipeline für PDF, Office, Bilder, E-Mail und OCR |
| Analyse | Gespeicherte Ergebnisse können angezeigt werden | Automatische/assistierte Analyse, Quellenbelege, Korrektur und Neuberechnung |
| Fristen und Quellenstatus | Datenmodell vorbereitet | Erfassung, Dashboard, Erinnerung und Statuspflege |
| Freigaben | Datenmodell und Liste vorhanden | Erstellen, Vorschau, Revision, Freigeben, Ablehnen und Invalidierung in der UI |
| E-Mail-Verbindung | Datenmodell vorbereitet | Sichere Anbieteranbindung, Einwilligung, Entwurf, Versand und Widerruf |
| Exporte | PDF, DOCX, XLSX, PPTX, CSV und TXT vorhanden | Authentifizierter E2E-Test und Layout-/Inhaltsfreigabe |
| Tarifempfehlung | Vorhanden | Fachliche Freigabe der Leistungsgrenzen |
| Upgrade-Vorschau | Angebot und Vormerkung vorhanden | Zahlung bleibt deaktiviert; späterer Zahlungs- und Belegprozess offen |
| Erinnerungen | Regeln und Datenbankfunktion vorbereitet | Tatsächliche Zustellung, Opt-out und Fehlerbehandlung |
| Audit | Lokale Gerätehistorie und Server-Audit vorhanden | Vollständige Ereignismatrix und Admin-Auswertung |
| Datenexport | JSON-Export vorhanden | Vollständigkeit, Anhänge und maschinenlesbare Struktur prüfen |
| Kontolöschung | Anfrage und Rücknahme vorhanden | Prüfung, Aufbewahrung, Freigabe und tatsächliche Löschung |
| Team/Business | Produktbeschreibung und Datenbasis teilweise vorhanden | Einladungen, Rollen, Rechte, gemeinsame Organisationen und Team-UI |
| Admin | Geschützte RPC-Grundlage vorhanden | Admin-UI, Protokollierung und Vier-Augen-Freigaben |

## 5. Dokument-Testkonfiguration

- Vorläufige technische Dateigröße: **maximal 50 MB pro Datei**. Das ist die derzeitige Plattformobergrenze des verwendeten Supabase-Free-Tarifs und keine endgültige AS-Gold-Produktgrenze.
- Vorläufig getestete Eingaben: PDF, TXT, CSV, RTF, EML, MSG, JPG/JPEG, PNG, WEBP, HEIC/HEIF, TIF/TIFF, DOC/DOCX, XLS/XLSX, PPT/PPTX, ODT/ODS/ODP.
- Die endgültigen Dateitypen, Größen, Seitenzahlen, Scanqualität und Gesamtmengen werden erst anhand echter Testfälle festgelegt.
- Die öffentliche kostenlose Stufe enthält derzeit drei Dokumente. Ein freigegebenes Owner-/Testkonto umgeht dieses Mengenlimit für vollständige Tests; das öffentliche Tarifversprechen wird nicht global aufgeweicht.
- Für Dateien oberhalb von etwa 6 MB muss vor Marktstart geprüft werden, ob ein fortsetzbarer Upload statt Standard-Upload erforderlich ist.

## 6. Noch zu treffende Produktentscheidungen

1. Soll die Kernanalyse automatisch durch KI erfolgen, durch einen Menschen unterstützt werden oder beides kombinieren?
2. Welche Fallarten sind zum Marktstart ausdrücklich unterstützt und welche ausgeschlossen?
3. Welche Ergebnisse darf die App selbst vorschlagen, und wann ist eine fachliche Freigabe zwingend?
4. Welche Teamrollen und Sichtbarkeitsgrenzen gelten im Business-Tarif?
5. Welche Dokument- und Fallmengen gehören nach den Tests zu jeder Tarifstufe?
6. Welche Aufbewahrungsfristen gelten je Datenart und Fallstatus?
7. Welche Benachrichtigungen werden per E-Mail, in der App oder über weitere Kanäle versendet?

## 7. Freigabekriterien

Eine Produktionsfreigabe ist erst möglich, wenn:

- die offenen Produktentscheidungen schriftlich bestätigt sind,
- jeder Soll-Ablauf vollständig implementiert oder ausdrücklich aus V23 ausgeschlossen ist,
- Registrierung, Login, Passwort-Neusetzen und Abmeldung getestet sind,
- Kunden-, Fall-, Dokument-, Analyse-, Freigabe- und Exportablauf mit einem echten Testkonto funktionieren,
- RLS, Rollen, private Dateien, Audit und Löschablauf sicherheitsgeprüft sind,
- mobile Darstellung, Mehrsprachigkeit einschließlich RTL und Barrierefreiheit geprüft sind,
- Fehlerfälle, große Dateien, falsche Dateitypen und Verbindungsabbrüche getestet sind,
- Zahlungen weiterhin deaktiviert sind oder separat vollständig freigegeben wurden,
- die Produktionsfreigabe ausdrücklich erteilt wurde.

## 8. Aktuelle Freigabeentscheidung

**Noch keine Produktionsfreigabe.** V23 ist eine belastbare Build- und Preview-Basis, aber der vollständige Kernablauf von Fallanlage über Dokumentanalyse bis Freigabe ist noch nicht durchgängig implementiert und getestet.
