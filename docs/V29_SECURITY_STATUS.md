# AS Gold V29 – Sicherheits- und Integritätsstatus

Stand: 30. August 2026, nach Produktionsrollout

## Ergebnis

V29 ist als kostenloses Härtungsrelease auf Basis des vollständigen V28-Funktionsstands produktiv veröffentlicht. Zahlung, Abonnement, automatische Verlängerung und die Verarbeitung echter Kundendaten bleiben deaktiviert. Quellstand, lokaler Build, Office-Exporte, Vercel-Produktionsbuild, Live-Header und beide V29-Datenbankmigrationen sind geprüft.

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

Die vollständige Migration wurde zunächst in einer Produktionstransaktion mit Berechtigungs- und Negativtests geprüft und vollständig zurückgerollt. Nach dem erfolgreichen Frontend-Rollout wurde sie dauerhaft angewendet. Die anschließende Prüfung bestätigt:

- `authenticated` kann eigene Audit-Ereignisse lesen, aber nicht direkt einfügen, ändern oder löschen
- ausschließlich `authenticated` darf die öffentliche validierende RPC aufrufen
- `anon` darf die öffentliche RPC nicht ausführen
- Browserrollen dürfen die private Implementierung nicht direkt ausführen
- einzige Audit-RLS-Policy bleibt `audit_events_select_own`
- öffentliche RPC ist `SECURITY DEFINER` mit leerem `search_path`

Der Security Advisor kennzeichnet die bewusst für angemeldete Nutzer freigegebene `SECURITY DEFINER`-RPC als Warnhinweis. Das ist hier die beabsichtigte, eng begrenzte Schreibgrenze: Die Funktion prüft aktive Berechtigung, Allowlists, Metadaten, Semantik und Entitätsbesitz; direkte Tabellenschreibrechte und der private Funktionszugriff sind entzogen. Die vier Info-Hinweise zu RLS ohne Policies betreffen ausschließlich interne Tabellen im nicht exponierten `private`-Schema und sind beabsichtigt.

## Datenbank-Performance

Die Migration `v29_index_foreign_keys` ergänzt Indizes für:

- `exports.case_id`
- `exports.document_id`
- `user_access_periods.plan_id`
- `user_access_periods.term_months`

Alle vier Indizes sind produktiv vorhanden. Der erneut ausgeführte Performance Advisor meldet danach keine unindexierten Fremdschlüssel mehr. Hinweise auf bislang ungenutzte Indizes sind in dem jungen Testsystem erwartbar und kein belastbarer Löschgrund.

## Passwortschutz

Die Registrierung prüft in allen sieben Oberflächensprachen mindestens 12 Zeichen, Groß- und Kleinbuchstaben, Zahl und Sonderzeichen. Diese Prüfung verbessert die Oberfläche, ersetzt aber keine serverseitige Auth-Konfiguration; direkte API-Aufrufe dürfen nicht allein auf Clientvalidierung vertrauen.

Der Supabase Security Advisor meldet weiterhin die deaktivierte Prüfung auf bekannte kompromittierte Passwörter. Diese Funktion ist nach aktueller Supabase-Dokumentation nicht im verwendeten Free-Plan enthalten. V29 löst weder ein kostenpflichtiges Upgrade aus noch behauptet es, diese Plattformgrenze geschlossen zu haben.

## Verifikation

- `npm run build`: erfolgreich mit Next.js 16.3.3
- alle App-Routen statisch erzeugt
- `git diff --check`: erfolgreich
- `npm audit --json`: 0 Schwachstellen
- Hauptseite und Datenschutzseite lokal: HTTP 200
- erwartete Sicherheitsheader lokal vorhanden
- keine Kürzungsmarker, CDN-Loader, direkten Audit-Inserts oder alten XLSX-Imports im Quelltext
- GitHub-Quellstand für das Frontend: `c09e9eefced0074ccb43a71a7f1746234ba9afd3`
- Vercel-Preview `dpl_541dKT2vV8cNjzxyhGswkbPVzpeW`: `READY`
- Vercel-Produktion `dpl_KrZ3Wqa8MzS7yVEszGSANojGeGSP`: `READY`
- Produktionsadresse `https://app-gold-workspace.vercel.app`
- `/`, `/datenschutz`, `/datenschutzsteuerung` und `/widerruf`: jeweils HTTP 200 mit erwarteten Sicherheitsheadern
- keine Vercel-Laufzeitfehler im Kontrollzeitraum nach dem Rollout
- Audit-Migration produktiv angewendet und Berechtigungsgrenzen geprüft
- vier Fremdschlüssel-Indizes produktiv angewendet; Performance Advisor danach ohne unindexierte Fremdschlüssel

## Noch ausstehend vor einer Freigabe über den kontrollierten Test hinaus

1. Supabase-Mindestpasswort serverseitig auf die V29-Regel abstimmen, sobald die Projektkonfiguration über einen autorisierten Verwaltungsweg verfügbar ist.
2. Schutz vor bekannten kompromittierten Passwörtern aktivieren, sobald dafür bewusst ein geeigneter Tarif freigegeben wird; V29 löst kein kostenpflichtiges Upgrade aus.
3. Authentifizierten End-to-End-Test mit isoliertem Testkonto und ausschließlich synthetischen Dateien durchführen.
4. Separaten Test auf realen Mobilgeräten durchführen.

Die organisatorischen und rechtlichen offenen Punkte aus `V28_RELEASE_STATUS.md` bleiben unverändert: Auftragsverarbeitung und Unterauftragsverarbeiter, Drittland-/Regionsbewertung, mögliche DSFA, vollständige echte Anbieterangaben und fachanwaltliche Prüfung vor Bezahl- oder Echtdatenbetrieb.

## Freigabegrenze

V29 bleibt ausschließlich für den kontrollierten kostenlosen Test mit synthetischen oder wirksam anonymisierten Daten bestimmt. Die technische Härtung ist keine allgemeingültige Zusage vollständiger DSGVO-Konformität.
