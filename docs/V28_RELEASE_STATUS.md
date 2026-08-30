# AS Gold V28 – Datenschutz-, Rechts- und Freigabestatus

Stand: 30. August 2026

## Ergebnis

V28 vervollständigt den kontrollierten, kostenlosen Testbetrieb um einen öffentlich erreichbaren Rechtsbereich, nachvollziehbare Datenschutzentscheidungen, technische Testdaten-Sperren und eine elektronische Widerrufsfunktion. V28 ist ausdrücklich keine Freigabe für zahlungspflichtige Angebote oder echte personenbezogene Kundendaten.

## Enthalten

- Impressum nach dem derzeit bekannten Anbieterstand
- Datenschutzerklärung mit tatsächlichen Datenflüssen, Rechtsgrundlagen, Empfängern, Drittlandhinweisen, Speicherdauern, Rechten und Beschwerdestelle
- Nutzungsbedingungen für den kostenlosen Test ohne Zahlung, Abo oder automatische Verlängerung
- Cookies-/Browser-Speicher-Erklärung ohne Marketing- oder Reichweiten-Tracker
- KI-Transparenz zu OpenAI, `store: false`, möglicher Sicherheitsaufbewahrung bis zu 30 Tagen, menschlicher Prüfung und den Grenzen der Analyse
- öffentlicher Kontakt- und Rechts-Hub
- öffentliche Zwei-Schritt-Widerrufsfunktion mit den Schaltflächen „Vertrag widerrufen“ und „Widerruf bestätigen“
- private Widerrufsnachweise, stündliche Missbrauchsbegrenzung, Honeypot und sofort herunterladbare Eingangsbestätigung
- getrennte Registrierungsbestätigung für Rechtstexte und Testdaten-Regel
- versionierte Konto-Bestätigung (`2026-08-30-v1` / `2026-08-30-test-v1`)
- Datei-Klassifizierung `synthetic` oder `anonymized` vor Upload
- zusätzliche, nicht vorausgewählte Freigabe vor jeder KI-Analyse
- serverseitige Prüfung von Anmeldung, Eigentum, Hinweisversionen, Datenklasse, Konto- und Dokumentfreigabe
- einmalig verbrauchte Dokument-KI-Freigabe
- Datenschutz-Steuerung zum Ausschalten von Konto-KI und allen noch offenen Dokumentfreigaben
- Datenexport, Audit-Trail und Löschanfrage aus den vorherigen Versionen

## Supabase-Stand

- Projekt: `bcvggtnvuesaihqvgisg`, Region `eu-west-2` (London, Vereinigtes Königreich)
- Migration `v28_privacy_security_foundation` war bereits produktiv vorhanden; lokale Source-Parität wurde ergänzt.
- Migration `v28_electronic_withdrawal` am 30.08.2026 erfolgreich angewendet.
- Migration `v28_lock_test_data_release_gates` am 30.08.2026 erfolgreich angewendet.
- Edge Function `gold-withdrawal`, Version 1, aktiv; ohne Plattform-JWT, da sie gesetzlich öffentlich erreichbar sein muss, mit eigener Origin-/Eingabe-/Missbrauchsprüfung.
- Edge Function `gold-ocr-v28`, Version 2, aktiv und mit JWT-Prüfung.
- Rollback-Speichertest der Widerrufsfunktion erfolgreich.
- `anon` besitzt keinen Lesezugriff und `authenticated` keinen Schreibzugriff auf `private.electronic_withdrawals`.
- RLS erzwingt `real_data_authorized=false` und `special_categories_authorized=false` im kontrollierten Test.

## Verifikation

- `npm run build`: erfolgreich mit Next.js 15.5.24; alle 13 Routen statisch erzeugt.
- `git diff --check`: erfolgreich.
- Supabase Security Advisor nach den Migrationen geprüft.
- produktiver Edge-API-Test `gold-withdrawal`: HTTP 201 mit Widerrufs-ID, Eingangszeitpunkt und vollständiger Textbestätigung; der ausschließlich synthetische Testdatensatz wurde danach gezielt entfernt.
- fremder Origin an `gold-withdrawal`: HTTP 403.
- Aufruf von `gold-ocr-v28` ohne gültige Anmeldung: HTTP 401.
- GitHub-V28-Codecommit: `26448a08f4e945880f0f0be85f105e3f877bff64` auf `main`.
- Vercel-Produktionsdeployment: `dpl_Ba9v8y61QdqoMMF5ExX6jycmdj6G`, Status `READY`, Next.js 15.5.24, 13 statische Routen.
- Produktionsadresse: `https://app-gold-workspace.vercel.app`.
- Browserlauf auf der Produktionsadresse: alle neun Rechts-/Kontrolllinks und alle Pflichtseiten erreichbar; keine horizontale Überbreite bei 1363 × 936 CSS-Pixeln.
- Registrierung: zwei getrennte, erforderliche und zunächst nicht ausgewählte Checkboxen; Registrierung bleibt bis zur Bestätigung beider Felder deaktiviert.
- Widerruf: erster Schritt „Vertrag widerrufen“, zweiter Schritt mit Name, Vertrags-/Kontoreferenz, Download-Kanal, Erklärung und „Widerruf bestätigen“.
- Datenschutz-Steuerung: öffentlich erreichbar; ohne Sitzung korrekter Anmeldehinweis, mit Sitzung für persönliche Kontofreigaben vorbereitet.
- Arabische Oberfläche: `lang=ar`, `dir=rtl` und lokalisierter Rechtsfooter ohne horizontalen Überlauf.
- Browserprotokoll: keine Fehler aus der Anwendung; angezeigte Meldungen stammten ausschließlich aus der Testbrowser-Erweiterung.
- Vercel-Laufzeitfehlerprüfung für die letzte Stunde: keine Fehler gefunden.

## Bewusst offene Freigaben vor Bezahl- oder Echtdatenbetrieb

1. Schutz vor bekannten kompromittierten Passwörtern in Supabase Auth aktivieren. Der Security Advisor meldet diesen Plattform-Schalter weiterhin als Warnung.
2. Auftragsverarbeitungsverträge, Unterauftragsverarbeiter und Drittland-Transferbewertung für Vercel, Supabase und OpenAI abschließen und dokumentieren.
3. Prüfen, ob eine EU-Datenregion, genehmigte Zero Data Retention und/oder eine Datenschutz-Folgenabschätzung für den geplanten Echtdaten-Anwendungsfall erforderlich sind.
4. Fehlende Anbieterangaben wie Telefonnummer, Umsatzsteuer-ID, Wirtschafts-ID oder Registerangaben nur ergänzen, wenn sie tatsächlich vorhanden bzw. gesetzlich einschlägig sind; keine Angaben erfinden.
5. Rechtstexte und die konkrete elektronische Widerrufsfunktion vor einem zahlungspflichtigen Verbraucherangebot fachanwaltlich prüfen lassen.
6. Vollständigen authentifizierten End-to-End-Test mit isoliertem Testkonto und Testdateien sowie einen Test auf realen Mobilgeräten durchführen.

## Freigabegrenze

Der aktuelle V28-Stand ist für den kontrollierten kostenlosen Test mit synthetischen oder wirksam anonymisierten Daten bestimmt. Eine Behauptung vollständiger oder allgemeingültiger „DSGVO-Konformität“ wird nicht abgegeben; die tatsächliche Rechtmäßigkeit hängt zusätzlich von Organisation, Verträgen, Löschbetrieb, Anbieter-Konfiguration und konkretem Nutzungsszenario ab.

## Maßgebliche Quellen

- DSGVO: https://eur-lex.europa.eu/legal-content/DE/TXT/HTML/?uri=CELEX%3A02016R0679-20160504
- § 5 DDG: https://www.gesetze-im-internet.de/ddg/__5.html
- § 25 TDDDG: https://www.gesetze-im-internet.de/ttdsg/__25.html
- §§ 355, 356 und 356a BGB: https://www.gesetze-im-internet.de/bgb/__355.html, https://www.gesetze-im-internet.de/bgb/__356.html, https://www.gesetze-im-internet.de/bgb/__356a.html
- Art. 246a § 1 EGBGB: https://www.gesetze-im-internet.de/bgbeg/art_246a__1.html
- § 36 VSBG: https://www.gesetze-im-internet.de/vsbg/__36.html
- Hamburgische Datenschutzaufsicht: https://datenschutz-hamburg.de/service-information/beschwerde-oder-hinweis-einreichen
- Supabase GDPR/DPA: https://supabase.com/docs/guides/security/gdpr-compliance, https://supabase.com/legal/customer-resources/data-processing-addendum
- Vercel Datenschutz/DPA: https://vercel.com/legal/privacy-notice, https://vercel.com/legal/dpa
- OpenAI Enterprise Privacy/DPA/Subprozessoren: https://openai.com/enterprise-privacy/, https://openai.com/policies/data-processing-addendum/, https://openai.com/policies/sub-processor-list/
