# AS Gold V29 – Sicherheits- und Integritätsstatus

Stand: 30. August 2026, vor Produktionsrollout

## Ergebnis

V29 ist ein kostenloses Härtungsrelease auf Basis des vollständigen V28-Funktionsstands. Zahlung, Abonnement, automatische Verlängerung und die Verarbeitung echter Kundendaten bleiben deaktiviert. Der lokale Build, die neuen Office-Exporte, die HTTP-Sicherheitsheader und die Datenbankmigration sind geprüft; Produktion und Datenbank werden erst nach dem versionierten Frontend-Rollout gemeinsam freigegeben.

## Reparatur der Repository-Quelle

Die in GitHub gespeicherte V28-Datei `app/page.js` enthielt zwei wörtliche Ausgabemarker und an einer Stelle den Marker `…8400 tokens truncated…`. Dadurch fehlte ein Teil einer mehrsprachigen Textdefinition, obwohl das zuvor separat veröffentlichte V28-Deployment als `READY` dokumentiert war.

Die Reparatur wurde nicht geschätzt:

- letzter vollständiger Ausgangspunkt: V27-Commit `de10238761108cab396896138abcd801bbb20051`
- beschädigter V28-Commit: `26448a08f4e945880f0f0be85f105e3f877bff64`
- vor und nach dem fehlenden Abschnitt stimmen jeweils 500 Zeichen exakt mit V27 überein
- wiederhergestellter, zwischen V27 und V28 unveränderter Abschnitt: 27.165 Zeichen
- alle V28-Ergänzungen außerhalb dieses Abschnitts bleiben erhalten
- anschließend kompiliert die vollständige Datei mit Next.js 16 erfolgreich

## Abhängigkeiten und Exporte

- Next.js `16.3.3`
- React / ReactDOM `19.2.8`
- jsPDF `4.2.1`
- SheetJS `xlsx`, ExcelJS und PptxGenJS entfernt
- XLSX und PPTX werden mit JSZip als minimale Office-Open-XML-Pakete lokal im Browser erzeugt
- Tabellenwerte werden ausschließlich als Textzellen geschrieben; führende Formelzeichen werden nicht als Formel ausgeführt
- kein jsDelivr- oder anderes Laufzeit-CDN für Exporte
- `npm audit --json`: 0 bekannte Schwachstellen

Unabhängige Exportprüfungen:

- ZIP-Integritätsprüfung für XLSX und PPTX erfolgreich
- XLSX mit OpenPyXL 3.1.5 geöffnet und Inhalte geprüft
- PPTX mit python-pptx 1.0.2 geöffnet und Folien-/Textinhalte geprüft
- beide Formate mit LibreOffice erfolgreich in PDF konvertiert
- erste gerenderte Seiten visuell geprüft

## Browser- und Header-Härtung

Für alle Routen gelten:

- Content Security Policy mit festen `self`-/Supabase-Zielen, gesperrten Objekten und `frame-ancestors 'none'`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
- eingeschränkte `Permissions-Policy`
- `Cross-Origin-Opener-Policy: same-origin`
- HSTS im Produktionsmodus
- deaktivierter `X-Powered-By`-Header

Der lokale Produktionsserver lieferte `/` und `/datenschutz` mit HTTP 200 und sämtlichen erwarteten Headern. Die CSP erlaubt derzeit `unsafe-inline` für Skripte und Stile, damit die statisch vorgerenderten Next.js-Seiten ohne nonce-bedingte Dynamisierung funktionieren; diese Einschränkung wird nicht als vollständiger XSS-Schutz dargestellt.

## Audit-Integrität und Datenminimierung

Die V29-Migration `v29_harden_audit_integrity` stellt das Audit-Protokoll auf eine append-only RPC-Grenze um:

- Ereignistypen, Entitätstypen, Entitätsbesitz und Metadaten werden serverseitig validiert
- Ereignis und Entität müssen semantisch zusammenpassen
- Formate, Statuswerte, Klassifizierungen, Tarifschlüssel, Laufzeiten und Revisionen sind allowlist-beschränkt
- die öffentliche RPC ist nur für `authenticated` ausführbar
- die private Implementierung ist für Browserrollen nicht direkt ausführbar
- direkte `INSERT`-, `UPDATE`- und `DELETE`-Rechte auf `audit_events` werden Browserrollen entzogen
- die eigene, RLS-geschützte Audit-Historie bleibt lesbar

Die Anwendung übermittelt keine Kunden-, Fall-, Betreff- oder Dateinamen mehr an Audit-Metadaten. Die lokale Gerätehistorie speichert nur Zeitpunkt und Ereignisart; bereits gespeicherte Detailwerte werden beim nächsten Laden bereinigt.

Die vollständige Migration wurde in einer Produktionstransaktion ausgeführt, mit Berechtigungs- und Negativtests geprüft und danach vollständig zurückgerollt. Es entstand dadurch noch keine dauerhafte Datenbankänderung.

## Passwortschutz

Die Registrierung prüft in allen sieben Oberflächensprachen mindestens 12 Zeichen, Groß- und Kleinbuchstaben, Zahl und Sonderzeichen. Diese Prüfung verbessert die Oberfläche, ersetzt aber keine serverseitige Auth-Konfiguration; direkte API-Aufrufe dürfen nicht allein auf Clientvalidierung vertrauen.

Der Supabase Security Advisor meldet weiterhin die deaktivierte Prüfung auf bekannte kompromittierte Passwörter. Diese Funktion ist nach aktueller Supabase-Dokumentation nicht im verwendeten Free-Plan enthalten. V29 löst weder ein kostenpflichtiges Upgrade aus noch behauptet es, diese Plattformgrenze geschlossen zu haben.

## Lokale Verifikation

- `npm run build`: erfolgreich mit Next.js 16.3.3
- alle App-Routen statisch erzeugt
- `git diff --check`: erfolgreich
- `npm audit --json`: 0 Schwachstellen
- Hauptseite und Datenschutzseite lokal: HTTP 200
- erwartete Sicherheitsheader lokal vorhanden
- keine Kürzungsmarker, CDN-Loader, direkten Audit-Inserts oder alten XLSX-Imports im Quelltext
- V29-Migration transaktional validiert und zurückgerollt

## Noch ausstehend vor V29-Produktionsfreigabe

1. Frontend-Commit versionieren und Vercel-Deployment bis `READY` prüfen.
2. Danach die bereits transaktional geprüfte Audit-Migration einmalig anwenden.
3. Supabase Security und Performance Advisor erneut ausführen.
4. Produktionsadresse, Header, Rechtsseiten und öffentliche Widerrufsfunktion prüfen.
5. Supabase-Mindestpasswort serverseitig auf die V29-Regel abstimmen, sobald die Projektkonfiguration über einen autorisierten Verwaltungsweg verfügbar ist.
6. Authentifizierten End-to-End-Test mit isoliertem Testkonto und ausschließlich synthetischen Dateien durchführen.
7. Separaten Test auf realen Mobilgeräten durchführen.

Die organisatorischen und rechtlichen offenen Punkte aus `V28_RELEASE_STATUS.md` bleiben unverändert: Auftragsverarbeitung und Unterauftragsverarbeiter, Drittland-/Regionsbewertung, mögliche DSFA, vollständige echte Anbieterangaben und fachanwaltliche Prüfung vor Bezahl- oder Echtdatenbetrieb.

## Freigabegrenze

V29 bleibt ausschließlich für den kontrollierten kostenlosen Test mit synthetischen oder wirksam anonymisierten Daten bestimmt. Die technische Härtung ist keine allgemeingültige Zusage vollständiger DSGVO-Konformität.
